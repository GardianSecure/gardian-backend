// launch.js
const { spawn } = require("child_process");

const appPort = process.env.PORT || 10000;
const zapPort = process.env.ZAP_PORT || "8080";

console.log("🚀 Starting GardianX backend on port:", appPort);

// Start backend
const backend = spawn("node", ["server.js"], { stdio: "inherit" });
backend.on("error", err => console.error("❌ Backend failed to start:", err));
backend.on("exit", code => console.warn(`⚠️ Backend exited with code ${code}`));

function launchZap() {
  console.log(`🚀 Launching ZAP daemon on port ${zapPort}...`);

  const args = [
  "-daemon",
  "-host", "0.0.0.0",
  "-port", zapPort,
  "-config", "api.disablekey=true",
  "-config", "api.addrs.addr.name=.*",
  "-config", "api.addrs.addr.regex=true",
  "-config", "connection.timeoutInSecs=120",
  "-config", "autoupdate.checkOnStart=false",
  "-config", "autoupdate.downloadNewRelease=false",
  "-config", "autoupdate.installAddonUpdates=false",
  "-nostdaddons",
  "-addoninstall", "pscanrules",
  "-addoninstall", "ascanrules",
  "-addoninstall", "reports",
  "-addoninstall", "retire",
  "-addonuninstall", "selenium",
  "-addonuninstall", "client",
  "-addonuninstall", "oast"
  // ⚠️ Do NOT uninstall callhome — leave it installed
];



  console.log("🛠️ ZAP spawn args:", args.join(" "));
  const zap = spawn("/opt/zap/zap.sh", args, { stdio: "inherit" });

  zap.on("error", err => console.error("❌ Failed to launch ZAP:", err));
  zap.on("exit", code => console.warn(`⚠️ ZAP exited with code ${code}`));

  console.log("✅ ZAP spawn command executed");
}


// Launch ZAP after backend is up
setTimeout(launchZap, 20000);

// Keep process alive
setInterval(() => {}, 1000);
