const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true,index: true },
    name: { type: String, required: true, index: true },
    phone: { type: String, required: true, unique: true, index: true },
    dob: { type: Date, required: true, index: true },
    password: { type: String, required: true, index: false },
    hasVoted: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now }
});

// 🟣 Additional compound indexes (optional but recommended):
// 1. Prevent duplicate voters per election (in case same phone reused across elections)
voterSchema.index({ election: 1, phone: 1 }, { unique: true });

// 2. Optional compound for analytics (if you’ll often query by election + hasVoted)
voterSchema.index({ election: 1, hasVoted: 1 });

module.exports = mongoose.model('Voter', voterSchema);
