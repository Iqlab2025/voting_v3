const generateToken = require('../utils/generateToken');
const Election = require('../models/Election');
const Voter = require('../models/Voter');
const generateVoterPassword = require('../utils/generateVoterPassword');
const Candidate = require('../models/Candidate');


const adminLogin = (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = generateToken(username);
        return res.json({ token });
    } else {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
};

module.exports = { adminLogin };


// Create election
const createElection = async (req, res) => {
    const { name, startDate, endDate } = req.body;

    if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: 'Start date must be before end date' });
    }

    try {
        const election = await Election.create({ name, startDate, endDate });
        res.status(201).json(election);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating election', error: err.message });
    }
};

// Add voters
const addVoters = async (req, res) => {
    const { electionId, voters } = req.body; 
    // voters: [{ name, phone, dob }, ...]

    try {
        const addedVoters = [];

        for (const voter of voters) {
            const { name, phone, dob } = voter;

            // Check unique phone
            const exists = await Voter.findOne({ phone });
            if (exists) continue;

            const password = generateVoterPassword(name, phone, dob);

            const newVoter = await Voter.create({
                election: electionId,
                name,
                phone,
                dob,
                password
            });

            addedVoters.push({ name, phone, password });
        }

        res.status(201).json({ message: 'Voters added', voters: addedVoters });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding voters', error: err.message });
    }
};

module.exports = { adminLogin, createElection, addVoters };


// Add candidate
const addCandidate = async (req, res) => {
    const { electionId, name } = req.body;
    let photo = '';

    if (req.file) {
        photo = req.file.path; // path on server
    } else if (req.body.photo) {
        photo = req.body.photo; // URL
    }

    try {
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }

        const candidate = await Candidate.create({ election: electionId, name, photo });
        res.status(201).json(candidate);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding candidate', error: err.message });
    }
};

// Get live vote counts
const getLiveVotes = async (req, res) => {
    const { electionId } = req.params;

    try {
        const candidates = await Candidate.find({ election: electionId }).select('name votes');
        res.json({ electionId, candidates });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching live votes', error: err.message });
    }
};

// Get final results (only after election ends)
const getResults = async (req, res) => {
    const { electionId } = req.params;

    try {
        const election = await Election.findById(electionId);
        if (!election) return res.status(404).json({ message: 'Election not found' });

        const now = new Date();
        if (now < new Date(election.endDate)) {
            return res.status(403).json({ message: 'Election is still ongoing' });
        }

        const candidates = await Candidate.find({ election: electionId }).sort({ votes: -1 });
        res.json({ election: election.name, results: candidates });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching results', error: err.message });
    }
};

module.exports = { adminLogin, createElection, addVoters, addCandidate, getLiveVotes, getResults };

