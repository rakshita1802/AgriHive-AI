# Stage 1: Build static production bundle with Node & Vite
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install --silent

COPY . .
# Run Vite production build (fallback if dist exists)
RUN npm run build || mkdir -p dist

# Stage 2: Serve static production assets with Nginx
FROM nginx:alpine

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY index.html /usr/share/nginx/html/index.html
COPY components /usr/share/nginx/html/components

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
