const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const { runZapScan } = require("./zapScan");
const sendReportEmail = require("./mailer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Store submissions in memory
const submissions = [];

// Utility: run ZAP with timeout safeguard
async function runZapWithTimeout(siteUrl) {
  const timeoutMs = process.env.ZAP_TIMEOUT_MS
    ? parseInt(process.env.ZAP_TIMEOUT_MS, 10)
    : 60000; // default 60s

  return Promise.race([
    runZapScan(siteUrl),
    new Promise((resolve) =>
      setTimeout(() => {
        console.warn(`⚠️ ZAP scan timed out after ${timeoutMs}ms`);
        resolve([{ risk: "Timeout", issue: `ZAP scan exceeded ${timeoutMs}ms limit` }]);
      }, timeoutMs)
    ),
  ]);
}

// Scan endpoint
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

  // Persist submissions
  try {
    fs.writeFileSync("submissions.json", JSON.stringify(submissions, null, 2));
  } catch (fsErr) {
    console.error("❌ Failed to write submissions.json:", fsErr);
  }

  // Run ZAP scan with safe fallback
  let findings;
  try {
    findings = await runZapWithTimeout(siteUrl);
  } catch (zapErr) {
    console.error("❌ Internal ZAP error:", zapErr.message);
    findings = [{ risk: "Info", issue: "Scan could not complete, please try again later." }];
  }

  // Save report
  try {
    const reportPath = path.join(__dirname, "reports");
    if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath);
    fs.writeFileSync(
      path.join(reportPath, `report-${submission.id}.json`),
      JSON.stringify(findings, null, 2)
    );
  } catch (fsErr) {
    console.error("❌ Failed to write report file:", fsErr);
  }

  // Send email
  try {
    await sendReportEmail(
      email,
      {
        totalFindings: findings.length,
        high: findings.filter((f) => f.risk === "High").length,
        medium: findings.filter((f) => f.risk === "Medium").length,
        low: findings.filter((f) => f.risk === "Low").length,
        topIssues: findings.slice(0, 3),
      },
      submission.id,
      siteUrl
    );
  } catch (mailErr) {
    console.error("❌ Failed to send email:", mailErr);
  }

  // Return clean response
  res.json({
    message: "Scan complete.",
    id: submission.id,
    summary: {
      totalFindings: findings.length,
      high: findings.filter((f) => f.risk === "High").length,
      medium: findings.filter((f) => f.risk === "Medium").length,
      low: findings.filter((f) => f.risk === "Low").length,
    },
    topIssues: findings.slice(0, 3),
    status: findings.some(
      (f) => f.risk === "Info" && f.issue.includes("could not complete")
    )
      ? "partial"
      : findings.some((f) => f.risk === "Timeout")
      ? "timeout"
      : "completed",
  });
});

// Catch-all route
app.use((req, res) => {
  res.status(404).send("❌ Route not found");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ GardianX backend running on port ${PORT}`);
});
