const nodemailer = require("nodemailer");

const createTransporter = (host, port, secure, user, pass) => {
    return nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure,
        auth: {
            user: user,
            pass: pass,
        },
        connectionTimeout: 10000, // 10s connection timeout
        greetingTimeout: 10000,   // 10s greeting timeout
        socketTimeout: 15000,     // 15s socket timeout
        tls: {
            rejectUnauthorized: false
        }
    });
};

const mailSender = async (email, title, body, config = null) => {
    // Resolve credentials and primary settings
    const smtpHost = (config && config.smtpHost) || process.env.MAIL_HOST || 'smtp.gmail.com';
    const smtpUser = (config && config.smtpUser) || process.env.MAIL_USER;
    const smtpPass = (config && config.smtpPass) || process.env.MAIL_PASS;

    console.log(`[MailSender] ---- DEBUG START ----`);
    console.log(`[MailSender] smtpHost: ${smtpHost}`);
    console.log(`[MailSender] smtpUser: ${smtpUser ? smtpUser.substring(0, 4) + '***' : '<NOT SET>'}`);
    console.log(`[MailSender] smtpPass: ${smtpPass ? `SET (${smtpPass.length} chars, starts with "${smtpPass.substring(0, 4)}")` : '<NOT SET>'}`);
    console.log(`[MailSender] to: ${email}, subject: ${title}`);
    console.log(`[MailSender] body length: ${body ? body.length : 0} chars`);

    // Determine initial port and secure settings (default to 465 SSL, as 587 STARTTLS is frequently blocked)
    let primaryPort = (config && config.smtpPort) ? Number(config.smtpPort) : (process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 465);
    let primarySecure = (config && config.smtpSecure !== undefined) ? Boolean(config.smtpSecure) : (process.env.MAIL_SECURE !== undefined ? process.env.MAIL_SECURE === 'true' : primaryPort === 465);

    // Prepare fallback options (if primary is 465 SSL, fallback is 587 TLS; if 587, fallback is 465)
    let fallbackPort = primaryPort === 465 ? 587 : 465;
    let fallbackSecure = fallbackPort === 465;

    // Attempt 1: Primary transport
    try {
        console.log(`[MailSender] ATTEMPT 1: Connecting to ${smtpHost}:${primaryPort} (secure: ${primarySecure})...`);
        const transporter = createTransporter(smtpHost, primaryPort, primarySecure, smtpUser, smtpPass);

        // Verify SMTP connection & auth BEFORE sending
        console.log(`[MailSender] ATTEMPT 1: Verifying SMTP connection & credentials...`);
        const verifyStart = Date.now();
        try {
            await transporter.verify();
            console.log(`[MailSender] ATTEMPT 1: SMTP verified OK in ${Date.now() - verifyStart}ms`);
        } catch (verifyErr) {
            console.error(`[MailSender] ATTEMPT 1: SMTP verify FAILED in ${Date.now() - verifyStart}ms`);
            console.error(`[MailSender] ATTEMPT 1: Verify error — code: ${verifyErr.code || 'N/A'}, command: ${verifyErr.command || 'N/A'}, responseCode: ${verifyErr.responseCode || 'N/A'}`);
            console.error(`[MailSender] ATTEMPT 1: Verify error message: ${verifyErr.message}`);
            throw verifyErr; // Go to fallback
        }

        console.log(`[MailSender] ATTEMPT 1: Sending email...`);
        const sendStart = Date.now();
        let info = await transporter.sendMail({
            from: smtpUser,
            to: email,
            subject: title,
            html: body,
        });

        console.log(`[MailSender] ATTEMPT 1: Email sent in ${Date.now() - sendStart}ms — messageId: ${info.messageId}`);
        console.log(`[MailSender] ATTEMPT 1: Response: ${info.response}`);
        console.log(`[MailSender] ---- DEBUG END (success) ----`);
        return info;
    } catch (primaryError) {
        console.warn(`[MailSender] ATTEMPT 1 FAILED on ${smtpHost}:${primaryPort}`);
        console.warn(`[MailSender]   Error name: ${primaryError.name}`);
        console.warn(`[MailSender]   Error message: ${primaryError.message}`);
        console.warn(`[MailSender]   Error code: ${primaryError.code || 'N/A'}`);
        console.warn(`[MailSender]   Error command: ${primaryError.command || 'N/A'}`);
        console.warn(`[MailSender]   Error responseCode: ${primaryError.responseCode || 'N/A'}`);

        // Attempt 2: Fallback transport
        try {
            console.log(`[MailSender] ATTEMPT 2: Connecting to ${smtpHost}:${fallbackPort} (secure: ${fallbackSecure})...`);
            const fallbackTransporter = createTransporter(smtpHost, fallbackPort, fallbackSecure, smtpUser, smtpPass);

            // Verify SMTP connection & auth BEFORE sending
            console.log(`[MailSender] ATTEMPT 2: Verifying SMTP connection & credentials...`);
            const verifyStart2 = Date.now();
            try {
                await fallbackTransporter.verify();
                console.log(`[MailSender] ATTEMPT 2: SMTP verified OK in ${Date.now() - verifyStart2}ms`);
            } catch (verifyErr2) {
                console.error(`[MailSender] ATTEMPT 2: SMTP verify FAILED in ${Date.now() - verifyStart2}ms`);
                console.error(`[MailSender] ATTEMPT 2: Verify error — code: ${verifyErr2.code || 'N/A'}, command: ${verifyErr2.command || 'N/A'}, responseCode: ${verifyErr2.responseCode || 'N/A'}`);
                console.error(`[MailSender] ATTEMPT 2: Verify error message: ${verifyErr2.message}`);
                throw verifyErr2;
            }

            console.log(`[MailSender] ATTEMPT 2: Sending email...`);
            const sendStart2 = Date.now();
            let info = await fallbackTransporter.sendMail({
                from: smtpUser,
                to: email,
                subject: title,
                html: body,
            });

            console.log(`[MailSender] ATTEMPT 2: Email sent in ${Date.now() - sendStart2}ms — messageId: ${info.messageId}`);
            console.log(`[MailSender] ATTEMPT 2: Response: ${info.response}`);
            console.log(`[MailSender] ---- DEBUG END (fallback success) ----`);
            return info;
        } catch (fallbackError) {
            console.error(`[MailSender] ATTEMPT 2 FAILED on ${smtpHost}:${fallbackPort}`);
            console.error(`[MailSender]   Error name: ${fallbackError.name}`);
            console.error(`[MailSender]   Error message: ${fallbackError.message}`);
            console.error(`[MailSender]   Error code: ${fallbackError.code || 'N/A'}`);
            console.error(`[MailSender]   Error command: ${fallbackError.command || 'N/A'}`);
            console.error(`[MailSender]   Error responseCode: ${fallbackError.responseCode || 'N/A'}`);
            console.error(`[MailSender] ---- DEBUG END (both failed) ----`);
            throw fallbackError;
        }
    }
};

module.exports = mailSender;

