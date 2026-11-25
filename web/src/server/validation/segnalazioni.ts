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

const SOLO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const UN_GIORNO_MENO_1MS = 24 * 60 * 60 * 1000 - 1;

/**
 * Fine del periodo. "al=2026-10-01" vuol dire "fino a tutto il 1 ottobre":
 * una data senza ora diventa 23:59:59.999 (UTC) di quel giorno, non la
 * mezzanotte iniziale (bug-report-43). Con data e ora esplicite il limite resta quello.
 */
const fineperiodo = z
  .string()
  .transform((v, ctx) => {
    const data = new Date(v);
    if (Number.isNaN(data.getTime())) {
      ctx.addIssue({ code: "custom", message: "Data non valida" });
      return z.NEVER;
    }
    return SOLO_DATA.test(v) ? new Date(data.getTime() + UN_GIORNO_MENO_1MS) : data;
  });

export const filtriSegnalazioniSchema = z.object({
  statoId: id.optional(),
  categoriaId: id.optional(),
  luogoId: id.optional(),
  tecnicoId: id.optional(),
  dal: z.coerce.date().optional(),
  al: fineperiodo.optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type FiltriSegnalazioni = z.infer<typeof filtriSegnalazioniSchema>;
