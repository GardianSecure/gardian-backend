#!/bin/bash
# Start ZAP in daemon mode
zap.sh -daemon -port 8080 -host 0.0.0.0

#Check if it even starts
echo "ZAP daemon launched"

# Wait a bit for ZAP to initialize
sleep 15

# Start your backend
node server.js

