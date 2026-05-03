// backend/src/models/User.model.js (complete final version)
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      match:    [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false,
    },
    avatar: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
    bio:         { type: String, maxlength: 200 },
    isVerified:  { type: Boolean, default: false },
    refreshToken:{ type: String, select: false },
    lastActive:  { type: Date, default: Date.now },

    // ── Password Reset ──
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method — compare passwords
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ name: 'text', email: 'text' });

export default mongoose.model('User', userSchema);