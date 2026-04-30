// scanHandler.js
const runZapScan = require("./zapScan");
const sendReportEmail = require("./mailer");
const fs = require("fs");
const path = require("path");
const https = require("https");
const fetch = require("node-fetch");
const fixes = require("./fixes");   // ✅ Import fixes lookup

function normalizeRisk(risk) {
  if (!risk) return "Informational";
  const r = risk.toLowerCase();
  if (r === "high") return "High";
  if (r === "medium") return "Medium";
  if (r === "low") return "Low";
  return "Informational";
}

// --- SSL/TLS check ---
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
      resolve([{
        name: "SSL Scan Error",
        risk: "Informational",
        plainSummary: `Error running SSL scan: ${err.message}`,
      }]);
    }
  });
}

// --- HTTP Security Headers check ---
async function runHeaderScan(siteUrl) {
  const results = [];
  try {
    const res = await fetch(siteUrl);
    const headers = res.headers;

    const checks = [
      { key: "content-security-policy", name: "Content Security Policy (CSP) Header Not Set", risk: "High" },
      { key: "strict-transport-security", name: "Strict-Transport-Security Header Not Set", risk: "Medium" },
      { key: "x-frame-options", name: "Missing Anti-clickjacking Header", risk: "Medium" },
      { key: "x-content-type-options", name: "X-Content-Type-Options Header Missing", risk: "Low" },
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

// --- Dependency/Library Scanner ---
async function runDependencyScan(siteUrl) {
  const results = [];
  try {
    const res = await fetch(siteUrl);
    const html = await res.text();

    const libraries = [
      { name: "jQuery", regex: /jquery-(\d+\.\d+\.\d+)/i, latest: "3.7.1" },
      { name: "AngularJS", regex: /angular(\.min)?\.js/i, latest: "1.8.3" },
      { name: "React", regex: /react(\.min)?\.js/i, latest: "18.2.0" },
    ];

    libraries.forEach(lib => {
      const match = html.match(lib.regex);
      if (match) {
        const version = match[1] || "unknown";
        if (version !== "unknown" && version !== lib.latest) {
          results.push({
            name: `${lib.name} Library`,
            risk: "Medium",
            plainSummary: `${lib.name} version ${version} detected. Latest is ${lib.latest}. Consider upgrading.`,
          });
        } else {
          results.push({
            name: `${lib.name} Library`,
            risk: "Informational",
            plainSummary: `${lib.name} is up-to-date.`,
          });
        }
      }
    });

    if (results.length === 0) {
      results.push({
        name: "Dependency Scan",
        risk: "Informational",
        plainSummary: "No common libraries detected.",
      });
    }
  } catch (err) {
    results.push({
      name: "Dependency Scan Error",
      risk: "Informational",
      plainSummary: `Error scanning dependencies: ${err.message}`,
    });
  }
  return results;
}

// --- Content Scanner ---
async function runContentScan(siteUrl) {
  const results = [];
  try {
    const res = await fetch(siteUrl);
    const html = await res.text();

    if (html.match(/<form[^>]*action=["']http:/gi)) {
      results.push({
        name: "Insecure Form Action",
        risk: "High",
        plainSummary: "Form submits data over HTTP instead of HTTPS.",
      });
    }

    if (siteUrl.startsWith("https://") && html.match(/src=["']http:/gi)) {
      results.push({
        name: "Mixed Content",
        risk: "Medium",
        plainSummary: "Page loads resources over HTTP on an HTTPS site.",
      });
    }

    if (html.match(/<img(?![^>]*alt=)[^>]*>/gi)) {
      results.push({
        name: "Missing Alt Attributes",
        risk: "Low",
        plainSummary: "Some images are missing alt attributes.",
      });
    }

    if (results.length === 0) {
      results.push({
        name: "Content Scan",
        risk: "Informational",
        plainSummary: "No insecure content issues detected.",
      });
    }
  } catch (err) {
    results.push({
      name: "Content Scan Error",
      risk: "Informational",
      plainSummary: `Error scanning content: ${err.message}`,
    });
  }
  return results;
}

// --- Main handler ---
async function handleScanRequest({ email, siteUrl, tier = "Free" }) {
  const reportId = Date.now().toString();

  try {
    console.log(`📩 Incoming scan request for ${siteUrl}, email: ${email}, tier: ${tier}`);

    const [zapResult, sslResult, headerResult, dependencyResult, contentResult] = await Promise.all([
      runZapScan(siteUrl),
      runSslScan(siteUrl),
      runHeaderScan(siteUrl),
      runDependencyScan(siteUrl),
      runContentScan(siteUrl),
    ]);

    // ✅ Enrich alerts with risk + fix guidance
    const alerts = [
      ...(zapResult.alerts || []),
      ...(sslResult || []),
      ...(headerResult || []),
      ...(dependencyResult || []),
      ...(contentResult || []),
    ].map(alert => ({
      ...alert,
      riskDetail: fixes[alert.name]?.risk || "No risk description available.",
      fix: fixes[alert.name]?.fix || "No recommended fix available."
    }));

    const summary = {
      status: zapResult.status === "Error" ? "Error" : "Complete",
      totalFindings: alerts.length,
      high: alerts.filter(a => normalizeRisk(a.risk) === "High").length,
      medium: alerts.filter(a => normalizeRisk(a.risk) === "Medium").length,
      low: alerts.filter(a => normalizeRisk(a.risk) === "Low").length,
      informational: alerts.filter(a => normalizeRisk(a.risk) === "Informational").length,
      topIssues: alerts.slice(0, 5),
    };

    const reportsDir = path.join(__dirname, "reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);
    const reportPath = path.join(reportsDir, `report-${reportId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({ siteUrl, summary, alerts }, null, 2));

    await sendReportEmail(email, summary, reportId, siteUrl, tier);
    console.log(`✅ Report email sent to ${email} with status: ${summary.status}`);

    return { summary, alerts };
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
      console.error("❌ Failed to send error report email:", mailErr.message);
    }

    return { summary, alerts: [] };
  }
}

module.exports = { handleScanRequest };
