// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const runZapScan = require("./zapScan");
const sendReportEmail = require("./mailer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/health", (req, res) => res.status(200).send("OK"));

const submissions = [];

// Normalize risk values for consistent counting
function normalizeRisk(risk) {
  if (!risk) return "Informational";
  const r = risk.toLowerCase();
  if (r === "high") return "High";
  if (r === "medium") return "Medium";
  if (r === "low") return "Low";
  return "Informational";
}

// Run ZAP with timeout safeguard
async function runZapWithTimeout(siteUrl) {
  const timeoutMs = process.env.ZAP_TIMEOUT_MS
    ? parseInt(process.env.ZAP_TIMEOUT_MS, 10)
    : 900000; // default 15 minutes

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), timeoutMs)
  );

  return Promise.race([runZapScan(siteUrl), timeoutPromise]);
}

app.post("/scan", async (req, res) => {
  const { siteUrl, email, consentGiven } = req.body;
  console.log("📩 Incoming scan request:", req.body);

  if (!siteUrl || !email || !consentGiven) {
    return res.status(400).json({ error: "Missing required fields or consent not given." });
  }

  const submission = {
    id: uuidv4(),
    siteUrl,
    email,
    consentGiven,
    timestamp: new Date().toISOString(),
  };
  submissions.push(submission);

  try {
    fs.writeFileSync("submissions.json", JSON.stringify(submissions, null, 2));
  } catch (err) {
    console.error("❌ Failed to write submissions.json:", err);
  }

  let result;
  try {
    result = await runZapWithTimeout(siteUrl);
  } catch (err) {
    if (err.message === "Timeout") {
      console.warn(`⚠️ ZAP scan timed out after ${process.env.ZAP_TIMEOUT_MS || "15 minutes"}`);
      result = { status: "Timeout", alerts: [] };
    } else {
      console.error("❌ Internal ZAP error:", err.message);
      result = { status: "Error", alerts: [] };
    }
  }

  const findings = result.alerts || [];
  try {
    const reportPath = path.join(__dirname, "reports");
    if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath);
    fs.writeFileSync(
      path.join(reportPath, `report-${submission.id}.json`),
      JSON.stringify(result, null, 2)
    );
  } catch (err) {
    console.error("❌ Failed to write report file:", err);
  }

  const summary = {
    status: result.status,
    totalFindings: findings.length,
    high: findings.filter(f => normalizeRisk(f.risk) === "High").length,
    medium: findings.filter(f => normalizeRisk(f.risk) === "Medium").length,
    low: findings.filter(f => normalizeRisk(f.risk) === "Low").length,
    informational: findings.filter(f => normalizeRisk(f.risk) === "Informational").length,
    topIssues: findings.slice(0, 3),
  };

  try {
    await sendReportEmail(email, summary, submission.id, siteUrl);
    console.log(`✅ Report email sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err);
  }

  res.json({ message: "Scan complete.", id: submission.id, summary });
});

app.use((req, res) => res.status(404).send("❌ Route not found"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ GardianX backend running on port ${PORT}`);
});
