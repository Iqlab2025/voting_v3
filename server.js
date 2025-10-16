require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const voterRoutes = require('./routes/voter');
const path = require('path');


const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();


app.use('/api/admin', adminRoutes);
app.use('/api/voter', voterRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
