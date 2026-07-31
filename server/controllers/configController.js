const AppConfig = require('../models/AppConfig');
require('dotenv').config();

// ─── In-Memory Cache ─────────────────────────────────────────────────────────
let cachedConfig = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Returns the current AppConfig from MongoDB (with in-memory cache).
 * Used internally by email templates, AI controller, mail sender, etc.
 */
const getConfigInternal = async () => {
    const now = Date.now();
    if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return cachedConfig;
    }

    // Try to find existing config, or create one with defaults seeded from env
    let config = await AppConfig.findOne();
    if (!config) {
        config = await AppConfig.create({
            geminiApiKey: process.env.GEMINI_API_KEY || '',
            geminiApiUrl: process.env.GEMINI_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            smtpHost: process.env.MAIL_HOST || 'smtp.gmail.com',
            smtpPort: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 465,
            smtpSecure: process.env.MAIL_SECURE !== undefined ? process.env.MAIL_SECURE === 'true' : true,
            smtpUser: process.env.MAIL_USER || '',
            smtpPass: process.env.MAIL_PASS || '',
        });
        console.log('[AppConfig] Seeded default configuration from environment variables.');
    }

    cachedConfig = config.toObject();
    cacheTimestamp = now;
    return cachedConfig;
};

/**
 * Clears the in-memory cache so next getConfigInternal() call fetches fresh data.
 */
const clearConfigCache = () => {
    cachedConfig = null;
    cacheTimestamp = 0;
};

// ─── Mask sensitive fields ───────────────────────────────────────────────────
const maskSecret = (value) => {
    if (!value || value.length < 8) return value ? '••••••••' : '';
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
};

// ─── API Handlers ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/config
 * Returns config with sensitive fields masked.
 */
const getConfig = async (req, res) => {
    try {
        const config = await getConfigInternal();
        const safeConfig = {
            ...config,
            _id: undefined,
            __v: undefined,
            geminiApiKey: maskSecret(config.geminiApiKey),
            smtpPass: maskSecret(config.smtpPass),
        };
        res.json({ success: true, config: safeConfig });
    } catch (error) {
        console.error('[AppConfig] Error fetching config:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch configuration.' });
    }
};

/**
 * GET /api/v1/config/raw
 * Returns config with unmasked sensitive fields (for internal use / admin).
 */
const getConfigRaw = async (req, res) => {
    try {
        const config = await getConfigInternal();
        const rawConfig = { ...config, _id: undefined, __v: undefined };
        res.json({ success: true, config: rawConfig });
    } catch (error) {
        console.error('[AppConfig] Error fetching raw config:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch configuration.' });
    }
};

/**
 * PUT /api/v1/config
 * Accepts partial updates. Clears cache so changes take effect immediately.
 */
const updateConfig = async (req, res) => {
    try {
        const updates = req.body;

        // Remove fields that shouldn't be updated directly
        delete updates._id;
        delete updates.__v;
        delete updates.createdAt;
        delete updates.updatedAt;

        // Skip masked values — don't overwrite secrets with mask placeholders
        if (updates.geminiApiKey && updates.geminiApiKey.includes('••••')) {
            delete updates.geminiApiKey;
        }
        if (updates.smtpPass && updates.smtpPass.includes('••••')) {
            delete updates.smtpPass;
        }

        const config = await AppConfig.findOneAndUpdate(
            {},
            { $set: updates },
            { new: true, upsert: true, runValidators: true }
        );

        clearConfigCache();

        console.log('[AppConfig] Configuration updated successfully.');
        res.json({ success: true, message: 'Configuration updated successfully.', config });
    } catch (error) {
        console.error('[AppConfig] Error updating config:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update configuration.' });
    }
};

module.exports = {
    getConfig,
    getConfigRaw,
    updateConfig,
    getConfigInternal,
    clearConfigCache,
};
