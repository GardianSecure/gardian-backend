// launch.js
const { spawn } = require("child_process");

console.log("🚀 Launching backend on Render-assigned port:", process.env.PORT);

// Start backend immediately so Render health checks pass
spawn("node", ["server.js"], { stdio: "inherit" });

// Delay ZAP start so backend is already listening
setTimeout(() => {
  const zapPort = process.env.PORT || "8080";
  console.log(`🚀 Launching ZAP daemon on Render-assigned port ${zapPort}...`);

  spawn("/opt/zap/zap.sh", [
    "-daemon",
    "-host", "0.0.0.0",

    // Force ZAP to bind to Render-assigned port
    "-port", zapPort,
    "-config", `server.port=${zapPort}`,
    "-config", `proxy.port=${zapPort}`,
    "-config", `network.localServers.port=${zapPort}`,

    // API config
    "-config", "api.disablekey=false",
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",

    // Disable Selenium/browser integration
    "-config", "selenium.enabled=false",

    // Disable client integration (prevents Firefox errors)
    "-config", "addon.client.disabled=true",

    // Disable ALL auto-update behaviours
    "-config", "autoupdate.optionCheckOnStart=false",
    "-config", "autoupdate.optionDownloadNewRelease=false",
    "-config", "autoupdate.optionInstallNewExtensions=false",
    "-config", "autoupdate.optionInstallScannerRules=false",
    "-config", "autoupdate.optionInstallOptionalAddOns=false",
    "-config", "autoupdate.optionInstallBetaAddOns=false",
  ], { stdio: "inherit" });

  // Keep process alive
  setInterval(() => {}, 1000);
}, 15000);
