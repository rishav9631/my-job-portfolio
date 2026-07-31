const axios = require('axios');

/**
 * Creates a base64url-encoded RFC 2822 raw email string for Gmail API.
 */
function createRawEmail(to, fromName, fromEmail, subject, htmlBody) {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
        `From: ${fromName} <${fromEmail}>`,
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        htmlBody
    ];
    const message = messageParts.join('\r\n');
    return Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Fetches a fresh OAuth2 access token using client ID, client secret, and refresh token.
 */
async function getGmailAccessToken(clientId, clientSecret, refreshToken) {
    console.log(`[MailSender] Requesting fresh Google OAuth2 access token...`);
    const tokenRes = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        },
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        }
    );
    return tokenRes.data.access_token;
}

/**
 * Send email via Gmail REST API (HTTPS port 443 — works on Render free tier).
 * Falls back to Resend API if Gmail API is not configured or fails.
 *
 * @param {string} email - Recipient email address
 * @param {string} title - Email subject line
 * @param {string} body  - HTML email body
 * @param {object} config - Dynamic config from MongoDB
 */
const mailSender = async (email, title, body, config = null) => {
    // Resolve Gmail API credentials (from config, env, or defaults)
    const gmailClientId = (config && config.gmailClientId) || process.env.GMAIL_CLIENT_ID || '';
    const gmailClientSecret = (config && config.gmailClientSecret) || process.env.GMAIL_CLIENT_SECRET || '';
    const gmailRefreshToken = (config && config.gmailRefreshToken) || process.env.GMAIL_REFRESH_TOKEN || '';

    const senderEmail = (config && config.senderEmail) || process.env.SENDER_EMAIL || 'rishavjha771@gmail.com';
    const senderName = (config && config.senderName) || process.env.SENDER_NAME || 'Rishav Kumar';

    console.log(`[MailSender] ---- DEBUG START ----`);
    console.log(`[MailSender] Primary Provider: Gmail REST API (HTTPS)`);
    console.log(`[MailSender] Gmail Client ID: ${gmailClientId ? `SET (${gmailClientId.substring(0, 10)}...)` : '<NOT SET>'}`);
    console.log(`[MailSender] Gmail Refresh Token: ${gmailRefreshToken ? `SET (${gmailRefreshToken.substring(0, 10)}...)` : '<NOT SET>'}`);
    console.log(`[MailSender] From: ${senderName} <${senderEmail}>`);
    console.log(`[MailSender] To: ${email}`);
    console.log(`[MailSender] Subject: ${title}`);
    console.log(`[MailSender] Body length: ${body ? body.length : 0} chars`);

    // ── ATTEMPT 1: Gmail REST API ─────────────────────────────────────────────
    if (gmailClientId && gmailClientSecret && gmailRefreshToken) {
        try {
            console.log(`[MailSender] ATTEMPT 1: Sending via Gmail REST API...`);
            const sendStart = Date.now();

            // 1. Get access token
            const accessToken = await getGmailAccessToken(gmailClientId, gmailClientSecret, gmailRefreshToken);
            console.log(`[MailSender] ATTEMPT 1: OAuth2 Access Token acquired successfully.`);

            // 2. Encode raw email
            const rawEmail = createRawEmail(email, senderName, senderEmail, title, body);

            // 3. Post to Gmail API
            const response = await axios.post(
                'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
                { raw: rawEmail },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            const elapsed = Date.now() - sendStart;
            console.log(`[MailSender] ATTEMPT 1: Email sent via Gmail REST API in ${elapsed}ms — Message ID: ${response.data?.id}`);
            console.log(`[MailSender] ---- DEBUG END (Gmail API success) ----`);

            return {
                messageId: response.data?.id || 'unknown',
                response: JSON.stringify(response.data),
            };
        } catch (gmailError) {
            console.error(`[MailSender] ATTEMPT 1 FAILED via Gmail REST API: ${gmailError.message}`);
            if (gmailError.response) {
                console.error(`[MailSender]   HTTP Status: ${gmailError.response.status}`);
                console.error(`[MailSender]   Response body: ${JSON.stringify(gmailError.response.data)}`);
            }
            console.warn(`[MailSender] Retrying via Resend API fallback...`);
        }
    } else {
        console.warn(`[MailSender] Gmail API credentials incomplete. Skipping Gmail API.`);
    }

    // ── ATTEMPT 2: Resend API Fallback ────────────────────────────────────────
    const resendApiKey = (config && config.resendApiKey) || process.env.RESEND_API_KEY;
    if (resendApiKey) {
        try {
            console.log(`[MailSender] ATTEMPT 2: Sending via Resend API fallback...`);
            const sendStart = Date.now();

            const isGmailOrPublic = senderEmail.includes('@gmail.com') || senderEmail.includes('@yahoo.com') || senderEmail.includes('@outlook.com');
            const fromAddress = isGmailOrPublic ? `${senderName} <onboarding@resend.dev>` : `${senderName} <${senderEmail}>`;

            const response = await axios.post(
                'https://api.resend.com/emails',
                {
                    from: fromAddress,
                    to: [email],
                    subject: title,
                    html: body,
                    reply_to: senderEmail,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            const elapsed = Date.now() - sendStart;
            console.log(`[MailSender] ATTEMPT 2: Email sent via Resend API in ${elapsed}ms — ID: ${response.data?.id}`);
            console.log(`[MailSender] ---- DEBUG END (Resend API success) ----`);

            return {
                messageId: response.data?.id || 'unknown',
                response: JSON.stringify(response.data),
            };
        } catch (resendError) {
            console.error(`[MailSender] ATTEMPT 2 FAILED via Resend API: ${resendError.message}`);
            if (resendError.response) {
                console.error(`[MailSender]   HTTP Status: ${resendError.response.status}`);
                console.error(`[MailSender]   Response body: ${JSON.stringify(resendError.response.data)}`);
            }
            throw new Error(`Email failed: Gmail API error and Resend fallback error (${resendError.message})`);
        }
    }

    const finalErrMsg = 'All email sending providers failed or were missing credentials.';
    console.error(`[MailSender] ERROR: ${finalErrMsg}`);
    console.error(`[MailSender] ---- DEBUG END (all failed) ----`);
    throw new Error(finalErrMsg);
};

module.exports = mailSender;
