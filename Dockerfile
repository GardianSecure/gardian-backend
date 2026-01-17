# Base: Node.js for backend
FROM node:18-slim

# Install Java 17 + tools + ZAP
RUN apt-get update && apt-get install -y wget tar openjdk-17-jre-headless curl \
    && wget https://github.com/zaproxy/zaproxy/releases/download/v2.16.1/ZAP_2.16.1_Linux.tar.gz \
    && tar -xzf ZAP_2.16.1_Linux.tar.gz -C /opt \
    && mv /opt/ZAP_2.16.1 /opt/zap \
    && rm ZAP_2.16.1_Linux.tar.gz \
    && chmod +x /opt/zap/zap.sh \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install backend dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend
COPY . .

# Expose backend port (Render injects $PORT at runtime)
EXPOSE 10000
# Expose ZAP API port
EXPOSE 8080

# Start both ZAP daemon and backend
# ZAP runs headless with API enabled, then backend starts
CMD ["/bin/sh", "-c", "/opt/zap/zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true -addonuninstall selenium -addonuninstall client -addonuninstall oast -addonuninstall callhome & sleep 20 && npm start"]
