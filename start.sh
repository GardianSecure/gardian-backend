#!/bin/bash
set -e

echo "🚀 Launching ZAP daemon..."
zap.sh -daemon -port 8080 -host 0.0.0.0 -config api.disablekey=true &

# Give ZAP enough time to boot
sleep 45

echo "🚀 Launching backend..."
node server.js

