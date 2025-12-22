# Base: Node.js for backend
FROM node:18-slim

# Install Java 17 + tools + ZAP
RUN apt-get update && apt-get install -y wget tar openjdk-17-jre-headless \
    && wget https://github.com/zaproxy/zaproxy/releases/download/v2.16.1/ZAP_2.16.1_Linux.tar.gz \
    && tar -xzf ZAP_2.16.1_Linux.tar.gz -C /opt \
    && mv /opt/ZAP_2.16.1 /opt/zap \
    && rm ZAP_2.16.1_Linux.tar.gz \
    && chmod +x /opt/zap/zap.sh \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install backend dependencies (cache-friendly)
COPY package*.json ./
RUN npm install --only=production

# Copy the rest of the backend
COPY . .

# Expose ports
EXPOSE 8080
EXPOSE 3000

# Ensure start.sh is executable
RUN chmod +x /app/start.sh

# Default start command
CMD ["bash", "./start.sh"]
