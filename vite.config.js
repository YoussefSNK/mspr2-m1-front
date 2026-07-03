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
    coverage: {
      provider: 'v8',
      // text : résumé en console ; cobertura : XML lu par Jenkins ; html : rapport navigable.
      reporter: ['text', 'cobertura', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**'],
      // Fichiers sans logique à couvrir : point d'entrée, tests, setup.
      exclude: ['src/main.jsx', 'src/**/*.test.{js,jsx}', 'src/test/**'],
    },
  },
})
