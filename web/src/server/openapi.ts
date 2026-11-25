import "server-only";
import { z } from "zod";
import { loginSchema } from "./validation/auth";
import { cambiaStatoSchema, creaSegnalazioneSchema } from "./validation/segnalazioni";

/**
 * Specifica OpenAPI delle API, servita su /api/openapi.json e mostrata da Swagger UI su /api/docs.
 * I body delle richieste sono generati dagli schemi zod: documentazione e validazione
 * non possono divergere. Quando aggiungi un endpoint, aggiungilo anche qui.
 */

// OpenAPI 3.1 accetta JSON Schema così com'è; togliamo solo la dichiarazione $schema.
const fromZod = (schema: z.ZodType) => {
  const jsonSchema: Record<string, unknown> = z.toJSONSchema(schema);
  delete jsonSchema.$schema;
  return jsonSchema;
};

const idPath = (descrizione: string) => ({
  name: "id",
  in: "path",
  required: true,
  description: descrizione,
  schema: { type: "integer", minimum: 1 },
});

const queryInt = (name: string, description: string) => ({
  name,
  in: "query",
  required: false,
  description,
  schema: { type: "integer", minimum: 1 },
});

const errore = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Errore" } } },
});

const listaDi = (description: string) => ({
  description,
  content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
});

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Smart Maintenance API",
    version: "0.1.0",
    description:
      "API per la gestione delle segnalazioni di manutenzione.\n\n" +
      "**Autenticazione**: chiama `POST /auth/login` con email e password, copia il `token` della risposta, " +
      "clicca **Authorize** e incollalo. Le richieste successive inviano `Authorization: Bearer <token>`.",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Sistema" },
    { name: "Autenticazione" },
    { name: "Anagrafiche", description: "Dati di riferimento (sola lettura)" },
    { name: "Segnalazioni" },
  ],
  components: {
    securitySchemes: {
      utenteCorrente: {
        type: "http",
        scheme: "bearer",
        description: "Token restituito da POST /auth/login (firmato dal server, con scadenza)",
      },
    },
    schemas: {
      Errore: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", examples: ["VALIDATION_ERROR"] },
              message: { type: "string" },
              details: {},
            },
            required: ["code", "message"],
          },
        },
      },
      Login: fromZod(loginSchema),
      CreaSegnalazione: fromZod(creaSegnalazioneSchema),
      CambiaStato: fromZod(cambiaStatoSchema),
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Sistema"],
        summary: "Stato dell'app e della connessione al database",
        responses: {
          "200": { description: "App e database raggiungibili" },
          "503": { description: "Database non raggiungibile" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Autenticazione"],
        summary: "Accesso con email e password: restituisce il token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Login" },
              example: { email: "tecnico@demo.it", password: "password" },
            },
          },
        },
        responses: {
          "200": { description: "{ token, tokenType, expiresIn, utente }" },
          "400": errore("Dati non validi"),
          "401": errore("Email o password non corrette"),
          "429": errore("Troppi tentativi falliti: riprovare tra 15 minuti"),
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Autenticazione"],
        summary: "Utente del token corrente, con i ruoli",
        security: [{ utenteCorrente: [] }],
        responses: { "200": { description: "Utente corrente" }, "401": errore("Token mancante, scaduto o non valido") },
      },
    },
    "/categorie": {
      get: { tags: ["Anagrafiche"], summary: "Categorie attive", responses: { "200": listaDi("Elenco categorie") } },
    },
    "/priorita": {
      get: { tags: ["Anagrafiche"], summary: "Priorità (per livello)", responses: { "200": listaDi("Elenco priorità") } },
    },
    "/stati": {
      get: { tags: ["Anagrafiche"], summary: "Stati del workflow (per ordine)", responses: { "200": listaDi("Elenco stati") } },
    },
    "/luoghi": {
      get: { tags: ["Anagrafiche"], summary: "Luoghi (edifici, aree, impianti)", responses: { "200": listaDi("Elenco luoghi") } },
    },
    "/segnalazioni": {
      get: {
        tags: ["Segnalazioni"],
        summary: "Lista segnalazioni con filtri e paginazione",
        parameters: [
          queryInt("statoId", "Filtra per stato"),
          queryInt("categoriaId", "Filtra per categoria"),
          queryInt("luogoId", "Filtra per luogo"),
          queryInt("tecnicoId", "Solo segnalazioni assegnate a questo tecnico"),
          { name: "dal", in: "query", description: "Creata a partire da (es. 2026-10-01)", schema: { type: "string", format: "date" } },
          { name: "al", in: "query", description: "Creata entro (es. 2026-10-31)", schema: { type: "string", format: "date" } },
          { name: "q", in: "query", description: "Testo cercato in titolo e descrizione", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          "200": {
            description: "Pagina di risultati",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: { type: "array", items: { type: "object" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    pageSize: { type: "integer" },
                  },
                },
              },
            },
          },
          "400": errore("Filtri non validi"),
        },
      },
      post: {
        tags: ["Segnalazioni"],
        summary: "Crea una segnalazione (stato iniziale: Segnalato)",
        description: "Ruoli ammessi: Segnalatore, Responsabile manutenzione, Amministratore.",
        security: [{ utenteCorrente: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreaSegnalazione" },
              example: {
                titolo: "Condizionatore rumoroso",
                descrizione: "Il condizionatore della sala riunioni fa un forte rumore all'accensione.",
                luogoId: 1,
                categoriaId: 3,
                prioritaPropostaId: 2,
              },
            },
          },
        },
        responses: {
          "201": { description: "Segnalazione creata" },
          "400": errore("Dati non validi o riferimento inesistente"),
          "401": errore("Token mancante, scaduto o non valido"),
          "403": errore("Ruolo non autorizzato"),
        },
      },
    },
    "/segnalazioni/{id}": {
      get: {
        tags: ["Segnalazioni"],
        summary: "Dettaglio con storico stati, assegnazioni, note e allegati",
        parameters: [idPath("Id della segnalazione")],
        responses: {
          "200": { description: "Segnalazione, con `transizioniAmmesse` (stati raggiungibili da quello attuale)" },
          "404": errore("Segnalazione non trovata"),
        },
      },
    },
    "/segnalazioni/{id}/stato": {
      patch: {
        tags: ["Segnalazioni"],
        summary: "Cambia lo stato seguendo il workflow",
        description:
          "Transizioni ammesse: Segnalato → Preso in carico → In lavorazione → Sospeso / Risolto; " +
          "Sospeso → In lavorazione. Scrive storico_stato e log_audit.\n\n" +
          "Ruoli ammessi: Tecnico, Responsabile manutenzione, Amministratore.",
        security: [{ utenteCorrente: [] }],
        parameters: [idPath("Id della segnalazione")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CambiaStato" },
              example: { statoId: 2, motivo: "Presa in carico dal responsabile" },
            },
          },
        },
        responses: {
          "200": { description: "Segnalazione aggiornata" },
          "400": errore("Transizione non ammessa o dati non validi"),
          "401": errore("Token mancante, scaduto o non valido"),
          "403": errore("Ruolo non autorizzato"),
          "404": errore("Segnalazione non trovata"),
          "409": errore("Modificata nel frattempo da un altro utente"),
        },
      },
    },
  },
};
