import mongoose, { Document } from 'mongoose';

interface IUser extends Document {
  walletAddress: string;
  refCode: string;
  createdAt: Date;
  referredBy: string | null;
  referralRewards: number;
}

const UserSchema = new mongoose.Schema<IUser>({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  refCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  referredBy: {
    type: String,
    default: null,
    sparse: true,
  },
  referralRewards: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
  strict: true, // Only allow fields defined in schema
  strictQuery: true,
});

// Create indexes
UserSchema.index({ walletAddress: 1 }, { unique: true });
UserSchema.index({ refCode: 1 }, { unique: true });

// Pre-save hook to ensure required fields
UserSchema.pre('save', function(next) {
  if (!this.walletAddress) {
    next(new Error('Wallet address is required'));
  }
  if (!this.refCode) {
    next(new Error('Ref code is required'));
  }
  next();
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
