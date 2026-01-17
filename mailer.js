// mailer.js
const sgMail = require("@sendgrid/mail");

// Ensure API key is present
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("Missing SENDGRID_API_KEY environment variable");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Basic HTML-escape to avoid breaking markup if user content slips in
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Format top issues into HTML list
function formatIssues(topIssues) {
  const issues = Array.isArray(topIssues) ? topIssues.slice(0, 5) : [];
  if (!issues.length) return "<p>No issues to highlight.</p>";

  const items = issues.map(issue => {
    const risk = escapeHtml(issue.risk || "Info");
    const title = escapeHtml(issue.name || issue.title || "Unnamed issue");
    const summary = escapeHtml(issue.plainSummary || issue.description || "No summary available.");
    const ref = issue.reference
      ? `<br/><a href="${escapeHtml(issue.reference)}" target="_blank" rel="noopener">Learn more</a>`
      : "";
    return `
      <li style="margin-bottom:8px;">
        <strong>${risk}:</strong> ${title}
        <br/>
        <em>${summary}</em>
        ${ref}
      </li>`;
  }).join("");

  return `<ul style="padding-left:18px;">${items}</ul>`;
}

// Build HTML email body
function buildHtml(reportSummary = {}, reportId, siteUrl) {
  const status = escapeHtml(reportSummary.status || "Complete");
  const total = Number.isFinite(reportSummary.totalFindings) ? reportSummary.totalFindings : 0;
  const high = Number.isFinite(reportSummary.high) ? reportSummary.high : 0;
  const medium = Number.isFinite(reportSummary.medium) ? reportSummary.medium : 0;
  const low = Number.isFinite(reportSummary.low) ? reportSummary.low : 0;

  const headerSite = siteUrl ? ` for ${escapeHtml(siteUrl)}` : "";
  const issuesHtml = formatIssues(reportSummary.topIssues);

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color:#222; line-height:1.5;">
      <h2 style="margin:0 0 8px;">🔐 Gardian Scan ${status}${headerSite}</h2>
      <p style="margin:0 0 12px;">Here’s your quick summary:</p>

      <ul style="list-style:none; padding:0; margin:0 0 12px;">
        <li><strong>Total findings:</strong> ${total}</li>
        <li><strong>High risk:</strong> ${high}</li>
        <li><strong>Medium risk:</strong> ${medium}</li>
        <li><strong>Low risk:</strong> ${low}</li>
      </ul>

      <p style="margin:16px 0 8px;"><strong>Top issues:</strong></p>
      ${issuesHtml}

      <hr style="border:none; border-top:1px solid #eee; margin:16px 0;" />
      <p style="margin:6px 0; color:#666;">
        Report ID: ${escapeHtml(reportId || "")}
      </p>
    </div>
  `;
}

// Build plain-text email body
function buildText(reportSummary = {}, reportId, siteUrl) {
  const status = reportSummary.status || "Complete";
  const total = Number.isFinite(reportSummary.totalFindings) ? reportSummary.totalFindings : 0;
  const high = Number.isFinite(reportSummary.high) ? reportSummary.high : 0;
  const medium = Number.isFinite(reportSummary.medium) ? reportSummary.medium : 0;
  const low = Number.isFinite(reportSummary.low) ? reportSummary.low : 0;

  const headerSite = siteUrl ? ` for ${siteUrl}` : "";

  const issues = Array.isArray(reportSummary.topIssues) ? reportSummary.topIssues.slice(0, 5) : [];
  const issuesText = issues.length
    ? issues.map(i => `- ${i.risk || "Info"}: ${i.name || i.title || "Unnamed issue"}${i.plainSummary ? ` — ${i.plainSummary}` : ""}`).join("\n")
    : "No issues to highlight.";

  return [
    `Gardian Scan ${status}${headerSite}`,
    "",
    `Total findings: ${total}`,
    `High risk: ${high}`,
    `Medium risk: ${medium}`,
    `Low risk: ${low}`,
    "",
    "Top issues:",
    issuesText,
    "",
    `Report ID: ${reportId || ""}`,
  ].join("\n");
}

// Send email via SendGrid
async function sendReportEmail(to, reportSummary, reportId, siteUrl) {
  if (!process.env.SENDGRID_VERIFIED_SENDER) {
    throw new Error("Missing SENDGRID_VERIFIED_SENDER environment variable");
  }

  const safeTo = escapeHtml(to);
  const subjectSite = siteUrl ? ` — ${siteUrl}` : "";
  const subjectStatus = reportSummary.status ? ` (${reportSummary.status})` : "";
  const subject = `Your Gardian Security Scan Report${subjectSite}${subjectStatus}`.trim();

  const msg = {
    to: safeTo,
    from: process.env.SENDGRID_VERIFIED_SENDER,
    replyTo: process.env.SENDGRID_VERIFIED_SENDER,
    subject,
    html: buildHtml(reportSummary, reportId, siteUrl),
    text: buildText(reportSummary, reportId, siteUrl)
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Report email sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send report email:", error);
    throw error;
  }
}

module.exports = sendReportEmail;
