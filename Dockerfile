# syntax=docker/dockerfile:1

# Node 22 everywhere: @sparticuz/chromium-min requires ^22.17.0 || >=24.0.0
# (it's only dynamically imported when VERCEL is set, but npm ci still
# installs it, so the engine needs to line up for a clean install).
ARG NODE_IMAGE=node:22-bookworm-slim

# ---- deps -------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ------------------------------------------------------------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so
# they must be supplied as build args, not just runtime env vars.
ARG NEXT_PUBLIC_PRESENTATION_API_URL
ENV NEXT_PUBLIC_PRESENTATION_API_URL=${NEXT_PUBLIC_PRESENTATION_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- runner ---------------------------------------------------------------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# launchLocalBrowser() (lib/launch-browser.ts) tries a system Chrome channel
# first, then falls back to Playwright's own bundled Chromium — install the
# bundled browser plus its OS deps so PDF export works without a system Chrome.
# Fixed path (not the default $HOME/.cache) so it survives the USER switch below.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY --from=builder /app/node_modules/playwright-core ./node_modules/playwright-core
RUN node ./node_modules/playwright-core/cli.js install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs \
    && chown -R nextjs:nodejs /ms-playwright

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
