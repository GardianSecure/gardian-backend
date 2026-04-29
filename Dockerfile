# Base image with Node.js
FROM node:18-slim

# Install dependencies: wget, curl, unzip, etc.
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    firefox-esr \
    && rm -rf /var/lib/apt/lists/*

# Install Geckodriver
RUN wget -q https://github.com/mozilla/geckodriver/releases/download/v0.34.0/geckodriver-v0.34.0-linux64.tar.gz \
    && tar -xzf geckodriver-v0.34.0-linux64.tar.gz -C /usr/local/bin \
    && rm geckodriver-v0.34.0-linux64.tar.gz

# Install OWASP ZAP
RUN wget -q https://github.com/zaproxy/zaproxy/releases/download/v2.16.1/ZAP_2.16.1_Linux.tar.gz \
    && tar -xzf ZAP_2.16.1_Linux.tar.gz -C /opt \
    && rm ZAP_2.16.1_Linux.tar.gz

ENV PATH="/opt/ZAP_2.16.1:/usr/local/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy backend files
COPY package*.json ./
RUN npm install
COPY . .

# Expose ports
EXPOSE 10000 8080

# Start backend (launch.js will spawn ZAP + server.js)
CMD ["node", "launch.js"]
