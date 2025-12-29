// mailer.js
const sgMail = require('@sendgrid/mail');

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("Missing SENDGRID_API_KEY environment variable");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendReportEmail(to, reportSummary, reportId) {
  if (!process.env.SENDGRID_VERIFIED_SENDER) {
    throw new Error("Missing SENDGRID_VERIFIED_SENDER environment variable");
  }

  const issuesHtml = reportSummary.topIssues.map(issue => `
    <li>
      <strong>${issue.risk}:</strong> ${issue.name || issue.title}
      <br/>
      <em>${issue.plainSummary || issue.description}</em>
      ${issue.reference ? `<br/><a href="${issue.reference}">Learn more</a>` : ""}
    </li>
  `).join("");

  const msg = {
    to,
    from: process.env.SENDGRID_VERIFIED_SENDER,
    replyTo: process.env.SENDGRID_VERIFIED_SENDER,
    subject: 'Your Gardian Security Scan Report',
    html: `
      <h2>🔐 Gardian Scan ${reportSummary.status || "Complete"}</h2>
      <p>Here’s a quick summary:</p>
      <ul>
        <li><strong>Total Findings:</strong> ${reportSummary.totalFindings}</li>
        <li><strong>High Risk:</strong> ${reportSummary.high}</li>
        <li><strong>Medium Risk:</strong> ${reportSummary.medium}</li>
        <li><strong>Low Risk:</strong> ${reportSummary.low}</li>
      </ul>
      <p><strong>Top Issues:</strong></p>
      <ul>
        ${issuesHtml}
      </ul>
      <p><small>Report ID: ${reportId}</small></p>
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
