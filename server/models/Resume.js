const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    company: {
        type: String,
        required: true,
    },
    jobId: {
        type: String,
        default: 'N/A'
    },
    content: {
        type: String,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
