
README.md
100%
# Laboratorio — Lezione 5: Container e orchestrazione con MicroK8s/Kubernetes

**Durata: 105 minuti** (dopo la pausa, prima della verifica finale)

## Obiettivo

A fine laboratorio, almeno un componente della vostra applicazione **gira in un
Pod su MicroK8s**, raggiungibile tramite un **Service**, con la sua
configurazione — parametri e credenziali — **esterna al codice e all'immagine**.
Prima di oggi il vostro backend girava solo sul vostro PC; da oggi gira in un
cluster, con un manifest che chiunque nel team può rieseguire.

## Prerequisiti

Prima di iniziare, dovete già avere (dalle lezioni 3 e 4):

- un **backend funzionante in locale**, collegato al database, con le
  credenziali lette da variabili d'ambiente e non scritte nel codice;
- almeno **un endpoint REST raggiungibile** e testato (`docs/api.md` scritto);
- **Docker e MicroK8s installati e avviati** sulla vostra postazione — se
  `microk8s status --wait-ready` non risponde "microk8s is running", fermatevi
  e chiamate il docente prima di continuare;
- gli addon MicroK8s necessari abilitati: `microk8s enable dns storage
  registry ingress` (se non l'ha già fatto il docente prima della lezione).

Non serve containerizzare tutta l'applicazione: **basta un componente**, di
solito il backend.

## I passi

### 1 · Immagine — 25'

Scrivete un `Dockerfile` per il componente che avete scelto. Costruite
l'immagine, taggatela con una **versione** (mai `latest`), e pubblicatela sul
registry di MicroK8s.

```bash
docker build -t <team>/<componente>:1.0.0 .
docker tag <team>/<componente>:1.0.0 localhost:32000/<team>/<componente>:1.0.0
docker push localhost:32000/<team>/<componente>:1.0.0
```

**Producete:** `Dockerfile` nel repository del componente · immagine visibile
su `localhost:32000`.

### 2 · Deployment e Service — 30'

Scrivete i manifest per i componenti principali: un `Deployment` (con le
`labels` nel template dei Pod) e un `Service` (con lo stesso valore in
`selector`). Sono le label, non i nomi, a collegare Service e Pod: se non
combaciano esattamente, il Service non trova nessun Pod.

**Producete:** `k8s/deployment-*.yaml` · `k8s/service-*.yaml` (partite dagli
scheletri in `template/k8s/`).

### 3 · Configurazione — 25'

Spostate fuori dal codice tutto ciò che oggi è ancora hardcoded: parametri non
sensibili in una `ConfigMap`, credenziali in un `Secret`. Collegateli al
Deployment con `envFrom`, e rifate `apply` — il cluster non si accorge da solo
di un file cambiato sul disco.

**Producete:** `k8s/configmap.yaml` · `k8s/secret-example.yaml`.

### 4 · Ingress — 15'

Definite un host e l'instradamento per percorso verso i componenti che avete
esposto (tipicamente `/` verso il frontend, `/api` verso il backend, se avete
containerizzato entrambi; se avete solo il backend, instradate tutto lì).

**Producete:** `k8s/ingress.yaml`.

### 5 · Verifica — 10'

Dimostrate, con i comandi, che il componente **risponde davvero**, non solo
che "sembra partito":

```bash
microk8s kubectl get pods                 # Running, non Pending/CrashLoopBackOff
microk8s kubectl get svc                  # ClusterIP assegnato
microk8s kubectl get ingress              # ADDRESS presente
microk8s kubectl logs -f deploy/<nome>    # il processo ha davvero risposto
```

Se un Pod resta in `CrashLoopBackOff`, **non cancellatelo e riprovate**:
leggete i log, prima. Cancellare un Pod rotto e ricrearlo non cambia il motivo
per cui si rompe.

## Fatto quando

- `microk8s kubectl get pods` mostra il Pod del vostro componente in stato
  `Running`, con 0 (o pochi) restart.
- `microk8s kubectl get svc` mostra il Service con un `ClusterIP` e la porta
  corretta.
- `microk8s kubectl get endpoints <service>` **non è vuoto**: è la prova che
  il `selector` combacia con le label del Pod.
- `microk8s kubectl describe pod <pod>` mostra, tra le variabili d'ambiente,
  quelle che arrivano da `ConfigMap` e `Secret` (non valori scritti a mano nel
  manifest del Deployment).
- `microk8s kubectl get ingress` mostra un `ADDRESS` e una richiesta verso
  l'host configurato riceve risposta dal componente, non un errore di
  connessione.
- Nessuna password o credenziale reale è finita nel repository: il file
  `k8s/secret-example.yaml` contiene valori di **esempio**, non quelli usati.

## Errori tipici

- **Tag `latest` o immagine non pushata**: il manifest cerca un'immagine che
  il registry non ha. Costa un `ImagePullBackOff` e tempo perso a capire perché.
- **Label del Pod diverse dal `selector` del Service** (anche una sola lettera,
  o un ordine diverso non conta ma un valore diverso sì): il Service resta
  senza endpoint, "sembra tutto a posto" ma non risponde nessuno.
- **`containerPort`/`targetPort` diversi dalla porta su cui il processo
  ascolta davvero dentro il container**: connessione rifiutata, anche con Pod
  `Running`.
- **Credenziali reali dentro `secret-example.yaml` committato**: un Secret non
  è cifrato, è solo codificato in base64. Costa una fuga di credenziali nella
  cronologia Git.
- **Modificare la ConfigMap senza rifare `apply`**: il cluster non guarda il
  vostro editor, guarda l'ultimo manifest applicato. E dopo l'`apply` i Pod
  già avviati tengono i valori vecchi, perché le variabili d'ambiente si
  leggono all'avvio: riavviateli con
  `microk8s kubectl rollout restart deploy/<nome>`.
- **Ingress creato ma nessun `ADDRESS`**: quasi sempre l'addon `ingress` non è
  abilitato su MicroK8s.

## Cosa consegnate

```
k8s/
├── deployment-*.yaml
├── service-*.yaml
├── configmap.yaml
├── secret-example.yaml
└── ingress.yaml
```

- **Applicazione eseguibile su MicroK8s**: almeno un componente distribuito
  con Deployment e Service.
- **Configurazione esterna al codice**, con raggiungibilità verificata usando
  i comandi visti oggi (`get`, `describe`, `logs`).

Il `Dockerfile` e l'immagine pubblicata sul registry (passo 1) sono la base
tecnica su cui poggia tutto il resto: teneteli nel repository del componente,
anche se non compaiono nell'elenco dei manifest sopra.

## Se restate indietro

Versione minima accettabile, in ordine di priorità:

1. **Un solo componente**, Deployment + Service, in stato `Running` e
   raggiungibile — anche solo con `microk8s kubectl port-forward`, senza
   Ingress.
2. **Almeno una ConfigMap** collegata con `envFrom` (anche con un solo
   parametro, es. `LOG_LEVEL`), per mostrare il principio: non serve spostare
   fuori dal codice ogni singolo valore oggi.
3. Se il tempo manca ancora, **il Secret può restare con dati di esempio
   minimi** (una sola credenziale), ma deve esistere ed essere collegato.

L'Ingress è la parte più facile da rimandare: senza, l'applicazione resta
raggiungibile dentro il cluster, e questo per oggi basta a dimostrare il
principio. Riprendetelo per primo, la prossima volta che avete tempo.
Visualizzazione di README.md.