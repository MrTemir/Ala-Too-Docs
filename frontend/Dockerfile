# syntax=docker/dockerfile:1
# Образ фронтенда AlaToo-Doc (Next.js, режим standalone).

# 1) Зависимости: ставим строго по package-lock.json.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Сборка. NEXT_PUBLIC_* переменные вшиваются в JS на этапе сборки,
#    поэтому адрес API передаётся как build-arg. Пустая строка = тот же домен
#    (запросы идут на /api/..., их проксирует Caddy).
FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Рантайм: только собранный standalone-сервер, без исходников и devDependencies.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
