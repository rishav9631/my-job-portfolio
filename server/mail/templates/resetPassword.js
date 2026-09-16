/**
 * Generates an HTML email template for password recovery.
 * Sends the user's credentials (username + new temporary password).
 *
 * @param {string} username - The user's username
 * @param {string} password - The new temporary password
 * @returns {string} HTML email body
 */
exports.getPasswordRecoveryEmail = (username, password) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Recovery — JobTracker</title>
    <style>
        body {
            background-color: #000814;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #e5e7eb;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            max-width: 520px;
            margin: 40px auto;
            padding: 0 16px;
        }
        .card {
            background: linear-gradient(145deg, #111827, #0f172a);
            border: 1px solid #1f2937;
            border-radius: 16px;
            padding: 40px 32px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .logo {
            text-align: center;
            margin-bottom: 28px;
        }
        .logo-icon {
            display: inline-block;
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 12px;
            line-height: 48px;
            text-align: center;
            font-size: 24px;
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }
        .title {
            text-align: center;
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 8px 0;
        }
        .subtitle {
            text-align: center;
            font-size: 14px;
            color: #9ca3af;
            margin: 0 0 32px 0;
        }
        .credentials-box {
            background: #1f2937;
            border: 1px solid #374151;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
        }
        .credential-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
        }
        .credential-row + .credential-row {
            border-top: 1px solid #374151;
        }
        .credential-label {
            font-size: 13px;
            font-weight: 600;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .credential-value {
            font-size: 16px;
            font-weight: 700;
            color: #10b981;
            font-family: 'Courier New', monospace;
            background: #111827;
            padding: 6px 14px;
            border-radius: 8px;
            border: 1px solid #374151;
            letter-spacing: 0.5px;
        }
        .warning-box {
            background: rgba(245, 158, 11, 0.08);
            border: 1px solid rgba(245, 158, 11, 0.25);
            border-radius: 10px;
            padding: 14px 18px;
            margin: 24px 0 0 0;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .warning-icon {
            font-size: 18px;
            flex-shrink: 0;
            margin-top: 1px;
        }
        .warning-text {
            font-size: 13px;
            color: #fbbf24;
            line-height: 1.5;
            margin: 0;
        }
        .footer {
            text-align: center;
            margin-top: 28px;
            font-size: 12px;
            color: #6b7280;
        }
        .footer a {
            color: #10b981;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="logo">
                <div class="logo-icon">&#128188;</div>
            </div>
            <h1 class="title">Password Recovery</h1>
            <p class="subtitle">Here are your JobTracker login credentials</p>

            <div class="credentials-box">
                <div class="credential-row">
                    <span class="credential-label">Username</span>
                    <span class="credential-value">${username}</span>
                </div>
                <div class="credential-row">
                    <span class="credential-label">Password</span>
                    <span class="credential-value">${password}</span>
                </div>
            </div>

            <div class="warning-box">
                <span class="warning-icon">&#9888;&#65039;</span>
                <p class="warning-text">
                    Your password has been reset to a temporary one. Please log in and change it as soon as possible for security.
                </p>
            </div>
        </div>
        <p class="footer">
            JobTracker &copy; 2026 &mdash; Built by Rishav Kumar
        </p>
    </div>
</body>
</html>`;
};
