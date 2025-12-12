import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional (could be null for system actions)
    action: { type: String, required: true }, // e.g., 'DEVICE_TOGGLE', 'MODE_ACTIVATE', 'MEMBER_INVITE'
    details: { type: String }, // Human-readable description
    metadata: { type: mongoose.Schema.Types.Mixed }, // JSON for IDs, old/new values
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true // adds createdAt/updatedAt (though timestamp handles created)
});

export default mongoose.model('ActivityLog', activityLogSchema);
