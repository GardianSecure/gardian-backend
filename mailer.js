const sgMail = require('@sendgrid/mail');

// ✅ Ensure API key exists
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("Missing SENDGRID_API_KEY environment variable");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendReportEmail(to, reportSummary, reportId) {
  if (!process.env.SENDGRID_VERIFIED_SENDER) {
    throw new Error("Missing SENDGRID_VERIFIED_SENDER environment variable");
  }

  const msg = {
    to,
    from: process.env.SENDGRID_VERIFIED_SENDER,
    replyTo: process.env.SENDGRID_VERIFIED_SENDER,
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

  return sgMail
    .send(msg)
    .then(() => {
      console.log(`✅ Report email sent to ${to}`);
    })
    .catch(error => {
      console.error("❌ Failed to send report email:", error);
      throw error;
    });
}

module.exports = sendReportEmail;
