# ── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# cache dependencies first
COPY package.json package-lock.json* ./
RUN npm ci

# copy source & build production bundle
COPY index.html tsconfig*.json vite.config.ts eslint.config.js ./
COPY src ./src
COPY public ./public

# Set backend API URL for production build
ENV VITE_API_URL=/api

RUN npm run build

# ── Stage 2: Serve with nginx ──────────────────────────────
FROM nginx:1.27-alpine

# remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
