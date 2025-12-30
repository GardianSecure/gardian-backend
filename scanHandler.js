// scanHandler.js
const { runZapScan } = require("./zapScan");
const sendReportEmail = require("./mailer");

async function handleScanRequest({ email, siteUrl }) {
  const reportId = Date.now().toString();

  try {
    console.log(`📩 Incoming scan request for ${siteUrl}, email: ${email}`);

    // Run the scan and wait until it finishes (completed/partial/error)
    const result = await runZapScan(siteUrl);

    // Build summary for mailer
    const summary = {
      status: result.status,
      totalFindings: result.alerts.length,
      high: result.alerts.filter(a => a.risk === "High").length,
      medium: result.alerts.filter(a => a.risk === "Medium").length,
      low: result.alerts.filter(a => a.risk === "Low").length,
      topIssues: result.alerts.slice(0, 5)
    };

    // Send the report email only after scan result is ready
    await sendReportEmail(email, summary, reportId, siteUrl);
    console.log(`✅ Report email sent to ${email} with status: ${summary.status}`);
  } catch (err) {
    console.error("❌ Scan failed:", err);

    // Send an error summary if scan completely failed
    const summary = {
      status: "error",
      totalFindings: 0,
      high: 0,
      medium: 0,
      low: 0,
      topIssues: []
    };
    await sendReportEmail(email, summary, reportId, siteUrl);
    console.log(`⚠️ Error report email sent to ${email}`);
  }
}

module.exports = { handleScanRequest };