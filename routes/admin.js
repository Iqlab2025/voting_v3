const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/auth');
const upload = require('../middleware/upload');

const { 
    adminLogin, 
    createElection, 
    addVoters, 
    addCandidate, 
    getLiveVotes, 
    getResults,
    getAllElections,
    getElectionDetails,
    addVotersBulk,
    deleteVoter,
    deleteCandidate
} = require('../controllers/adminController');

// Login route
router.post('/login', adminLogin);

// Protected routes
router.use(adminAuth);

// Elections
router.post('/elections', createElection);

// DELETE /api/admin/voters/:voterId
router.delete('/voters/:voterId', deleteVoter);


// Voters
router.post('/voters', addVoters);

// Candidates (with photo upload)
router.post('/candidates', upload.single('photo'), addCandidate);
// DELETE /api/admin/candidates/:candidateId
router.delete('/candidates/:candidateId', deleteCandidate);

// Live votes
router.get('/votes/:electionId', getLiveVotes);

// Results
router.get('/results/:electionId', getResults);
router.get("/elections", adminAuth, getAllElections); // list all elections
router.get("/elections/:id", adminAuth, getElectionDetails); // view details of one election
// routes/adminRoutes.js
router.post('/voters/bulk/:electionId', adminAuth, addVotersBulk);



module.exports = router;
