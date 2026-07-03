import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mode démo forcé (backend injoignable) pour des tests déterministes.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
})

// Récupère un bouton de navigation de la barre latérale par son libellé.
const navButton = (name) => screen.getByRole('button', { name: new RegExp(name) })

describe('<App /> — navigation entre les vues', () => {
  it('ouvre la vue « Stocks & lots » et affiche la table', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(navButton('Stocks & lots'))

    // titre de page + en-têtes de colonnes de la table
    expect(screen.getByRole('heading', { level: 1, name: /Stocks & lots/ })).toBeInTheDocument()
    expect(screen.getByText('Date stockage')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Rechercher un lot/)).toBeInTheDocument()
  })

  it('ouvre la vue « Alertes »', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(navButton('Alertes'))

    expect(screen.getByRole('heading', { level: 1, name: /Centre d’alertes/ })).toBeInTheDocument()
    // les onglets de filtre d'alertes
    expect(screen.getByRole('button', { name: /Toutes/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ancienneté/ })).toBeInTheDocument()
  })

  it('ouvre le détail d’un lot depuis la table, puis revient en arrière', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(navButton('Stocks & lots'))

    // premier lot de la table (le plus ancien, tri FIFO). On clique sur un
    // identifiant de lot connu des données de démo.
    const lotBtn = screen.getByText('CO-2342').closest('button')
    await user.click(lotBtn)

    // vue détail : cartes caractéristiques
    expect(screen.getByText('Historique des relevés')).toBeInTheDocument()
    expect(screen.getByText('Conditions idéales')).toBeInTheDocument()
    expect(screen.getByText('Journal du lot')).toBeInTheDocument()

    // bouton retour → on revient sur la liste
    await user.click(screen.getByRole('button', { name: /Retour/ }))
    expect(screen.getByRole('heading', { level: 1, name: /Stocks & lots/ })).toBeInTheDocument()
  })
})

describe('<App /> — filtres et recherche des stocks', () => {
  it('filtre les lots via la recherche', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(navButton('Stocks & lots'))

    const search = screen.getByPlaceholderText(/Rechercher un lot/)
    await user.type(search, 'CO-2342')

    // le lot recherché est présent, un lot d'un autre pays ne l'est plus
    expect(screen.getByText('CO-2342')).toBeInTheDocument()
    expect(screen.queryByText('BR-2511')).not.toBeInTheDocument()
  })

  it('affiche un message quand aucun lot ne correspond', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(navButton('Stocks & lots'))

    await user.type(screen.getByPlaceholderText(/Rechercher un lot/), 'ZZZ-INEXISTANT')
    expect(screen.getByText(/Aucun lot ne correspond/)).toBeInTheDocument()
  })

  it('filtre par statut « Périmés »', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(navButton('Stocks & lots'))

    await user.click(screen.getByRole('button', { name: /Périmés/ }))
    // les 3 lots périmés des données de démo sont visibles
    expect(screen.getByText('BR-2347')).toBeInTheDocument()
    expect(screen.getByText('EC-2351')).toBeInTheDocument()
    expect(screen.getByText('CO-2342')).toBeInTheDocument()
  })
})

describe('<App /> — bascule de thème', () => {
  it('passe du thème clair au thème sombre', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)

    // état initial : thème clair (le conteneur racine porte data-theme)
    const root = container.querySelector('[data-theme]')
    expect(root).toHaveAttribute('data-theme', 'light')

    await user.click(screen.getByRole('button', { name: /Mode sombre/ }))
    expect(container.querySelector('[data-theme]')).toHaveAttribute('data-theme', 'dark')
  })
})

describe('<App /> — détail : bascule de métrique du graphique', () => {
  it('bascule entre Température, Humidité et Les deux', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(navButton('Stocks & lots'))
    await user.click(screen.getByText('CO-2342').closest('button'))

    // onglets de métrique présents
    const humBtn = screen.getByRole('button', { name: /^Humidité$/ })
    await user.click(humBtn)
    const bothBtn = screen.getByRole('button', { name: /Les deux/ })
    await user.click(bothBtn)
    // en mode « Les deux », « Température » et « Humidité » apparaissent à la
    // fois comme onglets et dans la légende → on vérifie leur présence (>= 1).
    expect(screen.getAllByText('Température').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Humidité').length).toBeGreaterThan(0)
  })
})
