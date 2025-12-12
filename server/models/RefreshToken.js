import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true }
}, {
    timestamps: true
});

export default mongoose.model('RefreshToken', refreshTokenSchema);
