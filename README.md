# Ognuno crea un suo Branch col suo nome 


# Laboratorio — Lezione 1: Dall'applicazione all'architettura software

**Durata: 70 minuti** (23/09/2026, dopo la parte teorica)

## Obiettivo

A fine laboratorio ogni team esiste, ha un cliente assegnato e ha messo per
scritto tre cose che prima non esistevano: il problema del cliente con i suoi
casi d'uso, una prima architettura a componenti, e un backlog con le domande
ancora aperte.

## Prerequisiti

È il **primo** laboratorio del corso: non serve nulla dalle lezioni
precedenti. Vi serve solo aver seguito la parte teorica della mattina
(applicazione vs sistema, client-server, tre livelli, API, requisiti e casi
d'uso, componenti) e avere a disposizione un computer, un modo per scrivere in
Markdown e l'accesso a Gemini se volete usarlo nel confronto finale.

## I passi

### 1 · Team e traccia — 10 minuti

Formate il team (3-4 persone). Il docente vi assegna un cliente tra i cinque
disponibili e vi consegna la relativa richiesta. Decidete un canale di
comunicazione del team (chat, board, cartella condivisa: quello che preferite)
e ruoli iniziali indicativi — **verranno ruotati** nelle prossime lezioni,
oggi servono solo per partire senza perdere tempo.

**Producete**: nome del team, elenco membri, cliente assegnato — scritto da
qualche parte visibile al docente (lavagna, foglio, canale condiviso).

### 2 · Problema, attori, casi d'uso — 25 minuti

Leggete la richiesta del vostro cliente. Riducete il problema a **tre righe**:
cosa non funziona oggi, per chi, con quale conseguenza concreta. Elencate gli
**attori** (ruoli, non persone) e per ciascuno i **casi d'uso** principali, nel
formato *attore + azione + risultato osservabile*.

**Producete**: `docs/requirements.md` (problema, requisiti funzionali e non
funzionali) e `docs/use-cases.md` (attori e casi d'uso) — compilando i
template in `template/`.

### 3 · Componenti e architettura v1 — 25 minuti

Applicate il metodo visto in teoria: sostantivi ricorrenti → candidati a
entità, verbi ricorrenti → candidate a operazioni. Raggruppate ciò che cambia
insieme in componenti, e per ciascuno scrivete una riga di responsabilità e
una di **non**-responsabilità. Disegnate il diagramma: scatole, frecce con
sopra cosa passa, cosa è dentro e cosa è fuori dal vostro perimetro.

**Producete**: `docs/architecture-v1.md`, compilando il template — diagramma
incluso (va bene descritto a parole, con un blocco Mermaid, o su carta
fotografata: quello che riuscite a condividere col team in tempo).

### 4 · Backlog e domande al cliente — 10 minuti

Scrivete le prime **8-10 voci di backlog**, ordinate per valore e rischio, nel
formato *"Come \<attore\> voglio \<azione\> per \<beneficio\>"* con relativo
*"Fatto quando"*. In parallelo, elencate ogni punto della richiesta cliente
che è rimasto ambiguo: non indovinatelo, scrivetelo come **domanda**.

**Producete**: backlog iniziale e lista delle domande al cliente — usando
`template/backlog.md` e `template/domande-cliente.md`, o le sezioni
equivalenti se preferite un unico file.

## Fatto quando

- Il team esiste, ha un nome, un cliente assegnato e un canale di lavoro
- `docs/requirements.md` contiene il problema in tre righe e almeno 3
  requisiti funzionali e 3 non funzionali verificabili (sì/no, non aggettivi)
- `docs/use-cases.md` elenca almeno 3 attori e, per ciascuno, almeno un caso
  d'uso nel formato attore + azione + risultato
- `docs/architecture-v1.md` elenca almeno 3 componenti, ciascuno con una riga
  di responsabilità e una di non-responsabilità, più un diagramma con frecce
  etichettate
- Il backlog ha tra 8 e 10 voci, ordinate, ciascuna con un "Fatto quando"
- Esiste una lista di almeno 3 domande da porre al cliente
- Ogni membro del team sa spiegare a voce, senza leggere, il problema del
  proprio cliente e la scelta di almeno un componente

## Errori tipici

- **Requisito non verificabile** ("il sistema deve essere intuitivo") — non
  potrete mai dire se è stato rispettato, né in questo progetto né all'esame
- **Confondere requisito con soluzione tecnica** ("usare React") — il cliente
  non ha chiesto una tecnologia, ha chiesto di risolvere un problema
- **Un componente con due responsabilità scritte con "e"** — è quasi sempre
  segno che sono due componenti, non uno
- **Ambiguità risolta a intuito** invece di scritta come domanda — vi costerà
  rilavoro quando il cliente (il docente, più avanti) la chiarirà diversamente
- **Diagramma senza etichette sulle frecce** — una scatola collegata a un'altra
  senza dire cosa ci passa sopra non è ancora un'architettura
- **Backlog con voci troppo grandi** ("fare il backend") — non è una voce di
  backlog, è un intero progetto: scomponetela

## Cosa consegnate

```
docs/
├── requirements.md      il problema, i requisiti funzionali e non funzionali
├── use-cases.md         attori e casi d'uso principali
└── architecture-v1.md   componenti, responsabilità, diagramma, dipendenze
```

- **Backlog iniziale** del team: 8-10 voci ordinate per valore e rischio
- **Lista delle domande** da porre al cliente

Oggi basta che questi file esistano e siano condivisi nel team, in qualunque
strumento stiate usando. Dalla lezione 2 vivranno nel repository Git del
progetto.

## Se restate indietro

Puntate tutto sul passo 2 e 3: senza problema-attori-casi d'uso e senza almeno
tre componenti con responsabilità chiare non avete nulla su cui costruire la
prossima lezione. Se il tempo stringe, riducete il backlog a 5 voci e le
domande al cliente a 2-3, ma non saltateli: sono l'unico modo per non
inventare da soli ciò che andava chiesto.
