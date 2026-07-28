const mongoose = require('mongoose');

const masterResumeSchema = new mongoose.Schema({
    label: {
        type: String,
        default: 'master',
        unique: true
    },
    content: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('MasterResume', masterResumeSchema);
