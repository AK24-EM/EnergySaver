import mongoose from 'mongoose';

const usageLogSchema = new mongoose.Schema({
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  power: { type: Number, required: true }, // watts
  cost: { type: Number, required: true }   // computed at ingest
}, {
  timestamps: false // No need for updatedAt
});

// Index for efficient time-series querying
usageLogSchema.index({ device: 1, timestamp: -1 });

export default mongoose.model('UsageLog', usageLogSchema);