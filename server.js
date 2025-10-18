const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { runZapScan } = require('./zapScan');
const { sendReportEmail } = require('./mailer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const submissions = [];

app.post('/submit', async (req, res) => {
  const { siteUrl, email, consentGiven } = req.body;

  if (!siteUrl || !email || !consentGiven) {
    return res.status(400).json({ error: 'Missing required fields or consent not given.' });
  }

  const submission = {
    id: uuidv4(),
    siteUrl,
    email,
    consentGiven,
    timestamp: new Date().toISOString()
  };

  submissions.push(submission);
  fs.writeFileSync('submissions.json', JSON.stringify(submissions, null, 2));

  // Trigger ZAP scan
  const findings = await runZapScan(siteUrl);

  // Save report
  const reportPath = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath);
  fs.writeFileSync(`${reportPath}/report-${submission.id}.json`, JSON.stringify(findings, null, 2));
  // Send email with report summary
  await sendReportEmail(email, {
  totalFindings: findings.length,
  high: findings.filter(f => f.risk === 'High').length,
  medium: findings.filter(f => f.risk === 'Medium').length,
  low: findings.filter(f => f.risk === 'Low').length,
  topIssues: findings.slice(0, 3)
}, submission.id);

  // Respond with summary
  res.json({
    message: 'Scan complete.',
    id: submission.id,
    summary: {
      totalFindings: findings.length,
      high: findings.filter(f => f.risk === 'High').length,
      medium: findings.filter(f => f.risk === 'Medium').length,
      low: findings.filter(f => f.risk === 'Low').length
    },
    topIssues: findings.slice(0, 3)
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gardian backend running on port ${PORT}`);
});
