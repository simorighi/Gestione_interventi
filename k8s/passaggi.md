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

---

**Passo 1b · Dockerfile del frontend (`frontend/frontendGestione/`)**

Build multi-stage: Node compila la SPA (`npm run build` → `dist/`), l'immagine
finale contiene solo nginx (non root, porta 8080) e i file statici.

```bash
docker build -t nordfacility/frontend:1.0.0 frontend/frontendGestione
docker tag nordfacility/frontend:1.0.0 localhost:32000/nordfacility/frontend:1.0.0
docker push localhost:32000/nordfacility/frontend:1.0.0
docker run --rm nordfacility/frontend:1.0.0 whoami     # deve stampare "nginx"
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
| Deployment `web` | `deployment-web.yaml` | 2 repliche, `app: web`, `localhost:32000/nordfacility/web:1.0.0`, porta 3000 |
| Service `web-svc` | `service-web.yaml` | `ClusterIP`, `port: 80` → `targetPort: 3000` |
| Deployment `frontend` | `deployment-frontend.yaml` | 2 repliche, `app: frontend`, `localhost:32000/nordfacility/frontend:1.0.0`, porta 8080 |
| Service `frontend-svc` | `service-frontend.yaml` | `ClusterIP`, `port: 80` → `targetPort: 8080` |

Probe di `web`: `startupProbe` (TCP, fino a 2' per l'avvio del dev server),
`readinessProbe` su `/api/health` (verifica anche il DB: un Pod senza DB non
riceve traffico), `livenessProbe` TCP (non dipende dal DB, così un problema su
Supabase non fa riavviare i Pod in loop). Probe del frontend: `/healthz` di nginx.

**Passo 3 · Configurazione**

- `k8s/configmap.yaml` → ConfigMap `web-config`: `HOSTNAME`, `PORT`,
  `NEXT_TELEMETRY_DISABLED`.
- `k8s/secret-example.yaml` → Secret `web-secret`: `DATABASE_URL`, **solo
  valore di esempio**. Quello vero si crea così (non finisce in Git):

```bash
microk8s kubectl create secret generic web-secret \
  --from-literal=DATABASE_URL='postgresql://<utente>:<password>@<host>:6543/postgres' \
  --dry-run=client -o yaml | microk8s kubectl apply -f -
```

(in alternativa: copiare `secret-example.yaml` in `k8s/secret.yaml`, già in
`.gitignore`, e fare `apply` di quello).

Entrambi sono collegati al Deployment `web` con `envFrom`. Il frontend non ha
configurazione né credenziali.

**Passo 4 · Ingress**

`k8s/ingress.yaml`: host `nordfacility.local`, classe `public` (addon MicroK8s),
`/api` → `web-svc:80`, `/` → `frontend-svc:80`.

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

curl http://nordfacility.local/                    # HTML della SPA (dal frontend)
curl http://nordfacility.local/api/health          # {"status":"ok","database":"up"} (dal backend)
curl -H "x-user-id: 1" http://nordfacility.local/api/segnalazioni
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
| `/api/...` restituisce l'HTML della SPA | manca il path `/api` nell'Ingress, o è scritto dopo un errore di battitura |
