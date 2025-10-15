const express = require('express');
const router = express.Router();

const { voterLogin, castVote } = require('../controllers/voterController');
const voterAuth = require('../middleware/voterAuth');

router.post('/login', voterLogin);

// Protected voter routes
router.use(voterAuth);

router.get('/dashboard', (req, res) => {
    res.json({ message: `Welcome ${req.voter.name}!`, election: req.voter.election });
});

// Cast vote
router.post('/vote', castVote);

module.exports = router;
