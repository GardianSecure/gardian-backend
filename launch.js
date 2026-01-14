// launch.js
const { spawn } = require("child_process");

const appPort = process.env.PORT;
const zapPort = process.env.ZAP_PORT || "8080";

console.log("🚀 Starting backend on port:", appPort);
spawn("node", ["server.js"], { stdio: "inherit" });

setTimeout(() => {
  console.log(`🚀 Launching ZAP daemon on port ${zapPort} (separate from backend ${appPort})...`);

  const args = [
    "-daemon",
    "-host", "0.0.0.0",
    "-port", zapPort,
    "-config", "api.disablekey=false",
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",
    "-config", "autoupdate.optionCheckOnStart=false",
    "-config", "autoupdate.optionDownloadNewRelease=false",
    "-config", "autoupdate.optionInstallNewExtensions=false",
    "-config", "autoupdate.optionInstallScannerRules=false",
    "-config", "autoupdate.optionInstallOptionalAddOns=false",
    "-config", "autoupdate.optionInstallBetaAddOns=false",
    // Uninstall noisy add-ons
    "-addonuninstall", "selenium",
    "-addonuninstall", "client",
    "-addonuninstall", "oast",
    "-addonuninstall", "callhome"
  ];

  spawn("/opt/zap/zap.sh", args, { stdio: "inherit" });
  console.log("✅ ZAP spawn command executed");

  setInterval(() => {}, 1000);
}, 15000);
