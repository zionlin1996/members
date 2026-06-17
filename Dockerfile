# ── Build ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# VITE_* vars are inlined into the bundle at build time — pass via CapRover's
# App Config → Build Arguments, not Environment Variables.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN yarn build

# ── Serve ──────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build/client /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
