// launch.js
const { spawn } = require("child_process");

const appPort = process.env.PORT || 10000;
const zapPort = process.env.ZAP_PORT || "8080";

console.log("🚀 Starting backend on port:", appPort);
spawn("node", ["server.js"], { stdio: "inherit" });

setTimeout(() => {
  console.log(`🚀 Launching ZAP daemon on port ${zapPort}...`);

  const args = [
    "-daemon",
    "-host", "0.0.0.0",
    "-port", zapPort,
    "-config", "api.disablekey=false",
    "-config", "api.key=gardian123",
    "-config", "api.addrs.addr.name=.*",
    "-config", "api.addrs.addr.regex=true",
    // Disable ALL auto-update and add-on installs
    "-config", "autoupdate.checkOnStart=false",
    "-config", "autoupdate.downloadNewRelease=false",
    "-config", "autoupdate.installAddonUpdates=false",
    "-config", "autoupdate.installScannerRules=false",
    "-config", "autoupdate.installOptionalAddOns=false",
    "-config", "autoupdate.installBetaAddOns=false",
    // Uninstall noisy add-ons that cause Firefox/OAST errors
    "-addonuninstall", "selenium",
    "-addonuninstall", "client",
    "-addonuninstall", "oast",
    "-addonuninstall", "callhome"
  ];

  console.log("🛠️ ZAP spawn args:", args.join(" "));
  spawn("/opt/zap/zap.sh", args, { stdio: "inherit" });
  console.log("✅ ZAP spawn command executed");

  // keep process alive
  setInterval(() => {}, 1000);
}, 20000); // give ZAP 20s head start
