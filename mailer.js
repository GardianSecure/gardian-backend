require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const fs = require("fs");
const path = require("path");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendReportEmail(email, summary, reportId, siteUrl, tier = "Free") {
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
  ? summary.topIssues.map(i => {
      return `- ${i.name}\n  Risk: ${i.riskDetail}\n  Fix: ${i.fix}`;
    }).join("\n\n") 
  : "No major issues detected."}

${
  tier === "Pro"
    ? "\nAs a Pro user, the full detailed JSON report is attached to this email."
    : "\nUpgrade to Pro to receive the full detailed JSON report as an attachment."
}

Thank you for using GardianX.
`;

  const attachments = [];
  if (tier === "Pro") {
    const reportPath = path.join(__dirname, "reports", `report-${reportId}.json`);
    if (fs.existsSync(reportPath)) {
      attachments.push({
        content: fs.readFileSync(reportPath).toString("base64"),
        filename: `report-${reportId}.json`,
        type: "application/json",
        disposition: "attachment"
      });
    }
  }

  const msg = {
    to: email,
    from: `"GardianX Reports" <${process.env.SMTP_USER}>`, // must be a verified sender in SendGrid
    subject: `GardianX Scan Report - ${siteUrl}`,
    text: plainSummary,
    attachments
  };

  try {
    await sgMail.send(msg);
    console.log(`📧 Report email sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
    throw err;
  }
}

module.exports = sendReportEmail;
