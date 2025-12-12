import mongoose from 'mongoose';

const deviceTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: {
        type: String,
        required: true,
        enum: ['AC', 'Refrigerator', 'Washing Machine', 'TV', 'Light', 'Fan', 'Heater', 'Microwave', 'Computer', 'Kitchen', 'Entertainment', 'Other']
    },
    ratedPower: { type: Number, required: true }, // in Watts
    icon: { type: String, default: 'zap' },
    defaultName: { type: String }, // optional default name for the device
    baselineUsagePerDay: { type: Number, default: 4 }, // hours
    specifications: {
        brand: String,
        model: String,
        energyRating: { type: String, enum: ['1 Star', '2 Star', '3 Star', '4 Star', '5 Star'], default: '3 Star' }
    }
}, {
    timestamps: true
});

export default mongoose.model('DeviceTemplate', deviceTemplateSchema);
