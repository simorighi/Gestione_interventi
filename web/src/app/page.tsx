const ENDPOINTS = [
  ["GET", "/api/health", "stato app + connessione DB"],
  ["GET", "/api/categorie", "categorie attive"],
  ["GET", "/api/priorita", "priorità"],
  ["GET", "/api/stati", "stati del workflow"],
  ["GET", "/api/luoghi", "luoghi (gerarchia)"],
  ["GET", "/api/segnalazioni", "lista con filtri e paginazione"],
  ["POST", "/api/segnalazioni", "crea segnalazione (header x-user-id)"],
  ["GET", "/api/segnalazioni/:id", "dettaglio + storico"],
  ["PATCH", "/api/segnalazioni/:id/stato", "cambio stato (header x-user-id)"],
] as const;

export default function Home() {
  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "0 16px" }}>
      <h1>Smart Maintenance — API</h1>
      <p>Endpoint disponibili (esempi pronti in <code>requests.http</code>):</p>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          {ENDPOINTS.map(([method, path, desc]) => (
            <tr key={method + path} style={{ borderTop: "1px solid #8884" }}>
              <td style={{ padding: 6 }}><code>{method}</code></td>
              <td style={{ padding: 6 }}>
                {method === "GET" && !path.includes(":") ? <a href={path}><code>{path}</code></a> : <code>{path}</code>}
              </td>
              <td style={{ padding: 6 }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
