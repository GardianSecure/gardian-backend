# Dockerfile for GardianX backend
FROM node:18-slim

# Install basic tools
RUN apt-get update && apt-get install -y wget curl unzip \
    && rm -rf /var/lib/apt/lists/*

# Install OWASP ZAP
RUN wget -q https://github.com/zaproxy/zaproxy/releases/download/v2.16.1/ZAP_2.16.1_Linux.tar.gz \
    && tar -xzf ZAP_2.16.1_Linux.tar.gz -C /opt \
    && mv /opt/ZAP_2.16.1 /opt/zap \
    && rm ZAP_2.16.1_Linux.tar.gz

ENV PATH="/opt/zap:${PATH}"

# Set working directory
WORKDIR /app

# Install backend dependencies
COPY package*.json ./
RUN npm install

# Copy backend code
COPY . .

# Expose backend + ZAP ports
EXPOSE 10000 8080

# Start backend (launch.js will spawn ZAP)
CMD ["node", "launch.js"]
