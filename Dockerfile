FROM node:18-alpine

RUN apk add --no-cache openssl3

RUN apk add --no-cache \
    openssl3 \
    curl \
    net-tools \
    iproute2 \
    bind-tools \
    procps \
    sudo

WORKDIR /app

COPY . .

RUN npm install --legacy-peer-deps

RUN mkdir -p /app/public/uploads

RUN npm run build

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "start"]
