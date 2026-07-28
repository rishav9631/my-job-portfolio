const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mailapp-secret-key-2026';

// Seed the default user on first run
const seedDefaultUser = async () => {
    try {
        const existing = await User.findOne({ username: 'Rishav771' });
        if (!existing) {
            const hashedPassword = await bcrypt.hash('Rishav771', 10);
            await User.create({ username: 'Rishav771', password: hashedPassword });
            console.log('Default user "Rishav771" created.');
        }
    } catch (error) {
        console.error('Error seeding default user:', error.message);
    }
};

// Call seed on module load
seedDefaultUser();

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: { username: user.username }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

exports.verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ success: true, user: { username: decoded.username } });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};
