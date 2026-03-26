// mailer.js
const sgMail = require("@sendgrid/mail");
const fs = require("fs");
const path = require("path");

// Ensure API key is present
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("Missing SENDGRID_API_KEY environment variable");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatIssues(topIssues) {
  const issues = Array.isArray(topIssues) ? topIssues.slice(0, 5) : [];
  if (!issues.length) return "<p>No issues to highlight.</p>";

  return `<ul style="padding-left:18px;">${issues.map(issue => {
    const risk = escapeHtml(issue.risk || "Info");
    const title = escapeHtml(issue.name || issue.title || "Unnamed issue");
    const summary = escapeHtml(issue.plainSummary || issue.description || "No summary available.");
    return `
      <li style="margin-bottom:8px;">
        <strong>${risk}:</strong> ${title}
        <br/>
        <em>${summary}</em>
      </li>`;
  }).join("")}</ul>`;
}

function buildHtml(reportSummary = {}, reportId, siteUrl, tier = "Free") {
  const status = escapeHtml(reportSummary.status || "Complete");
  const total = reportSummary.totalFindings || 0;
  const high = reportSummary.high || 0;
  const medium = reportSummary.medium || 0;
  const low = reportSummary.low || 0;

  const headerSite = siteUrl ? ` for ${escapeHtml(siteUrl)}` : "";
  const issuesHtml = formatIssues(reportSummary.topIssues);

  let introNote = "";
  if (tier === "Free") {
    introNote = `<p style="margin:0 0 12px; font-size:14px; color:#333;">
      We scanned your website to check if it’s safe and trustworthy. 
      This report shows what we found — things that look secure, and areas that might need fixing. 
      Think of it as a health check for your site.
    </p>`;
  }

  let nextSteps = `
    <p style="margin:16px 0 8px;"><strong>Next steps:</strong></p>
    <ul style="padding-left:18px;">
      <li>Focus on fixing <strong>High risk</strong> issues first.</li>
      <li>Then address <strong>Medium risk</strong> issues.</li>
      <li>Finally, review <strong>Low risk</strong> issues for best practice.</li>
    </ul>
  `;

  let extraNote = "";
  if (tier === "Free") {
    extraNote = `<p style="color:#666; font-size:13px;">
      This is a Free tier summary. Upgrade to Pro for full detailed reports and export options.
    </p>`;
  }

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color:#222; line-height:1.5;">
      <h2 style="margin:0 0 8px;">🔐 GardianX Scan ${status}${headerSite}</h2>
      ${introNote}
      <p style="margin:0 0 12px;">Here’s your quick summary:</p>

      <ul style="list-style:none; padding:0; margin:0 0 12px;">
        <li><strong>Total findings:</strong> ${total}</li>
        <li><strong>High risk:</strong> ${high}</li>
        <li><strong>Medium risk:</strong> ${medium}</li>
        <li><strong>Low risk:</strong> ${low}</li>
      </ul>

      <p style="margin:16px 0 8px;"><strong>Top issues:</strong></p>
      ${issuesHtml}

      ${nextSteps}
      ${extraNote}

      <hr style="border:none; border-top:1px solid #eee; margin:16px 0;" />
      <p style="margin:6px 0; color:#666;">
        Report ID: ${escapeHtml(reportId || "")}
      </p>
      <p style="margin:6px 0; font-size:12px; color:#999;">
        GardianX — Building trust through deeper security scans.
      </p>
    </div>
  `;
}

function buildText(reportSummary = {}, reportId, siteUrl, tier = "Free") {
  const status = reportSummary.status || "Complete";
  const total = reportSummary.totalFindings || 0;
  const high = reportSummary.high || 0;
  const medium = reportSummary.medium || 0;
  const low = reportSummary.low || 0;

  const headerSite = siteUrl ? ` for ${siteUrl}` : "";
  const issues = Array.isArray(reportSummary.topIssues) ? reportSummary.topIssues.slice(0, 5) : [];
  const issuesText = issues.length
    ? issues.map(i => `- ${i.risk || "Info"}: ${i.name || i.title || "Unnamed issue"}${i.plainSummary ? ` — ${i.plainSummary}` : ""}`).join("\n")
    : "No issues to highlight.";

  let introNote = "";
  if (tier === "Free") {
    introNote = "We scanned your website to check if it’s safe and trustworthy.\nThis report shows what we found — things that look secure, and areas that might need fixing.\nThink of it as a health check for your site.\n";
  }

  let nextSteps = [
    "Next steps:",
    "- Focus on fixing High risk issues first.",
    "- Then address Medium risk issues.",
    "- Finally, review Low risk issues for best practice."
  ].join("\n");

  let extraNote = "";
  if (tier === "Free") {
    extraNote = "\nThis is a Free tier summary. Upgrade to Pro for full detailed reports and export options.";
  }

  return [
    `GardianX Scan ${status}${headerSite}`,
    "",
    introNote,
    `Total findings: ${total}`,
    `High risk: ${high}`,
    `Medium risk: ${medium}`,
    `Low risk: ${low}`,
    "",
    "Top issues:",
    issuesText,
    "",
    nextSteps,
    extraNote,
    "",
    `Report ID: ${reportId || ""}`,
    "GardianX — Building trust through deeper security scans."
  ].join("\n");
}

async function sendReportEmail(to, reportSummary, reportId, siteUrl, tier = "Free") {
  if (!process.env.SENDGRID_VERIFIED_SENDER) {
    throw new Error("Missing SENDGRID_VERIFIED_SENDER environment variable");
  }

  const subjectSite = siteUrl ? ` — ${siteUrl}` : "";
  const subjectStatus = reportSummary.status ? ` (${reportSummary.status})` : "";
  const subject = `Your GardianX Security Scan Report${subjectSite}${subjectStatus}`.trim();

  const msg = {
    to,
    from: process.env.SENDGRID_VERIFIED_SENDER,
    replyTo: process.env.SENDGRID_VERIFIED_SENDER,
    subject,
    html: buildHtml(reportSummary, reportId, siteUrl, tier),
    text: buildText(reportSummary, reportId, siteUrl, tier)
  };

  // Attach full report for Pro tier
  if (tier === "Pro") {
    const reportPath = path.join(__dirname, "reports", `report-${reportId}.json`);
    if (fs.existsSync(reportPath)) {
      msg.attachments = [
        {
          content: fs.readFileSync(reportPath).toString("base64"),
          filename: `report-${reportId}.json`,
          type: "application/json",
          disposition: "attachment"
        }
      ];
    }
  }

  try {
    await sgMail.send(msg);
    console.log(`✅ Report email sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send report email:", error);
    throw error;
  }
}

module.exports = sendReportEmail;
