import "server-only";
import { z } from "zod";
import { cambiaStatoSchema, creaSegnalazioneSchema } from "./validation/segnalazioni";
import {
  annullaSchema,
  assegnazioneInputSchema,
  categoriaInputSchema,
  luogoInputSchema,
  notaInputSchema,
  segnalazioneUpdateSchema,
  statoInputSchema,
  transizioneInputSchema,
  utenteCreateSchema,
  utenteUpdateSchema,
} from "./validation/gestione";

const fromZod = (schema: z.ZodType) => {
  const jsonSchema: Record<string, unknown> = z.toJSONSchema(schema);
  delete jsonSchema.$schema;
  return jsonSchema;
};

const idPath = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer", minimum: 1 },
};

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

const body = (schemaName: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: `#/components/schemas/${schemaName}` } } },
});

const protetto = [{ bearerAuth: [] }];

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Smart Maintenance API",
    version: "0.1.0",
    description:
      "API per la gestione delle segnalazioni e delle anagrafiche di manutenzione. " +
      "Le route protette richiedono un access token Supabase come Bearer token. " +
      "I permessi sono verificati dal backend tramite il ruolo associato all'utente applicativo.",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Sistema" },
    { name: "Autenticazione" },
    { name: "Anagrafiche" },
    { name: "Segnalazioni" },
    { name: "Gestione" },
    { name: "Workflow" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token Supabase ottenuto dopo il login.",
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
      CreaSegnalazione: fromZod(creaSegnalazioneSchema),
      ModificaSegnalazione: fromZod(segnalazioneUpdateSchema),
      CambiaStato: fromZod(cambiaStatoSchema),
      Annulla: fromZod(annullaSchema),
      Categoria: fromZod(categoriaInputSchema),
      Luogo: fromZod(luogoInputSchema),
      Nota: fromZod(notaInputSchema),
      Assegnazione: fromZod(assegnazioneInputSchema),
      Utente: fromZod(utenteCreateSchema),
      ModificaUtente: fromZod(utenteUpdateSchema),
      StatoWorkflow: fromZod(statoInputSchema),
      Transizione: fromZod(transizioneInputSchema),
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Sistema"],
        summary: "Stato dell'app e della connessione al database",
        security: [],
        responses: {
          "200": { description: "App e database raggiungibili" },
          "503": { description: "Database non raggiungibile" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Autenticazione"],
        summary: "Restituisce il profilo applicativo autenticato",
        security: protetto,
        responses: {
          "200": { description: "Profilo utente e ruoli" },
          "401": errore("Sessione non valida o utente non abilitato"),
        },
      },
    },
    "/categorie": {
      get: {
        tags: ["Anagrafiche"],
        summary: "Categorie attive",
        security: [],
        responses: { "200": listaDi("Elenco categorie") },
      },
      post: {
        tags: ["Anagrafiche"],
        summary: "Crea una categoria",
        security: protetto,
        requestBody: body("Categoria"),
        responses: { "201": { description: "Categoria creata" }, "400": errore("Dati non validi"), "403": errore("Ruolo non autorizzato") },
      },
    },
    "/categorie/{id}": {
      patch: {
        tags: ["Anagrafiche"],
        summary: "Modifica o riattiva una categoria",
        security: protetto,
        parameters: [idPath],
        requestBody: body("Categoria"),
        responses: { "200": { description: "Categoria aggiornata" }, "404": errore("Categoria non trovata") },
      },
      delete: {
        tags: ["Anagrafiche"],
        summary: "Disattiva una categoria",
        security: protetto,
        parameters: [idPath],
        responses: { "200": { description: "Categoria disattivata" }, "403": errore("Ruolo non autorizzato") },
      },
    },
    "/priorita": {
      get: {
        tags: ["Anagrafiche"],
        summary: "Priorità ordinate per livello",
        security: [],
        responses: { "200": listaDi("Elenco priorità") },
      },
    },
    "/stati": {
      get: {
        tags: ["Anagrafiche"],
        summary: "Stati attivi del workflow",
        security: protetto,
        responses: { "200": listaDi("Elenco stati") },
      },
    },
    "/luoghi": {
      get: {
        tags: ["Anagrafiche"],
        summary: "Luoghi attivi",
        security: [],
        responses: { "200": listaDi("Elenco luoghi") },
      },
      post: {
        tags: ["Anagrafiche"],
        summary: "Crea un luogo",
        security: protetto,
        requestBody: body("Luogo"),
        responses: { "201": { description: "Luogo creato" }, "400": errore("Dati o gerarchia non validi") },
      },
    },
    "/luoghi/{id}": {
      patch: {
        tags: ["Anagrafiche"],
        summary: "Modifica un luogo",
        security: protetto,
        parameters: [idPath],
        requestBody: body("Luogo"),
        responses: { "200": { description: "Luogo aggiornato" }, "409": errore("Gerarchia o riferimenti incompatibili") },
      },
      delete: {
        tags: ["Anagrafiche"],
        summary: "Archivia un luogo",
        security: protetto,
        parameters: [idPath],
        responses: { "200": { description: "Luogo archiviato" }, "409": errore("Archiviare prima figli o segnalazioni associate") },
      },
    },
    "/segnalazioni": {
      get: {
        tags: ["Segnalazioni"],
        summary: "Lista segnalazioni con filtri e paginazione",
        security: protetto,
        parameters: [
          queryInt("statoId", "Filtra per stato"),
          queryInt("categoriaId", "Filtra per categoria"),
          queryInt("luogoId", "Filtra per luogo"),
          queryInt("tecnicoId", "Filtra per tecnico assegnato"),
          { name: "dal", in: "query", schema: { type: "string", format: "date" } },
          { name: "al", in: "query", schema: { type: "string", format: "date" } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: { "200": { description: "Pagina di segnalazioni" }, "401": errore("Autenticazione richiesta") },
      },
      post: {
        tags: ["Segnalazioni"],
        summary: "Crea una segnalazione nello stato iniziale",
        security: protetto,
        requestBody: body("CreaSegnalazione"),
        responses: { "201": { description: "Segnalazione creata" }, "400": errore("Dati non validi"), "403": errore("Ruolo non autorizzato") },
      },
    },
    "/segnalazioni/{id}": {
      get: {
        tags: ["Segnalazioni"],
        summary: "Dettaglio con storico, assegnazioni, note e allegati",
        security: protetto,
        parameters: [idPath],
        responses: { "200": { description: "Dettaglio e transizioni consentite" }, "404": errore("Segnalazione non trovata") },
      },
      patch: {
        tags: ["Segnalazioni"],
        summary: "Modifica i campi della segnalazione",
        security: protetto,
        parameters: [idPath],
        requestBody: body("ModificaSegnalazione"),
        responses: { "200": { description: "Segnalazione aggiornata" }, "403": errore("Modifica non autorizzata"), "404": errore("Segnalazione non trovata") },
      },
      delete: {
        tags: ["Segnalazioni"],
        summary: "Archivia logicamente una segnalazione",
        security: protetto,
        parameters: [idPath],
        requestBody: body("Annulla"),
        responses: { "200": { description: "Segnalazione archiviata" }, "403": errore("Ruolo non autorizzato") },
      },
    },
    "/segnalazioni/{id}/stato": {
      patch: {
        tags: ["Segnalazioni"],
        summary: "Cambia lo stato secondo il workflow configurato",
        security: protetto,
        parameters: [idPath],
        requestBody: body("CambiaStato"),
        responses: { "200": { description: "Stato aggiornato" }, "400": errore("Transizione non ammessa"), "409": errore("Conflitto di stato") },
      },
    },
    "/segnalazioni/{id}/note": {
      get: {
        tags: ["Segnalazioni"],
        summary: "Elenca le note non archiviate",
        security: protetto,
        parameters: [idPath],
        responses: { "200": listaDi("Note della segnalazione") },
      },
      post: {
        tags: ["Segnalazioni"],
        summary: "Aggiunge una nota",
        security: protetto,
        parameters: [idPath],
        requestBody: body("Nota"),
        responses: { "201": { description: "Nota creata" }, "403": errore("Ruolo non autorizzato") },
      },
    },
    "/note/{id}": {
      patch: {
        tags: ["Gestione"],
        summary: "Modifica una nota",
        security: protetto,
        parameters: [idPath],
        requestBody: body("Nota"),
        responses: { "200": { description: "Nota aggiornata" }, "403": errore("Modifica non autorizzata") },
      },
      delete: {
        tags: ["Gestione"],
        summary: "Archivia una nota",
        security: protetto,
        parameters: [idPath],
        responses: { "200": { description: "Nota archiviata" }, "403": errore("Ruolo non autorizzato") },
      },
    },
    "/segnalazioni/{id}/assegnazioni": {
      get: {
        tags: ["Segnalazioni"],
        summary: "Elenca le assegnazioni attive",
        security: protetto,
        parameters: [idPath],
        responses: { "200": listaDi("Assegnazioni attive") },
      },
      post: {
        tags: ["Segnalazioni"],
        summary: "Assegna un tecnico",
        security: protetto,
        parameters: [idPath],
        requestBody: body("Assegnazione"),
        responses: { "201": { description: "Tecnico assegnato" }, "409": errore("Assegnazione già presente") },
      },
    },
    "/assegnazioni/{id}": {
      delete: {
        tags: ["Gestione"],
        summary: "Archivia un'assegnazione",
        security: protetto,
        parameters: [idPath],
        responses: { "200": { description: "Assegnazione archiviata" } },
      },
    },
    "/tecnici": {
      get: { tags: ["Gestione"], summary: "Elenco tecnici attivi", security: protetto, responses: { "200": listaDi("Tecnici") } },
      post: {
        tags: ["Gestione"],
        summary: "Crea un utente con ruolo Tecnico",
        security: protetto,
        requestBody: body("Utente"),
        responses: { "201": { description: "Tecnico creato" }, "400": errore("Dati non validi") },
      },
    },
    "/tecnici/{id}": {
      patch: {
        tags: ["Gestione"],
        summary: "Modifica un tecnico",
        security: protetto,
        parameters: [idPath],
        requestBody: body("ModificaUtente"),
        responses: { "200": { description: "Tecnico aggiornato" }, "404": errore("Tecnico non trovato") },
      },
      delete: {
        tags: ["Gestione"],
        summary: "Disattiva un tecnico",
        security: protetto,
        parameters: [idPath],
        responses: { "200": { description: "Tecnico disattivato" } },
      },
    },
    "/utenti": {
      get: { tags: ["Gestione"], summary: "Elenco utenti", security: protetto, responses: { "200": listaDi("Utenti") } },
      post: {
        tags: ["Gestione"],
        summary: "Crea utente applicativo e account Supabase Auth",
        security: protetto,
        requestBody: body("Utente"),
        responses: { "201": { description: "Utente creato" }, "503": errore("Provisioning Supabase non configurato") },
      },
    },
    "/utenti/{id}": {
      patch: {
        tags: ["Gestione"],
        summary: "Modifica o riattiva un utente",
        security: protetto,
        parameters: [idPath],
        requestBody: body("ModificaUtente"),
        responses: { "200": { description: "Utente aggiornato" }, "409": errore("Non è possibile rimuovere un ruolo tecnico con dati storici") },
      },
      delete: {
        tags: ["Gestione"],
        summary: "Disattiva un utente",
        security: protetto,
        parameters: [idPath],
        responses: { "200": { description: "Utente disattivato" } },
      },
    },
    "/workflow/stati": {
      get: { tags: ["Workflow"], summary: "Stati attivi del workflow", security: protetto, responses: { "200": listaDi("Stati") } },
      post: {
        tags: ["Workflow"],
        summary: "Crea uno stato",
        security: protetto,
        requestBody: body("StatoWorkflow"),
        responses: { "201": { description: "Stato creato" } },
      },
    },
    "/workflow/stati/{id}": {
      patch: {
        tags: ["Workflow"],
        summary: "Modifica uno stato",
        security: protetto,
        parameters: [idPath],
        requestBody: body("StatoWorkflow"),
        responses: { "200": { description: "Stato aggiornato" }, "409": errore("Ordine già utilizzato") },
      },
      delete: {
        tags: ["Workflow"],
        summary: "Archivia uno stato non utilizzato",
        security: protetto,
        parameters: [idPath],
        responses: { "200": { description: "Stato archiviato" }, "409": errore("Stato ancora referenziato") },
      },
    },
    "/workflow/transizioni": {
      get: { tags: ["Workflow"], summary: "Elenco transizioni configurate", security: protetto, responses: { "200": listaDi("Transizioni") } },
      post: {
        tags: ["Workflow"],
        summary: "Aggiunge una transizione consentita",
        security: protetto,
        requestBody: body("Transizione"),
        responses: { "201": { description: "Transizione creata" }, "400": errore("Stati non validi") },
      },
    },
    "/workflow/transizioni/{id}": {
      delete: {
        tags: ["Workflow"],
        summary: "Rimuove una transizione",
        security: protetto,
        parameters: [idPath],
        responses: { "200": { description: "Transizione rimossa" } },
      },
    },
  },
};
