const jwt = require('jsonwebtoken');

const generateVoterToken = (voterId) => {
    return jwt.sign({ voterId }, process.env.JWT_SECRET, { expiresIn: '4h' });
};

module.exports = generateVoterToken;
