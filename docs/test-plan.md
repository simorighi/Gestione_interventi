# Test plan — [Nome progetto]

| Progetto | Team / cliente | Data | Versione |
|---|---|---|---|
| *nome del progetto* | *nome del team / cliente simulato* | *gg/mm/aaaa* | *v0.1* |

*Questo file va salvato come `docs/test-plan.md` nel repository del
progetto. Una riga per ogni caso di test: non serve testare tutto, serve
testare ciò che decide qualcosa (logica di business, casi limite, ciò che è
già stato rotto una volta).*

## Caso d'uso

*Il caso d'uso da cui nasce questa matrice, in una frase — copiato o
adattato da `docs/use-cases.md`.*

> Esempio (Smart Maintenance): "Il tecnico aggiorna lo stato di un
> intervento assegnato; il segnalatore vede il nuovo stato."

## Matrice requisito → caso di test → esito

*Ogni riga collega un requisito o un vincolo del caso d'uso a un caso di
test concreto. La colonna "Tipo" dichiara il livello (unit / integration /
e2e) senza imporre lo strumento. La colonna "Esito" si aggiorna quando il
test viene eseguito davvero — non prima.*

| # | Requisito / vincolo | Caso di test | Input / precondizioni | Risultato atteso | Tipo | Esito |
|---|---|---|---|---|---|---|
| 1 | *transizione di stato valida* | *happy path* | *tecnico assegnato, transizione consentita* | *200, nuovo stato salvato* | *unit* | *passa (gg/mm)* |
| 2 | *non si salta uno stato* | *transizione non valida* | *`segnalato` → `risolto` senza passaggi intermedi* | *400, stato invariato* | *unit* | *da eseguire* |
| 3 | *solo il tecnico assegnato modifica* | *permesso mancante* | *un tecnico diverso da quello assegnato* | *403* | *integration* | *da eseguire* |
| 4 | *risorsa deve esistere* | *id inesistente* | *id di un intervento non presente* | *404* | *integration* | *da eseguire* |
| 5 | *dati minimi obbligatori* | *body malformato* | *campo obbligatorio assente* | *400* | *integration* | *da eseguire* |

*Aggiungete righe per il vostro dominio: sostituite l'esempio, non
limitatevi a copiarlo. Ogni riga negativa (permesso, risorsa inesistente,
input sporco) è tanto importante quanto la riga happy path — spesso di più,
perché è quella che in produzione capita davvero.*

## Note

*Cosa avete scoperto scrivendo i test che non era chiaro leggendo solo i
requisiti (ambiguità, caso non previsto, comportamento da confermare col
cliente simulato).*

> Esempio: "Il requisito non dice cosa succede se il tecnico assegnato viene
> rimosso mentre l'intervento è aperto: da verificare con il committente."
