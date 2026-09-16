const { getValidAccessToken, forceRefresh, storeInitialTokens, getTokenStatus } = require('../utils/googleOAuthService');

/**
 * GET /api/v1/oauth/status
 * Returns current OAuth token status (expiry, refresh count, errors).
 */
exports.getOAuthStatus = async (req, res) => {
    try {
        const status = await getTokenStatus();
        res.json({ success: true, oauth: status });
    } catch (error) {
        console.error('[OAuthController] Error fetching status:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch OAuth status.' });
    }
};

/**
 * POST /api/v1/oauth/initialize
 * Stores initial OAuth credentials and validates them by performing a token refresh.
 *
 * Body: { clientId, clientSecret, refreshToken }
 */
exports.initializeOAuth = async (req, res) => {
    try {
        const { clientId, clientSecret, refreshToken } = req.body;

        if (!clientId || !clientSecret || !refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'clientId, clientSecret, and refreshToken are all required.'
            });
        }

        console.log('[OAuthController] Initializing OAuth credentials...');
        const doc = await storeInitialTokens(clientId, clientSecret, refreshToken);

        res.json({
            success: true,
            message: 'OAuth credentials stored and validated successfully.',
            oauth: {
                expiresAt: doc.expiresAt,
                scope: doc.scope,
                refreshCount: doc.refreshCount,
            }
        });
    } catch (error) {
        console.error('[OAuthController] Initialization failed:', error.message);
        res.status(500).json({
            success: false,
            message: `Failed to initialize OAuth: ${error.message}`
        });
    }
};

/**
 * POST /api/v1/oauth/refresh
 * Forces an immediate token refresh, regardless of current token validity.
 */
exports.forceRefreshOAuth = async (req, res) => {
    try {
        console.log('[OAuthController] Forcing token refresh...');
        const result = await forceRefresh();

        res.json({
            success: true,
            message: 'Token refreshed successfully.',
            oauth: {
                expiresAt: result.expiresAt,
            }
        });
    } catch (error) {
        console.error('[OAuthController] Force refresh failed:', error.message);
        res.status(500).json({
            success: false,
            message: `Token refresh failed: ${error.message}`
        });
    }
};
