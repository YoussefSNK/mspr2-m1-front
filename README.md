# FutureKawa — Front

Tableau de bord de suivi des stocks de café (siège + 3 pays), désormais un vrai
projet **React + Vite** compilable dans une pipeline CI/CD.

Ce projet remplace l'ancienne page `FutureKawa.dc.html` (un composant au format
propriétaire « Design Component » exécuté via `support.js`). Le **rendu visuel
est identique** : mêmes vues, mêmes styles, mêmes données de démonstration et
même branchement au backend central.

## Démarrer

```bash
npm install
npm run dev        # serveur de dev Vite
npm run build      # build de production -> dist/
npm run preview    # prévisualise le build
npm run lint       # ESLint
npm test           # Vitest (tests unitaires + rendu)
npm run test:watch # Vitest en mode watch
```

## Qualité & tests

- **ESLint** (`eslint.config.js`, flat config) : règles React Hooks + Fast Refresh.
- **Vitest** + Testing Library (jsdom) :
  - `src/lib/model.test.js` — logique métier (mappings pays, statuts, modèle de démo, FIFO).
  - `src/App.test.jsx` — rendu de l'app (vue d'ensemble, KPIs, mode démo).

## CI/CD — Jenkins

Un `Jenkinsfile` à la racine décrit la pipeline (job **front** distinct du back) :

`Checkout → Install (npm ci) → Lint → Test → Build → Archive (dist/**) → Docker Image`

Pré-requis côté Jenkins : une installation NodeJS nommée **`node20`**
(Manage Jenkins → Tools → NodeJS installations). Le stage Docker ne s'exécute
que si `docker` est présent sur l'agent.

## Docker

Image statique servie par nginx (`Dockerfile` multi-stage + `nginx.conf` avec
fallback SPA) :

```bash
docker build -t futurekawa/frontend:latest .
docker run -p 8080:80 futurekawa/frontend:latest   # http://localhost:8080
```

## Backend central

Le front ne parle **qu'au backend central** (`Frontend → Backend central →
backends pays`). URL du central, par ordre de priorité :

1. paramètre d'URL `?centralUrl=http://...`
2. `window.CENTRAL_URL`
3. variable d'environnement Vite `VITE_CENTRAL_URL`
4. défaut : `http://localhost:9000`

Si le central est injoignable, l'app bascule automatiquement en **mode démo**
(données factices) pour rester présentable.

Astuce : `?dark=1` force le thème sombre au démarrage.

## Structure

```
index.html            point d'entrée + polices Google
src/
  main.jsx            montage React
  App.jsx             état, chargement API, logique de rendu (renderVals)
  index.css           variables de thème, keyframes, styles globaux
  components/         vues (Sidebar, Topbar, Dashboard, Stocks, LotDetail, Alerts, Hover)
  lib/
    model.js          modèle métier + mappers API + données de démo
    chart.jsx         graphiques SVG (aires lissées, bande de tolérance)
    icons.jsx         jeu d'icônes SVG
    api.js            client HTTP du backend central
    style.js          conversion chaîne CSS -> objet style React
```

## Notes de migration

- Le fichier `FutureKawa.dc.html` d'origine et `support.js` sont conservés pour
  référence mais ne sont plus utilisés par le build.
- Toute la logique (calcul du modèle, statuts, FIFO, graphiques) a été portée
  telle quelle depuis le composant d'origine pour garantir un comportement
  identique.
