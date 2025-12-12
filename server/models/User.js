import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home' },

  // Security metadata
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  accountLockedUntil: Date,
  trustedDevices: [{
    deviceId: String,
    ipAddress: String,
    userAgent: String,
    addedAt: { type: Date, default: Date.now }
  }],
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    },
    createdAt: { type: Date, default: Date.now }
  }],

  // Kept for backward compatibility/frontend needs until full migration
  profile: {
    avatar: String,
    phone: String,
    address: String,
    tariffRate: { type: Number, default: 5.5 }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      categories: {
        budgetAlerts: { type: Boolean, default: true },
        deviceOverload: { type: Boolean, default: true },
        automationActions: { type: Boolean, default: true },
        safetyOverrides: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true },
        tips: { type: Boolean, default: false }
      },
      quietHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: '22:00' },
        end: { type: String, default: '07:00' }
      }
    },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'INR' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);