// Dati demo per provare le API. Ruoli, stati, priorità e categorie sono già
// su Supabase e qui vengono solo letti. Idempotente: rilanciarlo non duplica nulla.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// `npm run db:seed -- --solo-utenti` crea solo gli utenti, senza luoghi e segnalazioni.
const SOLO_UTENTI = process.argv.includes("--solo-utenti");

// Password demo uguale per tutti: solo per sviluppo.
const PASSWORD_DEMO = "password";

const UTENTI = [
  { nome: "Sara", cognome: "Segnalatrice", email: "segnalatore@demo.it", ruolo: "Segnalatore" },
  { nome: "Tommaso", cognome: "Tecnico", email: "tecnico@demo.it", ruolo: "Tecnico" },
  { nome: "Rita", cognome: "Responsabile", email: "responsabile@demo.it", ruolo: "Responsabile manutenzione" },
  { nome: "Andrea", cognome: "Admin", email: "admin@demo.it", ruolo: "Amministratore" },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);
  const utenti: Record<string, number> = {};

  for (const u of UTENTI) {
    const ruolo = await db.ruolo.findUniqueOrThrow({ where: { nome: u.ruolo } });
    // L'unicità dell'email è su lower(email): niente findUnique, si cerca case-insensitive.
    const esistente = await db.utente.findFirst({
      where: { email: { equals: u.email, mode: "insensitive" } },
    });
    const utente =
      esistente ??
      (await db.utente.create({
        data: {
          nome: u.nome,
          cognome: u.cognome,
          email: u.email,
          passwordHash,
          ruoli: { create: { ruoloId: ruolo.id } },
        },
      }));
    utenti[u.ruolo] = utente.id;
  }

  await db.tecnico.upsert({
    where: { utenteId: utenti["Tecnico"] },
    update: {},
    create: { utenteId: utenti["Tecnico"], tipo: "interno", specializzazione: "Elettrico" },
  });

  if (SOLO_UTENTI) return stampaUtenti(utenti);

  // Luoghi: niente chiavi naturali, quindi si creano solo se la tabella è vuota.
  // Vincoli DB: tipo in (edificio, area, impianto); solo un edificio è senza padre.
  if ((await db.luogo.count()) === 0) {
    const sede = await db.luogo.create({
      data: { nome: "Sede Centrale", tipo: "edificio", via: "Via Roma 1", citta: "Milano", cap: "20100" },
    });
    const piano1 = await db.luogo.create({ data: { nome: "Piano 1", tipo: "area", padreId: sede.id } });
    await db.luogo.createMany({
      data: [
        { nome: "Sala riunioni A", tipo: "area", padreId: piano1.id },
        { nome: "Bagno uomini", tipo: "area", padreId: piano1.id },
        { nome: "Centrale termica", tipo: "impianto", padreId: sede.id },
      ],
    });
    await db.luogo.create({
      data: { nome: "Magazzino Nord", tipo: "edificio", via: "Via Milano 50", citta: "Bergamo", cap: "24100" },
    });
  }

  if ((await db.segnalazione.count()) === 0) {
    const segnalato = await db.stato.findUniqueOrThrow({ where: { nome: "Segnalato" } });
    const sala = await db.luogo.findFirstOrThrow({ where: { nome: "Sala riunioni A" } });
    const bagno = await db.luogo.findFirstOrThrow({ where: { nome: "Bagno uomini" } });
    const elettrico = await db.categoria.findUniqueOrThrow({ where: { nome: "Elettrico" } });
    const idraulico = await db.categoria.findUniqueOrThrow({ where: { nome: "Idraulico" } });
    const alta = await db.priorita.findUniqueOrThrow({ where: { nome: "Alta" } });
    const media = await db.priorita.findUniqueOrThrow({ where: { nome: "Media" } });
    const segnalatoreId = utenti["Segnalatore"];

    const demo = [
      {
        titolo: "Luci sala riunioni non funzionanti",
        descrizione: "Metà delle plafoniere della sala riunioni A non si accendono da stamattina.",
        luogoId: sala.id,
        categoriaId: elettrico.id,
        prioritaPropostaId: alta.id,
      },
      {
        titolo: "Perdita lavandino",
        descrizione: "Il lavandino del bagno uomini al piano 1 perde acqua dal sifone.",
        luogoId: bagno.id,
        categoriaId: idraulico.id,
        prioritaPropostaId: media.id,
      },
    ];
    for (const d of demo) {
      await db.segnalazione.create({
        data: {
          ...d,
          statoId: segnalato.id,
          segnalatoreId,
          storicoStati: { create: { statoNuovoId: segnalato.id, modificatoDaId: segnalatoreId } },
        },
      });
    }
  }

  stampaUtenti(utenti);
}

function stampaUtenti(utenti: Record<string, number>) {
  console.log("Seed completato. Utenti demo (password: %s) — usa l'id come header x-user-id:", PASSWORD_DEMO);
  console.table(Object.entries(utenti).map(([ruolo, id]) => ({ id, ruolo })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
