import mongoose from 'mongoose';

const benchmarkSchema = new mongoose.Schema({
    clusterId: { type: String, required: true, unique: true, index: true }, // e.g., "3room-tropical-2ac"

    // Criteria defining this cluster
    criteria: {
        rooms: Number,
        climateZone: String,
        deviceProfile: [String]    // ["AC", "Heater", "Geyser"]
    },

    sampleSize: { type: Number, default: 0 },          // Min 20 for confidence

    // Aggregated Metrics
    metrics: {
        avgKwhPerCapita: { type: Number, default: 0 },
        avgPeakUsagePercent: { type: Number, default: 0 },
        avgStandbyWaste: { type: Number, default: 0 },
        avgCarbonKg: { type: Number, default: 0 }
    },

    // Percentiles for efficiency ranking
    percentiles: {
        p25: { type: Number, default: 0 },
        p50: { type: Number, default: 0 },
        p75: { type: Number, default: 0 },
        p90: { type: Number, default: 0 }
    },

    confidence: { type: Number, default: 0 },          // 0-1 score

    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export default mongoose.model('Benchmark', benchmarkSchema);
