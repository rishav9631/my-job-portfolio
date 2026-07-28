exports.getJobRoleInquiry = (recipientName, recipientCompany, jobRole, jobLink, config = {}) => {
  const linkedinUrl = config.linkedinUrl || "https://www.linkedin.com/in/rishav-kumar-sde/";
  const resumeUrl = config.resumeUrl || "https://drive.google.com/file/d/1myrH9blbnZ06gFsS0_-XkJpzcax5LH7z/view";
  const githubUrl = config.githubUrl || "https://github.com/rishav9631";
  const senderName = config.senderName || "Rishav Kumar";
  const senderTitle = config.senderTitle || "Software Developer | Amdocs";
  const senderEmail = config.senderEmail || "rishavjha771@gmail.com";

  return `<!DOCTYPE html>
  <html>

  <head>
      <meta charset="UTF-8">
      <title>Inquiry About ${jobRole} Role</title>
      <style>
          body {
              background-color: #ffffff;
              font-family: Arial, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #333333;
              margin: 0;
              padding: 0;
          }

          .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
          }

          .header {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 20px;
              color: #007BFF;
          }

          .body {
              font-size: 16px;
              margin-bottom: 20px;
          }

          .link {
              color: #007BFF;
              text-decoration: none;
              font-weight: bold;
          }

          .footer {
              font-size: 14px;
              color: #999999;
              margin-top: 20px;
          }

          .bold {
              font-weight: bold;
          }
      </style>
  </head>

  <body>
      <div class="container">
          <div class="header">Inquiry About ${jobRole} Role</div>
          <div class="body">
              <p>Hi ${recipientName},</p>

              <p>I hope this email finds you well. My name is ${senderName}, a Software Developer at Amdocs and a B.Tech graduate in Electronics and Communication Engineering from NIT Jamshedpur (CGPA: 8.54).</p>

              <p>I am reaching out to inquire about the ${jobRole} role at ${recipientCompany}. With 2+ years of professional experience building and maintaining telecom billing systems serving over 10 million subscribers at Amdocs, I bring hands-on expertise in Java, Python, Google Cloud Platform (GCP - BigQuery, IAM, STS), Kubernetes, Docker, Grafana, and SRE automation.</p>

              <p>Additionally, I have strong full-stack experience with the MERN stack (MongoDB, Express.js, React.js, Node.js), workflow automation using n8n and Gen AI, and have solved 1250+ algorithmic problems across LeetCode, Codeforces, and CodeChef.</p>

              <p>You can find more details about my background and projects on my LinkedIn profile: <a href="${linkedinUrl}" class="link" target="_blank">${linkedinUrl}</a>.</p>

              <p>Here is the link to my resume for your reference: <a href="${resumeUrl}" class="link" target="_blank">${resumeUrl}</a>.</p>

              <p>You can also explore my GitHub profile for a closer look at my work: <a href="${githubUrl}" class="link" target="_blank">${githubUrl}</a>.</p>

              ${
                jobLink
                  ? `<p>Job Link: <a href="${jobLink}" class="link" target="_blank">${jobLink}</a></p>`
                  : ''
              }

              <p>Thank you for your time and consideration. I would be grateful if you could let me know about the next steps for this opportunity or guide me through the application process.</p>

              <p>Looking forward to hearing from you.</p>

              <p>Best regards,</p>
              <p><strong>${senderName}</strong><br/>
              ${senderTitle}<br/>
              Email: <a href="mailto:${senderEmail}" class="link">${senderEmail}</a></p>
          </div>
      </div>
  </body>

  </html>`;
};
