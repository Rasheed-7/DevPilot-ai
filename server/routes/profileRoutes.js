import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import DSAProblem from "../models/DSAProblem.js";
import Goal from "../models/Goal.js";
import Resume from "../models/Resume.js";
import multer from "multer";
import supabase from "../config/supabase.js";

const router = express.Router();

// Configure multer for memory storage (Supabase upload)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Only JPEG, PNG, and WebP image files are allowed"),
        false
      );
    }
  },
});

// Helper to calculate completion %
function calculateProfileCompletion(user) {
  const fields = [
    user.name,
    user.email,
    user.location,
    user.bio,
    user.targetRole || user.role,
    user.skills && user.skills.length > 0,
    user.education?.college,
    user.experience?.company,
  ];

  const completed = fields.filter(Boolean).length;
  const total = fields.length;

  return Math.round((completed / total) * 100);
}

// GET /api/profile
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [jobs, interviews, offers, dsaProblems, goals, resume] =
      await Promise.all([
        Job.countDocuments({ user: req.user._id }),
        Interview.countDocuments({ user: req.user._id }),
        Job.countDocuments({
          user: req.user._id,
          status: "Offer",
        }),
        DSAProblem.countDocuments({
          user: req.user._id,
          solved: true,
        }),
        Goal.find({
          user: req.user._id,
          status: "Active",
        })
          .limit(3)
          .sort({ createdAt: -1 }),
        Resume.findOne({
          user: req.user._id,
        }).sort({ updatedAt: -1 }),
      ]);

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          role: user.role || user.targetRole || "",
          location: user.location || "",
          bio: user.bio || "",
          skills: user.skills || [],
          profileCompletion: calculateProfileCompletion(user),

          profilePicture: user.profilePicture || "",

          socialLinks: user.socialLinks || {
            github: "",
            linkedin: "",
            portfolio: "",
            twitter: "",
          },

          education: user.education || {
            college: "",
            degree: "",
            graduationYear: "",
          },

          experience: user.experience || {
            company: "",
            role: "",
            startDate: "",
            endDate: "",
            current: false,
          },
        },

        stats: {
          applications: jobs,
          interviews,
          offers,
          dsaProblems,
        },

        goals,
        resume,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});

// PUT /api/profile
router.put("/", protect, async (req, res) => {
  try {
    const {
      name,
      location,
      bio,
      targetRole,
      skills,
      socialLinks,
      education,
      experience,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (location !== undefined) {
      user.location = location;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (targetRole !== undefined) {
      user.targetRole = targetRole;
    }

    if (skills !== undefined) {
      user.skills = skills;
    }

    if (socialLinks) {
      user.socialLinks = {
        github: socialLinks.github || "",
        linkedin: socialLinks.linkedin || "",
        portfolio: socialLinks.portfolio || "",
        twitter: socialLinks.twitter || "",
      };
    }

    if (education) {
      user.education = {
        college: education.college || "",
        degree: education.degree || "",
        graduationYear: education.graduationYear || "",
      };
    }

    if (experience) {
      user.experience = {
        company: experience.company || "",
        role: experience.role || "",
        startDate: experience.startDate || "",
        endDate: experience.endDate || "",
        current: experience.current || false,
      };
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          name: user.name,
          email: user.email,
          role: user.role || user.targetRole || "",
          location: user.location || "",
          bio: user.bio || "",
          skills: user.skills || [],
          profilePicture: user.profilePicture || "",

          socialLinks: user.socialLinks || {
            github: "",
            linkedin: "",
            portfolio: "",
            twitter: "",
          },

          education: user.education || {
            college: "",
            degree: "",
            graduationYear: "",
          },

          experience: user.experience || {
            company: "",
            role: "",
            startDate: "",
            endDate: "",
            current: false,
          },
        },
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// POST /api/profile/upload-picture
router.post(
  "/upload-picture",
  protect,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      console.log("Profile picture upload started");

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }

      console.log("File received:", {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      });

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const bucketName = "devpilot-profiles";

      // Delete old profile picture if it exists
      if (user.profilePictureStoragePath) {
        console.log(
          "Deleting old profile picture:",
          user.profilePictureStoragePath
        );

        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove([user.profilePictureStoragePath]);

        if (deleteError) {
          console.error(
            "Old profile picture deletion error:",
            deleteError
          );
        }
      }

      // Get file extension safely
      const originalName = req.file.originalname || "";
      const extension =
        originalName.includes(".")
          ? originalName.split(".").pop().toLowerCase()
          : "jpg";

      const timestamp = Date.now();

      const fileName = `${timestamp}-${user._id}.${extension}`;

      const storagePath = `profiles/${user._id}/${fileName}`;

      console.log("Uploading to Supabase:", storagePath);

      const {
        data: uploadData,
        error: uploadError,
      } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error(
          "Supabase upload error:",
          uploadError
        );

        return res.status(500).json({
          success: false,
          message:
            uploadError.message ||
            "Failed to upload profile picture",
        });
      }

      console.log(
        "Supabase upload successful:",
        uploadData?.path
      );

      // Get public URL
      const {
        data: urlData,
      } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath);

      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        console.error(
          "Supabase did not return a public URL"
        );

        return res.status(500).json({
          success: false,
          message: "Failed to generate profile picture URL",
        });
      }

      console.log(
        "Profile picture public URL:",
        publicUrl
      );

      // Save URL and storage path in MongoDB
      user.profilePicture = publicUrl;
      user.profilePictureStoragePath = storagePath;

      await user.save();

      console.log(
        "Profile picture saved successfully for:",
        user._id
      );

      return res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully",
        profilePicture: publicUrl,
      });
    } catch (error) {
      console.error(
        "Upload picture error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to upload profile picture",
      });
    }
  }
);
// DELETE /api/profile/upload-picture - Remove profile picture
router.delete("/upload-picture", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: "No profile picture to remove",
      });
    }

    if (user.profilePictureStoragePath) {
      await supabase.storage
        .from("devpilot-profiles")
        .remove([user.profilePictureStoragePath])
        .catch(console.error);
    }

    user.profilePicture = "";
    user.profilePictureStoragePath = "";
    await user.save();

    res.json({
      success: true,
      message: "Profile picture removed successfully",
    });
  } catch (error) {
    console.error("Delete profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove profile picture",
    });
  }
});
// DELETE /api/profile/upload-picture - Remove profile picture
router.delete("/upload-picture", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: "No profile picture to remove",
      });
    }

    if (user.profilePictureStoragePath) {
      await supabase.storage
        .from("devpilot-profiles")
        .remove([user.profilePictureStoragePath])
        .catch(console.error);
    }

    user.profilePicture = "";
    user.profilePictureStoragePath = "";
    await user.save();

    res.json({
      success: true,
      message: "Profile picture removed successfully",
    });
  } catch (error) {
    console.error("Delete profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove profile picture",
    });
  }
});

export default router;