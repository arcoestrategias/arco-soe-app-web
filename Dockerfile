# --- deps ---
FROM node:22-alpine AS deps
WORKDIR /app
# Recomendado para binarios nativos (sharp/libvips)
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci --omit=dev

# --- builder ---
FROM node:22-alpine AS builder
WORKDIR /app
# Paquetes de build (si tu app usa sharp u otros nativos)
RUN apk add --no-cache python3 make g++ pkgconfig libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runner ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# En Alpine usa adduser/addgroup (no existe useradd)
RUN addgroup -S nextjs && adduser -S -G nextjs nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
