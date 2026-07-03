import { describe, it, expect } from 'vitest'
import { buildModel } from './model'

// Helpers : dates relatives à « maintenant » pour des tests déterministes,
// indépendants de la date d'exécution (buildModel calcule l'âge via new Date()).
const DAY = 86400000
const isoDaysAgo = (n) => new Date(Date.now() - n * DAY).toISOString()

// Jeu de lots simulant une réponse du backend central (/central/lots).
const lotsRaw = [
  { id: 1, lot_code: 'BR-1001', pays: 'bresil', exploitation: 'Fazenda A', entrepot: 'Santos A1', date_stockage: isoDaysAgo(10), statut: 'conforme' },
  { id: 2, lot_code: 'BR-1002', pays: 'Brésil', exploitation: 'Fazenda B', entrepot: 'Santos A2', date_stockage: isoDaysAgo(400), statut: 'conforme' }, // vieux → périmé par l'âge
  { id: 3, lot_code: 'EC-2001', pays: 'equateur', exploitation: 'Hacienda X', entrepot: 'Loja 1', date_stockage: isoDaysAgo(20), statut: 'en_alerte' }, // alerte via statut
  { id: 4, lot_code: 'CO-3001', pays: 'colombie', exploitation: 'Finca Y', entrepot: 'Huila 1', date_stockage: isoDaysAgo(30), statut: 'expedie' }, // exclu
]

describe('buildModel — mapping des réponses du backend central', () => {
  it('mappe les champs backend vers le modèle interne', () => {
    const m = buildModel(lotsRaw, [], [])
    const lot = m.lots.find((l) => l.id === 'BR-1001')
    expect(lot).toBeDefined()
    expect(lot.dbId).toBe(1)
    expect(lot.c).toBe('BR')
    expect(lot.ex).toBe('Fazenda A')
    expect(lot.wh).toBe('Santos A1')
    expect(lot.country.name).toBe('Brésil')
    expect(lot.age).toBeGreaterThanOrEqual(9) // ~10 j
  })

  it('exclut les lots expédiés (sortis du stock)', () => {
    const m = buildModel(lotsRaw, [], [])
    expect(m.lots.some((l) => l.id === 'CO-3001')).toBe(false)
    expect(m.lots).toHaveLength(3) // 4 lots - 1 expédié
  })

  it('classe en « périmé » un lot stocké depuis plus de 365 jours', () => {
    const m = buildModel(lotsRaw, [], [])
    const vieux = m.lots.find((l) => l.id === 'BR-1002')
    expect(vieux.age).toBeGreaterThan(365)
    expect(vieux.status).toBe('perime')
  })

  it('respecte le statut « en_alerte » renvoyé par le backend', () => {
    const m = buildModel(lotsRaw, [], [])
    const ec = m.lots.find((l) => l.id === 'EC-2001')
    expect(ec.status).toBe('alerte')
  })

  it('produit des compteurs cohérents (total = conforme + alerte + périmé)', () => {
    const m = buildModel(lotsRaw, [], [])
    const { total, conforme, alerte, perime } = m.counts
    expect(total).toBe(3)
    expect(conforme + alerte + perime).toBe(3)
    expect(perime).toBe(1) // BR-1002
    expect(alerte).toBe(1) // EC-2001
  })
})

describe('buildModel — historique via les mesures (/central/mesures)', () => {
  it('utilise les vraies mesures d’un lot quand elles existent', () => {
    const mesures = [
      { lot_id: 1, temperature: 29.1, humidite: 55, date_mesure: isoDaysAgo(3) },
      { lot_id: 1, temperature: 29.4, humidite: 56, date_mesure: isoDaysAgo(2) },
      { lot_id: 1, temperature: 40.0, humidite: 90, date_mesure: isoDaysAgo(1) }, // hors tolérance
    ]
    const m = buildModel(lotsRaw, mesures, [])
    const lot = m.lots.find((l) => l.id === 'BR-1001')
    // 3 relevés réels → séries de longueur 3 (et non les 24 synthétiques)
    expect(lot.temp).toHaveLength(3)
    expect(lot.tNow).toBe(40) // dernier relevé
    // une température à 40°C (idéal BR 29 ±3) déclenche le drapeau de dépassement
    expect(lot.tB).toBe(true)
    expect(lot.status).toBe('alerte')
  })
})

describe('buildModel — alertes (/central/alertes)', () => {
  const alertesRaw = [
    { id: 10, pays: 'bresil', lot_id: 2, type_alerte: 'lot_ancien', message: 'Lot de plus de 365 jours', statut: 'ouverte', niveau: 'critique' },
    { id: 11, pays: 'equateur', lot_id: 3, type_alerte: 'temperature', message: 'Température élevée', statut: 'ouverte', niveau: 'moyen' },
    { id: 12, pays: 'colombie', lot_id: null, type_alerte: 'humidite', message: 'Humidité entrepôt', statut: 'fermee', niveau: 'moyen' }, // fermée → ignorée
  ]

  it('ne garde que les alertes ouvertes', () => {
    const m = buildModel(lotsRaw, [], alertesRaw)
    expect(m.alerts).toHaveLength(2)
    expect(m.alerts.some((a) => a.msg === 'Humidité entrepôt')).toBe(false)
  })

  it('classe une alerte d’ancienneté en type « age » / sévérité « danger »', () => {
    const m = buildModel(lotsRaw, [], alertesRaw)
    const age = m.alerts.find((a) => a.type === 'age')
    expect(age).toBeDefined()
    expect(age.sev).toBe('danger')
  })

  it('rattache une alerte à son lot (lot_id → lotId)', () => {
    const m = buildModel(lotsRaw, [], alertesRaw)
    const ec = m.alerts.find((a) => a.co.code === 'EC')
    expect(ec.lotId).toBe('EC-2001')
    expect(ec.scope).toBe('Lot')
  })
})

describe('buildModel — tolérance sur le format de réponse', () => {
  it('accepte une enveloppe { data: [...] } comme un tableau plat', () => {
    const enveloppe = { data: lotsRaw, total: lotsRaw.length, errors: {} }
    const m = buildModel(enveloppe, { data: [] }, { data: [] })
    expect(m.lots).toHaveLength(3) // même résultat que le tableau brut
  })

  it('ne casse pas sur des entrées vides', () => {
    const m = buildModel([], [], [])
    expect(m.lots).toHaveLength(0)
    expect(m.counts.total).toBe(0)
    expect(m.alerts).toHaveLength(0)
  })
})
