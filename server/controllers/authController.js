const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailSender = require('../utils/mailsender');
const { forceRefresh } = require('../utils/googleOAuthService');
const { getPasswordRecoveryEmail } = require('../mail/templates/resetPassword');

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

/**
 * Forgot Password — refreshes Gmail OAuth token, fetches user credentials,
 * resets password to a temporary one, and emails it to rishavjha771@gmail.com.
 */
exports.forgotPassword = async (req, res) => {
    try {
        console.log('[ForgotPassword] Step 1/4: Force-refreshing Gmail OAuth token...');
        await forceRefresh();
        console.log('[ForgotPassword] Step 1/4: OAuth token refreshed successfully.');

        // Step 2: Query MongoDB for the hardcoded user
        console.log('[ForgotPassword] Step 2/4: Looking up user in MongoDB...');
        const user = await User.findOne({ username: 'Rishav771' });
        if (!user) {
            console.error('[ForgotPassword] User not found in database.');
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        console.log(`[ForgotPassword] Step 2/4: Found user "${user.username}".`);

        // Step 3: Generate a new temporary password, hash it, and update in DB
        const tempPassword = crypto.randomBytes(4).toString('hex'); // 8-char hex string
        console.log('[ForgotPassword] Step 3/4: Resetting password...');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        user.password = hashedPassword;
        await user.save();
        console.log('[ForgotPassword] Step 3/4: Password updated in MongoDB.');

        // Step 4: Send credentials via email
        console.log('[ForgotPassword] Step 4/4: Sending recovery email to rishavjha771@gmail.com...');
        const emailBody = getPasswordRecoveryEmail(user.username, tempPassword);
        await mailSender(
            'rishavjha771@gmail.com',
            'JobTracker — Password Recovery',
            emailBody
        );
        console.log('[ForgotPassword] Step 4/4: Recovery email sent successfully.');

        res.json({
            success: true,
            message: 'Password recovery email sent! Check your inbox at rishavjha771@gmail.com.',
        });
    } catch (error) {
        console.error('[ForgotPassword] Error:', error.message);
        res.status(500).json({
            success: false,
            message: `Password recovery failed: ${error.message}`,
        });
    }
};
