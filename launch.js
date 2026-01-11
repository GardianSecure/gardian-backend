// launch.js
const { spawn } = require("child_process");

const appPort = process.env.PORT;               // Render-assigned port for Express
const zapPort = process.env.ZAP_PORT || "8080"; // Dedicated ZAP port (default 8080)

console.log("🚀 Starting backend on port:", appPort);
spawn("node", ["server.js"], { stdio: "inherit" });

// Delay ZAP start so backend is already listening
setTimeout(() => {
  console.log(`🚀 Launching ZAP daemon on port ${zapPort} (separate from backend ${appPort})...`);

  const args = [
    "-daemon",
    "-host", "0.0.0.0",
    "-port", zapPort,

    // API configuration
    "-config", "api.disablekey=false",
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",

    // Disable auto-update behaviours
    "-config", "autoupdate.optionCheckOnStart=false",
    "-config", "autoupdate.optionDownloadNewRelease=false",
    "-config", "autoupdate.optionInstallNewExtensions=false",
    "-config", "autoupdate.optionInstallScannerRules=false",
    "-config", "autoupdate.optionInstallOptionalAddOns=false",
    "-config", "autoupdate.optionInstallBetaAddOns=false",

    // Explicitly uninstall add-ons that cause noisy errors
    "-addonuninstall", "selenium",
    "-addonuninstall", "client",
    "-addonuninstall", "oast",
    "-addonuninstall", "callhome"
  ];

  spawn("/opt/zap/zap.sh", args, { stdio: "inherit" });
  console.log("✅ ZAP spawn command executed");

  // Keep process alive
  setInterval(() => {}, 1000);
}, 15000);
