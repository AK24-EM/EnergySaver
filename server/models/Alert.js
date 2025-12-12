import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  title: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['limit', 'anomaly', 'offline', 'budget', 'system']
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'dismissed'],
    default: 'active'
  },
  isRead: { type: Boolean, default: false }, // Kept for backward compatibility
  expiresAt: { type: Date },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.model('Alert', alertSchema);