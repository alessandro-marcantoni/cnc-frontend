FROM oven/bun:1 AS builder
WORKDIR /app

# Install deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
# adjust if your build script is different
RUN bun run build

# ... builder stage same as before ...

FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy built static files (dist/ for Vite, adjust if needed)
COPY --from=builder /app/dist ./

COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
