import { z } from "zod";

const id = z.coerce.number().int().positive();
const email = z.string().trim().email().max(255);

export const categoriaInputSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  descrizione: z.string().trim().max(1000).nullable().optional(),
  attiva: z.boolean().optional(),
});

export const luogoInputSchema = z.object({
  nome: z.string().trim().min(2).max(150),
  tipo: z.enum(["edificio", "area", "impianto"]),
  via: z.string().trim().max(150).nullable().optional(),
  citta: z.string().trim().max(100).nullable().optional(),
  cap: z.string().trim().max(10).nullable().optional(),
  padreId: id.nullable().optional(),
});

export const utenteCreateSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  cognome: z.string().trim().min(1).max(100),
  email,
  password: z.string().min(12).max(128),
  ruolo: z.enum(["Segnalatore", "Tecnico", "Responsabile manutenzione", "Amministratore"]),
  specializzazione: z.string().trim().min(2).max(100).optional(),
  tipoTecnico: z.enum(["interno", "esterno"]).optional(),
  azienda: z.string().trim().max(150).optional(),
});

export const utenteUpdateSchema = z.object({
  nome: z.string().trim().min(1).max(100).optional(),
  cognome: z.string().trim().min(1).max(100).optional(),
  ruolo: z.enum(["Segnalatore", "Tecnico", "Responsabile manutenzione", "Amministratore"]).optional(),
  attivo: z.boolean().optional(),
  specializzazione: z.string().trim().min(2).max(100).nullable().optional(),
  tipoTecnico: z.enum(["interno", "esterno"]).optional(),
  azienda: z.string().trim().max(150).nullable().optional(),
});

export const notaInputSchema = z.object({
  testo: z.string().trim().min(1).max(10000),
});

export const assegnazioneInputSchema = z.object({
  tecnicoId: id,
});

export const transizioneInputSchema = z.object({
  daStatoId: id,
  aStatoId: id,
});

export const statoInputSchema = z.object({
  nome: z.string().trim().min(2).max(50),
  ordine: z.number().int().min(1),
  isFinale: z.boolean().default(false),
});

export const segnalazioneUpdateSchema = z.object({
  titolo: z.string().trim().min(3).max(200).optional(),
  descrizione: z.string().trim().min(10).max(5000).optional(),
  luogoId: id.optional(),
  categoriaId: id.optional(),
  prioritaPropostaId: id.optional(),
});

export const annullaSchema = z.object({
  motivo: z.string().trim().min(3).max(1000),
});

export const idRouteSchema = z.object({ id });
