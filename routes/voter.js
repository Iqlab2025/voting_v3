const express = require('express');
const router = express.Router();
const { voterLogin, castVote, viewResults, voterDashboard } = require('../controllers/voterController');
const voterAuth = require('../middleware/voterAuth');

router.post('/login', voterLogin);

// Protected voter routes
router.use(voterAuth);

router.get('/dashboard', voterAuth, voterDashboard);

// Cast vote
router.post('/vote', castVote);

// View results
router.get('/results', viewResults);

module.exports = router;
