import { describe, it, expect } from 'vitest'
import { buildMockModel, paysCode, statusLabel } from './model'

describe('paysCode — normalisation du nom de pays vers un code', () => {
  it('reconnaît le Brésil sous ses différentes formes', () => {
    expect(paysCode('bresil')).toBe('BR')
    expect(paysCode('Brésil')).toBe('BR')
    expect(paysCode('brazil')).toBe('BR')
    expect(paysCode('BR')).toBe('BR')
  })
  it('reconnaît l’Équateur et la Colombie', () => {
    expect(paysCode('equateur')).toBe('EC')
    expect(paysCode('Ecuador')).toBe('EC')
    expect(paysCode('colombie')).toBe('CO')
    expect(paysCode('Colombia')).toBe('CO')
  })
  it('retombe sur un slug à 2 lettres pour un pays inconnu', () => {
    expect(paysCode('perou')).toBe('PE')
  })
})

describe('statusLabel — libellé lisible d’un statut', () => {
  it('traduit chaque statut', () => {
    expect(statusLabel('conforme')).toBe('Conforme')
    expect(statusLabel('alerte')).toBe('En alerte')
    expect(statusLabel('perime')).toBe('Périmé')
  })
})

describe('buildMockModel — modèle de démonstration', () => {
  const m = buildMockModel()

  it('contient 16 lots répartis sur 3 pays', () => {
    expect(m.lots).toHaveLength(16)
    expect(Object.keys(m.C).sort()).toEqual(['BR', 'CO', 'EC'])
  })

  it('compte 3 lots périmés (âge > 365 j)', () => {
    const perimes = m.lots.filter((l) => l.status === 'perime')
    expect(perimes).toHaveLength(3)
    // tous les périmés dépassent bien 365 jours de stockage
    perimes.forEach((l) => expect(l.age).toBeGreaterThan(365))
  })

  it('a des compteurs cohérents (total = conforme + alerte + périmé)', () => {
    const { total, conforme, alerte, perime } = m.counts
    expect(total).toBe(16)
    expect(conforme + alerte + perime).toBe(total)
  })

  it('génère au moins une alerte pour chaque lot périmé', () => {
    const alertesAge = m.alerts.filter((a) => a.type === 'age')
    expect(alertesAge.length).toBeGreaterThanOrEqual(3)
  })

  it('produit un historique de 24 relevés par lot', () => {
    m.lots.forEach((l) => {
      expect(l.temp).toHaveLength(24)
      expect(l.hum).toHaveLength(24)
      expect(l.dates).toHaveLength(24)
    })
  })
})
