const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');

// Route to fetch the master resume
router.get('/master', resumeController.getMasterResume);

// Route to update the master resume
router.put('/master', resumeController.updateMasterResume);

// Route to save a tailored copy of the resume for a specific job application
router.post('/tailored', resumeController.saveTailoredResume);

// Route to fetch all tailored resumes
router.get('/tailored', resumeController.getTailoredResumes);

// Route to delete a tailored resume
router.delete('/tailored/:id', resumeController.deleteTailoredResume);

// Route to proxy LaTeX compilation to latexonline.cc
router.post('/compile', resumeController.compileResume);

module.exports = router;
