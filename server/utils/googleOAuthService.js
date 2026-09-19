const { google } = require('googleapis');
const GoogleOAuthToken = require('../models/GoogleOAuthToken');
const AppConfig = require('../models/AppConfig');

// ─── In-Memory Cache ─────────────────────────────────────────────────────────
let cachedAccessToken = null;
let cachedExpiresAt = null;

// Buffer: refresh token 5 minutes before actual expiry to avoid edge-case failures
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Creates a configured OAuth2 client from stored credentials.
 * Uses the googleapis library (Node.js equivalent of Java's Jetty OAuth client).
 */
function createOAuth2Client(clientId, clientSecret) {
    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground' // redirect URI for token refresh
    );
}

/**
 * Returns a valid (non-expired) Google OAuth2 access token.
 *
 * Flow:
 * 1. Check in-memory cache — if valid, return immediately (fastest path)
 * 2. Check MongoDB — if valid, populate cache and return
 * 3. If expired or missing — use refresh token to get a new access token from Google
 * 4. Store new token in MongoDB + update cache
 *
 * @returns {Promise<string>} A valid access token
 * @throws {Error} If no credentials are stored or refresh fails
 */
async function getValidAccessToken() {
    const now = new Date();

    // ── Fast path: in-memory cache ──────────────────────────────────────────
    if (cachedAccessToken && cachedExpiresAt && (cachedExpiresAt.getTime() - now.getTime()) > EXPIRY_BUFFER_MS) {
        console.log(`[GoogleOAuth] Using cached access token (expires in ${Math.round((cachedExpiresAt - now) / 1000)}s)`);
        return cachedAccessToken;
    }

    // ── Load from MongoDB ───────────────────────────────────────────────────
    let tokenDoc = await GoogleOAuthToken.findOne();

    if (!tokenDoc) {
        // Attempt auto-migration from AppConfig
        console.log('[GoogleOAuth] No stored token found. Attempting migration from AppConfig...');
        tokenDoc = await migrateFromAppConfig();
        if (!tokenDoc) {
            throw new Error('No Google OAuth credentials stored. Please initialize via POST /api/v1/oauth/initialize');
        }
    }

    // Check if stored access token is still valid
    if (tokenDoc.accessToken && tokenDoc.expiresAt && (tokenDoc.expiresAt.getTime() - now.getTime()) > EXPIRY_BUFFER_MS) {
        // Populate cache and return
        cachedAccessToken = tokenDoc.accessToken;
        cachedExpiresAt = tokenDoc.expiresAt;
        console.log(`[GoogleOAuth] Using stored access token from MongoDB (expires in ${Math.round((tokenDoc.expiresAt - now) / 1000)}s)`);
        return tokenDoc.accessToken;
    }

    // ── Token expired or missing — refresh ──────────────────────────────────
    console.log('[GoogleOAuth] Access token expired or missing. Refreshing...');
    return await refreshAndStore(tokenDoc);
}

/**
 * Forces an immediate token refresh, regardless of current token validity.
 * Returns the full token status object (same shape as getTokenStatus()) so
 * callers can relay it to the client without a second DB round-trip.
 *
 * @returns {Promise<object>} Full token status — no raw tokens exposed
 */
async function forceRefresh() {
    let tokenDoc = await GoogleOAuthToken.findOne();

    if (!tokenDoc) {
        // Graceful fallback: auto-migrate from AppConfig before failing
        console.log('[GoogleOAuth] forceRefresh: no token doc found. Attempting migration from AppConfig...');
        tokenDoc = await migrateFromAppConfig();
        if (!tokenDoc) {
            throw new Error('No Google OAuth credentials stored. Cannot refresh.');
        }
        // migrateFromAppConfig already performs an initial refresh — return status now
        return await getTokenStatus();
    }

    await refreshAndStore(tokenDoc);

    // Return the full safe status (reads back the freshly-written MongoDB document)
    return await getTokenStatus();
}

/**
 * Core refresh logic: exchanges refresh token for a new access token via Google,
 * then stores the result in MongoDB and updates the in-memory cache.
 */
async function refreshAndStore(tokenDoc) {
    try {
        const oauth2Client = createOAuth2Client(tokenDoc.clientId, tokenDoc.clientSecret);
        oauth2Client.setCredentials({
            refresh_token: tokenDoc.refreshToken,
        });

        console.log('[GoogleOAuth] Requesting new access token from Google...');
        const { credentials } = await oauth2Client.refreshAccessToken();

        const newAccessToken = credentials.access_token;
        const expiresAt = new Date(credentials.expiry_date);

        // If Google issued a new refresh token (rare but possible), update it too
        const newRefreshToken = credentials.refresh_token || tokenDoc.refreshToken;

        // Persist to MongoDB
        await GoogleOAuthToken.findByIdAndUpdate(tokenDoc._id, {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt: expiresAt,
            tokenType: credentials.token_type || 'Bearer',
            scope: credentials.scope || tokenDoc.scope,
            lastRefreshedAt: new Date(),
            lastError: '',
            $inc: { refreshCount: 1 },
        });

        // Update in-memory cache
        cachedAccessToken = newAccessToken;
        cachedExpiresAt = expiresAt;

        console.log(`[GoogleOAuth] Token refreshed successfully. Expires at: ${expiresAt.toISOString()} (refresh #${tokenDoc.refreshCount + 1})`);
        return newAccessToken;

    } catch (error) {
        const errorMsg = error.message || 'Unknown refresh error';
        console.error(`[GoogleOAuth] Token refresh FAILED: ${errorMsg}`);

        // Store the error for diagnostics
        await GoogleOAuthToken.findByIdAndUpdate(tokenDoc._id, {
            lastError: `${new Date().toISOString()} — ${errorMsg}`,
        }).catch(() => {}); // Don't throw if this update fails

        // Clear cache to force re-attempt next time
        cachedAccessToken = null;
        cachedExpiresAt = null;

        throw new Error(`Google OAuth token refresh failed: ${errorMsg}`);
    }
}

/**
 * Stores initial OAuth credentials into MongoDB.
 * Called during setup or when credentials need to be replaced.
 *
 * @param {string} clientId - Google OAuth Client ID
 * @param {string} clientSecret - Google OAuth Client Secret
 * @param {string} refreshToken - Google OAuth Refresh Token
 * @returns {Promise<object>} The created/updated token document
 */
async function storeInitialTokens(clientId, clientSecret, refreshToken) {
    // Validate by attempting an initial refresh
    const oauth2Client = createOAuth2Client(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    console.log('[GoogleOAuth] Validating credentials by performing initial token refresh...');
    const { credentials } = await oauth2Client.refreshAccessToken();

    const tokenData = {
        clientId,
        clientSecret,
        refreshToken: credentials.refresh_token || refreshToken,
        accessToken: credentials.access_token,
        tokenType: credentials.token_type || 'Bearer',
        expiresAt: new Date(credentials.expiry_date),
        scope: credentials.scope || 'https://www.googleapis.com/auth/gmail.send',
        lastRefreshedAt: new Date(),
        lastError: '',
        refreshCount: 1,
    };

    // Upsert — only one token document should exist
    const doc = await GoogleOAuthToken.findOneAndUpdate(
        {},
        { $set: tokenData },
        { upsert: true, new: true }
    );

    // Update in-memory cache
    cachedAccessToken = tokenData.accessToken;
    cachedExpiresAt = tokenData.expiresAt;

    console.log(`[GoogleOAuth] Credentials stored and validated. Token expires at: ${tokenData.expiresAt.toISOString()}`);
    return doc;
}

/**
 * Migrates OAuth credentials from AppConfig to GoogleOAuthToken.
 * This is a one-time operation on first startup after deployment.
 */
async function migrateFromAppConfig() {
    try {
        const appConfig = await AppConfig.findOne();
        if (!appConfig) return null;

        const { gmailClientId, gmailClientSecret, gmailRefreshToken } = appConfig;
        if (!gmailClientId || !gmailClientSecret || !gmailRefreshToken) {
            console.log('[GoogleOAuth] AppConfig has incomplete Gmail credentials. Skipping migration.');
            return null;
        }

        console.log('[GoogleOAuth] Migrating OAuth credentials from AppConfig to GoogleOAuthToken...');
        const doc = await storeInitialTokens(gmailClientId, gmailClientSecret, gmailRefreshToken);
        console.log('[GoogleOAuth] Migration complete.');
        return doc;
    } catch (error) {
        console.error(`[GoogleOAuth] Migration from AppConfig failed: ${error.message}`);
        return null;
    }
}

/**
 * Returns the current token status without exposing sensitive values.
 */
async function getTokenStatus() {
    const tokenDoc = await GoogleOAuthToken.findOne();
    if (!tokenDoc) {
        return { initialized: false };
    }

    const now = new Date();
    const expiresIn = tokenDoc.expiresAt ? Math.round((tokenDoc.expiresAt - now) / 1000) : null;

    return {
        initialized: true,
        hasAccessToken: !!tokenDoc.accessToken,
        expiresAt: tokenDoc.expiresAt,
        expiresInSeconds: expiresIn,
        isExpired: expiresIn !== null && expiresIn <= 0,
        lastRefreshedAt: tokenDoc.lastRefreshedAt,
        refreshCount: tokenDoc.refreshCount,
        lastError: tokenDoc.lastError || null,
        scope: tokenDoc.scope,
        clientIdPrefix: tokenDoc.clientId ? tokenDoc.clientId.substring(0, 12) + '...' : null,
    };
}

/**
 * Clears the in-memory cache (useful for testing or forced re-fetch).
 */
function clearCache() {
    cachedAccessToken = null;
    cachedExpiresAt = null;
}

module.exports = {
    getValidAccessToken,
    forceRefresh,
    storeInitialTokens,
    migrateFromAppConfig,
    getTokenStatus,
    clearCache,
};
