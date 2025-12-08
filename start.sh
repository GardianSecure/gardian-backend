#!/bin/bash
set -e

echo "🚀 Launching ZAP daemon..."
$ZAP_HOME/zap.sh -daemon -port 8080 -host 0.0.0.0 -config api.disablekey=true &

# Give ZAP time to boot
sleep 40

echo "🚀 Launching backend..."
node server.js
