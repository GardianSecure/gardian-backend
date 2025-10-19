const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function sendReportEmail(to, reportSummary, reportId) {
  const mailOptions = {
    from: `Gardian <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Gardian Security Scan Report',
    html: `
      <h2>🔐 Gardian Scan Complete</h2>
      <p>Here’s a quick summary:</p>
      <ul>
        <li>Total Findings: ${reportSummary.totalFindings}</li>
        <li>High Risk: ${reportSummary.high}</li>
        <li>Medium Risk: ${reportSummary.medium}</li>
        <li>Low Risk: ${reportSummary.low}</li>
      </ul>
      <p>Top Issues:</p>
      <pre>${JSON.stringify(reportSummary.topIssues, null, 2)}</pre>
      <p>Report ID: ${reportId}</p>
    `
  };

  return transporter.sendMail(mailOptions);
  module.exports = sendReportEmail;
}
