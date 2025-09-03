# --- 1) Dependencias ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# --- 2) Build ---
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# asegura build standalone
# (si no lo tienes, en next.config.js: module.exports = { output: 'standalone' })
RUN npm run build

# --- 3) Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# usuario no root por seguridad
RUN useradd -m nextjs
# Copiamos el bundle standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
