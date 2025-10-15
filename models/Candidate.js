const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    name: { type: String, required: true },
    photo: { type: String }, // URL or uploaded file path
    votes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Candidate', candidateSchema);
