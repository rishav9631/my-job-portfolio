const axios = require('axios');

/**
 * Send email via Resend HTTP API (works on Render free tier — uses HTTPS port 443).
 * Falls back gracefully with detailed error logging.
 *
 * @param {string} email - Recipient email address
 * @param {string} title - Email subject line
 * @param {string} body  - HTML email body
 * @param {object} config - Dynamic config from MongoDB (contains resendApiKey, senderEmail, senderName)
 */
const mailSender = async (email, title, body, config = null) => {
    const resendApiKey = (config && config.resendApiKey) || process.env.RESEND_API_KEY;
    const rawSenderEmail = (config && config.senderEmail) || process.env.SENDER_EMAIL || 'rishavjha771@gmail.com';
    const senderName = (config && config.senderName) || process.env.SENDER_NAME || 'Rishav Kumar';

    // Resend requires verified domain for 'from'. If sender email is @gmail.com or unverified default, use onboarding@resend.dev
    const isGmailOrPublic = rawSenderEmail.includes('@gmail.com') || rawSenderEmail.includes('@yahoo.com') || rawSenderEmail.includes('@outlook.com') || rawSenderEmail.includes('@hotmail.com');
    const fromAddress = isGmailOrPublic ? `${senderName} <onboarding@resend.dev>` : `${senderName} <${rawSenderEmail}>`;
    const replyToAddress = rawSenderEmail;

    console.log(`[MailSender] ---- DEBUG START ----`);
    console.log(`[MailSender] Provider: Resend API (HTTPS)`);
    console.log(`[MailSender] API Key: ${resendApiKey ? `SET (${resendApiKey.length} chars, starts with "${resendApiKey.substring(0, 6)}")` : '<NOT SET>'}`);
    console.log(`[MailSender] From: ${fromAddress}`);
    console.log(`[MailSender] Reply-To: ${replyToAddress}`);
    console.log(`[MailSender] To: ${email}`);
    console.log(`[MailSender] Subject: ${title}`);
    console.log(`[MailSender] Body length: ${body ? body.length : 0} chars`);

    if (!resendApiKey) {
        const errMsg = 'Resend API key is not configured. Set RESEND_API_KEY env var or update it in Admin Dashboard.';
        console.error(`[MailSender] ERROR: ${errMsg}`);
        console.error(`[MailSender] ---- DEBUG END (no API key) ----`);
        throw new Error(errMsg);
    }

    try {
        console.log(`[MailSender] Sending via Resend API...`);
        const sendStart = Date.now();

        const payload = {
            from: fromAddress,
            to: [email],
            subject: title,
            html: body,
            reply_to: replyToAddress,
        };

        const response = await axios.post(
            'https://api.resend.com/emails',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000, // 30s timeout
            }
        );

        const elapsed = Date.now() - sendStart;
        console.log(`[MailSender] Email sent in ${elapsed}ms`);
        console.log(`[MailSender] Resend response:`, JSON.stringify(response.data));
        console.log(`[MailSender] ---- DEBUG END (success) ----`);

        return {
            messageId: response.data?.id || 'unknown',
            response: JSON.stringify(response.data),
        };
    } catch (error) {
        console.error(`[MailSender] FAILED to send email via Resend API`);

        if (error.response) {
            // Resend API returned an error response
            console.error(`[MailSender]   HTTP Status: ${error.response.status}`);
            console.error(`[MailSender]   Response body: ${JSON.stringify(error.response.data)}`);

            const resendError = error.response.data;
            const statusCode = error.response.status;

            if (statusCode === 401) {
                console.error(`[MailSender]   DIAGNOSIS: Invalid API key. Check your Resend API key.`);
            } else if (statusCode === 403) {
                console.error(`[MailSender]   DIAGNOSIS: Forbidden. Your sending domain may not be verified in Resend.`);
            } else if (statusCode === 422) {
                console.error(`[MailSender]   DIAGNOSIS: Validation error. Check from/to email addresses and domain verification.`);
            } else if (statusCode === 429) {
                console.error(`[MailSender]   DIAGNOSIS: Rate limited. You've exceeded your Resend plan's sending limit.`);
            }

            const errMsg = resendError?.message || resendError?.error || `Resend API error (HTTP ${statusCode})`;
            console.error(`[MailSender] ---- DEBUG END (API error) ----`);
            throw new Error(errMsg);
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            console.error(`[MailSender]   DIAGNOSIS: Request timed out. Network issue or Resend API is down.`);
            console.error(`[MailSender] ---- DEBUG END (timeout) ----`);
            throw new Error('Email send request timed out');
        } else {
            console.error(`[MailSender]   Error: ${error.message}`);
            console.error(`[MailSender]   Code: ${error.code || 'N/A'}`);
            console.error(`[MailSender] ---- DEBUG END (network error) ----`);
            throw error;
        }
    }
};

module.exports = mailSender;
