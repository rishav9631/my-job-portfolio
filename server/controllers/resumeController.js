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

        // ── ATTEMPT 1: texlive.net ──────────────────────────────────────────
        try {
            const params = new URLSearchParams();
            params.append('filecontents[]', content);
            params.append('filename[]', 'main.tex');
            params.append('engine', 'pdflatex');
            params.append('return', 'pdf');

            const response = await axios.post('https://texlive.net/cgi-bin/latexcgi', params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const contentType = response.headers['content-type'];
            if (contentType && contentType.includes('application/pdf')) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
                return res.send(response.data);
            }
        } catch (err1) {
            console.warn("texlive.net compilation attempt failed, trying latexonline fallback...", err1.message);
        }

        // ── ATTEMPT 2: latexonline.cc fallback ──────────────────────────────
        try {
            const response2 = await axios.get(`https://latexonline.cc/compile?text=${encodeURIComponent(content)}`, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const contentType2 = response2.headers['content-type'];
            if (contentType2 && contentType2.includes('application/pdf')) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
                return res.send(response2.data);
            }
        } catch (err2) {
            console.error("latexonline.cc fallback compilation failed:", err2.message);
        }

        return res.status(422).json({ 
            success: false, 
            message: "LaTeX compilation error. Please check your LaTeX syntax or custom packages." 
        });
    } catch (error) {
        console.error("Error compiling resume:", error.message);
        res.status(500).json({ success: false, message: "Error compiling LaTeX on external service." });
    }
};
