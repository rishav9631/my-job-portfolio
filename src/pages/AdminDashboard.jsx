import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { apiConnector } from '../services/apiConnector';
import { configEndpoint, oauthEndpoint } from '../services/apis';
import { useAuth } from '../context/AuthContext';

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle, accentColor = 'indigo' }) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500' },
  };
  const c = colorMap[accentColor] || colorMap.indigo;

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${c.bg} ${c.text}`}>
        <i className={icon} />
      </div>
      <div>
        <h3 className={`text-lg font-bold text-slate-50 border-l-[3px] ${c.border} pl-3`}>{title}</h3>
        {subtitle && <p className="text-slate-400 text-sm pl-3 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

// ─── Config Field ────────────────────────────────────────────────────────────
const ConfigField = ({ label, fieldKey, value, onChange, type = 'text', placeholder, isSensitive = false, isRevealed, onToggleReveal }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-400">{label}</label>
        {isSensitive && value && (
          <button
            type="button"
            onClick={onToggleReveal}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <i className={isRevealed ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
            {isRevealed ? 'Hide' : 'Reveal'}
          </button>
        )}
      </div>
      <input
        type={isSensitive && !isRevealed ? 'password' : type}
        value={value || ''}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder={placeholder}
        className={`px-4 py-3 bg-[rgba(13,18,30,0.8)] border rounded-lg text-slate-50 text-sm outline-none transition-all
          focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]
          border-white/10
          placeholder:text-slate-600`}
      />
    </div>
  );
};

// ─── Stat Pill ───────────────────────────────────────────────────────────────
const StatPill = ({ icon, label, value, bgClass, textClass }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(20,27,45,0.75)] border border-white/[0.07]">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${bgClass} ${textClass}`}>
      <i className={icon} />
    </div>
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-50">{value}</p>
    </div>
  </div>
);

// ─── OAuth Token Status Widget ────────────────────────────────────────────────
const OAuthTokenStatus = () => {
  const [oauthStatus, setOauthStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const intervalRef = useRef(null);

  const fetchOAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('mailapp_token') || localStorage.getItem('token');
      const res = await apiConnector('GET', oauthEndpoint.OAUTH_STATUS, null, {
        Authorization: `Bearer ${token}`,
      });
      if (res.data?.success) {
        setOauthStatus(res.data.oauth);
      }
    } catch (err) {
      console.error('[OAuthStatus] Failed to fetch:', err.message);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchOAuthStatus();
    // Auto-refresh status every 30 seconds
    intervalRef.current = setInterval(fetchOAuthStatus, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchOAuthStatus]);

  const handleForceRefresh = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('mailapp_token') || localStorage.getItem('token');
      const res = await apiConnector('POST', oauthEndpoint.OAUTH_REFRESH, {}, {
        Authorization: `Bearer ${token}`,
      });
      if (res.data?.success) {
        toast.success('OAuth token refreshed successfully!');
        // Backend now returns the full status object — update widget state directly,
        // no second GET /status roundtrip needed.
        setOauthStatus(res.data.oauth);
      } else {
        toast.error(res.data?.message || 'Token refresh failed.');
      }
    } catch (err) {
      toast.error(`Token refresh failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // ── Derive status color based on seconds-to-expiry ──────────────────────────
  const getStatusInfo = (oauth) => {
    if (!oauth || !oauth.initialized) {
      return {
        color: 'gray',
        label: 'Not Initialized',
        dotClass: 'bg-slate-500',
        badgeBg: 'bg-slate-500/15',
        badgeText: 'text-slate-400',
        borderClass: 'border-slate-500/30',
        iconClass: 'text-slate-400',
        glowClass: '',
      };
    }
    if (oauth.isExpired) {
      return {
        color: 'red',
        label: 'Expired',
        dotClass: 'bg-red-500',
        badgeBg: 'bg-red-500/15',
        badgeText: 'text-red-400',
        borderClass: 'border-red-500/40',
        iconClass: 'text-red-400',
        glowClass: 'shadow-[0_0_18px_rgba(239,68,68,0.25)]',
      };
    }
    const sec = oauth.expiresInSeconds || 0;
    const WARNING_THRESHOLD = 5 * 60; // 5 minutes
    if (sec <= WARNING_THRESHOLD) {
      return {
        color: 'yellow',
        label: 'Expiring Soon',
        dotClass: 'bg-amber-400',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-400',
        borderClass: 'border-amber-500/40',
        iconClass: 'text-amber-400',
        glowClass: 'shadow-[0_0_18px_rgba(251,191,36,0.2)]',
      };
    }
    return {
      color: 'green',
      label: 'Active',
      dotClass: 'bg-emerald-400',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      borderClass: 'border-emerald-500/40',
      iconClass: 'text-emerald-400',
      glowClass: 'shadow-[0_0_18px_rgba(52,211,153,0.15)]',
    };
  };

  const formatTimeLeft = (seconds) => {
    if (seconds === null || seconds === undefined) return '—';
    if (seconds <= 0) return 'Expired';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const si = getStatusInfo(oauthStatus);

  return (
    <section
      className={`bg-[rgba(20,27,45,0.75)] border rounded-2xl p-7 backdrop-blur-[10px] shadow-[0_4px_30px_rgba(0,0,0,0.15)] transition-all duration-500 ${si.borderClass} ${si.glowClass}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Status icon with pulsing dot */}
          <div className="relative">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${si.badgeBg} ${si.iconClass}`}>
              <i className="fa-brands fa-google" />
            </div>
            {/* Status dot */}
            <span
              className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[rgba(20,27,45,1)] ${si.dotClass} ${
                (si.color === 'green' || si.color === 'yellow') ? 'animate-pulse' : ''
              }`}
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-50 border-l-[3px] border-emerald-500 pl-3">
              Google OAuth Token
            </h3>
            <p className="text-slate-400 text-sm pl-3 mt-0.5">Gmail API access token status &amp; validity</p>
          </div>
        </div>

        {/* Status badge + Refresh button */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${si.badgeBg} ${si.badgeText} border ${si.borderClass}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${si.dotClass} ${
              si.color === 'green' ? 'animate-pulse' : si.color === 'yellow' ? 'animate-pulse' : ''
            }`} />
            {si.label}
          </div>
          <button
            onClick={handleForceRefresh}
            disabled={refreshing || loadingStatus}
            title="Force refresh the OAuth access token"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/[0.06] text-slate-300 border border-white/10 hover:bg-white/[0.1] hover:text-slate-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className={`fa-solid fa-rotate-right ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh Token'}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      {loadingStatus ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : oauthStatus?.initialized ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Time Remaining */}
          <div className={`flex flex-col gap-1.5 px-4 py-3.5 rounded-xl ${si.badgeBg} border ${si.borderClass}`}>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <i className="fa-solid fa-clock" /> Time Remaining
            </p>
            <p className={`text-lg font-bold ${si.badgeText} tabular-nums`}>
              {formatTimeLeft(oauthStatus.expiresInSeconds)}
            </p>
          </div>

          {/* Expires At */}
          <div className="flex flex-col gap-1.5 px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <i className="fa-solid fa-calendar-xmark" /> Expires At
            </p>
            <p className="text-sm font-semibold text-slate-200">
              {formatDate(oauthStatus.expiresAt)}
            </p>
          </div>

          {/* Last Refreshed */}
          <div className="flex flex-col gap-1.5 px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <i className="fa-solid fa-arrow-rotate-right" /> Last Refreshed
            </p>
            <p className="text-sm font-semibold text-slate-200">
              {formatDate(oauthStatus.lastRefreshedAt)}
            </p>
          </div>

          {/* Refresh Count */}
          <div className="flex flex-col gap-1.5 px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <i className="fa-solid fa-layer-group" /> Total Refreshes
            </p>
            <p className="text-lg font-bold text-slate-200">
              {oauthStatus.refreshCount ?? '—'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400 text-sm">
          <i className="fa-solid fa-triangle-exclamation text-amber-400" />
          No OAuth credentials initialized. Add your Gmail Client ID, Secret &amp; Refresh Token in the section below, then save.
        </div>
      )}

      {/* Last error banner */}
      {oauthStatus?.lastError && (
        <div className="mt-4 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <i className="fa-solid fa-circle-exclamation text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-400 mb-0.5">Last Error</p>
            <p className="text-xs text-slate-400 break-all">{oauthStatus.lastError}</p>
          </div>
        </div>
      )}

      {/* Scope / Client info */}
      {oauthStatus?.initialized && (
        <div className="mt-4 flex flex-wrap gap-3">
          {oauthStatus.clientIdPrefix && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-1.5">
              <i className="fa-solid fa-key" />
              Client: <code className="text-slate-300 ml-1">{oauthStatus.clientIdPrefix}</code>
            </span>
          )}
          {oauthStatus.scope && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-1.5">
              <i className="fa-solid fa-shield" />
              Scope: <code className="text-slate-300 ml-1 truncate max-w-[220px]">{oauthStatus.scope}</code>
            </span>
          )}
        </div>
      )}
    </section>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── Admin Dashboard Component ──────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revealedFields, setRevealedFields] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalConfig, setOriginalConfig] = useState(null);

  // ── Fetch config on mount ──────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('mailapp_token') || localStorage.getItem('token');
      const res = await apiConnector('GET', configEndpoint.GET_CONFIG_RAW, null, {
        Authorization: `Bearer ${token}`,
      });
      if (res.data?.success) {
        const cfg = res.data.config;
        setConfig(cfg);
        setOriginalConfig(JSON.parse(JSON.stringify(cfg)));
        setHasChanges(false);
      } else {
        toast.error('Failed to load configuration.');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please check if the backend is running.');
      } else if (!error.response) {
        toast.error('Network error. Cannot reach the server.');
      } else {
        toast.error('Failed to load configuration.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ── Handle field change ────────────────────────────────────────────────────
  const handleChange = (key, value) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalConfig));
      return updated;
    });
  };

  // ── Toggle sensitive field visibility ──────────────────────────────────────
  const toggleReveal = (field) => {
    setRevealedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // ── Save config ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('mailapp_token') || localStorage.getItem('token');
      const res = await apiConnector('PUT', configEndpoint.UPDATE_CONFIG, config, {
        Authorization: `Bearer ${token}`,
      });
      if (res.data?.success) {
        toast.success('Configuration saved successfully!');
        setOriginalConfig(JSON.parse(JSON.stringify(config)));
        setHasChanges(false);
      } else {
        toast.error(res.data?.message || 'Failed to save configuration.');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset to defaults ─────────────────────────────────────────────────────
  const handleReset = () => {
    const defaults = {
      linkedinUrl: 'https://www.linkedin.com/in/rishav-kumar-sde/',
      resumeUrl: 'https://drive.google.com/file/d/1myrH9blbnZ06gFsS0_-XkJpzcax5LH7z/view',
      githubUrl: 'https://github.com/rishav9631',
      senderName: 'Rishav Kumar',
      senderTitle: 'Software Developer | Amdocs',
      senderEmail: 'rishavjha771@gmail.com',
      geminiApiKey: config?.geminiApiKey || '',
      geminiApiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      gmailClientId: config?.gmailClientId || '',
      gmailClientSecret: config?.gmailClientSecret || '',
      gmailRefreshToken: config?.gmailRefreshToken || '',
      resendApiKey: config?.resendApiKey || '',
    };
    setConfig(defaults);
    setHasChanges(JSON.stringify(defaults) !== JSON.stringify(originalConfig));
    toast('Fields reset to defaults.', { icon: '🔄' });
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-[calc(100vh-64px)] flex items-center justify-center font-['Inter',sans-serif]"
        style={{
          backgroundColor: '#0b0f19',
          backgroundImage: 'radial-gradient(at 10% 20%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(at 90% 80%, rgba(16,185,129,0.08) 0px, transparent 50%)',
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading configuration...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── RENDER ────────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="min-h-[calc(100vh-64px)] font-['Inter',sans-serif]"
      style={{
        backgroundColor: '#0b0f19',
        backgroundImage: 'radial-gradient(at 10% 20%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(at 90% 80%, rgba(16,185,129,0.08) 0px, transparent 50%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        {/* ─── Page Header ─── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/[0.07] mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-400 w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_4px_14px_rgba(99,102,241,0.25)] text-lg text-white">
                <i className="fa-solid fa-sliders" />
              </div>
              <h1 className="text-2xl font-bold text-slate-50">Admin Dashboard</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Manage email template links, Gemini API settings, and Resend email configuration.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(20,27,45,0.75)] border border-white/[0.07]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center text-white text-xs font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="text-slate-300 text-sm font-medium">{user?.username || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* ─── Quick Stats ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatPill icon="fa-solid fa-link" label="Profile Links" value="3" bgClass="bg-indigo-500/15" textClass="text-indigo-400" />
          <StatPill icon="fa-solid fa-envelope" label="Email Fields" value="3" bgClass="bg-emerald-500/15" textClass="text-emerald-400" />
          <StatPill icon="fa-solid fa-robot" label="AI Config" value="2" bgClass="bg-amber-500/15" textClass="text-amber-400" />
          <StatPill icon="fa-brands fa-google" label="Gmail API" value="3" bgClass="bg-rose-500/15" textClass="text-rose-400" />
        </div>

        {/* ─── Settings Sections ─── */}
        <div className="flex flex-col gap-8">

          {/* ══════ Section 0: Google OAuth Token Status ══════ */}
          <OAuthTokenStatus />

          {/* ══════ Section 1: Email Template Links ══════ */}
          <section className="bg-[rgba(20,27,45,0.75)] border border-white/[0.07] rounded-2xl p-7 backdrop-blur-[10px] shadow-[0_4px_30px_rgba(0,0,0,0.15)]">
            <SectionHeader
              icon="fa-solid fa-link"
              title="Email Template Links"
              subtitle="URLs embedded in outgoing emails"
              accentColor="indigo"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ConfigField label="LinkedIn URL" fieldKey="linkedinUrl" value={config?.linkedinUrl || ''} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
              <ConfigField label="Resume URL" fieldKey="resumeUrl" value={config?.resumeUrl || ''} onChange={handleChange} placeholder="https://drive.google.com/..." />
              <ConfigField label="GitHub URL" fieldKey="githubUrl" value={config?.githubUrl || ''} onChange={handleChange} placeholder="https://github.com/..." />
            </div>
          </section>

          {/* ══════ Section 2: Sender Identity ══════ */}
          <section className="bg-[rgba(20,27,45,0.75)] border border-white/[0.07] rounded-2xl p-7 backdrop-blur-[10px] shadow-[0_4px_30px_rgba(0,0,0,0.15)]">
            <SectionHeader
              icon="fa-solid fa-id-card"
              title="Sender Identity"
              subtitle="Name, title, and email shown in email signatures"
              accentColor="emerald"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ConfigField label="Sender Name" fieldKey="senderName" value={config?.senderName || ''} onChange={handleChange} placeholder="Your Name" />
              <ConfigField label="Sender Title" fieldKey="senderTitle" value={config?.senderTitle || ''} onChange={handleChange} placeholder="Software Developer | Company" />
              <ConfigField label="Sender Email (Reply-To)" fieldKey="senderEmail" value={config?.senderEmail || ''} onChange={handleChange} type="email" placeholder="you@example.com" />
            </div>
          </section>

          {/* ══════ Section 3: Gemini API Configuration ══════ */}
          <section className="bg-[rgba(20,27,45,0.75)] border border-white/[0.07] rounded-2xl p-7 backdrop-blur-[10px] shadow-[0_4px_30px_rgba(0,0,0,0.15)]">
            <SectionHeader
              icon="fa-solid fa-robot"
              title="Gemini API Configuration"
              subtitle="API key and endpoint for AI features"
              accentColor="amber"
            />
            <div className="grid grid-cols-1 gap-5">
              <ConfigField
                label="Gemini API Key"
                fieldKey="geminiApiKey"
                value={config?.geminiApiKey || ''}
                onChange={handleChange}
                placeholder="AIza..."
                isSensitive={true}
                isRevealed={revealedFields.geminiApiKey}
                onToggleReveal={() => toggleReveal('geminiApiKey')}
              />
              <ConfigField label="Gemini API URL" fieldKey="geminiApiUrl" value={config?.geminiApiUrl || ''} onChange={handleChange} placeholder="https://generativelanguage.googleapis.com/..." />
            </div>
          </section>

          {/* ══════ Section 4: Gmail REST API Configuration (Primary) ══════ */}
          <section className="bg-[rgba(20,27,45,0.75)] border border-white/[0.07] rounded-2xl p-7 backdrop-blur-[10px] shadow-[0_4px_30px_rgba(0,0,0,0.15)]">
            <SectionHeader
              icon="fa-brands fa-google"
              title="Gmail REST API Configuration"
              subtitle="Primary email provider (HTTPS port 443 — sends directly from your @gmail.com address)"
              accentColor="emerald"
            />
            <div className="grid grid-cols-1 gap-5">
              <ConfigField
                label="Gmail OAuth Client ID"
                fieldKey="gmailClientId"
                value={config?.gmailClientId || ''}
                onChange={handleChange}
                placeholder="1059520152914-xxxx.apps.googleusercontent.com"
              />
              <ConfigField
                label="Gmail OAuth Client Secret"
                fieldKey="gmailClientSecret"
                value={config?.gmailClientSecret || ''}
                onChange={handleChange}
                placeholder="GOCSPX-xxxx..."
                isSensitive={true}
                isRevealed={revealedFields.gmailClientSecret}
                onToggleReveal={() => toggleReveal('gmailClientSecret')}
              />
              <ConfigField
                label="Gmail OAuth Refresh Token"
                fieldKey="gmailRefreshToken"
                value={config?.gmailRefreshToken || ''}
                onChange={handleChange}
                placeholder="1//04_xxxx..."
                isSensitive={true}
                isRevealed={revealedFields.gmailRefreshToken}
                onToggleReveal={() => toggleReveal('gmailRefreshToken')}
              />
            </div>
          </section>

          {/* ══════ Section 5: Resend Email Configuration (Fallback) ══════ */}
          <section className="bg-[rgba(20,27,45,0.75)] border border-white/[0.07] rounded-2xl p-7 backdrop-blur-[10px] shadow-[0_4px_30px_rgba(0,0,0,0.15)]">
            <SectionHeader
              icon="fa-solid fa-paper-plane"
              title="Resend Email Configuration (Fallback)"
              subtitle="Secondary provider if Gmail API is unavailable"
              accentColor="indigo"
            />
            <div className="grid grid-cols-1 gap-5">
              <ConfigField
                label="Resend API Key"
                fieldKey="resendApiKey"
                value={config?.resendApiKey || ''}
                onChange={handleChange}
                placeholder="re_xxxxxxxxx..."
                isSensitive={true}
                isRevealed={revealedFields.resendApiKey}
                onToggleReveal={() => toggleReveal('resendApiKey')}
              />
            </div>
          </section>

        </div>

        {/* ─── Floating Save Bar ─── */}
        <div className={`sticky bottom-6 mt-8 transition-all duration-500 ${hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="bg-[rgba(13,18,30,0.95)] border border-white/[0.1] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl shadow-[0_-4px_40px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-slate-300 text-sm font-medium">You have unsaved changes</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.06] text-slate-300 border border-white/10 hover:bg-white/[0.1] transition-all"
              >
                <i className="fa-solid fa-rotate-left mr-2" />
                Reset Defaults
              </button>
              <button
                onClick={() => { setConfig(JSON.parse(JSON.stringify(originalConfig))); setHasChanges(false); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.06] text-slate-300 border border-white/10 hover:bg-white/[0.1] transition-all"
              >
                <i className="fa-solid fa-xmark mr-2" />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {saving ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-2" />Saving...</>
                ) : (
                  <><i className="fa-solid fa-check mr-2" />Save All Changes</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Bottom Spacer for floating bar ─── */}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default AdminDashboard;
