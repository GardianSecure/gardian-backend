// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const { runZapScan } = require("./zapScan");   // ZAP integration
const sendReportEmail = require("./mailer");   // Email integration

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Gardian backend is live.");
});

// Store submissions in memory (and file for persistence)
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

// Submission endpoint
app.post("/submit", async (req, res) => {
  try {
    console.log("✅ Received POST /submit", req.body);

    const { siteUrl, email, consentGiven } = req.body;
    if (!siteUrl || !email || !consentGiven) {
      console.warn("⚠️ Missing required fields:", { siteUrl, email, consentGiven });
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
    } catch (fsErr) {
      console.error("❌ Failed to write submissions.json:", fsErr);
    }

    // 🔍 Run ZAP scan
    let findings = [];
    try {
      console.log("🔍 Running ZAP scan...");
      findings = await runZapWithTimeout(siteUrl);
      console.log("✅ ZAP scan finished:", findings);
    } catch (zapErr) {
      console.error("❌ ZAP scan failed:", zapErr);
      findings = [{ risk: "Error", issue: "ZAP scan failed: " + zapErr.message }];
    }

    // 💾 Save report safely
    try {
      const reportPath = path.join(__dirname, "reports");
      if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath);
      fs.writeFileSync(
        `${reportPath}/report-${submission.id}.json`,
        JSON.stringify(findings, null, 2)
      );
    } catch (fsErr) {
      console.error("❌ Failed to write report file:", fsErr);
    }

    // 📩 Send email with safe error handling
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
        submission.id
      );
      console.log("✅ Email sent successfully");
    } catch (mailErr) {
      console.error("❌ Failed to send email:", mailErr);
    }

    // ✅ Respond with summary
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
    });
  } catch (error) {
    console.error("❌ Error in /submit:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Catch-all route
app.use((req, res) => {
  res.status(404).send("❌ Route not found");
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gardian backend running on port ${PORT}`);
});

