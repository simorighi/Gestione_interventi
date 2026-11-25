# Progetto: Nordfacility · Team: 1 · Data: 25/11/2026 · v1.0
#
# Componente: web/ (Next.js 16 + Prisma 7). Immagine di PRODUZIONE (C8):
#   1) "deps":  npm ci con il lockfile
#   2) "build": prisma generate + next build (output standalone)
#   3) finale:  solo .next/standalone + file statici, utente non root,
#               nessun compilatore, nessun dev server, nessun segreto.
#
#   docker build -t localhost:32000/nordfacility/web:1.1.0 web
#
# La configurazione (DATABASE_URL, AUTH_SECRET, ...) arriva SOLO a runtime da
# ConfigMap e Secret: se manca, il container esce subito con il motivo nei log
# (src/instrumentation.ts).

# ---- Stage 1: dipendenze ----
FROM node:22.12-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: il postinstall (prisma generate) ha bisogno dello schema,
# che non è ancora stato copiato; lo si lancia nello stage di build.
RUN npm ci --ignore-scripts

# ---- Stage 2: build ----
FROM node:22.12-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Né prisma generate né next build si collegano al database: nessuna
# DATABASE_URL serve qui (vedi prisma.config.ts e src/server/db.ts).
RUN npx prisma generate && npx next build

# ---- Stage 3: runtime ----
FROM node:22.12-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Utente "node" (non root) già presente nell'immagine base.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node

# Deve combaciare con containerPort/targetPort nei manifest.
EXPOSE 3000

# Forma "exec": il processo riceve direttamente i segnali di stop di Kubernetes.
CMD ["node", "server.js"]

# Checklist prima di buildare:
# [x] nessun .env nell'immagine (vedi web/.dockerignore)
# [x] non root: docker run --rm <img> whoami  ->  node
# [x] porta in EXPOSE = porta usata dal processo (3000)
# [x] il tag (es. 1.1.0) è lo stesso di k8s/deployment-web.yaml
# [x] niente "next dev" in produzione
