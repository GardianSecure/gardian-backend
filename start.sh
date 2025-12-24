#!/bin/bash
set -e

echo "🚀 Launching ZAP daemon on port 8080..."
/opt/zap/zap.sh -daemon \
  -port 8080 \
  -host 0.0.0.0 \
  -config api.key=gardian123 \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true &

# Give ZAP enough time to boot
sleep 10

echo "🚀 Launching backend on Render-assigned port $PORT..."
node server.js
