const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
    // Email template links
    linkedinUrl: {
        type: String,
        default: 'https://www.linkedin.com/in/rishav-kumar-sde/'
    },
    resumeUrl: {
        type: String,
        default: 'https://drive.google.com/file/d/1myrH9blbnZ06gFsS0_-XkJpzcax5LH7z/view'
    },
    githubUrl: {
        type: String,
        default: 'https://github.com/rishav9631'
    },
    senderName: {
        type: String,
        default: 'Rishav Kumar'
    },
    senderTitle: {
        type: String,
        default: 'Software Developer | Amdocs'
    },
    senderEmail: {
        type: String,
        default: 'rishavjha771@gmail.com'
    },

    // Gemini API configuration
    geminiApiKey: {
        type: String,
        default: ''
    },
    geminiApiUrl: {
        type: String,
        default: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    },

    // SMTP configuration
    smtpHost: {
        type: String,
        default: 'smtp.gmail.com'
    },
    smtpPort: {
        type: Number,
        default: 465
    },
    smtpSecure: {
        type: Boolean,
        default: true
    },
    smtpUser: {
        type: String,
        default: ''
    },
    smtpPass: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('AppConfig', appConfigSchema);
