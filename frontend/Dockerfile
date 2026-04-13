# =============================================
# Stage 1: Build React app
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# =============================================
# Stage 2: Serve with Nginx
# =============================================
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK NONE

CMD ["nginx", "-g", "daemon off;"]
