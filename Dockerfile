# ===== Étape 1 : build du bundle Vite =====
FROM node:20-alpine AS build
WORKDIR /app

# Installe les dépendances de façon reproductible (respecte package-lock.json).
COPY package*.json ./
RUN npm ci

# Copie le reste des sources et génère dist/.
COPY . .
RUN npm run build

# ===== Étape 2 : image finale, statique servie par nginx =====
FROM nginx:alpine

# Config nginx adaptée à une Single Page Application (fallback index.html).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Bundle statique produit à l'étape build.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
