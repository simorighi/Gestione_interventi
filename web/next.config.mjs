// web/next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Validazione "Fail Fast" all'avvio del server per la configurazione CORS
    if (!process.env.CORS_ORIGIN) {
      console.error("ERRORE FATALE: Variabile d'ambiente CORS_ORIGIN non configurata.");
      process.exit(1);
    }

    return [
      {
        // Applica le regole CORS a tutte le rotte API
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGIN },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  }
};

export default nextConfig;
