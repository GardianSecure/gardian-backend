// zapClient.js
const fetch = require("node-fetch");
const { waitForZapReady } = require("./zapClientUtils"); // renamed helper for clarity

const zapHost = process.env.ZAP_HOST || "127.0.0.1";
const zapPort = process.env.ZAP_PORT || 8080;
const ZAP_API_BASE = `http://${zapHost}:${zapPort}`;
const apiKey = process.env.ZAP_API_KEY || "gardian123";

async function runZapScan(targetUrl) {
  try {
    // Wait until ZAP API is responsive
    await waitForZapReady(ZAP_API_BASE, apiKey);

    // 1) Spider scan
    const spiderStart = await fetch(
      `${ZAP_API_BASE}/JSON/spider/action/scan/?url=${encodeURIComponent(targetUrl)}&apikey=${apiKey}`
    );
    const spiderJson = await spiderStart.json();
    if (!spiderJson.scan) throw new Error(`Spider failed: ${JSON.stringify(spiderJson)}`);
    const spiderId = spiderJson.scan;

    let spiderProgress = 0;
    const spiderTimeout = Date.now() + 10 * 60 * 1000;
    while (spiderProgress < 100 && Date.now() < spiderTimeout) {
      const res = await fetch(`${ZAP_API_BASE}/JSON/spider/view/status/?scanId=${spiderId}&apikey=${apiKey}`);
      const { status } = await res.json();
      spiderProgress = Number(status);
      console.log(`⏳ Spider progress: ${spiderProgress}%`);
      await new Promise(r => setTimeout(r, 3000));
    }
    console.log("✅ Spider completed");

    // 2) Active scan
    const ascanStart = await fetch(
      `${ZAP_API_BASE}/JSON/ascan/action/scan/?url=${encodeURIComponent(targetUrl)}&apikey=${apiKey}`
    );
    const ascanJson = await ascanStart.json();
    if (!ascanJson.scan) throw new Error(`Active scan failed: ${JSON.stringify(ascanJson)}`);
    const ascanId = ascanJson.scan;

    let ascanProgress = 0;
    const ascanTimeout = Date.now() + 10 * 60 * 1000;
    while (ascanProgress < 100 && Date.now() < ascanTimeout) {
      const res = await fetch(`${ZAP_API_BASE}/JSON/ascan/view/status/?scanId=${ascanId}&apikey=${apiKey}`);
      const { status } = await res.json();
      ascanProgress = Number(status);
      console.log(`⏳ Active scan progress: ${ascanProgress}%`);
      await new Promise(r => setTimeout(r, 5000));
    }
    console.log("✅ Active scan completed");

    // 3) Alerts
    const normalizedUrl = targetUrl.endsWith("/") ? targetUrl : targetUrl + "/";
    const alertsRes = await fetch(
      `${ZAP_API_BASE}/JSON/alert/view/alerts/?baseurl=${encodeURIComponent(normalizedUrl)}&apikey=${apiKey}`
    );
    const alertsJson = await alertsRes.json();
    const alerts = alertsJson.alerts || [];
    console.log(`✅ Retrieved ${alerts.length} alerts`);

    return {
      tool: "ZAP",
      status: "Success",
      alerts
    };
  } catch (err) {
    console.error("❌ ZAP scan error:", err.message);
    return {
      tool: "ZAP",
      status: "Error",
      alerts: []
    };
  }
}

module.exports = runZapScan;
