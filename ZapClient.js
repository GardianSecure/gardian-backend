// runZapScan.js
const fetch = require('node-fetch');
const { ZAP_API_BASE, waitForZapReady } = require('./zapClient');

async function runZapScan(targetUrl, apiKey = process.env.ZAP_API_KEY) {
  await waitForZapReady();

  // 1) Open/Access the target URL (spider helps discover links)
  const spiderStart = await fetch(`${ZAP_API_BASE}/JSON/spider/action/scan/?url=${encodeURIComponent(targetUrl)}&apikey=${apiKey}`);
  const spiderJson = await spiderStart.json();
  const spiderId = spiderJson.scan;

  // 2) Poll spider progress
  let spiderProgress = 0;
  while (spiderProgress < 100) {
    const res = await fetch(`${ZAP_API_BASE}/JSON/spider/view/status/?scanId=${spiderId}&apikey=${apiKey}`);
    const { status } = await res.json();
    spiderProgress = Number(status);
    await new Promise(r => setTimeout(r, 1000));
  }

  // 3) Start active scan
  const ascanStart = await fetch(`${ZAP_API_BASE}/JSON/ascan/action/scan/?url=${encodeURIComponent(targetUrl)}&apikey=${apiKey}`);
  const ascanJson = await ascanStart.json();
  const ascanId = ascanJson.scan;

  // 4) Poll active scan progress
  let ascanProgress = 0;
  while (ascanProgress < 100) {
    const res = await fetch(`${ZAP_API_BASE}/JSON/ascan/view/status/?scanId=${ascanId}&apikey=${apiKey}`);
    const { status } = await res.json();
    ascanProgress = Number(status);
    await new Promise(r => setTimeout(r, 2000));
  }

  // 5) Get alerts
  const alertsRes = await fetch(`${ZAP_API_BASE}/JSON/alert/view/alerts/?baseurl=${encodeURIComponent(targetUrl)}&apikey=${apiKey}`);
  const alertsJson = await alertsRes.json();
  return alertsJson.alerts || [];
}

module.exports = runZapScan;
