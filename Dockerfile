# ---------- base ----------
FROM node:22-alpine AS base
WORKDIR /app
# libs para binarios nativos (sharp/libvips) + corepack (pnpm)
RUN apk add --no-cache libc6-compat
RUN corepack enable

# ---------- deps: instala dependencias con pnpm ----------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# instala TODAS las deps (incluye dev para poder compilar Next)
RUN pnpm install --frozen-lockfile

# ---------- builder: compila Next en modo standalone ----------
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Asegura standalone en tu next.config.js:
# module.exports = { output: 'standalone' }
RUN pnpm build

# ---------- runner: imagen final mínima ----------
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV PORT=3000
# usuario no root
RUN addgroup -S nextjs && adduser -S -G nextjs nextjs

# Copiamos sólo lo necesario para correr
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
