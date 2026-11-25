import type { NextConfig } from "next";

// Unico file di configurazione di Next.js. (Prima esisteva anche
// next.config.mjs: Next legge solo il primo che trova, .mjs prima di .ts,
// quindi le opzioni qui sotto venivano ignorate senza nessun avviso.)
// CORS e header di sicurezza sono in src/proxy.ts, perché devono leggere le
// variabili d'ambiente a runtime e non al momento del build.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Non dichiarare "X-Powered-By: Next.js" a chi chiama l'API.
  poweredByHeader: false,
  // Immagine Docker di produzione più piccola: `next build` produce in
  // .next/standalone solo i file necessari a `node server.js` (vedi Dockerfile).
  output: "standalone",
};

export default nextConfig;
