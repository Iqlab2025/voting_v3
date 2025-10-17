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





const deleteVoter = async (req, res) => {
    try {
        const voterId = req.params.voterId;

        // Validate ObjectId
        if (!voterId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid voter ID" });
        }

        const voter = await Voter.findByIdAndDelete(voterId);
        if (!voter) return res.status(404).json({ message: "Voter not found" });

        res.json({ message: "Voter deleted successfully", voter });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting voter", error: err.message });
    }
};

module.exports = { deleteVoter };




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

// 🟢 GET /api/admin/elections — List all elections
const getAllElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({ startDate: -1 });

    const now = new Date();

    const data = elections.map((el) => {
      let status = "upcoming";
      if (now >= el.startDate && now <= el.endDate) status = "active";
      else if (now > el.endDate) status = "ended";

      return {
        _id: el._id,
        name: el.name,
        startDate: el.startDate,
        endDate: el.endDate,
        status,
      };
    });

    res.json(data);
  } catch (error) {
    console.error("Error fetching elections:", error);
    res.status(500).json({ message: "Failed to fetch elections" });
  }
};

// 🟢 GET /api/admin/elections/:id — View details of a specific election
const getElectionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const election = await Election.findById(id);
    if (!election) return res.status(404).json({ message: "Election not found" });

    const voters = await Voter.find({ election: id }).select("-__v  -election");
    const candidates = await Candidate.find({ election: id }).select("-__v  -election");

    const now = new Date();
    let status = "upcoming";
    if (now >= election.startDate && now <= election.endDate) status = "active";
    else if (now > election.endDate) status = "ended";

    res.json({
      _id: election._id,
      name: election.name,
      startDate: election.startDate,
      endDate: election.endDate,
      status,
      voters,
      candidates,
    });
  } catch (error) {
    console.error("Error fetching election details:", error);
    res.status(500).json({ message: "Failed to fetch election details" });
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

// Bulk Add Voters
const addVotersBulk = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { voters } = req.body;

    if (!voters || !Array.isArray(voters) || voters.length === 0) {
      return res.status(400).json({ message: 'Voter list required.' });
    }

    // Check election existence
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    const newVoters = voters.map(v => {
      const password =
        v.name.slice(0, 2).toLowerCase() +
        v.phone.slice(0, 2) +
        new Date(v.dob).getFullYear();

      return {
        name: v.name,
        phone: v.phone,
        dob: v.dob,
        password,
        election: electionId,
      };
    });

    // Insert all voters, skip duplicates
    const saved = await Voter.insertMany(newVoters, { ordered: false });

    res.status(201).json({
      message: `${saved.length} voters added successfully.`,
      voters: saved,
    });
  } catch (err) {
    console.error(err);

    if (err.writeErrors) {
      return res.status(207).json({
        message: `Some voters could not be added due to duplicates.`,
        details: err.writeErrors.map(e => e.errmsg),
      });
    }

    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete candidate
const deleteCandidate = async (req, res) => {
    try {
        const candidateId = req.params.candidateId;

        // Validate ObjectId
        if (!candidateId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid candidate ID" });
        }

        const candidate = await Candidate.findByIdAndDelete(candidateId);
        if (!candidate) return res.status(404).json({ message: "Candidate not found" });

        res.json({ message: "Candidate deleted successfully", candidate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting candidate", error: err.message });
    }
};

module.exports = { adminLogin, createElection, addVoters, addCandidate, getLiveVotes, getResults, getAllElections, getElectionDetails, addVotersBulk, deleteVoter, deleteCandidate };

