// scanHandler.js
const runZapScan = require("./zapScan");
const sendReportEmail = require("./mailer");

function normalizeRisk(risk) {
  if (!risk) return "Informational";
  const r = risk.toLowerCase();
  if (r === "high") return "High";
  if (r === "medium") return "Medium";
  if (r === "low") return "Low";
  return "Informational";
}

async function handleScanRequest({ email, siteUrl }) {
  const reportId = Date.now().toString();

  try {
    console.log(`📩 Incoming scan request for ${siteUrl}, email: ${email}`);

    // Run the scan and wait until it finishes
    const alerts = await runZapScan(siteUrl);

    // Build summary for mailer
    const summary = {
      status: "Complete",
      totalFindings: alerts.length,
      high: alerts.filter(a => normalizeRisk(a.risk) === "High").length,
      medium: alerts.filter(a => normalizeRisk(a.risk) === "Medium").length,
      low: alerts.filter(a => normalizeRisk(a.risk) === "Low").length,
      informational: alerts.filter(a => normalizeRisk(a.risk) === "Informational").length,
      topIssues: alerts.slice(0, 5)
    };

    // Send the report email only after scan result is ready
    await sendReportEmail(email, summary, reportId, siteUrl);
    console.log(`✅ Report email sent to ${email} with status: ${summary.status}`);
  } catch (err) {
    console.error("❌ Scan failed:", err);

    // Send an error summary if scan completely failed
    const summary = {
      status: "Error",
      totalFindings: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
      topIssues: []
    };

    try {
      await sendReportEmail(email, summary, reportId, siteUrl);
      console.log(`⚠️ Error report email sent to ${email}`);
    } catch (mailErr) {
      console.error("❌ Failed to send error report email:", mailErr);
    }
  }
}

module.exports = { handleScanRequest };
