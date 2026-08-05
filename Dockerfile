# Multi-stage build for the MigraineAAT-KG UI.
# Stage 1 builds the Next.js static export (ui/dist); stage 2 serves it with nginx.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# next.config.mjs uses output:'export' with distDir:'dist' -> writes to /app/dist
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80