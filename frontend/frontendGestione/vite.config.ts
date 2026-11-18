import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In sviluppo (npm run dev) le chiamate relative a /api vanno al backend
    // Next.js locale, come fa l'Ingress nel cluster: stesso codice, nessun
    // URL del backend scritto nel frontend.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
