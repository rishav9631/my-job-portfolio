const nodemailer = require("nodemailer");

const mailSender = async (email, title, body, config = null) => {
    try {
        // Use dynamic SMTP config if provided, otherwise fall back to env vars
        const smtpHost = (config && config.smtpHost) || process.env.MAIL_HOST;
        const smtpUser = (config && config.smtpUser) || process.env.MAIL_USER;
        const smtpPass = (config && config.smtpPass) || process.env.MAIL_PASS;

        let transporter = nodemailer.createTransport({
            host: smtpHost, // SMTP server (e.g., smtp.gmail.com)
            port: 587, // Default port for TLS
            secure: false, // Use STARTTLS
            auth: {
                user: smtpUser, // Your email
                pass: smtpPass, // Your app password
            },
        });

        let info = await transporter.sendMail({
            from: smtpUser, // Sender email
            to: email, // Recipient email
            subject: title, // Subject of the email
            html: body, // HTML content of the email
        });

        console.log("Email sent successfully:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error; // Rethrow error to allow further handling
    }
};

module.exports = mailSender;
