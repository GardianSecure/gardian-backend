// server.js
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { handleScanRequest } = require("./scanHandler");

const app = express();

// ✅ Enable CORS for your Netlify frontend
app.use(cors({
  origin: "https://gardian.netlify.app",   // allow requests from your frontend
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

const submissionsFile = path.join(__dirname, "submissions.json");

// Utility: load submissions
function loadSubmissions() {
  if (!fs.existsSync(submissionsFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(submissionsFile, "utf8"));
  } catch (err) {
    console.error("❌ Failed to parse submissions file:", err.message);
    return [];
  }
}

// Utility: save submissions
function saveSubmissions(submissions) {
  try {
    fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
  } catch (err) {
    console.error("❌ Failed to save submissions:", err.message);
  }
}

// --- Routes ---

// Healthcheck (for Docker/Render monitoring)
app.get("/health", (req, res) => {
  res.send("OK");
});

// Scan request
app.post("/scan", async (req, res) => {
  const { email, siteUrl, tier } = req.body;
  if (!email || !siteUrl) return res.status(400).json({ error: "Missing email or siteUrl" });

  const submissions = loadSubmissions();
  const submission = { id: Date.now().toString(), email, siteUrl, tier, status: "Pending", timestamp: new Date().toISOString() };
  submissions.push(submission);
  saveSubmissions(submissions);

  try {
    const { summary, alerts } = await handleScanRequest({ email, siteUrl, tier });
    submission.status = summary.status;
    submission.summary = summary;
    saveSubmissions(submissions);
    res.json({ message: "Scan complete", id: submission.id, summary, alerts });
  } catch (err) {
    submission.status = "Error";
    saveSubmissions(submissions);
    res.status(500).json({ error: "Scan failed", details: err.message });
  }
});

// List submissions (frontend dashboard will call this)
app.get("/api/submissions", (req, res) => {
  res.json(loadSubmissions());
});

// Fetch report by ID
app.get("/reports/:id", (req, res) => {
  const reportPath = path.join(__dirname, "reports", `report-${req.params.id}.json`);
  if (!fs.existsSync(reportPath)) {
    return res.status(404).json({ error: "Report not found" });
  }
  res.sendFile(reportPath);
});

// Rescan existing submission
app.post("/rescan/:id", async (req, res) => {
  const submissions = loadSubmissions();
  const submission = submissions.find(s => s.id === req.params.id);
  if (!submission) {
    return res.status(404).json({ error: "Submission not found" });
  }

  try {
    const { summary, alerts } = await handleScanRequest(submission);
    submission.status = summary.status;
    submission.summary = summary;
    submission.timestamp = new Date().toISOString();
    saveSubmissions(submissions);

    res.json({ message: "Rescan complete", id: submission.id, summary, alerts });
  } catch (err) {
    console.error("❌ Rescan error:", err.message);
    submission.status = "Error";
    saveSubmissions(submissions);
    res.status(500).json({ error: "Rescan failed", details: err.message });
  }
});

// Stats endpoint (for dashboard charts)
app.get("/stats", (req, res) => {
  const submissions = loadSubmissions();
  if (submissions.length === 0) {
    return res.json({ totalScans: 0, averageFindings: 0, riskDistribution: {} });
  }

  let totalFindings = 0;
  let riskCounts = { High: 0, Medium: 0, Low: 0, Informational: 0 };

  submissions.forEach(sub => {
    if (sub.summary) {
      totalFindings += sub.summary.totalFindings || 0;
      riskCounts.High += sub.summary.high || 0;
      riskCounts.Medium += sub.summary.medium || 0;
      riskCounts.Low += sub.summary.low || 0;
      riskCounts.Informational += sub.summary.informational || 0;
    }
  });

  const averageFindings = totalFindings / submissions.length;

  res.json({
    totalScans: submissions.length,
    averageFindings,
    riskDistribution: riskCounts
  });
});

// ✅ Upgrade to Pro
app.post("/upgrade", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const submissions = loadSubmissions();
  let updated = false;

  submissions.forEach(sub => {
    if (sub.email === email) {
      sub.tier = "Pro";
      updated = true;
    }
  });

  if (updated) {
    saveSubmissions(submissions);
    res.json({ message: `✅ User ${email} upgraded to Pro` });
  } else {
    res.status(404).json({ error: "User not found in submissions" });
  }
});

// Start server
const PORT = process.env.PORT || 10000; // ✅ align with Dockerfile
app.listen(PORT, () => {
  console.log(`🚀 GardianX server running on port ${PORT}`);
});
