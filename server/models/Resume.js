import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    resumeType: {
      type: String,
      enum: ["mine", "other"],
      default: "mine",
    },
    name: {
      type: String,
      required: [true, 'Resume name is required'],
      trim: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    storagePath: {
      type: String,
      required: [true, 'Storage path is required'],
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    mimeType: {
      type: String,
      required: true,
      default: 'application/pdf',
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    personName: {
  type: String,
  trim: true,
  default: "",
},
aiAnalysis: {
  analyzedAt: {
    type: Date,
    default: null,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  summary: {
    type: String,
    default: "",
  },
  strengths: {
    type: [String],
    default: [],
  },
  weaknesses: {
    type: [String],
    default: [],
  },
  skills: {
    type: [String],
    default: [],
  },
  suggestions: {
    type: [String],
    default: [],
  },
},
  },
  {
    timestamps: true,
  }
);

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;