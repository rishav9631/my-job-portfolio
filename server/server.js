// Import required modules
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Import cors
const { getJobRoleInquiry } = require("./mail/templates/jobRole");
const { getInternshipInquiry } = require("./mail/templates/mailSender"); // Email template for recipient
const mailSender = require("./utils/mailsender"); // Utility function to send emails
const { getConfigInternal } = require("./controllers/configController");

// Initialize environment variables
dotenv.config();

// Create an Express application
const app = express();
// Enable CORS — dynamically allow any Vercel frontend, localhost, and custom domains
app.use(cors({
  origin: true, // Reflects the requesting origin (Vercel, localhost, etc.)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors());
const PORT = process.env.PORT || 3000;

// Connect to Database
const connectDB = require('./config/db');
connectDB();

// Middleware to parse JSON from incoming requests
app.use(express.json());

// Import API Routes
const aiRoutes = require('./routes/aiRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const authRoutes = require('./routes/authRoutes');
const configRoutes = require('./routes/configRoutes');

// Health check endpoint for frontend status indicator
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, status: 'online', timestamp: Date.now() });
});

// Use API Routes
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/resume', resumeRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/config', configRoutes);

// API Endpoint to handle sending email
app.post('/send-email', async (req, res) => {
  const requestId = Date.now().toString(36);
  console.log(`[${requestId}] ========== /send-email START ==========`);
  console.log(`[${requestId}] Request body:`, JSON.stringify(req.body));

  try {
    const { recipientName, recipientEmail, recipientCompany, jobRole, jobLink } = req.body;

    // Validate required fields
    if (!recipientName || !recipientEmail || !recipientCompany) {
      console.log(`[${requestId}] Validation failed — missing required fields`);
      return res.status(400).json({ message: 'All fields are required.' });
    }
    console.log(`[${requestId}] Step 1/4: Validation passed`);

    // Fetch dynamic config from MongoDB
    console.log(`[${requestId}] Step 2/4: Fetching config from MongoDB...`);
    const configStart = Date.now();
    const config = await getConfigInternal();
    console.log(`[${requestId}] Step 2/4: Config fetched in ${Date.now() - configStart}ms`);

    // Log SMTP config (masked for security)
    const maskValue = (v) => v ? v.substring(0, 3) + '***' + v.substring(v.length - 2) : '<EMPTY>';
    console.log(`[${requestId}] SMTP Config — Host: ${config.smtpHost || '<EMPTY>'}, Port: ${config.smtpPort || '<EMPTY>'}, Secure: ${config.smtpSecure}, User: ${maskValue(config.smtpUser)}, Pass length: ${config.smtpPass ? config.smtpPass.length : 0} chars`);

    // Generate email content
    console.log(`[${requestId}] Step 3/4: Generating email template...`);
    const emailContent = getInternshipInquiry(recipientName, recipientCompany, jobRole || '', jobLink || '', config);
    console.log(`[${requestId}] Step 3/4: Template generated (${emailContent ? emailContent.length : 0} chars)`);

    // Send email to the recipient (pass config for dynamic SMTP)
    console.log(`[${requestId}] Step 4/4: Calling mailSender to ${recipientEmail}...`);
    const mailStart = Date.now();
    const emailRes = await mailSender(
      recipientEmail,
      jobRole
        ? `Inquiry About ${jobRole} Opportunity`
        : "Inquiry About Internship Opportunities",
      emailContent,
      config
    );
    console.log(`[${requestId}] Step 4/4: Email sent in ${Date.now() - mailStart}ms — messageId: ${emailRes?.messageId}`);

    console.log(`[${requestId}] ========== /send-email SUCCESS ==========`);
    return res.json({
      success: true,
      message: "Email sent successfully!",
    });
  } catch (error) {
    console.error(`[${requestId}] ========== /send-email FAILED ==========`);
    console.error(`[${requestId}] Error name: ${error.name}`);
    console.error(`[${requestId}] Error message: ${error.message}`);
    console.error(`[${requestId}] Error code: ${error.code || 'N/A'}`);
    console.error(`[${requestId}] Error command: ${error.command || 'N/A'}`);
    console.error(`[${requestId}] Error responseCode: ${error.responseCode || 'N/A'}`);
    console.error(`[${requestId}] Full stack:`, error.stack);
    return res.status(500).json({
      success: false,
      message: `Failed to send email: ${error.message}`,
    });
  }
});

// Export app for Vercel Serverless environment
module.exports = app;

// Start the server (if run directly)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
