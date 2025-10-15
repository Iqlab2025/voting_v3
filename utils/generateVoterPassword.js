// first 2 letters of name + first 2 digits of phone + year of birth
const generateVoterPassword = (name, phone, dob) => {
    const first2Name = name.slice(0, 2).toLowerCase();
    const first2Phone = phone.slice(0, 2);
    const year = new Date(dob).getFullYear();
    return `${first2Name}${first2Phone}${year}`;
};

module.exports = generateVoterPassword;
