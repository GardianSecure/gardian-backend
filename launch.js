// launch.js
const { spawn } = require("child_process");

console.log("🚀 Launching backend on Render-assigned port:", process.env.PORT);

// Start backend
spawn("node", ["server.js"], { stdio: "inherit" });

// Delay ZAP start a bit so the backend binds first
setTimeout(() => {
  console.log("🚀 Launching ZAP daemon on port 8080...");
  spawn("/opt/zap/zap.sh", [
    "-daemon",
    "-host", "0.0.0.0",

    // Force ZAP to bind to 8080 (prevent random port)
    "-port", "8080",
    "-config", "server.port=8080",

    // API config
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",

    // Disable Selenium/browser integration
    "-config", "selenium.enabled=false",

    // Correct auto-update disable flags (prevent add-on installs at startup)
    "-config", "autoupdate.optionCheckOnStart=false",
    "-config", "autoupdate.optionDownloadNewRelease=false",
    "-config", "autoupdate.optionInstallNewExtensions=false",
    "-config", "autoupdate.optionInstallScannerRules=false",
  ], { stdio: "inherit" });

  // Keep process alive
  setInterval(() => {}, 1000);
}, 15000);
