// mailer.js
require("dotenv").config();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

async function sendReportEmail(email, summary, reportId, siteUrl, tier = "Free") {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in environment variables");
  }

  const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: process.env.SMTP_USER, // your Gmail address
    pass: process.env.SMTP_PASS  // your Gmail App Password
  }
});


  const plainSummary = `
Hello,

Your GardianX scan for ${siteUrl} is complete.

Status: ${summary.status}
Total Findings: ${summary.totalFindings}
High Risk: ${summary.high}
Medium Risk: ${summary.medium}
Low Risk: ${summary.low}
Informational: ${summary.informational}

Top Issues:
${summary.topIssues && summary.topIssues.length > 0 
  ? summary.topIssues.map(i => `- ${i.name}: ${i.plainSummary}`).join("\n") 
  : "No major issues detected."}

Thank you for using GardianX.
`;

  const attachments = [];
  if (tier === "Pro") {
    const reportPath = path.join(__dirname, "reports", `report-${reportId}.json`);
    if (fs.existsSync(reportPath)) {
      attachments.push({
        filename: `report-${reportId}.json`,
        path: reportPath
      });
    } else {
      console.warn(`⚠️ Report file not found at ${reportPath}, skipping attachment.`);
    }
  }

  const mailOptions = {
    from: `"GardianX Reports" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `GardianX Scan Report - ${siteUrl}`,
    text: plainSummary,
    attachments
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Report email sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
    throw err;
  }
}

module.exports = sendReportEmail;
