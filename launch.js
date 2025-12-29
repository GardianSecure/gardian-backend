// launch.js
const { spawn } = require("child_process");

console.log("🚀 Launching backend on Render-assigned port:", process.env.PORT);

// 1) Start backend
spawn("node", ["server.js"], { stdio: "inherit" });

// 2) Start ZAP after a short delay
setTimeout(() => {
  console.log("🚀 Launching ZAP daemon on port 8080...");
  spawn("/opt/zap/zap.sh", [
    "-daemon",
    "-port", "8080",
    "-host", "0.0.0.0",

    // API config
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",

    // Disable auto-update (prevents runtime add-on installs)
    "-config", "addon.autoupdate.onStart=false",
    "-config", "addon.autoupdate.downloadNewVersions=false",
    "-config", "addon.autoupdate.checkOnStart=false",

    // Disable Selenium/browser integration
    "-config", "selenium.enabled=false"
  ], { stdio: "inherit" });

  // Keep this process alive (important for hosting platforms)
  setInterval(() => {}, 1000);
}, 15000);
