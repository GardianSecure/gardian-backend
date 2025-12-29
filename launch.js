// launch.js
const { spawn } = require("child_process");

console.log("🚀 Launching backend on Render-assigned port:", process.env.PORT);

// 1) Start backend immediately
spawn("node", ["server.js"], { stdio: "inherit" });

// 2) Start ZAP after a short delay (avoid port thrash during boot)
setTimeout(() => {
  console.log("🚀 Launching ZAP daemon on port 8080...");
  spawn("/opt/zap/zap.sh", [
    "-daemon",
    "-port", "8080",
    "-host", "0.0.0.0",

    // API open for localhost calls with your key
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",

    // 🚫 Disable auto-update (prevents runtime add-on installs delaying readiness)
    "-config", "addon.autoupdate.onStart=false",
    "-config", "addon.autoupdate.downloadNewVersions=false",
    "-config", "addon.autoupdate.checkOnStart=false",

    // 🚫 Disable Selenium/browser bits (no Firefox noise in headless server)
    "-config", "selenium.enabled=false"
  ], { stdio: "inherit" });

  // Keep this process alive (important on Render/hosting)
  setInterval(() => {}, 1000);
}, 15000);
