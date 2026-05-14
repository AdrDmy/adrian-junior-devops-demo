# Multi-stage build:
#   1) `deps`  — install only production dependencies
#   2) `final` — distroless runtime, non-root, no shell, smallest blast radius
#
# Why distroless: no package manager, no shell, no busybox — significantly
# reduces what an attacker can do with a foothold inside the container.

# ---------- 1) deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Copy lockfile + manifest first so `npm ci` is cached when only source changes.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- 2) final ----------
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS final
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Copy installed deps and source. Distroless runs as the `nonroot` user (uid 65532).
COPY --from=deps /app/node_modules ./node_modules
COPY server.js ./

# OCI labels make image provenance traceable from the registry alone.
ARG GIT_SHA=unknown
ARG BUILD_DATE=unknown
ARG APP_VERSION=dev
LABEL org.opencontainers.image.title="adrian-junior-devops-demo" \
      org.opencontainers.image.source="https://github.com/AdrDmy/adrian-junior-devops-demo" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.version="${APP_VERSION}"

ENV APP_VERSION=${APP_VERSION}

EXPOSE 3000
USER nonroot
CMD ["server.js"]
