import supabase from '../config/supabase.js';
import Resume from '../models/Resume.js';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
export const analyzeResume = async (req, res) => {
  try {
    const userId = req.user._id;
    const resumeId = req.params.id;

    // ------------------------------------------------------------
    // 1. Find the resume belonging to the authenticated user
    // ------------------------------------------------------------

    const resume = await Resume.findOne({
      _id: resumeId,
      user: userId,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    // ------------------------------------------------------------
    // 2. Only analyze the user's own resumes
    // ------------------------------------------------------------

    if (resume.resumeType !== "mine") {
      return res.status(403).json({
        success: false,
        message: "Only your personal resumes can be analyzed.",
      });
    }

    // ------------------------------------------------------------
    // 3. Return cached analysis if it already exists
    // ------------------------------------------------------------

    if (
      resume.aiAnalysis &&
      resume.aiAnalysis.analyzedAt &&
      resume.aiAnalysis.score !== null
    ) {
      return res.status(200).json({
        success: true,
        cached: true,
        analysis: resume.aiAnalysis,
      });
    }

    // ------------------------------------------------------------
    // 4. Check Gemini configuration
    // ------------------------------------------------------------

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    // ------------------------------------------------------------
    // 5. Download the user's PDF from Supabase
    // ------------------------------------------------------------

    const { data: fileData, error: downloadError } =
      await supabase.storage
        .from("devpilot-resumes")
        .download(resume.storagePath);

    if (downloadError || !fileData) {
      console.error("Resume download error:", downloadError);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve resume for analysis.",
      });
    }

    // ------------------------------------------------------------
    // 6. Convert PDF to base64
    // ------------------------------------------------------------

    const arrayBuffer = await fileData.arrayBuffer();

    const pdfBase64 = Buffer.from(arrayBuffer).toString("base64");

    // ------------------------------------------------------------
    // 7. Ask Gemini to analyze the resume
    // ------------------------------------------------------------

    const prompt = `
You are an expert resume reviewer and ATS-focused career advisor.

Analyze the attached resume carefully.

Your analysis must be based ONLY on information actually present
in the resume.

Do NOT invent:
- skills
- experience
- achievements
- technologies
- education
- certifications
- projects
- employers

Evaluate the resume for a software/developer job applicant.

Return ONLY valid JSON matching this exact structure:

{
  "score": 0,
  "summary": "Short overall assessment",
  "strengths": [
    "strength 1",
    "strength 2",
    "strength 3"
  ],
  "weaknesses": [
    "weakness 1",
    "weakness 2",
    "weakness 3"
  ],
  "skills": [
    "skill 1",
    "skill 2",
    "skill 3"
  ],
  "suggestions": [
    "specific improvement 1",
    "specific improvement 2",
    "specific improvement 3"
  ]
}

Rules:

- score must be an integer from 0 to 100
- strengths must contain useful observations
- weaknesses must identify genuine issues
- skills must contain only skills actually detected in the resume
- suggestions must be actionable
- do not exaggerate
- do not make assumptions
- do not mention that you are an AI
- return JSON only
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        {
          text: prompt,
        },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBase64,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: {
              type: "integer",
              minimum: 0,
              maximum: 100,
            },
            summary: {
              type: "string",
            },
            strengths: {
              type: "array",
              items: {
                type: "string",
              },
            },
            weaknesses: {
              type: "array",
              items: {
                type: "string",
              },
            },
            skills: {
              type: "array",
              items: {
                type: "string",
              },
            },
            suggestions: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: [
            "score",
            "summary",
            "strengths",
            "weaknesses",
            "skills",
            "suggestions",
          ],
        },
      },
    });

    // ------------------------------------------------------------
    // 8. Parse Gemini response
    // ------------------------------------------------------------

    let analysis;

    try {
      analysis = JSON.parse(response.text);
    } catch (parseError) {
      console.error("Gemini JSON parse error:", parseError);
      console.error("Gemini response:", response.text);

      return res.status(500).json({
        success: false,
        message: "AI returned an invalid analysis format.",
      });
    }

    // ------------------------------------------------------------
    // 9. Save analysis to the resume
    // ------------------------------------------------------------

    resume.aiAnalysis = {
      analyzedAt: new Date(),
      score: analysis.score,
      summary: analysis.summary,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      skills: analysis.skills,
      suggestions: analysis.suggestions,
    };

    await resume.save();

    // ------------------------------------------------------------
    // 10. Return analysis
    // ------------------------------------------------------------

    return res.status(200).json({
      success: true,
      cached: false,
      analysis: resume.aiAnalysis,
    });

  } catch (error) {
    console.error("AI Resume Analysis Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze resume.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};
// ============================================================
// AI JOB–RESUME MATCHER
// ============================================================
export const matchResumeToJob = async (req, res) => {
  try {
    console.log("===== AI MATCHER START =====");
    const userId = req.user._id;
    const { resumeId, jobDescription, company } = req.body;
    console.log("User ID:", userId);
    console.log("Resume ID:", resumeId);
    console.log("Job Description length:", jobDescription?.length);
    console.log("Company:", company);

    // Validate inputs
    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: "Resume ID is required.",
      });
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Job description is required.",
      });
    }

    if (jobDescription.length > 10000) {
      return res.status(400).json({
        success: false,
        message: "Job description is too long. Please limit to 10,000 characters.",
      });
    }

    // Find the resume
    const resume = await Resume.findOne({
      _id: resumeId,
      user: userId,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    if (resume.resumeType !== "mine") {
      return res.status(403).json({
        success: false,
        message: "Only your personal resumes can be used for matching.",
      });
    }

    // Check Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set!");
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    console.log("GEMINI_API_KEY is set (length):", process.env.GEMINI_API_KEY.length);

    // Download the PDF
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("devpilot-resumes")
      .download(resume.storagePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve resume for analysis.",
        ...(process.env.NODE_ENV === "development" && { error: downloadError?.message }),
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const pdfBase64 = Buffer.from(arrayBuffer).toString("base64");
    console.log("PDF size (base64):", pdfBase64.length);

    const companyName = company?.trim() || "the company";

    // ------------------------------------------------------------
    // Build the prompt
    // ------------------------------------------------------------
    const prompt = `
You are an expert career advisor and ATS specialist.

You are given a resume (PDF) and a job description.

Your task is to evaluate how well the resume matches the job description.

The company name is "${companyName}" – this is only for context; do NOT let it influence the match score.

Analyze the resume against the job requirements.

Be objective and grounded in the actual content of the resume.

Do NOT invent skills, experience, or qualifications that are not explicitly present in the resume.

Do NOT assume the candidate knows anything not mentioned.

Your response must be a valid JSON object with the following structure:

{
  "matchScore": 0,
  "strongMatches": [
    "Skill or qualification that aligns well",
    "Another strong match"
  ],
  "weakAreas": [
    "Missing or weak area 1",
    "Missing or weak area 2"
  ],
  "resumeStrengths": [
    "Strength of the resume itself",
    "Another strength"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}

Guidelines:
- matchScore must be an integer from 0 to 100.
- matchScore should reflect how well the resume fits the job requirements, NOT the company prestige.
- Distinguish between required skills and preferred skills if possible.
- strongMatches should include specific skills, technologies, or experiences that the resume has and the job asks for.
- weakAreas should list requirements that the resume lacks or is weak on.
- resumeStrengths should highlight overall strengths of the resume (e.g., clear structure, strong project descriptions, relevant experience).
- recommendations should be specific, actionable improvements the candidate can make to the resume to better fit this job.
- Do not include the company name in the scoring.
- Return ONLY the JSON object, no extra text.
`;

    // ------------------------------------------------------------
    // Call Gemini with timeout
    // ------------------------------------------------------------
    const callGeminiWithTimeout = async (modelName, timeoutMs = 45000) => {
      return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Gemini request timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: pdfBase64,
                },
              },
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  matchScore: { type: "integer", minimum: 0, maximum: 100 },
                  strongMatches: { type: "array", items: { type: "string" } },
                  weakAreas: { type: "array", items: { type: "string" } },
                  resumeStrengths: { type: "array", items: { type: "string" } },
                  recommendations: { type: "array", items: { type: "string" } },
                },
                required: [
                  "matchScore",
                  "strongMatches",
                  "weakAreas",
                  "resumeStrengths",
                  "recommendations",
                ],
              },
            },
          });
          clearTimeout(timeout);
          resolve(response);
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });
    };

    // ------------------------------------------------------------
    // Try multiple models with retry
    // ------------------------------------------------------------
    const models = ["gemini-3.7-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
    let response = null;
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const modelName = attempt < models.length ? models[attempt] : models[models.length - 1];
      const timeoutMs = 45000 - attempt * 5000; // 45s, 40s, 35s

      try {
        console.log(`Attempt ${attempt + 1}: using ${modelName} (timeout: ${timeoutMs}ms)`);
        response = await callGeminiWithTimeout(modelName, timeoutMs);
        console.log(`${modelName} succeeded!`);
        break;
      } catch (err) {
        lastError = err;
        console.error(`${modelName} failed:`, err.message);

        // If it's a timeout, don't retry with the same model
        if (err.message.includes("timed out")) {
          console.log(`${modelName} timed out, trying next model...`);
          continue;
        }

        // If it's 503/rate limit, wait before retry
        if (err.message.includes("503") || err.message.includes("UNAVAILABLE") || err.message.includes("busy")) {
          const delay = Math.min(Math.pow(2, attempt + 1) * 1000, 10000);
          console.log(`Model busy, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Non-retryable error
          break;
        }
      }
    }

    if (!response) {
      console.error("All attempts failed. Last error:", lastError);
      return res.status(503).json({
        success: false,
        message: "The AI service is currently busy. Please try again in a few moments.",
      });
    }

    console.log("Gemini response received. Text length:", response.text?.length);

    if (!response.text) {
      console.error("Gemini response is empty!");
      return res.status(500).json({
        success: false,
        message: "Gemini returned an empty response.",
      });
    }

    // Parse JSON
    let analysis;
    try {
      analysis = JSON.parse(response.text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", response.text);
      return res.status(500).json({
        success: false,
        message: "AI returned an invalid analysis format.",
        ...(process.env.NODE_ENV === "development" && { raw: response.text }),
      });
    }

    const data = {
      company: companyName,
      matchScore: analysis.matchScore ?? 0,
      strongMatches: analysis.strongMatches || [],
      weakAreas: analysis.weakAreas || [],
      resumeStrengths: analysis.resumeStrengths || [],
      recommendations: analysis.recommendations || [],
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("===== AI MATCHER ERROR =====");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.response) {
      console.error("Gemini API response error:", error.response);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to analyze match.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};