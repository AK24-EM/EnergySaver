import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceTemplate' }, // Optional link to template

  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  location: {
    room: String,
    floor: String
  },

  ratedPower: { type: Number, required: true }, // Watts
  status: { type: String, enum: ['on', 'off', 'idle'], default: 'off' },

  // Backward compatibility with frontend
  isActive: { type: Boolean, default: false }, // Sync with status='on'
  currentPower: { type: Number, default: 0 },

  automation: {
    dailyLimit: {
      enabled: { type: Boolean, default: false },
      threshold: { type: Number, default: 0 }, // kWh
      action: { type: String, enum: ['notify', 'turn_off'], default: 'notify' }
    },
    schedule: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '00:00' },
      endTime: { type: String, default: '00:00' },
      action: { type: String, enum: ['turn_on', 'turn_off'], default: 'turn_on' }
    }
  },

  alertRules: [{
    ruleType: { type: String, enum: ['usage_limit', 'cost_limit', 'anomaly'] },
    threshold: Number,
    action: { type: String, enum: ['alert', 'auto_off', 'notify_user'] },
    createdAt: { type: Date, default: Date.now }
  }],

  automationRules: [{
    condition: {
      type: { type: String, enum: ['time', 'tariff', 'budget'] },
      startTime: String,
      endTime: String,
      threshold: Number
    },
    action: { type: String, enum: ['turn_off', 'reduce_intensity', 'notify'] },
    active: { type: Boolean, default: true }
  }]
}, {
  timestamps: true
});

// Middleware to sync status and specific fields
deviceSchema.pre('save', function (next) {
  if (this.status === 'on') {
    this.isActive = true;
    this.currentPower = this.ratedPower; // Simplified simulation
  } else {
    this.isActive = false;
    this.currentPower = 0;
  }
  next();
});

// Calculate efficiency score (Simplified version without full specifications)
deviceSchema.methods.getEfficiencyScore = function () {
  return 85; // Placeholder
};

export default mongoose.model('Device', deviceSchema);