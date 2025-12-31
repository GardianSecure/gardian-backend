// launch.js
const { spawn } = require("child_process");

const appPort = process.env.PORT;          // Render-assigned port for Express
const zapPort = process.env.ZAP_PORT || "8081"; // Dedicated ZAP port (separate from Express)

console.log("🚀 Starting backend on port:", appPort);
spawn("node", ["server.js"], { stdio: "inherit" });

// Delay ZAP start so backend is already listening
setTimeout(() => {
  console.log(`🚀 Launching ZAP daemon on port ${zapPort} (separate from backend ${appPort})...`);

  const args = [
    "-daemon",
    "-host", "127.0.0.1",              // keep ZAP local-only
    "-port", zapPort,

    // Bind all related configs to the dedicated ZAP port
    "-config", `server.port=${zapPort}`,
    "-config", `proxy.port=${zapPort}`,
    "-config", `network.localServers.port=${zapPort}`,

    // API config
    "-config", "api.disablekey=false",
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",

    // Hard-disable problematic add-ons
    "-config", "selenium.enabled=false",
    "-config", "addon.client.disabled=true",
    "-config", "addon.oast.disabled=true",
    "-config", "addon.callhome.disabled=true",

    // Disable ALL auto-update behaviours
    "-config", "autoupdate.optionCheckOnStart=false",
    "-config", "autoupdate.optionDownloadNewRelease=false",
    "-config", "autoupdate.optionInstallNewExtensions=false",
    "-config", "autoupdate.optionInstallScannerRules=false",
    "-config", "autoupdate.optionInstallOptionalAddOns=false",
    "-config", "autoupdate.optionInstallBetaAddOns=false",
  ];

  spawn("/opt/zap/zap.sh", args, { stdio: "inherit" });
  console.log("✅ ZAP spawn command executed");

  // Keep process alive
  setInterval(() => {}, 1000);
}, 15000);
