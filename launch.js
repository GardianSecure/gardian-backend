// launch.js
const { spawn } = require("child_process");

console.log("🚀 Launching backend on Render-assigned port:", process.env.PORT);

// Start backend immediately so Render health checks pass
spawn("node", ["server.js"], { stdio: "inherit" });

// Delay ZAP start so backend is already listening
setTimeout(() => {
  console.log("🚀 Launching ZAP daemon on fixed port 8080...");
  spawn("/opt/zap/zap.sh", [
    "-daemon",
    "-host", "0.0.0.0",

    // Force ZAP to bind to 8080 (double lock)
    "-port", "8080",
    "-config", "server.port=8080",
    "-config", "proxy.port=8080",

    // API config
    "-config", "api.disablekey=false",
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",

    // Disable Selenium/browser integration (no Firefox errors)
    "-config", "selenium.enabled=false",

    // Disable ALL auto-update behaviours (prevent add-on installs at startup)
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
