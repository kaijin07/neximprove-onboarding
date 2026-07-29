import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development the React dev server and the Express API run on different
    // ports. This proxy forwards /api/* to the backend so the browser only ever
    // talks to one origin — which means no CORS preflight and, importantly, the
    // same relative "/api" base URL works in production, where Express serves
    // this app's built files itself.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
