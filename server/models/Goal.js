import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Home',
    required: true
  },
  type: {
    type: String,
    enum: ['cost', 'usage', 'efficiency'],
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  target: {
    value: { type: Number, required: true },
    unit: { type: String, required: true } // ₹, kWh, %
  },
  current: {
    value: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed', 'paused'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  achievements: [{
    milestone: String,
    achievedAt: Date,
    reward: String
  }],
  settings: {
    notifications: { type: Boolean, default: true },
    autoReset: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Calculate progress percentage
goalSchema.methods.updateProgress = function() {
  this.current.percentage = Math.min((this.current.value / this.target.value) * 100, 100);
  if (this.current.percentage >= 100 && this.status === 'active') {
    this.status = 'completed';
  }
};

export default mongoose.model('Goal', goalSchema);