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

    // 👇 Force ZAP to bind to 8080
    "-port", "8080",
    "-config", "server.port=8080",

    // API config
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",

    // 🚫 Disable auto-update
    "-config", "addon.autoupdate.onStart=false",
    "-config", "addon.autoupdate.downloadNewVersions=false",
    "-config", "addon.autoupdate.checkOnStart=false",

    // 🚫 Disable Selenium/browser integration
    "-config", "selenium.enabled=false"
  ], { stdio: "inherit" });

  // Keep process alive
  setInterval(() => {}, 1000);
}, 15000);
