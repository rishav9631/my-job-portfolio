// Import required modules
const express = require('express');
const nodemailer = require('nodemailer');
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

// Configure nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, // SMTP server
  port: 587, // Port for TLS
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.MAIL_USER, // Your email
    pass: process.env.MAIL_PASS, // Your app password
  },
});

// API Endpoint to handle sending email
app.post('/send-email', async (req, res) => {
  console.log('Request received at /send-email');
  console.log('Request body:', req.body);

  try {
    const { recipientName, recipientEmail, recipientCompany, jobRole, jobLink } = req.body;

    // Validate required fields
    if (!recipientName || !recipientEmail || !recipientCompany) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Fetch dynamic config from MongoDB
    const config = await getConfigInternal();

    // Generate email content — always call the template so emailContent is never undefined
    const emailContent = getInternshipInquiry(recipientName, recipientCompany, jobRole || '', jobLink || '', config);

    // Send email to the recipient (pass config for dynamic SMTP)
    const emailRes = await mailSender(
      recipientEmail, // Recipient email address
      jobRole
        ? `Inquiry About ${jobRole} Opportunity`
        : "Inquiry About Internship Opportunities",
      emailContent,
      config // Dynamic SMTP config
    );

    console.log("User Email Response:", emailRes);

    return res.json({
      success: true,
      message: "Email sent successfully!",
    });
  } catch (error) {
    console.error("Error sending email:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending the email",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
