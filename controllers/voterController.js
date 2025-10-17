const Voter = require('../models/Voter');
const generateVoterToken = require('../utils/generateVoterToken');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const mongoose = require('mongoose'); // <--- add this




const voterDashboard = async (req, res) => {
  try {
    const voter = await Voter.findById(req.voter._id).populate("election");
    if (!voter) return res.status(404).json({ message: "Voter not found" });

    const candidates = await Candidate.find({ election: voter.election._id })
        .select("_id name votes photo");



    res.json({
      name: voter.name,
      hasVoted: voter.hasVoted,
      electionName: voter.election ? voter.election.name : "N/A",
      candidates
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching voter dashboard", error: err.message });
  }
};

module.exports = { voterDashboard };


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
        // 1️⃣ Validate election timing first (no DB lock needed)
        const candidate = await Candidate.findById(candidateId).select('election');
        if (!candidate) {
            return res.status(400).json({ message: 'Candidate not found' });
        }

        const election = await Election.findById(candidate.election).select('startDate endDate');
        if (!election) {
            return res.status(400).json({ message: 'Election not found' });
        }

        const now = new Date();
        if (now < new Date(election.startDate) || now > new Date(election.endDate)) {
            return res.status(400).json({ message: 'Election is not active' });
        }

        // 2️⃣ ATOMIC: Mark voter as voted (prevents double voting)
        // This is the KEY operation - it's atomic and prevents race conditions
        const voterUpdate = await Voter.findOneAndUpdate(
            { 
                _id: voter._id,
                hasVoted: false,  // Only update if not voted yet
                election: candidate.election  // Ensure candidate belongs to voter's election
            },
            { 
                $set: { hasVoted: true }
            },
            { 
                new: false  // Return old document to check if update happened
            }
        );

        // If voterUpdate is null, voter already voted or doesn't exist
        if (!voterUpdate) {
            const existingVoter = await Voter.findById(voter._id);
            if (!existingVoter) {
                return res.status(404).json({ message: 'Voter not found' });
            }
            if (existingVoter.hasVoted) {
                return res.status(400).json({ message: 'You have already voted' });
            }
            if (!existingVoter.election.equals(candidate.election)) {
                return res.status(400).json({ message: 'Candidate does not belong to your election' });
            }
            return res.status(400).json({ message: 'Unable to process vote, please try again' });
        }

        // 3️⃣ ATOMIC: Increment candidate votes
        // $inc is atomic at document level - no transaction needed
        await Candidate.updateOne(
            { _id: candidateId },
            { $inc: { votes: 1 } }
        );

        // 4️⃣ Record the vote (for audit trail)
        await Vote.create({
            voter: voter._id,
            candidate: candidateId,
            election: election._id
        });

        return res.json({ message: `Vote cast successfully for ${candidate.name}` });

    } catch (err) {
        console.error('Vote casting error:', err);
        
        // If anything fails after marking voter as voted, try to rollback
        // This is best-effort cleanup
        try {
            await Voter.updateOne(
                { _id: voter._id },
                { $set: { hasVoted: false } }
            );
        } catch (rollbackErr) {
            console.error('Rollback failed:', rollbackErr);
        }
        
        return res.status(500).json({ 
            message: 'Error casting vote', 
            error: err.message 
        });
    }
};





// View election results
const viewResults = async (req, res) => {
    const voter = req.voter;

    try {
        const election = await Election.findById(voter.election);
        if (!election) return res.status(404).json({ message: 'Election not found' });

        const now = new Date();
        if (now <= new Date(election.endDate)) {
            return res.status(403).json({ message: 'Results will be available shortly after the election ends' });
    }


        const candidates = await Candidate.find({ election: election._id })
            .select('name votes')
            .sort({ votes: -1 });

        res.json({ election: election.name, results: candidates });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching results', error: err.message });
    }
};

module.exports = { voterLogin, castVote, viewResults, voterDashboard };

