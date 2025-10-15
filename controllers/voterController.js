const Voter = require('../models/Voter');
const generateVoterToken = require('../utils/generateVoterToken');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');

// Voter login
const voterLogin = async (req, res) => {
    const { phone, password } = req.body;

    try {
        const voter = await Voter.findOne({ phone });
        if (!voter) {
            return res.status(401).json({ message: 'Invalid phone or password' });
        }

        if (voter.password !== password) {
            return res.status(401).json({ message: 'Invalid phone or password' });
        }

        const token = generateVoterToken(voter._id);
        res.json({ token, voter: { name: voter.name, election: voter.election } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
};

module.exports = { voterLogin };


// Cast a vote
const castVote = async (req, res) => {
    const { candidateId } = req.body;
    const voter = req.voter;

    try {
        // Check if voter has already voted
        if (voter.hasVoted) {
            return res.status(403).json({ message: 'You have already voted' });
        }

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const election = await Election.findById(candidate.election);
        const now = new Date();
        if (now < new Date(election.startDate) || now > new Date(election.endDate)) {
            return res.status(403).json({ message: 'Election is not active' });
        }

        // Save vote
        await Vote.create({
            voter: voter._id,
            candidate: candidate._id,
            election: election._id
        });

        // Increment candidate votes
        candidate.votes += 1;
        await candidate.save();

        // Mark voter as voted
        voter.hasVoted = true;
        await voter.save();

        res.json({ message: `Vote cast successfully for ${candidate.name}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error casting vote', error: err.message });
    }
};

module.exports = { voterLogin, castVote };
