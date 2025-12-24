#!/bin/bash
set -e

echo "🚀 Launching ZAP daemon on port $PORT..."
/opt/zap/zap.sh -daemon \
  -port $PORT \
  -host 0.0.0.0 \
  -config api.key=gardian123 \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true &

# Give ZAP enough time to boot
sleep 10

echo "🚀 Launching backend on port $PORT..."
node server.js
