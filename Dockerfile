#Dockerfile
# Base: Node.js for backend
FROM node:18-slim

# Install Java 17 + tools + ZAP + extra scanners (Nikto removed)
RUN apt-get update && apt-get install -y \
    wget tar curl openjdk-17-jre-headless \
    nmap openssl python3 python3-pip \
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

# Create reports directory (persistent volume mount recommended)
RUN mkdir -p /app/reports

# Expose backend port (Render injects $PORT at runtime)
EXPOSE 10000
# Expose ZAP API port
EXPOSE 8080

# Healthcheck for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:10000/health || exit 1

# Start backend (launch.js will spawn ZAP)
CMD ["node", "launch.js"]
