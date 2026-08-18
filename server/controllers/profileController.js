import User from "../models/User.js";
import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import DSAProblem from "../models/DSAProblem.js";
import Goal from "../models/Goal.js";
import Resume from "../models/Resume.js";

// Get user profile with statistics
export const getProfile = async (req, res) => {
  try {
    console.log("Getting profile for user:", req.user._id);

    const userId = req.user._id;

    // Get user data
    const user = await User.findById(userId).select("-password");

    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Get statistics
    const [jobs, interviews, dsaProblems, goals, resumes] = await Promise.all([
      Job.find({ user: userId }),
      Interview.find({ user: userId }),
      DSAProblem.find({ user: userId, isSolved: true }),
      Goal.find({ user: userId, status: "Active" }),
      Resume.find({ user: userId }).sort({ updatedAt: -1 }).limit(1),
    ]);

    const applications = jobs.length;
    const interviewCount = interviews.length;
    const offers = jobs.filter((job) => job.status === "Offer").length;
    const dsaSolved = dsaProblems.length;

    // Calculate profile completion
    const fields = [
      user.name,
      user.email,
      user.location,
      user.bio,
      user.targetRole,
      user.skills && user.skills.length > 0,
    ];

    const completedFields = fields.filter(
      (field) => field && field !== "" && field.length > 0
    );

    const profileCompletion = Math.round(
      (completedFields.length / fields.length) * 100
    );

    // Get latest resume
    const latestResume = resumes[0] || null;

    console.log("Profile fetched successfully for user:", user.name);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          role: user.role || "",
          targetRole: user.targetRole || "",
          location: user.location || "",
          bio: user.bio || "",
          skills: user.skills || [],

          // Profile Picture
          profilePicture: user.profilePicture || "",
          profilePictureStoragePath: user.profilePictureStoragePath || "",

          // Social Links
          socialLinks: {
            github: user.socialLinks?.github || "",
            linkedin: user.socialLinks?.linkedin || "",
            portfolio: user.socialLinks?.portfolio || "",
            twitter: user.socialLinks?.twitter || "",
          },

          // Education
          education: {
            college: user.education?.college || "",
            degree: user.education?.degree || "",
            graduationYear: user.education?.graduationYear || "",
          },

          // Experience
          experience: {
            company: user.experience?.company || "",
            role: user.experience?.role || "",
            startDate: user.experience?.startDate || "",
            endDate: user.experience?.endDate || "",
            current: user.experience?.current || false,
          },

          profileCompletion,
        },
        stats: {
          applications,
          interviews: interviewCount,
          offers,
          dsaProblems: dsaSolved,
        },
        goals: goals.slice(0, 3),
        resume: latestResume,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
      error: error.message,
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    console.log("Updating profile for user:", req.user._id);
    console.log("Request body:", req.body);

    const userId = req.user._id;

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

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Update existing fields
    if (name !== undefined) user.name = name.trim();
    if (location !== undefined) user.location = location.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (targetRole !== undefined) user.targetRole = targetRole.trim();
    if (skills !== undefined) user.skills = skills;

    // Update social links
    if (socialLinks !== undefined && socialLinks !== null) {
      user.socialLinks = {
        github:
          typeof socialLinks.github === "string"
            ? socialLinks.github.trim()
            : user.socialLinks?.github || "",
        linkedin:
          typeof socialLinks.linkedin === "string"
            ? socialLinks.linkedin.trim()
            : user.socialLinks?.linkedin || "",
        portfolio:
          typeof socialLinks.portfolio === "string"
            ? socialLinks.portfolio.trim()
            : user.socialLinks?.portfolio || "",
        twitter:
          typeof socialLinks.twitter === "string"
            ? socialLinks.twitter.trim()
            : user.socialLinks?.twitter || "",
      };
    }

    // Update education
    if (education !== undefined && education !== null) {
      user.education = {
        college:
          typeof education.college === "string"
            ? education.college.trim()
            : user.education?.college || "",
        degree:
          typeof education.degree === "string"
            ? education.degree.trim()
            : user.education?.degree || "",
        graduationYear:
          typeof education.graduationYear === "string"
            ? education.graduationYear.trim()
            : user.education?.graduationYear || "",
      };
    }

    // Update experience
    if (experience !== undefined && experience !== null) {
      user.experience = {
        company:
          typeof experience.company === "string"
            ? experience.company.trim()
            : user.experience?.company || "",
        role:
          typeof experience.role === "string"
            ? experience.role.trim()
            : user.experience?.role || "",
        startDate:
          typeof experience.startDate === "string"
            ? experience.startDate.trim()
            : user.experience?.startDate || "",
        endDate:
          typeof experience.endDate === "string"
            ? experience.endDate.trim()
            : user.experience?.endDate || "",
        current:
          typeof experience.current === "boolean"
            ? experience.current
            : user.experience?.current || false,
      };
    }

    await user.save();

    console.log("Profile updated successfully for user:", user.name);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        name: user.name,
        email: user.email,
        role: user.role || "",
        location: user.location || "",
        bio: user.bio || "",
        targetRole: user.targetRole || "",
        skills: user.skills || [],

        profilePicture: user.profilePicture || "",
        profilePictureStoragePath: user.profilePictureStoragePath || "",

        socialLinks: {
          github: user.socialLinks?.github || "",
          linkedin: user.socialLinks?.linkedin || "",
          portfolio: user.socialLinks?.portfolio || "",
          twitter: user.socialLinks?.twitter || "",
        },

        education: {
          college: user.education?.college || "",
          degree: user.education?.degree || "",
          graduationYear: user.education?.graduationYear || "",
        },

        experience: {
          company: user.experience?.company || "",
          role: user.experience?.role || "",
          startDate: user.experience?.startDate || "",
          endDate: user.experience?.endDate || "",
          current: user.experience?.current || false,
        },
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};