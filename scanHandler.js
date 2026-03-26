// scanHandler.js
const runZapScan = require("./zapScan");
const sendReportEmail = require("./mailer");
const fs = require("fs");
const path = require("path");
const https = require("https");
const fetch = require("node-fetch");

function normalizeRisk(risk) {
  if (!risk) return "Informational";
  const r = risk.toLowerCase();
  if (r === "high") return "High";
  if (r === "medium") return "Medium";
  if (r === "low") return "Low";
  return "Informational";
}

// SSL/TLS check
async function runSslScan(siteUrl) {
  return new Promise((resolve) => {
    const results = [];
    try {
      const url = new URL(siteUrl);
      const options = { method: "GET", host: url.hostname, port: 443 };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        if (cert && cert.valid_to) {
          results.push({
            name: "SSL Certificate Validity",
            risk: "Low",
            plainSummary: `Certificate is valid until ${cert.valid_to}`,
          });
        } else {
          results.push({
            name: "SSL Certificate Missing/Invalid",
            risk: "High",
            plainSummary: "No valid SSL certificate found.",
          });
        }
        resolve(results);
      });

      req.on("error", () => {
        results.push({
          name: "SSL Connection Failed",
          risk: "High",
          plainSummary: "Could not establish a secure HTTPS connection.",
        });
        resolve(results);
      });

      req.end();
    } catch (err) {
      resolve([
        {
          name: "SSL Scan Error",
          risk: "Informational",
          plainSummary: `Error running SSL scan: ${err.message}`,
        },
      ]);
    }
  });
}

// HTTP Security Headers check
async function runHeaderScan(siteUrl) {
  const results = [];
  try {
    const res = await fetch(siteUrl);
    const headers = res.headers;

    const checks = [
      { key: "content-security-policy", name: "Content Security Policy", risk: "High" },
      { key: "strict-transport-security", name: "Strict Transport Security", risk: "Medium" },
      { key: "x-frame-options", name: "Clickjacking Protection (X-Frame-Options)", risk: "Medium" },
      { key: "x-content-type-options", name: "MIME Sniffing Protection", risk: "Low" },
      { key: "referrer-policy", name: "Referrer Policy", risk: "Low" },
    ];

    checks.forEach(check => {
      if (headers.has(check.key)) {
        results.push({
          name: check.name,
          risk: "Informational",
          plainSummary: `${check.name} header is present.`,
        });
      } else {
        results.push({
          name: check.name,
          risk: check.risk,
          plainSummary: `${check.name} header is missing.`,
        });
      }
    });
  } catch (err) {
    results.push({
      name: "Header Scan Error",
      risk: "Informational",
      plainSummary: `Error fetching headers: ${err.message}`,
    });
  }
  return results;
}

async function handleScanRequest({ email, siteUrl, tier = "Free" }) {
  const reportId = Date.now().toString();

  try {
    console.log(`📩 Incoming scan request for ${siteUrl}, email: ${email}, tier: ${tier}`);

    // Run multiple scanners in parallel
    const [zapResult, sslResult, headerResult] = await Promise.all([
      runZapScan(siteUrl),
      runSslScan(siteUrl),
      runHeaderScan(siteUrl),
    ]);

    const alerts = [
      ...(zapResult.alerts || []),
      ...(sslResult || []),
      ...(headerResult || []),
    ];

    // Build summary
    const summary = {
      status: "Complete",
      totalFindings: alerts.length,
      high: alerts.filter(a => normalizeRisk(a.risk) === "High").length,
      medium: alerts.filter(a => normalizeRisk(a.risk) === "Medium").length,
      low: alerts.filter(a => normalizeRisk(a.risk) === "Low").length,
      informational: alerts.filter(a => normalizeRisk(a.risk) === "Informational").length,
      topIssues: alerts.slice(0, 5)
    };

    // Save full report
    const reportsDir = path.join(__dirname, "reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);
    const reportPath = path.join(reportsDir, `report-${reportId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({ siteUrl, summary, alerts }, null, 2));

    // Send email
    await sendReportEmail(email, summary, reportId, siteUrl, tier);
    console.log(`✅ Report email sent to ${email} with status: ${summary.status}`);
  } catch (err) {
    console.error("❌ Scan failed:", err);

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
      await sendReportEmail(email, summary, reportId, siteUrl, tier);
      console.log(`⚠️ Error report email sent to ${email}`);
    } catch (mailErr) {
      console.error("❌ Failed to send error report email:", mailErr);
    }
  }
}

module.exports = { handleScanRequest };
