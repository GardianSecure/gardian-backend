// launch.js
const { spawn } = require("child_process");

console.log("🚀 Launching backend on Render-assigned port:", process.env.PORT);

// Start backend
spawn("node", ["server.js"], { stdio: "inherit" });

setTimeout(() => {
  console.log("🚀 Launching ZAP daemon on port 8080...");
  spawn("/opt/zap/zap.sh", [
    "-daemon",
    "-host", "0.0.0.0",
    "-port", "8080",
    "-config", "server.port=8080",
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",
    "-config", "selenium.enabled=false",   // disable Firefox/Selenium
    "-config", "autoupdate.optionCheckOnStart=false",
    "-config", "autoupdate.optionDownloadNewRelease=false",
    "-config", "autoupdate.optionInstallNewExtensions=false",
    "-config", "autoupdate.optionInstallScannerRules=false",
  ], { stdio: "inherit" });

  setInterval(() => {}, 1000); // keep alive
}, 15000);
