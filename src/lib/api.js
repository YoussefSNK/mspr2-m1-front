// ============================================================================
//  api.js — branchement au backend central FutureKawa.
//  Le frontend ne dialogue QU'AVEC le backend central (cf. cahier des charges,
//  Fig 1 : Frontend → Backend central → backends pays). Il ne tape jamais les
//  backends pays en direct : c'est le central qui les interroge et consolide.
//
//  URL configurable via la variable d'environnement Vite VITE_CENTRAL_URL,
//  le paramètre ?centralUrl=... ou window.CENTRAL_URL. Défaut: localhost:9000.
// ============================================================================
import { flatten, paysCode } from './model'

export function centralUrl() {
  const qs = new URLSearchParams(window.location.search)
  return (
    qs.get('centralUrl') ||
    window.CENTRAL_URL ||
    import.meta.env.VITE_CENTRAL_URL ||
    'http://localhost:9000'
  )
}

export function apiGet(url) {
  return fetch(url, { headers: { Accept: 'application/json' } }).then((r) => {
    if (!r.ok) throw new Error(url + ' → HTTP ' + r.status)
    return r.json()
  })
}

// Chargement initial : santé + données consolidées de tout le réseau.
export async function loadConsolidated(base) {
  const B = base
  let healthy = false
  await apiGet(B + '/health').then(() => { healthy = true }).catch(() => { healthy = false })
  const [lots, mes, al, stocks] = await Promise.all([
    apiGet(B + '/central/lots'),
    apiGet(B + '/central/mesures'),
    apiGet(B + '/central/alertes'),
    apiGet(B + '/central/stocks').catch(() => null),
  ])
  if (stocks) console.info('[FutureKawa] /central/stocks →', stocks)
  return {
    healthy,
    consolidated: { lots: flatten(lots), mesures: flatten(mes), alertes: flatten(al) },
  }
}

// Valeur réelle de "pays" attendue par l'API, déduite des données (repli sur un slug).
export function paysParam(consolidated, code) {
  const src = (consolidated && consolidated.lots) || []
  const hit = src.find((l) => paysCode(l.pays) === code)
  return hit ? hit.pays : ({ BR: 'bresil', EC: 'equateur', CO: 'colombie' }[code] || (code || '').toLowerCase())
}

// Drill-down par pays : routes /central/pays/{pays}/*.
export async function loadPays(base, pays) {
  const B = base
  const [pl, pm, pa] = await Promise.all([
    apiGet(B + '/central/pays/' + encodeURIComponent(pays) + '/lots'),
    apiGet(B + '/central/pays/' + encodeURIComponent(pays) + '/mesures'),
    apiGet(B + '/central/pays/' + encodeURIComponent(pays) + '/alertes'),
  ])
  return { lots: flatten(pl), mesures: flatten(pm), alertes: flatten(pa) }
}
