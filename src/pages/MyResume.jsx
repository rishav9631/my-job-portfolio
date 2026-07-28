import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MyResume = () => {
  const [masterResume, setMasterResume] = useState('');
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [tailoredResumes, setTailoredResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfError, setPdfError] = useState(null);

  // New resume form
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newJobId, setNewJobId] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      // Fetch Master Resume
      const masterRes = await axios.get('http://localhost:4000/api/v1/resume/master');
      if (masterRes.data.success) {
        setMasterResume(masterRes.data.content);
      }

      // Fetch Tailored Resumes
      const tailoredRes = await axios.get('http://localhost:4000/api/v1/resume/tailored');
      if (tailoredRes.data.success) {
        setTailoredResumes(tailoredRes.data.resumes);
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
      toast.error("Failed to load your resumes.");
    } finally {
      setLoading(false);
    }
  };

  const saveMasterResume = async () => {
    const toastId = toast.loading('Saving Master Resume...');
    try {
      const res = await axios.put('http://localhost:4000/api/v1/resume/master', {
        content: masterResume
      });
      if (res.data.success) {
        toast.success('Master Resume Updated!', { id: toastId });
        setIsEditingMaster(false);
      } else {
        toast.error('Failed to save resume.', { id: toastId });
      }
    } catch (error) {
      console.error("Error saving master:", error);
      toast.error('Server error while saving.', { id: toastId });
    }
  };

  const compilePDF = async () => {
    if (!masterResume.trim()) {
      toast.error('Please enter LaTeX content first.');
      return;
    }
    
    setIsCompiling(true);
    setPdfUrl(null);
    setPdfError(null);
    const toastId = toast.loading('Compiling LaTeX to PDF via Cloud...');

    try {
      const response = await fetch('http://localhost:4000/api/v1/resume/compile', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({ content: masterResume })
      });

      if (!response.ok) {
        // Try to read error details
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Compilation Failed');
        }
        throw new Error('Compilation Failed: ' + response.statusText);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        const blob = await response.blob();
        // Revoke previous URL to avoid memory leaks
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        toast.success('Resume Compiled Successfully!', { id: toastId });
      } else {
        // Non-PDF response — might be HTML error from texlive.net
        const text = await response.text();
        setPdfError(text.substring(0, 500));
        toast.error('Compilation returned non-PDF output. Check your LaTeX.', { id: toastId });
      }
    } catch (error) {
      console.error("Error compiling PDF:", error);
      setPdfError(error.message);
      toast.error(error.message || 'Failed to compile LaTeX.', { id: toastId });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSaveNewResume = async () => {
    if (!newCompany.trim()) {
      toast.error('Company name is required.');
      return;
    }
    if (!newContent.trim()) {
      toast.error('Resume content is required.');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving resume...');

    try {
      const res = await axios.post('http://localhost:4000/api/v1/resume/tailored', {
        company: newCompany,
        jobId: newJobId || 'N/A',
        content: newContent
      });

      if (res.data.success) {
        toast.success(`Resume saved for ${newCompany}!`, { id: toastId });
        setNewCompany('');
        setNewJobId('');
        setNewContent('');
        setShowSaveForm(false);
        fetchResumes(); // Refresh list
      } else {
        toast.error('Failed to save.', { id: toastId });
      }
    } catch (error) {
      console.error("Error saving resume:", error);
      toast.error('Server error while saving.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResume = async (id, company) => {
    if (!window.confirm(`Delete resume for "${company}"?`)) return;

    const toastId = toast.loading('Deleting resume...');
    try {
      const res = await axios.delete(`http://localhost:4000/api/v1/resume/tailored/${id}`);
      if (res.data.success) {
        toast.success('Resume deleted.', { id: toastId });
        setTailoredResumes(prev => prev.filter(r => r._id !== id));
      } else {
        toast.error('Failed to delete.', { id: toastId });
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast.error('Server error while deleting.', { id: toastId });
    }
  };

  const downloadPDF = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen flex flex-col font-inter relative overflow-hidden bg-[#000814]">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#111827] to-[#064e3b] opacity-90 z-0 flex-grow"></div>
      
      {/* Content Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col relative z-10 p-4 sm:p-6 lg:p-8 pt-24 gap-8">
        
        <div className="mb-2">
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-teal-400">Resumes</span>
            </h1>
            <p className="text-gray-400 text-sm">
                Manage your master source file and review your tailored ATS-friendly versions.
            </p>
        </div>

        {/* Master Resume Section */}
        <div className="bg-[#111827]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#1f2937]/50 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-[#1f2937]/50 bg-[#1f2937]/30">
            <div>
              <h2 className="text-xl font-bold text-white">Master Resume</h2>
              <p className="text-xs text-gray-400 mt-1">This feeds into all Cover Letter and ATS Scans initially.</p>
            </div>
            
            {isEditingMaster ? (
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditingMaster(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveMasterResume}
                  className="px-4 py-2 text-sm font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-lg shadow-lg shadow-[#064e3b]/20 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(masterResume);
                    toast.success("Master Resume copied to clipboard!");
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/30 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy
                </button>
                <button 
                  onClick={() => setIsEditingMaster(true)}
                  className="px-4 py-2 text-sm font-medium text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/10 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit Master
                </button>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {loading ? (
               <div className="animate-pulse flex flex-col gap-2">
                  <div className="h-4 bg-[#374151] rounded w-3/4"></div>
                  <div className="h-4 bg-[#374151] rounded w-full"></div>
                  <div className="h-4 bg-[#374151] rounded w-5/6"></div>
               </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Pane - LaTeX Editor */}
                    <div className="flex flex-col h-full">
                        <textarea
                            disabled={!isEditingMaster}
                            value={masterResume}
                            onChange={(e) => setMasterResume(e.target.value)}
                            placeholder={isEditingMaster ? "Paste your LaTeX resume content here..." : "Click 'Edit Master' to add your resume content..."}
                            className={`w-full h-full min-h-[500px] p-4 rounded-lg bg-[#000814]/50 text-gray-300 border font-mono text-sm leading-relaxed focus:outline-none transition-colors resize-y shadow-inner ${
                            isEditingMaster 
                            ? 'border-[#10b981] focus:ring-1 focus:ring-[#10b981]' 
                            : 'border-[#1f2937] opacity-80 cursor-default'
                            }`}
                        />
                    </div>
                    
                    {/* Right Pane - Visual Preview */}
                    <div className="flex flex-col h-full min-h-[500px] rounded-lg border border-[#1f2937] bg-[#111827] overflow-hidden relative">
                        {/* Header for Viewer */}
                        <div className="flex justify-between items-center px-4 py-2 border-b border-[#1f2937]/80 bg-[#1f2937]/50">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">PDF Preview</span>
                            <div className="flex gap-2">
                                {pdfUrl && (
                                  <button
                                    onClick={downloadPDF}
                                    className="text-xs px-3 py-1.5 rounded font-bold text-white bg-[#10b981] hover:bg-[#059669] shadow transition-all flex items-center gap-1"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download
                                  </button>
                                )}
                                <button
                                    onClick={compilePDF}
                                    disabled={isCompiling || !masterResume.trim()}
                                    className={`text-xs px-3 py-1.5 rounded font-bold text-white shadow transition-all ${
                                        isCompiling || !masterResume.trim()
                                        ? "bg-[#374151] cursor-wait" 
                                        : "bg-[#2563eb] hover:bg-[#1d4ed8]"
                                    }`}
                                >
                                    {isCompiling ? "Compiling..." : "Compile LaTeX"}
                                </button>
                            </div>
                        </div>
                        
                        {/* PDF View Area */}
                        <div className="flex-grow flex items-center justify-center bg-[#000814]/80">
                            {isCompiling ? (
                                <div className="flex flex-col items-center animate-pulse text-[#10b981]">
                                    <svg className="w-12 h-12 mb-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    <span className="text-sm font-medium tracking-wide">Rendering Document...</span>
                                </div>
                            ) : pdfUrl ? (
                                <iframe 
                                    src={pdfUrl}
                                    title="Resume Preview"
                                    className="w-full h-full border-0"
                                    style={{ minHeight: '500px' }}
                                />
                            ) : pdfError ? (
                                <div className="text-center p-6 max-w-md">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                    <p className="text-red-400 text-sm font-medium mb-2">Compilation Error</p>
                                    <p className="text-gray-500 text-xs font-mono bg-[#1f2937]/50 p-3 rounded-lg overflow-auto max-h-40">{pdfError}</p>
                                </div>
                            ) : (
                                <div className="text-center p-6 opacity-50">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <p className="text-gray-400 text-sm">Click "Compile LaTeX" to render your PDF from the master source code.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Tailored Resumes Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-6 border-b border-[#1f2937]/50 pb-4">
            <h2 className="text-2xl font-bold text-white">
                Saved <span className="text-[#10b981]">Job-Specific</span> Resumes
            </h2>
            <button
              onClick={() => setShowSaveForm(!showSaveForm)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                showSaveForm
                  ? 'text-gray-300 bg-[#1f2937]/50 border border-[#374151]'
                  : 'text-white bg-[#10b981] hover:bg-[#059669] shadow-lg shadow-[#10b981]/20'
              }`}
            >
              {showSaveForm ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Save New Resume
                </>
              )}
            </button>
          </div>

          {/* New Resume Form */}
          {showSaveForm && (
            <div className="bg-[#111827]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#10b981]/30 p-6 mb-6 animate-in">
              <h3 className="text-lg font-bold text-white mb-4">Save a New Job-Specific Resume</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">Company Name *</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g., Google, Microsoft"
                    className="w-full p-3 rounded-lg bg-[#1f2937]/50 text-white border border-[#374151] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">Job ID (Optional)</label>
                  <input
                    type="text"
                    value={newJobId}
                    onChange={(e) => setNewJobId(e.target.value)}
                    placeholder="e.g., REQ-1234"
                    className="w-full p-3 rounded-lg bg-[#1f2937]/50 text-white border border-[#374151] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none text-sm transition-colors"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1 block font-medium">Resume Content *</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste your tailored resume content here..."
                  className="w-full min-h-[200px] p-4 rounded-lg bg-[#1f2937]/50 text-white border border-[#374151] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none text-sm font-mono leading-relaxed transition-colors resize-y"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNewResume}
                  disabled={isSaving || !newCompany.trim() || !newContent.trim()}
                  className={`px-6 py-2.5 rounded-lg font-bold text-white text-sm transition-all ${
                    isSaving || !newCompany.trim() || !newContent.trim()
                      ? 'bg-[#374151] cursor-not-allowed'
                      : 'bg-[#10b981] hover:bg-[#059669] shadow-lg shadow-[#10b981]/20 hover:-translate-y-0.5'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save Resume'}
                </button>
              </div>
            </div>
          )}
          
          {loading ? (
             <div className="text-gray-500 text-sm">Loading tailored resumes...</div>
          ) : tailoredResumes.length === 0 ? (
            <div className="bg-[#1f2937]/20 border border-dashed border-[#374151] rounded-2xl p-12 text-center">
               <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               <p className="text-gray-400 font-medium">No tailored resumes found.</p>
               <p className="text-gray-500 text-sm mt-1">Click "Save New Resume" above or generate custom resumes via the ATS tool.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tailoredResumes.map((resume, idx) => {
                const company = resume.company || "Unknown";
                const jobId = resume.jobId && resume.jobId !== 'N/A' ? ` | Job ID: ${resume.jobId}` : "";
                const date = new Date(resume.createdAt).toLocaleDateString();

                return (
                  <div key={resume._id || idx} className="bg-[#111827]/60 backdrop-blur-md rounded-xl border border-[#1f2937]/50 p-5 hover:border-[#10b981]/50 transition-colors group relative flex flex-col h-80">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-[#059669]/20 text-[#10b981] px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                        {company}{jobId}
                      </div>
                      <span className="text-xs text-gray-500">{date}</span>
                    </div>

                    <div className="flex-grow overflow-y-auto mb-4 border border-[#1f2937]/30 rounded-lg bg-[#000814]/50 p-3">
                       <p className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                         {resume.content}
                       </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-[#1f2937]/50">
                       <button 
                         onClick={() => handleDeleteResume(resume._id, company)}
                         className="px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/20 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
                       >
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         Delete
                       </button>
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(resume.content);
                           toast.success("Resume copied to clipboard!");
                         }}
                         className="px-3 py-1.5 text-sm font-medium text-white bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/30 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                         Copy
                       </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MyResume;
