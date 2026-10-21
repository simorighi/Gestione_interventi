# Progetto: <nome progetto>  ·  Team: <nome team>  ·  Data: <gg/mm/aaaa>  ·  v0.1
#
# Scheletro di Dockerfile: la sintassi delle istruzioni (FROM, COPY, RUN, ...)
# è la stessa per qualunque linguaggio. Quello che cambia — e che dovete
# decidere voi, in base allo stack scelto dal team — sono i valori. Ogni punto
# sotto è una decisione da motivare, non da copiare.
#
# ISTRUZIONE: scegliete un'immagine base MINIMALE per il vostro runtime, con
# un tag di versione preciso (mai ":latest": non sapreste più cosa gira).
# ESEMPIO (Smart Maintenance, se il backend fosse Node.js): node:20-alpine
# Altri runtime hanno equivalenti "slim"/"alpine" propri: valutate dimensione
# dell'immagine finale e superficie di attacco, non solo comodità.
FROM <immagine-base>:<tag-versione>

# ISTRUZIONE: una cartella di lavoro dentro il container, per non sporcare /.
WORKDIR /app

# ISTRUZIONE: copiate PRIMA solo i file che descrivono le dipendenze
# (es. package.json+lock, requirements.txt, pom.xml, go.mod...), poi
# installatele, e SOLO DOPO copiate il resto del codice. Se invertite
# l'ordine, ogni modifica al codice invalida la cache e reinstalla tutto da
# capo a ogni build: più lento, non più sicuro.
COPY <file-dipendenze> ./
RUN <comando-installazione-dipendenze>
COPY . .

# ISTRUZIONE: non fate girare il processo come root dentro il container. Se
# l'immagine base non ha già un utente non privilegiato pronto, createlo e
# passate a quello prima del CMD/ENTRYPOINT.
# ESEMPIO: RUN adduser -D appuser   (sintassi Alpine; varia con la distro)
RUN <crea-utente-non-root>
USER <nome-utente-non-root>

# ISTRUZIONE: EXPOSE è documentazione — dichiara la porta su cui il processo
# ascolta dentro il container. Non apre nulla da sola: deve combaciare con
# containerPort/targetPort nei manifest Kubernetes (Passo 2 del laboratorio).
# ESEMPIO (Smart Maintenance): il backend ascolta su 8080.
EXPOSE <porta>

# ISTRUZIONE: il comando che avvia davvero il processo. Preferite la forma
# "exec" (array), non quella con la shell: il processo riceve correttamente i
# segnali di stop da Kubernetes.
CMD ["<comando-avvio>", "<eventuale-argomento>"]

# Checklist prima di buildare:
# [ ] l'immagine base è la più piccola che copre le vostre dipendenze reali
# [ ] nessuna credenziale o file .env è stato copiato dentro l'immagine
# [ ] il processo NON gira come root (verificabile con: docker run --rm <img> whoami)
# [ ] la porta in EXPOSE è quella davvero usata dal processo
# [ ] il tag della build (es. 1.0.0) è lo stesso che scriverete nei manifest
