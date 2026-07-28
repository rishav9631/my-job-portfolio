import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const CoverLetter = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumeContent, setResumeContent] = useState('');
  const [company, setCompany] = useState('');
  const [jobId, setJobId] = useState('');

  const handleSaveToResumes = async () => {
    if (!company.trim()) {
      toast.error('Company Name is required to save.');
      return;
    }
    const toastId = toast.loading('Saving to My Resumes...');
    try {
      const res = await axios.post('http://localhost:4000/api/v1/resume/tailored', {
        company,
        jobId,
        content: coverLetter
      });
      if (res.data.success) {
        toast.success('Successfully saved to My Resumes!', { id: toastId });
        setCompany('');
        setJobId('');
      } else {
        toast.error('Failed to save.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error while saving.', { id: toastId });
    }
  };

  // Fetch the resume.txt on component mount
  useEffect(() => {
    fetch('/data/Resume.txt')
      .then((res) => res.text())
      .then((text) => setResumeContent(text))
      .catch((err) => console.error("Error loading resume:", err));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      toast.error('Please enter a Job Description');
      return;
    }
    
    setLoading(true);
    setCoverLetter('');
    const toastId = toast.loading('Generating your personalized Cover Letter...');

    try {
      const prompt = `Write a professional, compelling, and tailored cover letter based on the following Job Description and my Resume context.
      
      Job Description:
      ${jobDescription}

      My Resume:
      ${resumeContent}
      
      Keep the tone professional and enthusiastic. Ensure my skills map directly to the job requirements. Return ONLY the cover letter content (no greetings or markdown formatting fences at the start).`;

      const res = await axios.post('http://localhost:4000/api/v1/ai', { prompt });
      
      if (res.data.success) {
        setCoverLetter(res.data.response);
        toast.success('Cover Letter Generated!', { id: toastId });
      } else {
        toast.error('Failed to generate cover letter.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error contacting AI service.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-inter relative overflow-hidden bg-[#000814]">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#111827] to-[#064e3b] opacity-90 z-0"></div>
      
      {/* Content Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row relative z-10 p-4 sm:p-6 lg:p-8 pt-24 min-h-screen gap-8">
        
        {/* Left Side: Input Form */}
        <div className="w-full lg:w-1/3 flex flex-col h-full">
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                Cover Letter <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-teal-400">Builder</span>
            </h1>
            <p className="text-gray-400 text-sm mb-6">
                Paste the job description below to geneate a highly tailored cover letter utilizing your primary resume.
            </p>

            <form onSubmit={handleGenerate} className="bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-[#1f2937]/50 flex flex-col flex-grow gap-4">
                <div className="flex flex-col flex-grow gap-2">
                    <label htmlFor="jobDescription" className="text-sm font-medium text-gray-400">
                        Job Description
                    </label>
                    <textarea
                        id="jobDescription"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the target job description here..."
                        className="w-full h-full min-h-[250px] p-4 rounded-lg bg-[#1f2937]/50 text-white border border-[#374151] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors outline-none resize-none"
                    />
                </div>
                
                <button
                    disabled={loading || !resumeContent}
                    type="submit"
                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all transform 
                        ${
                            loading || !resumeContent
                            ? "bg-[#1f2937] text-gray-400 cursor-not-allowed border border-[#374151]"
                            : "bg-[#059669] hover:bg-[#047857] hover:-translate-y-0.5 shadow-[#064e3b]/20"
                        }`}
                >
                    {loading ? "Generating..." : "Generate Cover Letter"}
                </button>
            </form>
        </div>

        {/* Right Side: Output */}
        <div className="w-full lg:w-2/3 flex flex-col h-full">
            <div className="bg-[#111827]/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-[#1f2937]/50 h-full min-h-[600px] overflow-y-auto">
                <h2 className="text-xl font-bold text-[#10b981] mb-6 border-b border-[#1f2937] pb-4">
                    Generated Output
                </h2>

                {coverLetter ? (
                    <div className="flex flex-col h-full">
                        <div className="prose prose-invert prose-emerald max-w-none text-gray-300 mb-8 flex-grow">
                            <ReactMarkdown>{coverLetter}</ReactMarkdown>
                        </div>
                        
                        {/* Save to My Resumes Bar */}
                        <div className="mt-auto bg-[#1f2937]/50 rounded-xl p-4 border border-[#374151] flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-grow w-full">
                                <label className="text-xs text-gray-400 mb-1 block">Company Name *</label>
                                <input 
                                    type="text" 
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder="e.g., Google"
                                    className="w-full p-2 rounded bg-[#111827] text-white border border-[#374151] focus:border-[#10b981] outline-none text-sm"
                                />
                            </div>
                            <div className="flex-grow w-full">
                                <label className="text-xs text-gray-400 mb-1 block">Job ID (Optional)</label>
                                <input 
                                    type="text" 
                                    value={jobId}
                                    onChange={(e) => setJobId(e.target.value)}
                                    placeholder="e.g., REQ-1234"
                                    className="w-full p-2 rounded bg-[#111827] text-white border border-[#374151] focus:border-[#10b981] outline-none text-sm"
                                />
                            </div>
                            <button 
                                onClick={handleSaveToResumes}
                                className="w-full sm:w-auto px-6 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-lg transition-colors whitespace-nowrap"
                            >
                                Save to My Resumes
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50 pb-20">
                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-lg">Your generated cover letter will appear here.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CoverLetter;
