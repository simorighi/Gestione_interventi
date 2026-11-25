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

Componente: `web/` (Next.js 16 + Prisma 7). Il Dockerfile è in `web/Dockerfile`:
immagine di **produzione** multi-stage (`next build`, server standalone). La
prima versione (1.0.0) avviava `next dev`: corretto nella 1.1.0 (criticità C8).

```bash
docker build -t nordfacility/web:1.1.0 web
docker run --rm nordfacility/web:1.1.0 whoami      # deve stampare "node"
docker run --rm nordfacility/web:1.1.0              # senza env: esce con "Configurazione non valida"
```

| Scelta | Perché |
|---|---|
| `node:22.12-alpine` | Next 16 e Prisma 7 richiedono Node recente. Alpine = immagine piccola. Versione fissata, mai `latest`. |
| Stage `deps` → `build` → runtime | L'immagine finale contiene solo `.next/standalone`, `.next/static` e `public`: niente sorgenti, niente devDependencies. |
| `npm ci --ignore-scripts`, poi `prisma generate` nello stage di build | Il `postinstall` genera il client Prisma, ma schema e config non sono ancora copiati. Né `prisma generate` né `next build` si collegano al DB: nessuna `DATABASE_URL`, nemmeno finta. |
| `USER node` | Non gira come root (anche `runAsNonRoot` nel Deployment). |
| `HOSTNAME=0.0.0.0`, `PORT=3000`, `EXPOSE 3000` | Il Service deve raggiungere il Pod; la porta deve combaciare con `containerPort`/`targetPort`. |
| `CMD ["node","server.js"]` | Server di produzione: parte in pochi secondi e usa poca memoria. |
| `web/.dockerignore` | Esclude `node_modules`, `.next`, `tests` e `.env*`: nessun segreto nell'immagine. |

**Pubblicazione sul registry MicroK8s**

```bash
docker tag nordfacility/web:1.1.0 localhost:32000/nordfacility/web:1.1.0
docker push localhost:32000/nordfacility/web:1.1.0
curl http://localhost:32000/v2/_catalog     # deve elencare nordfacility/web
```

Il registry `localhost:32000` esiste solo dove gira MicroK8s con l'addon
`registry` abilitato. Sul PC Windows il `push` va in timeout (nessun registry
in ascolto): va eseguito sulla macchina/VM Linux con MicroK8s, dopo aver
costruito lì l'immagine.

---

**Passo 1b · Dockerfile del frontend (`frontend/frontendGestione/`)**

Build multi-stage: Node compila la SPA (`npm run build` → `dist/`), l'immagine
finale contiene solo nginx (non root, porta 8080) e i file statici.

```bash
docker build -t nordfacility/frontend:1.1.0 frontend/frontendGestione
docker tag nordfacility/frontend:1.1.0 localhost:32000/nordfacility/frontend:1.1.0
docker push localhost:32000/nordfacility/frontend:1.1.0
docker run --rm nordfacility/frontend:1.1.0 whoami     # deve stampare "nginx"
```

| Scelta | Perché |
|---|---|
| Multi-stage `node` → `nginx-unprivileged` | L'immagine finale non ha Node né `node_modules`: piccola, e il processo non è root. |
| `nginx.conf` con `try_files ... /index.html` | Ogni percorso sconosciuto torna alla SPA. `/healthz` per le probe. |
| Nessun URL del backend nel frontend | Il codice chiama `/api/...` (relativo): nel cluster lo instrada l'Ingress, in sviluppo il `proxy` di `vite.config.ts` verso `localhost:3000`. |

---

**Architettura nel cluster**

```
browser ──► Ingress nordfacility.local
              ├─ /api/* ──► web-svc:80      ──► Pod web x2 (Next.js :3000) ──► DB Supabase
              └─ /      ──► frontend-svc:80 ──► Pod frontend x2 (nginx :8080)
```

La SPA gira nel browser, quindi le sue chiamate partono dal browser e tornano
all'Ingress: stesso host, nessun problema di CORS. Solo `web` ha `DATABASE_URL`.

**Passo 2 · Deployment e Service**

| Oggetto | File | Valori chiave |
|---|---|---|
| Deployment `web` | `deployment-web.yaml` | 2 repliche, `app: web`, `localhost:32000/nordfacility/web:1.1.0`, porta 3000 |
| Service `web-svc` | `service-web.yaml` | `ClusterIP`, `port: 80` → `targetPort: 3000` |
| Deployment `frontend` | `deployment-frontend.yaml` | 2 repliche, `app: frontend`, `localhost:32000/nordfacility/frontend:1.1.0`, porta 8080 |
| Service `frontend-svc` | `service-frontend.yaml` | `ClusterIP`, `port: 80` → `targetPort: 8080` |

Probe di `web`: `startupProbe` (TCP, fino a 1' per l'avvio),
`readinessProbe` su `/api/health` (verifica anche il DB: un Pod senza DB non
riceve traffico), `livenessProbe` TCP (non dipende dal DB, così un problema su
Supabase non fa riavviare i Pod in loop). Probe del frontend: `/healthz` di nginx.

**Passo 3 · Configurazione**

- `k8s/configmap.yaml` → ConfigMap `web-config`: `HOSTNAME`, `PORT`,
  `NEXT_TELEMETRY_DISABLED`, `LOG_LEVEL`, `AUTH_TOKEN_TTL_MIN`, `API_DOCS`.
- `k8s/secret-example.yaml` → Secret `web-secret`: `DATABASE_URL` e
  `AUTH_SECRET`, **solo valori di esempio**. Quello vero si crea così (non finisce in Git):

```bash
microk8s kubectl create secret generic web-secret \
  --from-literal=DATABASE_URL='postgresql://<utente>:<password>@<host>:6543/postgres' \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 48)" \
  --dry-run=client -o yaml | microk8s kubectl apply -f -
```

Per `DATABASE_URL` usare l'utente limitato `nordfacility_app`
(`web/prisma/sql/02-utente-applicativo.sql`), non `postgres`.

(in alternativa: copiare `secret-example.yaml` in `k8s/secret.yaml`, già in
`.gitignore`, e fare `apply` di quello).

Entrambi sono collegati al Deployment `web` con `envFrom`. Il frontend non ha
configurazione né credenziali.

**Passo 4 · Ingress**

`k8s/ingress.yaml`: host `nordfacility.local` con **TLS** (Secret
`nordfacility-tls`, redirect HTTP → HTTPS), classe `public` (addon MicroK8s),
`/api` → `web-svc:80`, `/` → `frontend-svc:80`, più un Ingress con limite di
richieste su `/api/auth/login`. Certificato, rilascio e rollback:
[`rilascio-rollback.md`](rilascio-rollback.md).

```bash
echo "127.0.0.1 nordfacility.local" | sudo tee -a /etc/hosts
```

**Applicare tutto (ordine: config → app → rete)**

```bash
microk8s kubectl apply -f k8s/configmap.yaml
# Secret: quello vero (vedi Passo 3), non secret-example.yaml
microk8s kubectl apply -f k8s/deployment-web.yaml -f k8s/service-web.yaml
microk8s kubectl apply -f k8s/deployment-frontend.yaml -f k8s/service-frontend.yaml
microk8s kubectl apply -f k8s/ingress.yaml
```

Dopo una modifica a ConfigMap/Secret: `apply` + `microk8s kubectl rollout restart deploy/web`.
Dopo una nuova immagine: nuovo tag (es. `1.0.1`), aggiornare il Deployment e `apply`.

**Passo 5 · Verifica**

```bash
microk8s kubectl get pods                          # web x2 e frontend x2, Running, READY 1/1
microk8s kubectl get svc                           # web-svc e frontend-svc con ClusterIP
microk8s kubectl get endpoints web-svc frontend-svc   # non vuoti (:3000 e :8080)
microk8s kubectl describe pod -l app=web | grep -A3 "Environment Variables from"
microk8s kubectl get ingress                       # ADDRESS presente
microk8s kubectl logs -f deploy/web

curl --cacert nordfacility.crt https://nordfacility.local/            # HTML della SPA (dal frontend)
curl --cacert nordfacility.crt https://nordfacility.local/api/health  # {"status":"ok","database":"up"}
TOKEN=$(curl -s --cacert nordfacility.crt -X POST https://nordfacility.local/api/auth/login \
  -H 'content-type: application/json' -d '{"email":"responsabile@demo.it","password":"password"}' \
  | sed 's/.*"token":"\([^"]*\)".*/\1/')
curl --cacert nordfacility.crt -H "Authorization: Bearer $TOKEN" https://nordfacility.local/api/segnalazioni
```

Senza Ingress: `microk8s kubectl port-forward svc/web-svc 8080:80` e poi
`curl http://localhost:8080/api/health`.

| Sintomo | Causa probabile |
|---|---|
| `ImagePullBackOff` | immagine/tag non pushati su `localhost:32000` |
| `CreateContainerConfigError` | manca `web-config` o `web-secret` |
| Pod `web` `Running` ma `READY 0/1` | `/api/health` → 503: `DATABASE_URL` errata o DB non raggiungibile (vedi `logs`) |
| `get endpoints` vuoto | label del Pod ≠ `selector` del Service |
| Ingress senza `ADDRESS` | addon `ingress` non abilitato |
| Pod `web` in `CrashLoopBackOff`, log `Configurazione non valida` | manca una variabile obbligatoria (es. `AUTH_SECRET` nel Secret) |
| Browser: certificato non attendibile | è autofirmato: importare `nordfacility.crt` o usare `curl --cacert` |
| `/api/...` restituisce l'HTML della SPA | manca il path `/api` nell'Ingress, o è scritto dopo un errore di battitura |
