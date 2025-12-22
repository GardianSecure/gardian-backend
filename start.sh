#!/bin/bash
set -e

echo "🚀 Launching ZAP daemon..."
/opt/zap/zap.sh -daemon \
  -port 8080 \
  -host 0.0.0.0 \
  -config api.key=gardian123 \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true &

sleep 45

echo "🚀 Launching backend..."
node /app/server.js
