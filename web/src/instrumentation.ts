// Chiamata da Next.js una sola volta all'avvio del server, prima di servire
// richieste. Qui validiamo la configurazione: se manca qualcosa il processo
// esce subito con un messaggio chiaro su stderr (fail-fast).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { loadConfig } = await import("./server/config");
  try {
    loadConfig();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
