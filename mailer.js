//mailer.js
require("dotenv").config(); // Load variables from .env
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

async function sendReportEmail(email, summary, reportId, siteUrl, tier = "Free") {
  // Transporter uses Gmail with environment variables
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER, // GardianX sender email
      pass: process.env.SMTP_PASS  // Gmail App Password
    }
  });

  // Plain-language summary
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
${summary.topIssues.map(i => `- ${i.name}: ${i.plainSummary}`).join("\n")}

Thank you for using GardianX.
`;

  // Attach full JSON report for Pro tier
  const attachments = [];
  if (tier === "Pro") {
    const reportPath = path.join(__dirname, "reports", `report-${reportId}.json`);
    if (fs.existsSync(reportPath)) {
      attachments.push({
        filename: `report-${reportId}.json`,
        path: reportPath
      });
    }
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: `GardianX Scan Report - ${siteUrl}`,
    text: plainSummary,
    attachments
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Report email sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err);
  }
}

module.exports = sendReportEmail;
