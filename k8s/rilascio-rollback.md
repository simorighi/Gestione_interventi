# Rilascio, verifica e rollback — Lab 9

| | |
|---|---|
| **Progetto** | Smart Maintenance (NordFacility S.r.l.) |
| **Team** | Team 1 |
| **Data** | 25/11/2026 |
| **Versione da rilasciare** | `web:1.1.0`, `frontend:1.1.0` (in cluster c'è `1.0.0`) |

Tutti i comandi si eseguono sulla macchina con MicroK8s, dalla radice del
repository. La colonna **Esito** delle tabelle va compilata **eseguendo davvero**
i comandi: non è stata compilata in anticipo.

## Passo 1 · Hostname e certificato TLS

Certificato autofirmato per `nordfacility.local`, valido un anno. La chiave
privata resta sulla macchina e nel cluster. Non va nel repository (`*.pem`,
`*.key` e `*.crt` sono in `.gitignore`).

```bash
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout nordfacility.key -out nordfacility.crt \
  -subj "/CN=nordfacility.local" \
  -addext "subjectAltName=DNS:nordfacility.local"

microk8s kubectl create secret tls nordfacility-tls \
  --cert=nordfacility.crt --key=nordfacility.key

echo "127.0.0.1 nordfacility.local" | sudo tee -a /etc/hosts
```

## Passo 2 · Secret e ConfigMap della versione 1.1.0

La 1.1.0 **non parte senza `AUTH_SECRET`**: lo fa apposta (fail-fast). Va
aggiunto al Secret prima del rilascio:

```bash
microk8s kubectl create secret generic web-secret \
  --from-literal=DATABASE_URL='postgresql://<utente>:<password>@<host>:6543/postgres' \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 48)" \
  --dry-run=client -o yaml | microk8s kubectl apply -f -
microk8s kubectl apply -f k8s/configmap.yaml
```

## Passo 3 · Immagini

```bash
docker build -t localhost:32000/nordfacility/web:1.1.0 web
docker build -t localhost:32000/nordfacility/frontend:1.1.0 frontend/frontendGestione
docker push localhost:32000/nordfacility/web:1.1.0
docker push localhost:32000/nordfacility/frontend:1.1.0
docker run --rm localhost:32000/nordfacility/web:1.1.0 whoami   # node
```

## Passo 4 · Rilascio

```bash
microk8s kubectl apply -f k8s/deployment-web.yaml -f k8s/service-web.yaml \
  -f k8s/deployment-frontend.yaml -f k8s/service-frontend.yaml -f k8s/ingress.yaml
microk8s kubectl rollout status deploy/web --timeout=180s
microk8s kubectl rollout status deploy/frontend --timeout=180s
microk8s kubectl rollout history deploy/web
```

Con `maxUnavailable: 0` Kubernetes crea un Pod nuovo e toglie uno vecchio solo
quando il nuovo è *Ready*, cioè quando `/api/health` risponde anche dal database.

## Passo 5 · Verifica del routing

| # | Verifica | Comando | Atteso | Esito |
|---|---|---|---|---|
| R1 | HTTP rediretto a HTTPS | `curl -sI http://nordfacility.local/` | `308`, `Location: https://…` | |
| R2 | `/` va al frontend | `curl -s --cacert nordfacility.crt https://nordfacility.local/ \| head -3` | HTML della SPA | |
| R3 | `/api` va al backend | `curl -s --cacert nordfacility.crt https://nordfacility.local/api/health` | `{"status":"ok","database":"up"}` | |
| R4 | API protette | `curl -s -o /dev/null -w '%{http_code}' --cacert nordfacility.crt https://nordfacility.local/api/segnalazioni` | `401` | |
| R5 | Login | `curl -s --cacert nordfacility.crt -X POST https://nordfacility.local/api/auth/login -H 'content-type: application/json' -d '{"email":"responsabile@demo.it","password":"password"}'` | JSON con `token` | |
| R6 | Swagger spento nel cluster | `curl -s -o /dev/null -w '%{http_code}' --cacert nordfacility.crt https://nordfacility.local/api/docs` | `404` | |
| R7 | Una rotta SPA non esistente torna alla SPA | `curl -s --cacert nordfacility.crt https://nordfacility.local/segnalazioni/1 \| grep -c '<div id="root">'` | `1` | |
| R8 | Limite sul login | 30 login di fila con `for i in $(seq 30); do curl … ; done` | dopo ~20: `503` dall'Ingress | |
| R9 | Log strutturati | `microk8s kubectl logs deploy/web \| tail -3` | righe JSON con `requestId`, `userId`, `status` | |

## Passo 6 · Rilascio sbagliato e rollback (da eseguire davvero)

Simuliamo l'errore più probabile: una versione pubblicata **senza** la
variabile obbligatoria. Usiamo un'immagine valida, ma togliamo `AUTH_SECRET`
dall'ambiente del Deployment:

```bash
# 1. "Rilascio" difettoso: revisione nuova del Deployment senza AUTH_SECRET.
microk8s kubectl patch deploy web --type=json -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/env","value":[{"name":"AUTH_SECRET","value":""}]}
]'
microk8s kubectl annotate deploy/web kubernetes.io/change-cause="1.1.0-rotto: AUTH_SECRET vuota" --overwrite

# 2. Osservare: il Pod nuovo va in CrashLoopBackOff, i 2 vecchi restano Ready.
microk8s kubectl get pods -l app=web -w            # Ctrl+C dopo qualche secondo
microk8s kubectl logs -l app=web --tail=5 | grep -A2 "Configurazione non valida"
curl -s --cacert nordfacility.crt https://nordfacility.local/api/health   # risponde ancora: zero downtime
microk8s kubectl rollout status deploy/web --timeout=60s                  # fallisce

# 3. Rollback alla revisione precedente.
microk8s kubectl rollout history deploy/web
microk8s kubectl rollout undo deploy/web
microk8s kubectl rollout status deploy/web --timeout=180s
```

Una variabile d'ambiente con valore `""` *sovrascrive* quella del Secret, e la
validazione la rifiuta (`AUTH_SECRET deve avere almeno 32 caratteri`). È lo
stesso guasto che si avrebbe dimenticando la chiave nel Secret.

| # | Verifica | Atteso | Esito |
|---|---|---|---|
| B1 | Pod della revisione rotta | `CrashLoopBackOff`, log `Configurazione non valida: AUTH_SECRET…` | |
| B2 | Servizio durante il guasto | `/api/health` → 200 (i Pod vecchi non vengono tolti) | |
| B3 | `rollout status` | fallisce dopo il timeout | |
| B4 | Dopo `rollout undo` | 2 Pod `Running`, `READY 1/1`, `rollout history` mostra una revisione nuova uguale alla 1.1.0 | |
| B5 | Routing dopo il rollback | R3, R4, R5 di nuovo come atteso | |

**Tempo di ripristino misurato** (da `rollout undo` a `rollout status` OK): ____ s

## Note

- `kubectl rollout undo` riporta il **template del Pod** (immagine, env) alla
  revisione precedente. Non ripristina ConfigMap e Secret: se il guasto fosse
  in un Secret, bisognerebbe correggere il Secret e fare `rollout restart`.
- Ogni rilascio ha un tag nuovo (`1.1.0`, `1.1.1`, …). Riusare lo stesso tag
  con contenuto diverso rende il rollback inaffidabile.
