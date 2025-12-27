const { exec } = require("child_process");

console.log("🚀 Launching backend on Render-assigned port:", process.env.PORT);

const backend = exec(`node server.js`, (err, stdout, stderr) => {
  if (err) console.error("Backend error:", err);
  if (stdout) console.log("Backend output:", stdout);
  if (stderr) console.error("Backend stderr:", stderr);
});

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
  exec(`/opt/zap/zap.sh -daemon \
    -port 8080 \
    -host 0.0.0.0 \
    -config api.key=gardian123 \
    -config api.addrs.addr.name=.* \
    -config api.addrs.addr.regex=true`, (err, stdout, stderr) => {
    if (err) console.error("ZAP error:", err);
    if (stdout) console.log("ZAP output:", stdout);
    if (stderr) console.error("ZAP stderr:", stderr);
  });
}, 5000);
