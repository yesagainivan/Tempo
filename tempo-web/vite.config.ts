import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Allow deployment to subpath (like GH Pages)
  plugins: [
    react(),
    tailwindcss(),
  ],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@powersync/web'],
    include: ['@powersync/web > js-logger'],
  },
})
