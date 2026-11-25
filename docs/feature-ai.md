# Feature sviluppata con assistente AI — Lab 7

| | |
|---|---|
| **Progetto** | Smart Maintenance (NordFacility S.r.l.) |
| **Team** | Team 1 |
| **Data** | 25/11/2026 |
| **Assistente** | Claude Code (Claude Opus 5.5), nel terminale, sul repository |
| **Voce di backlog** | 4 · Assegnazione e ciclo di vita: *"posso selezionare uno o più tecnici per una segnalazione"* |

## Cosa è stato chiesto e cosa è uscito

Richiesta: implementare l'assegnazione di uno o più tecnici, rispettando lo
schema esistente (`assegnazione`, vincolo `uq_assegnazione_segnalazione_tecnico`)
e le regole del backlog (solo il Responsabile, audit di ogni assegnazione).

| File | Cosa contiene |
|---|---|
| `web/src/server/validation/segnalazioni.ts` | `assegnaTecniciSchema`: da 1 a 10 id, senza ripetizioni |
| `web/src/server/services/segnalazioni.service.ts` | `assegnaTecnici()`: in una transazione, 404 se la segnalazione non esiste, 400 se è chiusa o se un id non è un tecnico attivo, 409 se già assegnato, una riga `ASSEGNAZIONE` in `log_audit` per tecnico |
| `web/src/app/api/segnalazioni/[id]/assegnazioni/route.ts` | `POST`, con `requireRole(Responsabile, Amministratore)` |
| `web/src/server/services/anagrafiche.service.ts`, `web/src/app/api/tecnici/route.ts` | `GET /api/tecnici` per il menu, senza email |
| `web/tests/integration/assegnazioni.test.ts` | 10 test |
| `frontend/.../DettaglioSegnalazione.tsx` | riquadro "Assegna tecnico", visibile solo a Responsabile e Amministratore |

Commit: `8a263d2 Aggiunge assegnazione tecnici con audit` (backend) e
`c953efe Collega pagine segnalazioni al backend` (frontend).

## Lettura riga per riga — da fare dal team

Il codice l'ha scritto l'assistente. **Il lab chiede che una persona del team
lo legga riga per riga prima di tenerlo.** Per ogni file annotate cosa avete
cambiato o tolto, e perché.

| File | Letto da | Righe cambiate / tolte | Perché |
|---|---|---|---|
| `segnalazioni.service.ts` › `assegnaTecnici` | | | |
| `assegnazioni/route.ts` | | | |
| `assegnazioni.test.ts` | | | |

Punti su cui fermarsi, perché sono scelte, non ovvietà:
- si può assegnare anche dopo "Segnalato", basta che non sia chiusa. Il
  backlog parla di stato "Segnalato": va confermato col cliente;
- se due responsabili assegnano lo stesso tecnico nello stesso istante, il
  secondo riceve 409 dal vincolo unico del DB (P2002 → 409 in `http.ts`), non
  dal controllo esplicito;
- non c'è ancora la rimozione di un'assegnazione.

## Secondo tentativo e confronto — da fare dal team

Il lab chiede un secondo tentativo indipendente (altro membro, o la stessa
richiesta formulata diversamente) e il confronto. In questa sessione è stato
fatto un solo tentativo.

| Aspetto | Tentativo 1 (questo) | Tentativo 2 | Quale teniamo e perché |
|---|---|---|---|
| Dove sta la regola "solo Responsabile" | route (`requireRole`) | | |
| Tecnico inesistente | 400 con l'elenco degli id sbagliati | | |
| Duplicati | 409 con gli id già assegnati | | |
| Audit | una riga per tecnico, nella transazione | | |

## Test generati: verificati uno per uno

Ogni test generato è stato eseguito (`npm run test:integration`, 25/11, tutti
verdi). Per alcuni è stato anche controllato che **fallisca** quando la regola
manca, altrimenti un test verde non prova niente:

| Test | Cosa verifica davvero | Verifica fatta |
|---|---|---|
| `il Responsabile assegna due tecnici: 201, …, audit per ciascuno` | righe in `assegnazione` **e** in `log_audit`, con l'utente giusto | legge il DB, non solo la risposta |
| `Tecnico e Segnalatore non possono assegnare: 403` | il ruolo, e che `assegnazione` resti vuota | `count() = 0` dopo il 403 |
| `un utente che non è tecnico: 400 e nessuna assegnazione` | la transazione viene annullata del tutto (il primo id era valido) | `count() = 0` |
| `tecnico già assegnato: 409` | il conflitto | — |
| `segnalazione già risolta: 400` | non si assegna una pratica chiusa | — |
| `body non valido` (3 casi) | `[]`, `[1,1]`, `"abc"` | — |

La colonna "Verifica fatta" va completata dal team: per ogni test, togliere la
riga di codice che dovrebbe farlo fallire e controllare che fallisca.

## Errori diagnosticati con l'AI, ipotesi controllate a mano

Tre guasti reali capitati nella stessa sessione. Per ognuno l'assistente ha
proposto un'ipotesi, e l'ipotesi è stata **verificata con un comando** prima di
correggere.

### 1. La suite si ferma con "Unhandled Error", senza messaggio

- **Sintomo**: `npx vitest run` → `Errors 1 error`, `message: undefined`, nessun test eseguito.
- **Ipotesi**: il tentativo precedente era fallito dopo aver acceso il
  PostgreSQL di test, che era rimasto in ascolto sulla porta 54329. Il nuovo
  avvio quindi falliva.
- **Verifica a mano**: `lsof -nP -iTCP:54329 -sTCP:LISTEN` → un processo
  `postgres` del run precedente. Ipotesi confermata.
- **Correzione**: il server rimasto acceso è stato fermato con `pg_ctl stop`.
  `tests/setup/global-db.ts` ora spegne il database se la preparazione fallisce.

### 2. `next build` fallisce: "Failed to collect page data for /api/auth/me"

- **Sintomo**: build di produzione senza variabili d'ambiente →
  `Configurazione non valida: DATABASE_URL` durante il build.
- **Ipotesi**: `src/server/db.ts` creava il client Prisma (e quindi leggeva la
  configurazione) appena importato, e `next build` importa le route per
  analizzarle.
- **Verifica a mano**: lo stack trace puntava a `src/server/db.ts:16`,
  `export const db = … createClient()`, eseguito al caricamento del modulo.
- **Correzione**: client creato alla prima query. Il build passa senza
  variabili, e il server avviato senza variabili esce con il messaggio
  previsto. Entrambi verificati.

### 3. Il Dockerfile del branch `k8s` avrebbe mandato i Pod in crash

- **Sintomo** (trovato leggendo, non in esecuzione): dopo il merge di `k8s`, i
  manifest non definivano `CORS_ORIGIN`.
- **Ipotesi**: `next.config.mjs` faceva `process.exit(1)` se `CORS_ORIGIN`
  mancava, quindi il container sarebbe uscito all'avvio. In più Next legge
  `next.config.mjs` prima di `.ts`, quindi `cacheComponents` di `next.config.ts`
  era ignorato.
- **Verifica a mano**: in `node_modules/next/dist/shared/lib/constants.js`,
  `CONFIG_FILES = ['next.config.js', 'next.config.mjs', 'next.config.ts']`. In
  `k8s/configmap.yaml`, nessun `CORS_ORIGIN`.
- **Correzione**: un solo `next.config.ts`, CORS letto a runtime in
  `src/proxy.ts` e facoltativo. Verificato con `curl`: preflight da origine
  ammessa → 204 con header CORS; da origine estranea → nessun header.

### Un'ipotesi dell'AI che non è stata seguita

Per creare le tabelle nel database di test l'assistente ha usato prima `prisma
db push --accept-data-loss`. La CLI di Prisma l'ha bloccato: rifiuta i comandi
distruttivi lanciati da un agente AI senza consenso esplicito. Il database era
locale, temporaneo e vuoto, ma la protezione non è stata aggirata. Al suo posto
si usa `prisma migrate diff --from-empty --script`, che genera lo SQL senza
toccare nulla, e lo si esegue sul database appena creato.
