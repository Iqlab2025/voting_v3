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
    getResults 
} = require('../controllers/adminController');

// Login route
router.post('/login', adminLogin);

// Protected routes
router.use(adminAuth);

// Elections
router.post('/elections', createElection);

// Voters
router.post('/voters', addVoters);

// Candidates (with photo upload)
router.post('/candidates', upload.single('photo'), addCandidate);

// Live votes
router.get('/votes/:electionId', getLiveVotes);

// Results
router.get('/results/:electionId', getResults);

module.exports = router;
