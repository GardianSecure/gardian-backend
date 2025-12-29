// launch.js
const { spawn, exec } = require("child_process");

console.log("🚀 Launching backend on Render-assigned port:", process.env.PORT);

// Start backend
spawn("node", ["server.js"], { stdio: "inherit" });

setTimeout(() => {
  console.log("🔍 Curling /health on port", process.env.PORT);
  exec(`curl -s http://localhost:${process.env.PORT}/health`, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Health check failed");
    } else {
      console.log("✅ Health check passed");
    }
  });

  console.log("🚀 Launching ZAP daemon on port 8080...");
  spawn("/opt/zap/zap.sh", [
    "-daemon",
    "-port", "8080",
    "-host", "0.0.0.0",
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",

    // 🚀 Disable auto-update completely
    "-config", "addon.autoupdate.onStart=false",
    "-config", "addon.autoupdate.downloadNewVersions=false",
    "-config", "addon.autoupdate.checkOnStart=false",

    // 🚀 Disable Selenium/browser integration (no Firefox errors)
    "-config", "selenium.enabled=false"
  ], { stdio: "inherit" });

  // Keep launch.js alive so Render doesn't kill it
  setInterval(() => {}, 1000);
}, 15000); // wait 15s before health check
