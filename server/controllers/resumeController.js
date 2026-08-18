import supabase from '../config/supabase.js';
import Resume from '../models/Resume.js';

// Helper function to ensure bucket exists
const ensureBucketExists = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Failed to list buckets:', listError);
      return false;
    }

    const bucketExists = buckets.some(b => b.name === 'devpilot-resumes');
    
    if (!bucketExists) {
      console.log('Creating bucket: devpilot-resumes');
      const { data, error: createError } = await supabase.storage.createBucket('devpilot-resumes', {
        public: false,
        fileSizeLimit: 5242880, // 5 MB
      });

      if (createError) {
        console.error('Failed to create bucket:', createError);
        return false;
      }
      
      console.log('Bucket created successfully');
      return true;
    }
    
    console.log('Bucket already exists');
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};

export const uploadResume = async (req, res) => {
  try {
    console.log('=== UPLOAD RESUME STARTED ===');
    console.log('User ID:', req.user?._id);
    console.log('File present:', !!req.file);
    console.log('File name:', req.file?.originalname);
    console.log('File size:', req.file?.size);
    console.log('File type:', req.file?.mimetype);
    console.log('Resume type from body:', req.body.resumeType);
    console.log('Resume name from body:', req.body.name);

    // Check if file exists
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({
        success: false,
        message: 'Resume file is required.',
      });
    }

    // Ensure bucket exists
    console.log('Checking bucket...');
    const bucketReady = await ensureBucketExists();
    if (!bucketReady) {
      return res.status(500).json({
        success: false,
        message: 'Storage bucket is not available. Please contact support.',
      });
    }

    const userId = req.user._id;
    const file = req.file;

    // Generate unique storage path
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${file.originalname.replace(/\s+/g, '_')}`;
    const storagePath = `resumes/${userId.toString()}/${uniqueFileName}`;

    console.log('Storage path:', storagePath);

    // Upload to Supabase Storage
    console.log('Uploading to Supabase...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('devpilot-resumes')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      console.error('Error details:', JSON.stringify(uploadError, null, 2));
      
      return res.status(500).json({
        success: false,
        message: 'Failed to upload resume to storage.',
        error: uploadError.message,
      });
    }

    console.log('Supabase upload successful:', uploadData);

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('devpilot-resumes')
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;
    console.log('File URL:', fileUrl);

    // Determine resume name
    let resumeName = req.body.name;
    if (!resumeName || resumeName.trim() === '') {
      const originalName = file.originalname;
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
      resumeName = nameWithoutExt || 'Untitled Resume';
    }

    // Get resumeType from request body, default to "mine"
    const resumeType = req.body.resumeType || 'mine';

    // Determine version number
    console.log('Finding existing resumes for version...');
    const existingResumes = await Resume.find({ user: userId });
    const versions = existingResumes.map((r) => r.version);
    const nextVersion = versions.length > 0 ? Math.max(...versions) + 1 : 1;
    console.log('Next version:', nextVersion);

    // Parse tags from request body
    let tags = [];
    if (req.body.tags) {
      try {
        if (typeof req.body.tags === 'string') {
          tags = JSON.parse(req.body.tags);
        } else if (Array.isArray(req.body.tags)) {
          tags = req.body.tags;
        }
      } catch (error) {
        console.log('Failed to parse tags:', error.message);
        tags = [];
      }
    }
    console.log('Tags:', tags);
    console.log('Resume Type:', resumeType);

    try {
      // Set all existing resumes to inactive
      console.log('Setting existing resumes to inactive...');
      await Resume.updateMany(
        { user: userId },
        { isActive: false }
      );

      // Create the new resume document
      console.log('Creating new resume...');
      const resume = await Resume.create({
        user: userId,
        name: resumeName.trim(),
        resumeType: resumeType,
        version: nextVersion,
        fileUrl: fileUrl,
        storagePath: storagePath,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        tags: tags,
        isActive: true,
        isArchived: false,
      });

      console.log('Resume saved to database:', resume._id);
      console.log('Resume type saved:', resume.resumeType);

      return res.status(201).json({
        success: true,
        message: 'Resume uploaded successfully.',
        resume,
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // If MongoDB creation fails, clean up the uploaded file from Supabase
      console.log('Cleaning up Supabase file...');
      const { error: deleteError } = await supabase.storage
        .from('devpilot-resumes')
        .remove([storagePath]);

      if (deleteError) {
        console.error('Failed to clean up uploaded file:', deleteError);
      } else {
        console.log('Cleaned up Supabase file');
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to save resume to database.',
        error: dbError.message,
      });
    }

  } catch (error) {
    console.error('Upload resume error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while uploading resume.',
      error: error.message,
    });
  }
};

export const getResumes = async (req, res) => {
  try {
    console.log('Fetching resumes for user:', req.user._id);
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${resumes.length} resumes`);
    res.status(200).json({
      success: true,
      resumes,
    });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumes.',
    });
  }
};

export const previewResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    const { data, error } = await supabase.storage
      .from("devpilot-resumes")
      .createSignedUrl(resume.storagePath, 300);

    if (error) {
      console.error("Preview Resume Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to generate preview link.",
      });
    }

    return res.status(200).json({
      success: true,
      url: data.signedUrl,
    });
  } catch (error) {
    console.error("Preview Resume Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to preview resume.",
    });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    // Delete the PDF from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("devpilot-resumes")
      .remove([resume.storagePath]);

    if (storageError) {
      console.error("Supabase Delete Error:", storageError);

      return res.status(500).json({
        success: false,
        message: "Failed to delete resume file.",
      });
    }

    // Delete metadata from MongoDB
    await Resume.deleteOne({
      _id: resume._id,
    });

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Resume Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete resume.",
    });
  }
};

export const archiveResume = async (req, res) => {
  try {
    console.log("Archive request for resume:", req.params.id);
    
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
    }

    // Toggle the isArchived status
    resume.isArchived = !resume.isArchived;
    await resume.save();

    console.log("Resume archived status toggled to:", resume.isArchived);

    // Return the FULL resume with ALL fields
    return res.status(200).json({
      success: true,
      message: resume.isArchived ? 'Resume archived successfully.' : 'Resume unarchived successfully.',
      resume: {
        _id: resume._id,
        user: resume.user,
        resumeType: resume.resumeType,
        name: resume.name,
        version: resume.version,
        fileUrl: resume.fileUrl,
        storagePath: resume.storagePath,
        fileName: resume.fileName,
        fileSize: resume.fileSize,
        mimeType: resume.mimeType,
        tags: resume.tags,
        isActive: resume.isActive,
        isArchived: resume.isArchived,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      }
    });
  } catch (error) {
    console.error('Archive resume error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update resume.',
    });
  }
};

export const downloadResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    const { data, error } = await supabase.storage
      .from("devpilot-resumes")
      .download(resume.storagePath);

    if (error || !data) {
      console.error("Supabase Download Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to download resume.",
      });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    const filename = `${resume.name || "resume"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    return res.send(buffer);
  } catch (error) {
    console.error("Download Resume Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to download resume.",
    });
  }
};

export const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    const { name, personName, tags } = req.body;

    if (name !== undefined) {
      resume.name = name.trim();
    }

    if (personName !== undefined) {
      resume.personName = personName.trim();
    }

    if (tags !== undefined) {
      resume.tags = tags;
    }

    await resume.save();

    return res.status(200).json({
      success: true,
      message: "Resume updated successfully.",
      resume,
    });
  } catch (error) {
    console.error("Update Resume Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update resume.",
    });
  }
};