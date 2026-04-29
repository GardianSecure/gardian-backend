# Dockerfile for GardianX backend
FROM node:18-slim

# Install Java 17 + tools
RUN apt-get update && apt-get install -y wget curl unzip openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*

# Install OWASP ZAP
RUN wget -q https://github.com/zaproxy/zaproxy/releases/download/v2.16.1/ZAP_2.16.1_Linux.tar.gz \
    && tar -xzf ZAP_2.16.1_Linux.tar.gz -C /opt \
    && mv /opt/ZAP_2.16.1 /opt/zap \
    && rm ZAP_2.16.1_Linux.tar.gz

ENV PATH="/opt/zap:${PATH}"

# Remove unwanted add-ons directly from ZAP install dir
RUN rm -rf /opt/zap/plugin/selenium* \
           /opt/zap/plugin/client* \
           /opt/zap/plugin/oast* \
           /opt/zap/plugin/callhome*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 10000 8080
CMD ["node", "launch.js"]

