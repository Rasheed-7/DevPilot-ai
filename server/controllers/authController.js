import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ===== REGISTER =====
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If user exists with NO password (Google-only user)
      if (!existingUser.password) {
        console.log("Google-only user found. Setting password...");
        
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Update the existing user with the new password
        existingUser.password = hashedPassword;
        existingUser.name = name; // Update name if changed
        await existingUser.save();

        // Generate token and login
        const token = generateToken(existingUser._id);

        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
          success: true,
          message: "Password set successfully! You can now login with email and password.",
          token,
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role || "",
            location: existingUser.location || "",
            bio: existingUser.bio || "",
            skills: existingUser.skills || [],
            profilePicture: existingUser.profilePicture || "",
          },
        });
      }

      // If user has password → email already registered
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please login instead.",
      });
    }

    // New user → create account
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! Welcome to DevPilot!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "",
        location: user.location || "",
        bio: user.bio || "",
        skills: user.skills || [],
        profilePicture: user.profilePicture || "",
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// ===== LOGIN =====
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email doesn't exist",
      });
    }

    //Check if user has a password set
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "This account was created with Google. Please sign in with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "",
        location: user.location || "",
        bio: user.bio || "",
        skills: user.skills || [],
        profilePicture: user.profilePicture || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

// ===== GET ME (Current User) =====
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "",
        location: user.location || "",
        bio: user.bio || "",
        skills: user.skills || [],
        profilePicture: user.profilePicture || "",
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

// ===== LOGOUT =====
export const logoutUser = async (req, res) => {
  res.clearCookie("token");
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// ===== GOOGLE OAUTH CALLBACK =====
export const googleCallback = async (req, res) => {
  try {
    console.log("========== GOOGLE CALLBACK START ==========");
    
    if (!req.user) {
      console.error("No user in request!");
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=no_user`);
    }

    const { user } = req.user;
    console.log("User email:", user.email);

    const token = generateToken(user._id);
    console.log("Generated token");

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userData = encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture || "",
      role: user.role || "",
    }));

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth-success?token=${token}&user=${userData}`);
    
    console.log("Redirecting to:", `${frontendUrl}/auth-success?token=...&user=...`);
    console.log("========== GOOGLE CALLBACK END ==========");
  } catch (error) {
    console.error("Google callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
};

// ===== (Optional) SET PASSWORD – kept for backwards compatibility =====
// This is no longer needed because Google-only users can set password via /register
// Keeping it here in case you still use it from Profile page (but we removed it)
export const setPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.password) {
      return res.status(400).json({
        success: false,
        message: "You already have a password set.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password set successfully!",
    });
  } catch (error) {
    console.error("Set password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set password",
    });
  }
};

// ===== CHANGE PASSWORD – kept for backwards compatibility =====
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "You don't have a password set. Use 'Set Password' instead.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};