**INstallazione microk8s** 

sudo snap install microk8s --classic
sudo usermod -a -G microk8s $USER
mkdir -p ~/.kube && chmod 0700 ~/.kube
newgrp microk8s            # oppure chiudi e riapri il terminale
microk8s status --wait-ready

**Abilitare gli addon richiesti**
microk8s enable dns storage registry ingress


---

**Passo 1 · Dockerfile del componente `web/`**

Componente: `web/` (Next.js 16 + Prisma 7). Il Dockerfile è in `web/Dockerfile`. Un solo `FROM`, un'immagine sola,
pensata per test: avvia il dev server (`npm run dev`), nessun build di produzione.

```bash
docker build -t <team>/web:1.0.0 web
docker tag <team>/web:1.0.0 localhost:32000/<team>/web:1.0.0
docker push localhost:32000/<team>/web:1.0.0
docker run --rm <team>/web:1.0.0 whoami      # deve stampare "node"
```

| Scelta | Perché |
|---|---|
| `node:22.12-alpine` | Next 16 e Prisma 7 richiedono Node recente. Alpine = immagine piccola. Versione fissata, mai `latest`. |
| `COPY package*.json` → `npm ci` → `COPY . .` | Cache dei layer: se cambia solo il codice, le dipendenze non si reinstallano. `npm ci` usa il lockfile. |
| `npm ci --ignore-scripts` + `prisma generate` dopo la copia | Il `postinstall` genera il client Prisma, ma schema e config non sono ancora copiati. |
| `DATABASE_URL` finta solo nel `RUN` di `prisma generate` | `prisma.config.ts` la richiede, ma è solo una stringa: non si connette a nulla né avvia database. Non resta nell'immagine: la vera arriva da ConfigMap/Secret (Passo 3). |
| `USER node` + `chown` su `/app` | Non gira come root; `next dev` deve poter scrivere in `.next`. |
| `HOSTNAME=0.0.0.0`, `PORT=3000`, `EXPOSE 3000` | Il Service deve raggiungere il Pod; la porta deve combaciare con `containerPort`/`targetPort`. |
| `CMD ["npm","run","dev"]` | Per test basta il dev server: nessun build, quindi nessun problema con il database a build time. |
| `web/.dockerignore` | Esclude `node_modules`, `.next` e `.env*`: nessun segreto nell'immagine. |

Nota: per un uso reale (produzione) servirebbe un build multi-stage con
`next build` e `next start`; qui non serve.

**Pubblicazione sul registry MicroK8s**

```bash
docker tag nordfacility/web:1.0.0 localhost:32000/nordfacility/web:1.0.0
docker push localhost:32000/nordfacility/web:1.0.0
curl http://localhost:32000/v2/_catalog     # deve elencare nordfacility/web
```

Il registry `localhost:32000` esiste solo dove gira MicroK8s con l'addon
`registry` abilitato. Sul PC Windows il `push` va in timeout (nessun registry
in ascolto): va eseguito sulla macchina/VM Linux con MicroK8s, dopo aver
costruito lì l'immagine.
