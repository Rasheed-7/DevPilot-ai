import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import Interview from "../models/Interview.js";
import DSAProblem from "../models/DSAProblem.js";
import Goal from "../models/Goal.js";
import PlatformConnection from "../models/PlatformConnection.js";


export const getSettings = async (req, res) => {
  try {
    console.log("===== GET SETTINGS START =====");
    console.log("User ID:", req.user?._id);
    
    const user = await User.findById(req.user._id).select("-password");

    console.log("User found:", user ? "Yes" : "No");
    console.log("User name:", user?.name);
    console.log("User email:", user?.email);
    console.log("User settings:", user?.settings);
    console.log("User targetRole:", user?.targetRole);
    console.log("User location:", user?.location);
    console.log("User bio:", user?.bio);
    console.log("User skills:", user?.skills);

    if (!user) {
      console.log("User not found!");
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const userSettings = user.settings || {};
    
    const settings = {
      darkMode: true,
      compactMode: false,
      interviewReminder: true,
      applicationReminder: true,
      goalReminder: false,
      weeklySummary: true,
      profileVisibility: true,
      analyticsData: true,
      ...userSettings,
    };

    console.log("Final settings:", settings);
    console.log("===== GET SETTINGS END =====");

    return res.status(200).json({
      success: true,
      data: {
        settings,
        user: {
          name: user.name,
          email: user.email,
          targetRole: user.targetRole || "",
          location: user.location || "",
          bio: user.bio || "",
          skills: user.skills || [],
          profileImage: user.profileImage || "",
        },
      },
    });
  } catch (error) {
    console.error("===== GET SETTINGS ERROR =====");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load settings.",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    console.log("Updating settings for user:", req.user._id);
    console.log("Request body:", req.body);

    const { name, targetRole, location, bio, skills, settings } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Update profile fields
    if (name !== undefined && name.trim()) {
      user.name = name.trim();
    }
    if (targetRole !== undefined) {
      user.targetRole = targetRole.trim();
    }
    if (location !== undefined) {
      user.location = location.trim();
    }
    if (bio !== undefined) {
      user.bio = bio.trim();
    }
    if (skills !== undefined) {
      user.skills = skills;
    }

    // Ensure settings object exists
    if (!user.settings) user.settings = {};

    // Update settings
    if (settings) {
      const allowedSettings = [
        "darkMode",
        "compactMode",
        "interviewReminder",
        "applicationReminder",
        "goalReminder",
        "weeklySummary",
        "profileVisibility",
        "analyticsData",
      ];

      for (const key of allowedSettings) {
        if (settings[key] !== undefined) {
          user.settings[key] = settings[key];
        }
      }
    }

    await user.save();

    console.log("Settings updated successfully for user:", user.name);

    return res.status(200).json({
      success: true,
      message: "Settings saved successfully.",
      data: {
        settings: user.settings,
        user: {
          name: user.name,
          email: user.email,
          targetRole: user.targetRole,
          location: user.location,
          bio: user.bio,
          skills: user.skills,
          profileImage: user.profileImage,
        },
      },
    });
  } catch (error) {
    console.error("Update Settings Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save settings.",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password.",
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete all user data
    await Promise.all([
      Job.deleteMany({ user: userId }),
      Resume.deleteMany({ user: userId }),
      Interview.deleteMany({ user: userId }),
      DSAProblem.deleteMany({ user: userId }),
      Goal.deleteMany({ user: userId }),
      PlatformConnection.deleteMany({ user: userId }),
    ]);

    // Delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account.",
    });
  }
};