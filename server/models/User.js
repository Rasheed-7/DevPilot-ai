import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null, //Allow null for Google OAuth users
    },
    // Google OAuth field
    googleId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      default: "",
    },
    targetRole: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    profilePictureStoragePath: {
      type: String,
      default: "",
    },
    socialLinks: {
      _id: false,
      github: {
        type: String,
        default: "",
      },
      linkedin: {
        type: String,
        default: "",
      },
      portfolio: {
        type: String,
        default: "",
      },
      twitter: {
        type: String,
        default: "",
      },
    },
    education: {
      _id: false,
      college: {
        type: String,
        default: "",
      },
      degree: {
        type: String,
        default: "",
      },
      graduationYear: {
        type: String,
        default: "",
      },
    },
    experience: {
      _id: false,
      company: {
        type: String,
        default: "",
      },
      role: {
        type: String,
        default: "",
      },
      startDate: {
        type: String,
        default: "",
      },
      endDate: {
        type: String,
        default: "",
      },
      current: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;