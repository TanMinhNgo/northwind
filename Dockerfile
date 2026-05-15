# Monolith: Vite frontend + Express API. Build from repo root 

# --- Stage 1: build the SPA (Vite) ---
# Produces static HTML/JS/CSS under dist/ — copied into the final image as ./public.
FROM oven/bun:1.1.45 AS frontend-build
WORKDIR /app/frontend
COPY frontend/ ./
# Empty = browser calls /api on the same host as the page (same domain as Express).
ENV VITE_API_URL=
# Public Clerk key (safe to pass as build-arg; it is embedded in client JS anyway)
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN bun install --frozen-lockfile \
  && bun run build

  # --- Stage 2: compile the API (TypeScript → JavaScript) ---
# Produces dist/ with index.js and the rest of the server bundle.
FROM oven/bun:1.1.45 AS backend-build
WORKDIR /app
COPY backend/ ./
RUN bun install --frozen-lockfile \
  && bun run build

# --- Stage 3: runtime image (only prod deps + built assets) ---
# Express serves API routes and static files from public/ (the Vite build from stage 1).
FROM oven/bun:1.1.45 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/bun.lock ./
RUN bun install --production --frozen-lockfile

COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3001
USER node

CMD ["bun", "dist/index.js"]