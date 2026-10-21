import { z } from "zod";

const id = z.coerce.number().int().positive();

export const idParam = z.object({ id });

export const creaSegnalazioneSchema = z.object({
  titolo: z.string().trim().min(3).max(200),
  descrizione: z.string().trim().min(10).max(5000),
  luogoId: id,
  categoriaId: id,
  prioritaPropostaId: id,
});
export type CreaSegnalazioneInput = z.infer<typeof creaSegnalazioneSchema>;

export const cambiaStatoSchema = z.object({
  statoId: id,
  motivo: z.string().trim().max(1000).optional(),
});
export type CambiaStatoInput = z.infer<typeof cambiaStatoSchema>;

export const filtriSegnalazioniSchema = z.object({
  statoId: id.optional(),
  categoriaId: id.optional(),
  luogoId: id.optional(),
  tecnicoId: id.optional(),
  dal: z.coerce.date().optional(),
  al: z.coerce.date().optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type FiltriSegnalazioni = z.infer<typeof filtriSegnalazioniSchema>;
