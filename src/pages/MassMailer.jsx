import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { apiConnector } from '../services/apiConnector';
import { contactusEndpoint, configEndpoint } from '../services/apis';

// ─── Default Constants (fallbacks if config not loaded) ──────────────────────
const DEFAULT_LINKEDIN_URL = "https://www.linkedin.com/in/rishav-kumar-sde/";
const DEFAULT_RESUME_URL = "https://drive.google.com/file/d/1myrH9blbnZ06gFsS0_-XkJpzcax5LH7z/view";
const DEFAULT_GITHUB_URL = "https://github.com/rishav9631";

// ─── Email Template (matches backend mailSender.js) ──────────────────────────
function getTemplateHTML(recipientName, recipientCompany, cfg = {}) {
  const linkedinUrl = cfg.linkedinUrl || DEFAULT_LINKEDIN_URL;
  const resumeUrl = cfg.resumeUrl || DEFAULT_RESUME_URL;
  const githubUrl = cfg.githubUrl || DEFAULT_GITHUB_URL;
  const senderName = cfg.senderName || 'Rishav Kumar';
  const senderEmail = cfg.senderEmail || 'rishavjha771@gmail.com';

  return `<!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <title>Inquiry About Software Engineering Opportunities</title>
      <style>
          body { background-color:#ffffff; font-family:Arial,sans-serif; font-size:14px; line-height:1.5; color:#333333; margin:0; padding:0; }
          .container { max-width:100%; padding:10px; }
          .body { font-size:14px; margin-bottom:20px; }
          .link { color:#007BFF; text-decoration:none; font-weight:bold; }
          .bold { font-weight:bold; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="body">
              <p>Dear <span class="bold">${recipientName}</span>,</p>
              <p>I hope this email finds you well. My name is <span class="bold">${senderName}</span>. I am currently a <span class="bold">Software Developer at Amdocs</span> and graduated from <span class="bold">NIT Jamshedpur</span> (ECE) with a <span class="bold">CGPA of 8.54</span>.</p>
              <p>I am reaching out to express my interest in engineering opportunities at <span class="bold">${recipientCompany}</span>. With 2+ years of experience building telecom billing systems for TELUS (10M+ subscribers), hands-on expertise in <span class="bold">Java, Python, GCP, Kubernetes, Docker, Grafana, SRE automation, and MERN-Stack</span>, I am eager to contribute to your team.</p>
              <p>You can find more details about my background on my <span class="bold">LinkedIn Profile</span>: <a href="${linkedinUrl}" class="link" target="_blank">${linkedinUrl}</a>.</p>
              <p>Additionally, here is the link to my <span class="bold">Resume</span>: <a href="${resumeUrl}" class="link" target="_blank">${resumeUrl}</a>.</p>
              <p>You can also explore my <span class="bold">GitHub Profile</span>: <a href="${githubUrl}" class="link" target="_blank">${githubUrl}</a>.</p>
              <p>Thank you for your time and consideration. Looking forward to hearing from you.</p>
              <p class="bold">Best regards,</p>
              <p>${senderName}</p>
              <p>Email: <a href="mailto:${senderEmail}" class="link">${senderEmail}</a></p>
          </div>
      </div>
  </body>
  </html>`;
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name'));
  const emailIdx = headers.findIndex(h => h.toLowerCase().includes('email'));
  const companyIdx = headers.findIndex(h => h.toLowerCase().includes('company'));
  const nameCol = nameIdx !== -1 ? nameIdx : 0;
  const emailCol = emailIdx !== -1 ? emailIdx : 1;
  const companyCol = companyIdx !== -1 ? companyIdx : 2;

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = [];
    let insideQuote = false;
    let currentCell = '';
    for (let ci = 0; ci < line.length; ci++) {
      const ch = line[ci];
      if (ch === '"' || ch === "'") { insideQuote = !insideQuote; }
      else if (ch === ',' && !insideQuote) { cells.push(currentCell.trim().replace(/^["']|["']$/g, '')); currentCell = ''; }
      else { currentCell += ch; }
    }
    cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));
    if (cells.length > Math.max(nameCol, emailCol, companyCol)) {
      results.push({ name: cells[nameCol], email: cells[emailCol], company: cells[companyCol] });
    }
  }
  return results;
}

// ─── Sidebar Nav Button ──────────────────────────────────────────────────────
const NavButton = ({ id, icon, label, active, onClick }) => (
  <button
    id={id}
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[0.95rem] font-medium cursor-pointer border-none text-left transition-all duration-300
      ${active
        ? 'text-white bg-gradient-to-r from-indigo-500 to-indigo-500/40 shadow-lg shadow-indigo-500/15'
        : 'text-slate-400 bg-transparent hover:text-slate-100 hover:bg-white/[0.04]'
      }`}
  >
    <i className={`${icon} text-[1.1rem]`} />
    {label}
  </button>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, colorClass, bgClass }) => (
  <div className="bg-[rgba(20,27,45,0.75)] border border-white/[0.07] rounded-xl p-5 flex items-center gap-4 backdrop-blur-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-white/[0.15]">
    <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center text-[1.3rem] ${bgClass} ${colorClass}`}>
      <i className={icon} />
    </div>
    <div className="flex flex-col">
      <span className="text-[0.85rem] text-slate-400 mb-1">{label}</span>
      <h3 className="text-[1.6rem] font-bold text-slate-50">{value}</h3>
    </div>
  </div>
);

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    pending: { icon: 'fa-solid fa-clock', text: 'Pending', cls: 'bg-white/[0.08] text-slate-400' },
    sending: { icon: 'fa-solid fa-spinner fa-spin', text: 'Sending', cls: 'bg-amber-500/20 text-amber-300' },
    success: { icon: 'fa-solid fa-check', text: 'Sent', cls: 'bg-emerald-500/20 text-emerald-500' },
    failed: { icon: 'fa-solid fa-circle-xmark', text: 'Failed', cls: 'bg-red-500/20 text-red-500' },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold ${c.cls}`}>
      <i className={c.icon} /> {c.text}
    </span>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── MassMailer Component ────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
const MassMailer = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [recipientQueue, setRecipientQueue] = useState([]);
  const [campaignState, setCampaignState] = useState('idle'); // idle | running | paused
  const [currentSendingIndex, setCurrentSendingIndex] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, success: 0, failed: 0 });
  const [logs, setLogs] = useState([{ time: new Date().toLocaleTimeString(), msg: '[System] Ready to send emails. Configure recipient list and hit Send.', type: 'system' }]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [previewEmail, setPreviewEmail] = useState('recipient@company.com');
  const [previewName, setPreviewName] = useState('Recipient Name');
  const [previewCompany, setPreviewCompany] = useState('Company Name');
  const [isDragOver, setIsDragOver] = useState(false);

  // Dynamic config from backend
  const [appConfig, setAppConfig] = useState(null);

  // Single form
  const [singleName, setSingleName] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleCompany, setSingleCompany] = useState('');
  const [singleJobRole, setSingleJobRole] = useState('');
  const [singleJobLink, setSingleJobLink] = useState('');
  const [singleSending, setSingleSending] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const logBoxRef = useRef(null);
  const iframeRef = useRef(null);
  const campaignStateRef = useRef(campaignState);
  const queueRef = useRef(recipientQueue);
  const statsRef = useRef(stats);
  const sendingIndexRef = useRef(currentSendingIndex);

  // Keep refs in sync
  useEffect(() => { campaignStateRef.current = campaignState; }, [campaignState]);
  useEffect(() => { queueRef.current = recipientQueue; }, [recipientQueue]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { sendingIndexRef.current = currentSendingIndex; }, [currentSendingIndex]);

  // Fetch dynamic config from backend on mount
  useEffect(() => {
    const fetchAppConfig = async () => {
      try {
        const token = localStorage.getItem('mailapp_token') || localStorage.getItem('token');
        const res = await apiConnector('GET', configEndpoint.GET_CONFIG, null, {
          Authorization: `Bearer ${token}`,
        });
        if (res.data?.success) {
          setAppConfig(res.data.config);
        }
      } catch (err) {
        console.warn('Could not load app config, using defaults.');
      }
    };
    fetchAppConfig();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addLog = useCallback((message, type = 'system') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, msg: message, type }]);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
  }, [logs]);

  // Update iframe preview
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(getTemplateHTML(previewName || 'Recipient Name', previewCompany || 'Company Name', appConfig || {}));
        doc.close();
      }
    }
  }, [previewName, previewCompany, appConfig]);

  // Sync single form to preview
  useEffect(() => {
    if (currentTab === 'single') {
      setPreviewName(singleName || 'Recipient Name');
      setPreviewCompany(singleCompany || 'Company Name');
      setPreviewEmail(singleEmail || 'recipient@company.com');
    }
  }, [currentTab, singleName, singleEmail, singleCompany]);

  // ── Tab switching ──────────────────────────────────────────────────────────
  const switchTab = (tab) => {
    setCurrentTab(tab);
    if (tab === 'bulk' && recipientQueue.length > 0) {
      const idx = Math.min(currentSendingIndex, recipientQueue.length - 1);
      selectRow(idx);
    }
  };

  const getPageTitle = () => {
    if (currentTab === 'dashboard') return 'Dashboard Overview';
    if (currentTab === 'bulk') return 'Bulk Mailer Campaign';
    return 'Single Email Sender';
  };

  const getPageSubtitle = () => {
    if (currentTab === 'dashboard') return 'Track your email sending stats and status in real time.';
    if (currentTab === 'bulk') return 'Upload a CSV of companies to send batch email inquiries.';
    return 'Send a personalized email inquiry to a specific contact.';
  };

  // ── Row selection → preview ────────────────────────────────────────────────
  const selectRow = (index) => {
    if (index < 0 || index >= recipientQueue.length) return;
    setSelectedRowIndex(index);
    const r = recipientQueue[index];
    setPreviewName(r.name);
    setPreviewCompany(r.company);
    setPreviewEmail(r.email);
  };

  // ── CSV handling ───────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file.name.endsWith('.csv')) {
      addLog('Invalid file type. Please drop a valid .csv file.', 'error');
      return;
    }
    addLog(`Loading CSV file: ${file.name}...`, 'system');
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      if (parsed.length === 0) {
        addLog('No valid recipients found. Headers: recipientName, recipientEmail, recipientCompany', 'error');
        return;
      }
      const queue = parsed.map((item, i) => ({ id: i, name: item.name, email: item.email, company: item.company, status: 'pending' }));
      setRecipientQueue(queue);
      setCurrentSendingIndex(0);
      setCampaignState('idle');
      const newStats = { total: queue.length, pending: queue.length, success: 0, failed: 0 };
      setStats(newStats);
      setSelectedRowIndex(0);
      setPreviewName(queue[0].name);
      setPreviewCompany(queue[0].company);
      setPreviewEmail(queue[0].email);
      addLog(`Successfully loaded ${queue.length} records from CSV. Ready to start campaign.`, 'success');
    };
    reader.readAsText(file);
  };

  const onDragEnter = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  };

  const downloadSampleCSV = () => {
    const csv = "data:text/csv;charset=utf-8,recipientName,recipientEmail,recipientCompany\r\nRishav Kumar,rishavjha771@gmail.com,Google\r\nJane Miller,jane.miller@microsoft.com,Microsoft\r\nBob HR,bob@apple.com,Apple\r\n";
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'massmailer_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('Sample CSV downloaded.', 'system');
  };

  // ── Campaign Controls ──────────────────────────────────────────────────────
  const runNextInQueue = useCallback(async (queue, sIdx, st) => {
    if (campaignStateRef.current !== 'running') return;

    const nextIndex = queue.findIndex((item, idx) => idx >= sIdx && item.status === 'pending');
    if (nextIndex === -1) {
      setCampaignState('idle');
      const finalStats = statsRef.current;
      addLog(`Campaign finished! Sent successfully: ${finalStats.success}, Failed: ${finalStats.failed}`, 'success');
      return;
    }

    setCurrentSendingIndex(nextIndex);
    setSelectedRowIndex(nextIndex);

    const recipient = queue[nextIndex];
    recipient.status = 'sending';
    const newQueue = [...queue];
    setRecipientQueue(newQueue);

    const newStats = { ...statsRef.current, pending: statsRef.current.pending - 1 };
    setStats(newStats);

    setPreviewName(recipient.name);
    setPreviewCompany(recipient.company);
    setPreviewEmail(recipient.email);

    addLog(`[${nextIndex + 1}/${st.total}] Sending to ${recipient.name} at ${recipient.company}...`, 'system');

    try {
      const response = await apiConnector('POST', contactusEndpoint.CONTACT_US_API, {
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        recipientCompany: recipient.company,
      });

      if (response.data?.success || response.status === 200) {
        recipient.status = 'success';
        const updatedStats = { ...statsRef.current, success: statsRef.current.success + 1 };
        setStats(updatedStats);
        addLog(`[${nextIndex + 1}/${st.total}] Success: Sent to ${recipient.email}`, 'success');
      } else {
        recipient.status = 'failed';
        const updatedStats = { ...statsRef.current, failed: statsRef.current.failed + 1 };
        setStats(updatedStats);
        addLog(`[${nextIndex + 1}/${st.total}] Failed: ${response.data?.message || 'SMTP Error'}`, 'error');
      }
    } catch (err) {
      recipient.status = 'failed';
      const updatedStats = { ...statsRef.current, failed: statsRef.current.failed + 1 };
      setStats(updatedStats);
      addLog(`[${nextIndex + 1}/${st.total}] Network Error: ${err.message}`, 'error');
    }

    const finalQueue = [...newQueue];
    setRecipientQueue(finalQueue);

    if (campaignStateRef.current === 'running') {
      setTimeout(() => runNextInQueue(finalQueue, nextIndex + 1, st), 1500);
    }
  }, [addLog]);

  const startCampaign = () => {
    if (recipientQueue.length === 0) return;
    setCampaignState('running');
    addLog('Campaign started. Dispatching emails sequentially...', 'warning');
    // Need a small delay so the state ref updates
    setTimeout(() => {
      campaignStateRef.current = 'running';
      runNextInQueue(queueRef.current, sendingIndexRef.current, statsRef.current);
    }, 50);
  };

  const pauseCampaign = () => {
    setCampaignState('paused');
    addLog('Campaign paused by user.', 'warning');
  };

  const resetCampaign = () => {
    setCampaignState('idle');
    setRecipientQueue([]);
    setCurrentSendingIndex(0);
    setStats({ total: 0, pending: 0, success: 0, failed: 0 });
    setSelectedRowIndex(-1);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addLog('Queue cleared. System reset.', 'system');
  };

  // ── Single Email Send ─────────────────────────────────────────────────────
  const sendSingleEmail = async (e) => {
    e.preventDefault();
    if (!singleName.trim() || !singleEmail.trim() || !singleCompany.trim()) {
      toast.error('Please fill in Name, Email, and Company.');
      return;
    }
    setSingleSending(true);
    addLog(`Sending inquiry to ${singleName} (${singleCompany})...`, 'system');
    try {
      const response = await apiConnector('POST', contactusEndpoint.CONTACT_US_API, {
        recipientName: singleName.trim(),
        recipientEmail: singleEmail.trim(),
        recipientCompany: singleCompany.trim(),
        jobRole: singleJobRole.trim() || undefined,
        jobLink: singleJobLink.trim() || undefined,
      });
      if (response.data?.success || response.status === 200) {
        addLog(`Email successfully sent to ${singleName} (${singleEmail})!`, 'success');
        toast.success(`Email sent successfully to ${singleName}!`);
        setSingleName(''); setSingleEmail(''); setSingleCompany('');
        setSingleJobRole(''); setSingleJobLink('');
        setPreviewName('Recipient Name'); setPreviewCompany('Company Name'); setPreviewEmail('recipient@company.com');
      } else {
        addLog(`Failed to send email to ${singleName}: ${response.data?.message || 'Server error'}`, 'error');
        toast.error(`Failed: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      addLog(`Network error: ${error.message}`, 'error');
      toast.error(`Network error: ${error.message}`);
    } finally {
      setSingleSending(false);
    }
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const completed = stats.success + stats.failed;
  const progressPercent = stats.total > 0 ? Math.round((completed / stats.total) * 100) : 0;
  const showBulkControls = recipientQueue.length > 0;
  const isRunning = campaignState === 'running';
  const isCompleted = campaignState === 'idle' && stats.total > 0 && stats.pending === 0 && completed === stats.total;

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── RENDER ────────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="flex min-h-[calc(100vh-64px)] font-['Inter',sans-serif]"
      style={{
        backgroundColor: '#0b0f19',
        backgroundImage: 'radial-gradient(at 10% 20%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(at 90% 80%, rgba(16,185,129,0.08) 0px, transparent 50%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="w-[260px] bg-[rgba(13,18,30,0.9)] border-r border-white/[0.07] p-6 flex flex-col flex-shrink-0 backdrop-blur-[20px]">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-400 w-10 h-10 rounded-[10px] flex items-center justify-center shadow-[0_4px_14px_rgba(99,102,241,0.2)] text-[1.2rem] text-white">
            <i className="fa-solid fa-paper-plane" />
          </div>
          <h1 className="text-[1.4rem] font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            MassMailer
          </h1>
        </div>

        {/* Nav Menu */}
        <div className="flex flex-col gap-2 flex-grow">
          <NavButton id="nav-btn-dashboard" icon="fa-solid fa-chart-pie" label="Dashboard" active={currentTab === 'dashboard'} onClick={() => switchTab('dashboard')} />
          <NavButton id="nav-btn-bulk" icon="fa-solid fa-users-gear" label="Bulk Mailer" active={currentTab === 'bulk'} onClick={() => switchTab('bulk')} />
          <NavButton id="nav-btn-single" icon="fa-solid fa-user-plus" label="Single Mailer" active={currentTab === 'single'} onClick={() => switchTab('single')} />
        </div>

        {/* Footer */}
        <div className="pt-5 border-t border-white/[0.07] text-[0.85rem] text-slate-400">
          <p>Connected: <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] mr-1 align-middle" /> Resend API</p>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="flex-grow p-[30px] flex flex-col gap-6 max-w-[1600px] mx-auto" style={{ width: 'calc(100% - 260px)' }}>

        {/* ─── Top Header ─── */}
        <header className="flex justify-between items-center pb-5 border-b border-white/[0.07]">
          <div>
            <h2 className="text-[1.8rem] font-bold text-slate-50 mb-1">{getPageTitle()}</h2>
            <p className="text-slate-400 text-[0.95rem]">{getPageSubtitle()}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-full bg-indigo-500 text-white font-bold text-[0.9rem] flex items-center justify-center">RK</div>
            <span className="text-[0.95rem] font-semibold text-slate-50">Rishav Kumar</span>
          </div>
        </header>

        {/* ─── Stats Cards Row ─── */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          <StatCard icon="fa-solid fa-list-check" label="Total Queue" value={stats.total} bgClass="bg-indigo-500/15" colorClass="text-indigo-300" />
          <StatCard icon="fa-solid fa-spinner fa-spin" label="Pending" value={stats.pending} bgClass="bg-amber-500/15" colorClass="text-amber-300" />
          <StatCard icon="fa-solid fa-circle-check" label="Sent Successfully" value={stats.success} bgClass="bg-emerald-500/15" colorClass="text-emerald-400" />
          <StatCard icon="fa-solid fa-circle-xmark" label="Failed" value={stats.failed} bgClass="bg-red-500/15" colorClass="text-red-400" />
        </section>

        {/* ─── Content Grid (2 columns) ─── */}
        <div className="grid grid-cols-[1.2fr_0.8fr] gap-6 items-start max-lg:grid-cols-1">

          {/* ── Left Panel: Interaction Area ── */}
          <section className="bg-[rgba(20,27,45,0.75)] border border-white/[0.07] rounded-xl p-6 backdrop-blur-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex flex-col gap-5 min-h-[480px]">

            {/* DASHBOARD TAB */}
            {currentTab === 'dashboard' && (
              <div className="flex flex-col gap-5">
                {/* Welcome Box */}
                <div className="bg-gradient-to-br from-indigo-500/10 to-[rgba(13,18,30,0.3)] border border-indigo-500/20 rounded-xl p-6 flex flex-col gap-3.5">
                  <h3 className="text-[1.3rem] text-white font-semibold">Welcome to MassMailer</h3>
                  <p className="text-slate-400 leading-relaxed text-[0.95rem]">
                    Easily launch bulk email campaigns using the Resend API. You can upload a list of target companies via a CSV file, or send direct inquiries individually.
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => switchTab('bulk')} className="inline-flex items-center gap-2 px-[18px] py-[10px] rounded-lg text-[0.9rem] font-semibold bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:bg-indigo-600 hover:-translate-y-px transition-all">
                      <i className="fa-solid fa-upload" /> Upload CSV & Start Bulk
                    </button>
                    <button onClick={() => switchTab('single')} className="inline-flex items-center gap-2 px-[18px] py-[10px] rounded-lg text-[0.9rem] font-semibold bg-white/[0.08] text-slate-50 border border-white/10 hover:bg-white/[0.12] transition-all">
                      <i className="fa-solid fa-paper-plane" /> Send Single Inquiry
                    </button>
                  </div>
                </div>

                {/* System Info */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[1.1rem] font-semibold text-slate-50 border-l-[3px] border-indigo-500 pl-[10px]">System Information</h4>
                  <div className="grid grid-cols-1 gap-3 bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
                    <div className="flex justify-between text-[0.9rem]">
                      <span className="text-slate-400">SMTP Host:</span>
                      <span className="font-medium font-mono text-slate-50">Resend API (HTTPS)</span>
                    </div>
                    <div className="flex justify-between text-[0.9rem]">
                      <span className="text-slate-400">Sender Address:</span>
                      <span className="font-medium font-mono text-slate-50">{appConfig?.senderEmail || 'rishavjha771@gmail.com'}</span>
                    </div>
                    <div className="flex justify-between text-[0.9rem]">
                      <span className="text-slate-400">Active Template:</span>
                      <span className="font-medium font-mono text-slate-50">Professional Inquiry ({appConfig?.senderTitle || 'Software Developer'})</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BULK MAILER TAB */}
            {currentTab === 'bulk' && (
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <h4 className="text-[1.1rem] font-semibold text-slate-50">Bulk Campaign Management</h4>
                  <button onClick={downloadSampleCSV} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[0.8rem] font-semibold bg-white/[0.08] text-slate-50 border border-white/10 hover:bg-white/[0.12] transition-all">
                    <i className="fa-solid fa-download" /> Sample CSV
                  </button>
                </div>

                {/* Drag & Drop Uploader */}
                <div
                  onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl py-10 px-5 text-center cursor-pointer flex flex-col items-center gap-2.5 transition-all duration-300
                    ${isDragOver ? 'border-indigo-500 bg-indigo-500/5 scale-[0.99]' : 'border-white/15 bg-white/[0.01]'}`}
                >
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files.length > 0) handleFile(e.target.files[0]); }} />
                  <i className="fa-solid fa-file-csv text-[3rem] text-indigo-500 mb-2" />
                  <p className="text-slate-200">Drag & drop your CSV file here, or <span className="text-indigo-500 underline font-semibold">browse</span></p>
                  <span className="text-[0.8rem] text-slate-400">CSV should contain columns: <code className="bg-white/5 px-1 rounded text-indigo-300">recipientName</code>, <code className="bg-white/5 px-1 rounded text-indigo-300">recipientEmail</code>, <code className="bg-white/5 px-1 rounded text-indigo-300">recipientCompany</code></span>
                </div>

                {/* Bulk Controls */}
                {showBulkControls && (
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-[18px] flex flex-col gap-4">
                    {/* Progress Bar */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-[0.85rem] font-semibold text-slate-50">
                        <span>Progress: {progressPercent}%</span>
                        <span>{completed} / {stats.total} sent</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-400"
                          style={{ width: `${progressPercent}%`, background: 'linear-gradient(to right, #6366f1, #10b981)' }}
                        />
                      </div>
                    </div>
                    {/* Control Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={startCampaign}
                        disabled={isRunning || isCompleted}
                        className="inline-flex items-center gap-2 px-[18px] py-[10px] rounded-lg text-[0.9rem] font-semibold bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:bg-indigo-600 hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        <i className={isRunning ? 'fa-solid fa-spinner fa-spin' : (isCompleted ? 'fa-solid fa-circle-check' : 'fa-solid fa-play')} />
                        {isRunning ? 'Running...' : (isCompleted ? 'Campaign Completed' : (campaignState === 'paused' ? 'Resume Campaign' : 'Start Campaign'))}
                      </button>
                      <button
                        onClick={pauseCampaign}
                        disabled={!isRunning}
                        className="inline-flex items-center gap-2 px-[18px] py-[10px] rounded-lg text-[0.9rem] font-semibold bg-amber-500 text-[#0b0f19] shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="fa-solid fa-pause" /> Pause
                      </button>
                      <button
                        onClick={resetCampaign}
                        className="inline-flex items-center gap-2 px-[18px] py-[10px] rounded-lg text-[0.9rem] font-semibold bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:bg-red-600 transition-all"
                      >
                        <i className="fa-solid fa-rotate-left" /> Clear Queue
                      </button>
                    </div>
                  </div>
                )}

                {/* Recipient Queue Table */}
                {showBulkControls && (
                  <div className="max-h-[250px] overflow-y-auto border border-white/[0.07] rounded-lg">
                    <h5 className="px-3 py-3 border-b border-white/[0.07] bg-white/[0.01] sticky top-0 text-slate-50 font-semibold text-[0.9rem] z-10">Recipient Queue</h5>
                    <table className="w-full border-collapse text-[0.85rem] text-left">
                      <thead>
                        <tr>
                          <th className="px-3 py-2.5 border-b border-white/[0.07] text-slate-400 font-semibold bg-[rgba(13,18,30,0.5)] sticky top-[44px] z-10">Name</th>
                          <th className="px-3 py-2.5 border-b border-white/[0.07] text-slate-400 font-semibold bg-[rgba(13,18,30,0.5)] sticky top-[44px] z-10">Email</th>
                          <th className="px-3 py-2.5 border-b border-white/[0.07] text-slate-400 font-semibold bg-[rgba(13,18,30,0.5)] sticky top-[44px] z-10">Company</th>
                          <th className="px-3 py-2.5 border-b border-white/[0.07] text-slate-400 font-semibold bg-[rgba(13,18,30,0.5)] sticky top-[44px] z-10">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipientQueue.map((item, index) => (
                          <tr
                            key={item.id}
                            onClick={() => selectRow(index)}
                            className={`cursor-pointer transition-colors duration-200 hover:bg-white/[0.03] ${selectedRowIndex === index ? 'bg-indigo-500/10' : ''}`}
                          >
                            <td className="px-3 py-2.5 border-b border-white/[0.07] text-slate-200">{item.name}</td>
                            <td className="px-3 py-2.5 border-b border-white/[0.07] text-slate-200">{item.email}</td>
                            <td className="px-3 py-2.5 border-b border-white/[0.07] text-slate-200">{item.company}</td>
                            <td className="px-3 py-2.5 border-b border-white/[0.07]"><StatusBadge status={item.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SINGLE MAILER TAB */}
            {currentTab === 'single' && (
              <div className="flex flex-col gap-5">
                <h4 className="text-[1.1rem] font-semibold text-slate-50">Send Single Email Inquiry</h4>
                <form onSubmit={sendSingleEmail} className="flex flex-col gap-4">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.85rem] font-medium text-slate-400">Recipient Name</label>
                    <input
                      type="text" value={singleName} onChange={(e) => setSingleName(e.target.value)}
                      placeholder="e.g. John Doe" required
                      className="px-3 py-3 bg-[rgba(13,18,30,0.8)] border border-white/10 rounded-lg text-slate-50 text-[0.9rem] outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                    />
                  </div>
                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.85rem] font-medium text-slate-400">Recipient Email Address</label>
                    <input
                      type="email" value={singleEmail} onChange={(e) => setSingleEmail(e.target.value)}
                      placeholder="e.g. hr@company.com" required
                      className="px-3 py-3 bg-[rgba(13,18,30,0.8)] border border-white/10 rounded-lg text-slate-50 text-[0.9rem] outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                    />
                  </div>
                  {/* Company */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.85rem] font-medium text-slate-400">Company Name</label>
                    <input
                      type="text" value={singleCompany} onChange={(e) => setSingleCompany(e.target.value)}
                      placeholder="e.g. Google" required
                      className="px-3 py-3 bg-[rgba(13,18,30,0.8)] border border-white/10 rounded-lg text-slate-50 text-[0.9rem] outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                    />
                  </div>
                  {/* Job Role */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.85rem] font-medium text-slate-400">Job Role <span className="text-slate-500">(optional)</span></label>
                    <input
                      type="text" value={singleJobRole} onChange={(e) => setSingleJobRole(e.target.value)}
                      placeholder="e.g. Frontend Developer"
                      className="px-3 py-3 bg-[rgba(13,18,30,0.8)] border border-white/10 rounded-lg text-slate-50 text-[0.9rem] outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                    />
                  </div>
                  {/* Job Link */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.85rem] font-medium text-slate-400">Job Link <span className="text-slate-500">(optional)</span></label>
                    <input
                      type="url" value={singleJobLink} onChange={(e) => setSingleJobLink(e.target.value)}
                      placeholder="e.g. https://careers.google.com/..."
                      className="px-3 py-3 bg-[rgba(13,18,30,0.8)] border border-white/10 rounded-lg text-slate-50 text-[0.9rem] outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                    />
                  </div>
                  {/* Submit */}
                  <button
                    type="submit" disabled={singleSending}
                    className="inline-flex items-center justify-center gap-2 px-[18px] py-[10px] rounded-lg text-[0.9rem] font-semibold bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:bg-indigo-600 hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    <i className={singleSending ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'} />
                    {singleSending ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* ── Right Panel: Preview & Logs ── */}
          <section className="bg-[rgba(20,27,45,0.75)] border border-white/[0.07] rounded-xl p-6 backdrop-blur-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex flex-col gap-5 min-h-[480px]">

            {/* Email Live Preview */}
            <div className="flex flex-col bg-[rgba(13,18,30,0.5)] border border-white/[0.07] rounded-lg overflow-hidden h-[300px]">
              <div className="flex justify-between items-center px-4 py-3 border-b border-white/[0.07] bg-white/[0.02]">
                <h4 className="text-[0.95rem] font-semibold text-slate-50">Email Live Preview</h4>
                <span className="text-xs text-indigo-400 font-semibold"><i className="fa-solid fa-eye mr-1" />Dynamic Preview</span>
              </div>
              <div className="px-4 py-2.5 border-b border-white/[0.07] bg-black/15 flex flex-col gap-1">
                <div className="text-[0.8rem] flex gap-2">
                  <span className="text-slate-400 w-[55px]">Subject:</span>
                  <span className="text-slate-50 font-semibold overflow-hidden text-ellipsis whitespace-nowrap">Inquiry About Internship Opportunities</span>
                </div>
                <div className="text-[0.8rem] flex gap-2">
                  <span className="text-slate-400 w-[55px]">To:</span>
                  <span className="text-slate-50 overflow-hidden text-ellipsis whitespace-nowrap">{previewEmail}</span>
                </div>
              </div>
              <div className="flex-grow bg-white overflow-y-auto">
                <iframe
                  ref={iframeRef}
                  title="Email Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            {/* Activity Logs Console */}
            <div className="flex flex-col bg-[rgba(13,18,30,0.8)] border border-white/[0.07] rounded-lg overflow-hidden h-[160px]">
              <div className="flex justify-between items-center px-4 py-3 border-b border-white/[0.07] bg-white/[0.02]">
                <h4 className="text-[0.95rem] font-semibold text-slate-50">System Activity Logs</h4>
                <button
                  onClick={() => setLogs([{ time: new Date().toLocaleTimeString(), msg: '[System] Logs cleared. Ready.', type: 'system' }])}
                  className="bg-transparent border-none text-slate-400 cursor-pointer text-[0.85rem] flex items-center gap-1 hover:text-slate-200 transition-colors"
                >
                  <i className="fa-solid fa-trash-can" /> Clear
                </button>
              </div>
              <div ref={logBoxRef} className="px-4 py-3 font-mono text-[0.8rem] overflow-y-auto flex-grow flex flex-col gap-1">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`leading-[1.4] ${
                      log.type === 'success' ? 'text-emerald-500' :
                      log.type === 'error' ? 'text-red-500' :
                      log.type === 'warning' ? 'text-amber-500' :
                      'text-slate-400'
                    }`}
                  >
                    [{log.time}] {log.msg}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default MassMailer;
