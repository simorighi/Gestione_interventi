# Progetto: Nordfacility ·  Team: 1 ·  Data: <gg/mm/aaaa>  ·  v0.3
#
# Componente: web/ (Next.js 16 + Prisma 7). Immagine unica, per test (dev server).
# Il Dockerfile sta in web/, che è anche il contesto di build:
#
#   docker build -t <team>/web:1.0.0 web

# Immagine base minimale (alpine) con versione precisa, mai ":latest".
FROM node:22.12-alpine

# Cartella di lavoro, di proprietà dell'utente non root "node" (già presente
# nell'immagine base) così Next può scrivere la sua cache in .next.
RUN mkdir /app && chown node:node /app
WORKDIR /app
USER node

# Prima solo i file delle dipendenze, poi npm ci, poi il codice: se cambia solo
# il codice, Docker riusa la cache e non reinstalla tutto.
# --ignore-scripts: il postinstall (prisma generate) ha bisogno di schema e
# config, che non sono ancora stati copiati.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY --chown=node:node . .

# prisma.config.ts richiede DATABASE_URL anche solo per generare il client:
# valore finto (nessuna connessione viene aperta, nessun database viene
# avviato: è solo una stringa), usato solo in questo comando e non salvato
# nell'immagine. Quella vera, di Supabase, arriva a runtime da Secret.
RUN DATABASE_URL="postgresql://finto:finto@host-finto:5432/finto" npx prisma generate

# Il server deve ascoltare su tutte le interfacce, non solo su localhost,
# altrimenti il Service non raggiunge il Pod.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Documentazione: deve combaciare con containerPort/targetPort nei manifest.
EXPOSE 3000

# Forma "exec": il processo riceve i segnali di stop da Kubernetes.
CMD ["npm", "run", "dev"]

# Checklist prima di buildare:
# [x] nessun .env nell'immagine (vedi web/.dockerignore)
# [x] non root: docker run --rm <img> whoami  ->  node
# [x] porta in EXPOSE = porta usata dal processo (3000)
# [x] il tag (es. 1.0.0) è lo stesso dei manifest
