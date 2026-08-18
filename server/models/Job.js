import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    package: {
      type: String,
      trim: true,
      default: "",
    },
    appliedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "Wishlist",
        "Applied",
        "OA",
        "Interview",
        "HR",
        "Offer",
        "Rejected",
      ],
      default: "Wishlist",
    },
    referral: {
      type: Boolean,
      default: false,
    },
    jobLink: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    resumeUsed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model("Job", jobSchema);

export default Job;