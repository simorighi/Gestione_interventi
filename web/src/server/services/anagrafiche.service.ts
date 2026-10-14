import "server-only";
import { db } from "../db";

export function listCategorie() {
  return db.categoria.findMany({ where: { attiva: true }, orderBy: { nome: "asc" } });
}

export function listPriorita() {
  return db.priorita.findMany({ orderBy: { livello: "asc" } });
}

export function listStati() {
  return db.stato.findMany({ orderBy: { ordine: "asc" } });
}

export function listLuoghi() {
  return db.luogo.findMany({ orderBy: [{ padreId: "asc" }, { nome: "asc" }] });
}
