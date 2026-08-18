import mongoose from 'mongoose';

const platformConnectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: ['LeetCode', 'GeeksforGeeks', 'Codeforces'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    profileUrl: {
      type: String,
      trim: true,
      default: '',
    },
    connected: {
      type: Boolean,
      default: true,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    lastSyncStatus: {
      type: String,
      enum: ['never', 'success', 'failed'],
      default: 'never',
    },
    lastSyncMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one platform per user
platformConnectionSchema.index({ user: 1, platform: 1 }, { unique: true });

const PlatformConnection = mongoose.model('PlatformConnection', platformConnectionSchema);

export default PlatformConnection;