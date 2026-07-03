import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configuration des tests (Vitest).
  test: {
    environment: 'jsdom',        // DOM simulé pour tester le rendu React
    globals: true,               // expose describe/it/expect sans import
    setupFiles: './src/test/setup.js',
    css: false,                  // pas besoin de traiter le CSS dans les tests
  },
})
