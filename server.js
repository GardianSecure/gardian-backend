const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const { handleScanRequest } = require("./scanHandler");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/health", (req, res) => res.status(200).send("OK"));

// In-memory submissions list
const submissions = [];

// --- ROUTES ---

// Start a new scan
app.post("/scan", async (req, res) => {
  const { siteUrl, email, consentGiven, tier = "Free" } = req.body;
  console.log("📩 Incoming scan request:", req.body);

  if (!siteUrl || !email || !consentGiven) {
    return res.status(400).json({ error: "Missing required fields or consent not given." });
  }

  const submission = {
    id: uuidv4(),
    siteUrl,
    email,
    consentGiven,
    tier,
    timestamp: new Date().toISOString(),
  };
  submissions.push(submission);

  try {
    fs.writeFileSync("submissions.json", JSON.stringify(submissions, null, 2));
  } catch (err) {
    console.error("❌ Failed to write submissions.json:", err);
  }

  try {
    await handleScanRequest({
      email: submission.email,
      siteUrl: submission.siteUrl,
      tier: submission.tier,
    });

    res.json({ message: "Scan complete.", id: submission.id });
  } catch (err) {
    console.error("❌ Scan failed in handler:", err);
    res.status(500).json({ error: "Scan failed." });
  }
});

// Fetch all submissions
app.get("/submissions", (req, res) => {
  res.json({ submissions });
});

// Fetch a specific report by ID
app.get("/reports/:id", (req, res) => {
  const reportId = req.params.id;
  const reportPath = `reports/report-${reportId}.json`;

  if (!fs.existsSync(reportPath)) {
    return res.status(404).json({ error: "Report not found." });
  }

  try {
    const reportData = fs.readFileSync(reportPath, "utf-8");
    res.json(JSON.parse(reportData));
  } catch (err) {
    console.error("❌ Failed to read report file:", err);
    res.status(500).json({ error: "Failed to read report." });
  }
});

// Rescan an existing submission
app.post("/rescan/:id", async (req, res) => {
  const submission = submissions.find(s => s.id === req.params.id);
  if (!submission) {
    return res.status(404).json({ error: "Submission not found." });
  }

  try {
    await handleScanRequest({
      email: submission.email,
      siteUrl: submission.siteUrl,
      tier: submission.tier,
    });

    res.json({ message: "Rescan complete.", id: submission.id });
  } catch (err) {
    console.error("❌ Rescan failed:", err);
    res.status(500).json({ error: "Rescan failed." });
  }
});

// --- ERROR HANDLING ---
app.use((req, res) => res.status(404).send("❌ Route not found"));

app.use((err, req, res, next) => {
  console.error("❌ Unexpected error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// --- START SERVER ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ GardianX backend running on port ${PORT}`);
});
