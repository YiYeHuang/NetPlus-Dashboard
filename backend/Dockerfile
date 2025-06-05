# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies for macOS network monitoring
RUN apk add --no-cache \
    curl \
    net-tools \
    iproute2 \
    bind-tools \
    tcpdump \
    iperf3 \
    mtr \
    nmap

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8080
CMD ["npm", "start"]
