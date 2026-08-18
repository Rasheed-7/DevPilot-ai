import mongoose from "mongoose";

const dsaProblemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },

    platform: {
      type: String,
      enum: ["LeetCode", "GeeksforGeeks", "Codeforces", "Other"],
      default: "Other",
    },

    problemLink: {
      type: String,
      trim: true,
      default: "",
    },

    solvedDate: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    isSolved: {
      type: Boolean,
      default: true,
    },

    source: {
      type: String,
      enum: ["manual", "sync"],
      default: "manual",
    },

    externalId: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const DSAProblem = mongoose.model("DSAProblem", dsaProblemSchema);

export default DSAProblem;