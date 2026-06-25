FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
ARG COMMIT_SHA=unknown
ARG SENTRY_AUTH_TOKEN=
ENV NEXT_PUBLIC_COMMIT_SHA=$COMMIT_SHA
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx next telemetry disable
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy node_modules whole — the custom server.ts uses modules (socket.io,
# its adapters, etc.) that Next.js standalone output doesn't trace.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/dist/server.js ./server.js
RUN mkdir -p public/uploads && chown nextjs:nodejs public/uploads
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
