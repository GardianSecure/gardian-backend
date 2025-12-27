#!/bin/bash

echo "🚀 Launching backend on Render-assigned port $PORT..."
node server.js &

echo "🚀 Launching ZAP daemon on port 8080..."
/opt/zap/zap.sh -daemon \
  -port 8080 \
  -host 0.0.0.0 \
  -config api.key=gardian123 \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true &

# Give backend time to start
sleep 5

echo "🔍 Curling /health on port $PORT..."
if ! curl -s http://localhost:$PORT/health; then
  echo "❌ Health check failed"
else
  echo "✅ Health check passed"
fi

# Keep container alive
wait
