const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    voter: { type: mongoose.Schema.Types.ObjectId, ref: 'Voter', required: true, unique: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vote', voteSchema);
