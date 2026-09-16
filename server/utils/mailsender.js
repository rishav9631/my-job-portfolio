const axios = require('axios');
const { getValidAccessToken } = require('./googleOAuthService');

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
 * Send email via Gmail REST API (HTTPS port 443 — works on Render free tier).
 * Falls back to Resend API if Gmail API is not configured or fails.
 *
 * @param {string} email - Recipient email address
 * @param {string} title - Email subject line
 * @param {string} body  - HTML email body
 * @param {object} config - Dynamic config from MongoDB
 */
const mailSender = async (email, title, body, config = null) => {
    // Sender identity (still resolved from config/env for email composition)
    const senderEmail = (config && config.senderEmail) || process.env.SENDER_EMAIL || 'rishavjha771@gmail.com';
    const senderName = (config && config.senderName) || process.env.SENDER_NAME || 'Rishav Kumar';

    console.log(`[MailSender] ---- DEBUG START ----`);
    console.log(`[MailSender] Primary Provider: Gmail REST API (via MongoDB-cached OAuth)`);
    console.log(`[MailSender] From: ${senderName} <${senderEmail}>`);
    console.log(`[MailSender] To: ${email}`);
    console.log(`[MailSender] Subject: ${title}`);
    console.log(`[MailSender] Body length: ${body ? body.length : 0} chars`);

    // ── ATTEMPT 1: Gmail REST API (with MongoDB-cached OAuth tokens) ──────────
    try {
        console.log(`[MailSender] ATTEMPT 1: Sending via Gmail REST API...`);
        const sendStart = Date.now();

        // 1. Get access token (auto-refreshes from MongoDB cache)
        const accessToken = await getValidAccessToken();
        console.log(`[MailSender] ATTEMPT 1: OAuth2 Access Token acquired via googleOAuthService.`);

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
