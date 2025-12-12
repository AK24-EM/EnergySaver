import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  floor: { type: String, default: 'Ground' },
  zone: { type: String, enum: ['living', 'sleeping', 'utility', 'outdoor', 'other'], default: 'living' },
  icon: { type: String, default: 'home' },
  order: { type: Number, default: 0 }
}, { _id: true });

const homeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, default: '' },

  // Home Profile
  photo: { type: String, default: '' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  region: { type: String, default: '' },

  // Tariff & Billing
  tariffPlan: {
    type: { type: String, enum: ['flat', 'peak', 'slab'], default: 'flat' },
    currency: { type: String, default: 'INR' },
    flatRate: { type: Number, default: 5.5 }, // cost per kWh
    peakHours: [{
      start: String, // "18:00"
      end: String,   // "22:00"
      rateMultiplier: { type: Number, default: 1.5 }
    }],
    slabs: [{
      minUnits: { type: Number, default: 0 },
      maxUnits: { type: Number },
      rate: { type: Number, required: true }
    }]
  },
  billingCycleStartDay: { type: Number, default: 1, min: 1, max: 28 },
  monthlyBudget: { type: Number, default: 3000 },

  // Rooms & Zones
  rooms: [roomSchema],

  // Comparison & Clustering Profile
  householdProfile: {
    size: { type: Number, default: 2 },
    rooms: { type: Number, default: 3 },
    climateZone: { type: String, enum: ['tropical', 'temperate', 'cold', 'arid'], default: 'tropical' },
    homeType: { type: String, enum: ['apartment', 'villa', 'townhouse', 'studio'], default: 'apartment' },
    hasAC: { type: Boolean, default: false },
    hasHeater: { type: Boolean, default: false },
    hasSolar: { type: Boolean, default: false }
  },
  clusterLabel: { type: String },
  optInComparison: { type: Boolean, default: true },

  // Legacy & Future
  neighborhoodGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'NeighborhoodGroup' },
  totalDevices: { type: Number, default: 0 },

  // Settings metadata (backward compatibility)
  settings: {
    peakHours: {
      start: { type: String, default: '18:00' },
      end: { type: String, default: '22:00' }
    },
    budget: {
      monthly: { type: Number, default: 3000 },
      daily: { type: Number, default: 100 }
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
    tariffRate: { type: Number, default: 5.5 }
  }
}, {
  timestamps: true
});

export default mongoose.model('Home', homeSchema);