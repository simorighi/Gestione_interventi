# Progetto: Nordfacility  ·  Team: 1  ·  Data: 18/11/2026  ·  v1.0
#
# Componente frontend/frontendGestione (React + Vite). Build multi-stage:
#   1) "build": Node compila la SPA in file statici (dist/)
#   2) immagine finale: solo nginx + dist/, niente Node né node_modules
#
#   docker build -t nordfacility/frontend:1.0.0 frontend/frontendGestione

# ---- Stage 1: build ----
FROM node:22.12-alpine AS build
WORKDIR /app
# Prima le dipendenze (cache dei layer), poi il codice.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
# Variante "unprivileged": nginx gira come utente non root e ascolta su 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Deve combaciare con containerPort/targetPort nei manifest.
EXPOSE 8080

# Checklist:
# [x] non root: docker run --rm <img> whoami  ->  nginx
# [x] porta in EXPOSE = listen in nginx.conf (8080)
# [x] le chiamate al backend usano URL relativi (/api/...): l'Ingress le
#     instrada a web-svc, quindi nessun indirizzo del backend nell'immagine
