const jwt = require('jsonwebtoken');
const Voter = require('../models/Voter');

const voterAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const voter = await Voter.findById(decoded.voterId);

        if (!voter) {
            return res.status(401).json({ message: 'Voter not found' });
        }

        req.voter = voter;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = voterAuth;
