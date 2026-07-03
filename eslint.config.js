import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// Configuration ESLint « flat config » (ESLint 9+/10) pour un projet React + Vite.
export default [
  // Dossiers/fichiers à ne jamais linter.
  // support.js et FutureKawa.dc.html : ancien runtime « Design Component »,
  // conservé pour référence mais plus utilisé par le build Vite.
  { ignores: ['dist', 'node_modules', 'support.js'] },

  // Règles de base recommandées par ESLint.
  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser, // window, document, fetch, console, URLSearchParams…
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Bonnes pratiques des Hooks (dépendances useEffect/useMemo, etc.).
      ...reactHooks.configs.recommended.rules,
      // Prévient les exports qui cassent le Fast Refresh de Vite.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Autorise les variables inutilisées commençant par une majuscule ou _
      // (utile pour les imports JSX et les args ignorés volontairement).
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
]
