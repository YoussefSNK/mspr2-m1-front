import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from './App'

// En test, le backend central n'est pas joignable : on force fetch à échouer
// pour que l'app bascule en mode démonstration (comportement attendu hors ligne).
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
})

describe('<App /> — rendu de la vue d’ensemble', () => {
  it('affiche la marque et le titre de la vue d’ensemble', () => {
    render(<App />)
    // la marque dans la barre latérale
    expect(screen.getByText('FutureKawa')).toBeInTheDocument()
    // le titre de page (h1) — plusieurs libellés « Vue d’ensemble » existent
    // (nav + titre), on cible le titre principal via son rôle heading niveau 1
    expect(
      screen.getByRole('heading', { level: 1, name: /Vue d’ensemble/ }),
    ).toBeInTheDocument()
  })

  it('affiche les KPIs avec le total de 16 lots (données de démo)', () => {
    render(<App />)
    // La carte KPI « Lots en stock » : on remonte du label (span) jusqu'à la
    // carte (div flex intermédiaire puis carte), qui contient aussi la valeur.
    const label = screen.getByText('Lots en stock')
    const card = label.closest('div').parentElement
    expect(within(card).getByText('16')).toBeInTheDocument()
  })

  it('indique le mode démo quand le backend est injoignable', () => {
    render(<App />)
    expect(screen.getByText('Mode démo')).toBeInTheDocument()
  })
})
