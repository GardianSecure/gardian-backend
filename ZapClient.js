// runZapScan.js
const fetch = require("node-fetch");
const { waitForZapReady } = require("./zapClient");

const zapPort = process.env.PORT || 8080;
const ZAP_API_BASE = `http://127.0.0.1:${zapPort}`;

async function runZapScan(targetUrl, apiKey = process.env.ZAP_API_KEY || "gardian123") {
  await waitForZapReady(ZAP_API_BASE, apiKey);

  // 1) Start spider scan
  const spiderStart = await fetch(
    `${ZAP_API_BASE}/JSON/spider/action/scan/?url=${encodeURIComponent(targetUrl)}&apikey=${apiKey}`
  );
  const spiderJson = await spiderStart.json();
  if (!spiderJson.scan) {
    throw new Error(`Spider failed: ${JSON.stringify(spiderJson)}`);
  }
  const spiderId = spiderJson.scan;

  // 2) Poll spider progress with timeout
  let spiderProgress = 0;
  const spiderTimeout = Date.now() + 5 * 60 * 1000; // 5 minutes
  while (spiderProgress < 100 && Date.now() < spiderTimeout) {
    const res = await fetch(
      `${ZAP_API_BASE}/JSON/spider/view/status/?scanId=${spiderId}&apikey=${apiKey}`
    );
    const { status } = await res.json();
    spiderProgress = Number(status);
    console.log(`⏳ Spider progress: ${spiderProgress}%`);
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log("✅ Spider completed");

  // 3) Start active scan
  const ascanStart = await fetch(
    `${ZAP_API_BASE}/JSON/ascan/action/scan/?url=${encodeURIComponent(targetUrl)}&apikey=${apiKey}`
  );
  const ascanJson = await ascanStart.json();
  if (!ascanJson.scan) {
    throw new Error(`Active scan failed: ${JSON.stringify(ascanJson)}`);
  }
  const ascanId = ascanJson.scan;

  // 4) Poll active scan progress with timeout
  let ascanProgress = 0;
  const ascanTimeout = Date.now() + 10 * 60 * 1000; // 10 minutes
  while (ascanProgress < 100 && Date.now() < ascanTimeout) {
    const res = await fetch(
      `${ZAP_API_BASE}/JSON/ascan/view/status/?scanId=${ascanId}&apikey=${apiKey}`
    );
    const { status } = await res.json();
    ascanProgress = Number(status);
    console.log(`⏳ Active scan progress: ${ascanProgress}%`);
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log("✅ Active scan completed");

  // 5) Get alerts
  const alertsRes = await fetch(
    `${ZAP_API_BASE}/JSON/alert/view/alerts/?baseurl=${encodeURIComponent(targetUrl)}&apikey=${apiKey}`
  );
  const alertsJson = await alertsRes.json();
  const alerts = alertsJson.alerts || [];
  console.log(`✅ Retrieved ${alerts.length} alerts`);
  return alerts;
}

module.exports = runZapScan;
