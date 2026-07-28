exports.getInternshipInquiry = (recipientName, recipientCompany, jobRole, jobLink, config = {}) => {
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
      <title>Inquiry About ${jobRole ? jobRole : 'Engineering'} Opportunities</title>
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
              font-size: 22px;
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
          <div class="body">
              <p>Hi <span class="bold">${recipientName}</span>,</p>

              <p>I hope this email finds you well. My name is <span class="bold">${senderName}</span>. I am currently working as a <span class="bold">Software Developer at Amdocs</span> and graduated from <span class="bold">NIT Jamshedpur</span> (Electronics & Communication Engineering) with a <span class="bold">CGPA of 8.54</span>.</p>

              <p>I am reaching out to express my interest in the <span class="bold">${jobRole ? jobRole : 'Software Development / SRE'}</span> role at <span class="bold">${recipientCompany}</span> as a professional growth opportunity within your organization.</p>

              ${
                jobLink
                  ? `<p>Please find the job link here: <a href="${jobLink}" class="link" target="_blank">${jobLink}</a>.</p>`
                  : ""
              }

              <p>With 2+ years of professional experience building and maintaining telecom billing systems for TELUS serving 10M+ subscribers, I have extensive hands-on expertise in <span class="bold">Java</span>, <span class="bold">Python</span>, <span class="bold">Google Cloud Platform (GCP - BigQuery, IAM, STS)</span>, <span class="bold">Kubernetes</span>, <span class="bold">Docker</span>, <span class="bold">Grafana</span>, and <span class="bold">SRE automation</span>. Additionally, I hold strong full-stack capabilities in <span class="bold">MERN-stack development</span> (MongoDB, Express.js, React.js, Node.js), workflow automation with <span class="bold">n8n</span> & Gen AI, and have solved 1250+ algorithmic problems across competitive coding platforms.</p>

              <p>You can find more details about my background and projects on my <span class="bold">LinkedIn Profile</span>: <a href="${linkedinUrl}" class="link" target="_blank">${linkedinUrl}</a>.</p>

              <p>Additionally, here is the link to my <span class="bold">Resume</span> for your reference: <a href="${resumeUrl}" class="link" target="_blank">${resumeUrl}</a>.</p>

              <p>Feel free to explore my work on <span class="bold">GitHub</span>: <a href="${githubUrl}" class="link" target="_blank">${githubUrl}</a>.</p>

              <p>Thank you for your time and consideration. I would appreciate any guidance about the application process or upcoming opportunities.</p>

              <p>Looking forward to hearing from you.</p>

              <p class="bold">Best regards,</p>
              <p><strong>${senderName}</strong><br/>
              ${senderTitle}<br/>
              Email: <a href="mailto:${senderEmail}" class="link">${senderEmail}</a></p>
          </div>
      </div>
  </body>

  </html>`;
};
