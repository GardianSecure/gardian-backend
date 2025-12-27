#!/bin/bash

echo "🚀 Launching ZAP daemon on port 8080..."
/opt/zap/zap.sh -daemon \
  -port 8080 \
  -host 0.0.0.0 \
  -config api.key=gardian123 \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true &

# Wait for ZAP to be ready before starting backend
echo "⏳ Waiting for ZAP daemon to be ready..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8080/JSON/core/view/version/?apikey=gardian123 | grep -q "version"; then
    echo "✅ ZAP daemon is ready"
    break
  fi
  echo "… attempt $i/30"
  sleep 5
done

echo "🚀 Launching backend on Render-assigned port $PORT..."
node server.js &

# Health check
sleep 5
echo "🔍 Curling /health on port $PORT..."
if ! curl -s http://localhost:$PORT/health; then
  echo "❌ Health check failed"
else
  echo "✅ Health check passed"
fi

wait
