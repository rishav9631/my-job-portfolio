const MasterResume = require('../models/MasterResume');
const Resume = require('../models/Resume');
const axios = require('axios');

exports.getMasterResume = async (req, res) => {
    try {
        let master = await MasterResume.findOne({ label: 'master' });
        if (!master) {
            // Create an empty master resume if none exists
            master = await MasterResume.create({ label: 'master', content: '' });
        }
        res.json({ success: true, content: master.content });
    } catch (error) {
        console.error("Error reading master resume:", error);
        res.status(500).json({ success: false, message: "Server error reading resume." });
    }
};

exports.updateMasterResume = async (req, res) => {
    try {
        const { content } = req.body;
        if (content === undefined) {
            return res.status(400).json({ success: false, message: "Resume content is required." });
        }
        
        let master = await MasterResume.findOne({ label: 'master' });
        if (master) {
            master.content = content;
            await master.save();
        } else {
            master = await MasterResume.create({ label: 'master', content });
        }
        
        res.json({ success: true, message: "Master resume updated successfully." });
    } catch (error) {
        console.error("Error updating master resume:", error);
        res.status(500).json({ success: false, message: "Server error updating resume." });
    }
};

exports.saveTailoredResume = async (req, res) => {
    try {
        const { company, jobId, content } = req.body;
        
        if (!company || !content) {
            return res.status(400).json({ success: false, message: "Company name and resume content are required." });
        }

        const newResume = await Resume.create({
            company,
            jobId: jobId || 'N/A',
            content
        });
        
        res.json({ 
            success: true, 
            message: `Tailored resume saved for ${company}`,
            resume: newResume 
        });
    } catch (error) {
        console.error("Error saving tailored resume:", error);
        res.status(500).json({ success: false, message: "Server error saving tailored resume." });
    }
};

exports.getTailoredResumes = async (req, res) => {
    try {
        const resumes = await Resume.find().sort({ createdAt: -1 });
        res.json({ success: true, resumes });
    } catch (error) {
        console.error("Error fetching tailored resumes:", error);
        res.status(500).json({ success: false, message: "Server error fetching tailored resumes." });
    }
};

exports.deleteTailoredResume = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Resume.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Resume not found." });
        }
        res.json({ success: true, message: "Resume deleted successfully." });
    } catch (error) {
        console.error("Error deleting tailored resume:", error);
        res.status(500).json({ success: false, message: "Server error deleting resume." });
    }
};

exports.compileResume = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ success: false, message: "LaTeX content is required." });
        }

        console.log("[CompileResume] Compiling LaTeX via texlive.net (FormData)...");
        
        const form = new FormData();
        form.append('filecontents[]', content);
        form.append('filename[]', 'document.tex');
        form.append('engine', 'pdflatex');
        form.append('return', 'pdf');

        const response = await axios.post('https://texlive.net/cgi-bin/latexcgi', form, {
            responseType: 'arraybuffer',
            timeout: 35000
        });

        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/pdf')) {
            console.log(`[CompileResume] SUCCESS! Generated PDF (${response.data.length} bytes)`);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
            return res.send(response.data);
        } else {
            const text = Buffer.from(response.data).toString('utf-8');
            console.error("[CompileResume] LaTeX compilation returned non-PDF:", text.substring(0, 500));
            return res.status(422).json({
                success: false,
                message: "LaTeX compilation error. Please check your LaTeX syntax.",
                details: text.substring(0, 1000)
            });
        }
    } catch (error) {
        console.error("[CompileResume] Error compiling resume:", error.message);
        res.status(500).json({ success: false, message: "Error compiling LaTeX on external service." });
    }
};
