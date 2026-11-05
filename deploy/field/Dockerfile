FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY scripts/field-gateway.mjs scripts/field-gateway.mjs
COPY scripts/lib/gateway-authorize.mjs scripts/lib/gateway-runtime.mjs scripts/lib/realtime-gateway.mjs scripts/lib/maintenance.mjs scripts/lib/notification-delivery.mjs scripts/lib/
USER node
CMD ["node", "scripts/field-gateway.mjs"]
