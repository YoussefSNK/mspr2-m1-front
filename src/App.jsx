import { useState, useEffect, useMemo } from 'react'
import { icon } from './lib/icons.jsx'
import { buildChart } from './lib/chart.jsx'
import {
  buildMockModel,
  buildModel,
  statusColor,
  statusBg,
  statusLabel,
  paysCode,
} from './lib/model'
import { centralUrl, loadConsolidated, loadPays, paysParam } from './lib/api'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './components/Dashboard'
import Stocks from './components/Stocks'
import LotDetail from './components/LotDetail'
import Alerts from './components/Alerts'

const DARK_DEFAULT =
  new URLSearchParams(window.location.search).get('dark') === '1'

export default function App() {
  // ---- état (équivalent du `state` de la classe Component d'origine) ----
  const [state, setStateRaw] = useState({
    view: 'dashboard',
    country: 'all',
    selectedLot: null,
    dark: DARK_DEFAULT,
    collapsed: false,
    statusFilter: 'all',
    metric: 'temp',
    search: '',
    alertTab: 'all',
  })
  const setState = (patch) => setStateRaw((s) => ({ ...s, ...patch }))

  // Modèle API + données consolidées : conservés en state (et non en refs) pour
  // rester idiomatique React. `apiModel` est null tant que le backend central
  // n'a pas répondu → on retombe alors sur les données de démonstration.
  // Équivalent des champs this._model / this._live / this._consolidated d'origine.
  const [apiModel, setApiModel] = useState(null)
  const [consolidated, setConsolidated] = useState(null)
  const [live, setLive] = useState(false)

  // ---- chargement initial depuis le backend central ----
  useEffect(() => {
    let cancelled = false
    const B = centralUrl()
    loadConsolidated(B)
      .then(({ consolidated }) => {
        if (cancelled) return
        setConsolidated(consolidated)
        setApiModel(buildModel(consolidated.lots, consolidated.mesures, consolidated.alertes))
        setLive(true)
        setState({ country: 'all' })
      })
      .catch((e) => {
        console.warn('[FutureKawa] Backend central injoignable — affichage des données de démonstration.', e)
        if (!cancelled) setLive(false)
      })
    return () => { cancelled = true }
  }, [])

  // Données de démonstration construites une seule fois (repli hors-ligne).
  const mockModel = useMemo(() => buildMockModel(), [])
  // model : API si disponible, sinon démonstration.
  const model = apiModel || mockModel

  // ---- navigation ----
  const open = (view) => {
    setState({ view })
    const m = document.querySelector('main')
    if (m && typeof m.scrollTo === 'function') m.scrollTo(0, 0)
  }

  // Sélection d'un pays : drill-down via /central/pays/{pays}/*, ou filtrage
  // local en mode démo. Reproduit selectPays() de l'original.
  const selectPays = (code, view) => {
    const patch = { country: code }
    if (view) patch.view = view
    if (!live || !consolidated) {
      setState(patch)
      return
    }
    if (code === 'all') {
      setApiModel(buildModel(consolidated.lots, consolidated.mesures, consolidated.alertes))
      setState(patch)
      return
    }
    const B = centralUrl()
    const pays = paysParam(consolidated, code)
    loadPays(B, pays)
      .then(({ lots: pl, mesures: pm, alertes: pa }) => {
        const keep = (arr) => arr.filter((x) => paysCode(x.pays) !== code)
        const lots = keep(consolidated.lots).concat(pl)
        const mes = keep(consolidated.mesures).concat(pm)
        const als = keep(consolidated.alertes).concat(pa)
        setApiModel(buildModel(lots, mes, als))
        setState(patch)
      })
      .catch((e) => {
        console.warn('[FutureKawa] Routes /central/pays/' + pays + '/* indisponibles — filtrage local.', e)
        setState(patch)
      })
  }

  // ---- construction des valeurs de rendu (portage de renderVals()) ----
  const v = buildRenderVals({ model, state, setState, open, selectPays, live })

  return (
    <div
      data-theme={v.theme}
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        background: 'var(--bg)',
        color: 'var(--ink)',
        overflow: 'hidden',
        transition: 'background .4s ease,color .4s ease',
      }}
    >
      <Sidebar v={v} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar v={v} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '30px 32px 60px' }}>
          {v.isOverview && <Dashboard v={v} />}
          {v.isStocks && <Stocks v={v} />}
          {v.isDetail && <LotDetail v={v} />}
          {v.isAlerts && <Alerts v={v} />}
        </main>
      </div>
    </div>
  )
}

// ============================================================================
//  buildRenderVals — portage fidèle de la méthode renderVals() de l'original.
//  Produit le dictionnaire de valeurs consommé par les composants de vue.
// ============================================================================
function buildRenderVals({ model: m, state: st, setState, open, selectPays, live }) {
  const theme = st.dark ? 'dark' : 'light'
  const collapsed = st.collapsed
  const sel = st.selectedLot ? m.lots.find((l) => l.id === st.selectedLot) : null

  // nav
  const navDef = [
    { key: 'dashboard', label: 'Vue d’ensemble', icon: 'grid' },
    { key: 'stocks', label: 'Stocks & lots', icon: 'box' },
    { key: 'alerts', label: 'Alertes', icon: 'bell', badge: m.alerts.length },
  ]
  const navActive = st.view === 'detail' ? 'stocks' : st.view
  const navItems = navDef.map((d) => {
    const active = navActive === d.key
    return {
      label: d.label,
      icon: (
        <span style={{ color: active ? 'var(--primary)' : 'var(--ink-soft)', display: 'grid', placeItems: 'center' }}>
          {icon(d.icon)}
        </span>
      ),
      weight: active ? 700 : 500,
      showBadge: d.key === 'alerts' && d.badge > 0,
      badge: d.badge,
      onClick: () => open(d.key === 'stocks' ? 'stocks' : d.key),
      rowStyle:
        'display:flex;align-items:center;gap:13px;padding:11px 12px;border:none;border-radius:var(--r-sm);cursor:pointer;font:inherit;text-align:left;width:100%;transition:background .2s;color:' +
        (active ? 'var(--primary)' : 'var(--ink-soft)') +
        ';background:' +
        (active ? 'var(--primary-soft)' : 'transparent'),
    }
  })

  // page header
  const titles = {
    dashboard: ['Vue d’ensemble', 'Consolidation siège · ' + m.counts.total + ' lots sur 3 pays'],
    stocks: ['Stocks & lots', 'Suivi des lots et logique FIFO'],
    detail: [sel ? sel.id : 'Lot', sel ? sel.country.name + ' · ' + sel.exploitation : ''],
    alerts: ['Centre d’alertes', m.alerts.length + ' alertes actives'],
  }
  const ph = titles[st.view] || titles.dashboard

  const out = {
    theme,
    sidebarWidth: collapsed ? '78px' : '250px',
    showBrandText: !collapsed,
    brandLeaf: icon('leaf'),
    navItems,
    toggleTheme: () => setState({ dark: !st.dark }),
    toggleSidebar: () => setState({ collapsed: !st.collapsed }),
    themeIcon: (
      <span style={{ color: 'var(--ink-soft)', display: 'grid', placeItems: 'center' }}>{icon(st.dark ? 'sun' : 'moon')}</span>
    ),
    themeLabel: st.dark ? 'Mode clair' : 'Mode sombre',
    collapseIcon: (
      <span style={{ color: 'var(--ink-soft)', display: 'grid', placeItems: 'center', transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }}>
        {icon('chev')}
      </span>
    ),
    pageTitle: ph[0],
    pageSub: ph[1],
    liveLabel: live ? 'Données en direct' : 'Mode démo',
    showBack: st.view === 'detail',
    goBack: () => open('stocks'),
    backIcon: icon('back', 18),
    goAlerts: () => open('alerts'),
    isOverview: st.view === 'dashboard',
    isStocks: st.view === 'stocks',
    isDetail: st.view === 'detail' && !!sel,
    isAlerts: st.view === 'alerts',
    mailIcon: icon('mail', 16),
    tIconBig: icon('temp', 24),
    hIconBig: icon('drop', 24),
    searchIcon: icon('search', 18),
    fifoIcon: icon('archive', 20),
  }

  // ===== dashboard =====
  if (st.view === 'dashboard') {
    out.kpis = [
      { label: 'Lots en stock', value: m.counts.total, sub: 'répartis sur 3 pays', icon: icon('box', 18), tint: 'var(--ink)', tintBg: 'var(--surface-2)' },
      { label: 'Conformes', value: m.counts.conforme, sub: (m.counts.total ? Math.round((m.counts.conforme / m.counts.total) * 100) : 0) + '% du stock', icon: icon('check', 18), tint: 'var(--ok)', tintBg: 'var(--ok-soft)' },
      { label: 'En alerte', value: m.counts.alerte, sub: 'conditions hors plage', icon: icon('alert', 18), tint: 'var(--warn)', tintBg: 'var(--warn-soft)' },
      { label: 'Périmés > 365 j', value: m.counts.perime, sub: 'à expédier en priorité', icon: icon('clock', 18), tint: 'var(--danger)', tintBg: 'var(--danger-soft)' },
    ]
    out.mapPins = ['CO', 'EC', 'BR'].map((code) => {
      const co = m.C[code]
      return {
        code,
        name: co.name,
        statusLabel: statusLabel(co.status),
        color: statusColor(co.status),
        onClick: () => selectPays(code, 'stocks'),
      }
    })
    out.recentAlerts = m.alerts.slice(0, 4).map((a) => ({
      title: a.title,
      msg: a.msg,
      time: a.time,
      color: statusColor(a.sev === 'danger' ? 'perime' : 'alerte'),
      bg: statusBg(a.sev === 'danger' ? 'perime' : 'alerte'),
      icon: icon(a.type === 'age' ? 'clock' : a.title.indexOf('Humidité') >= 0 ? 'drop' : a.title.indexOf('Température') >= 0 ? 'flame' : 'alert', 18),
      onClick: () => (a.lotId ? setState({ view: 'detail', selectedLot: a.lotId }) : open('alerts')),
    }))
    out.countryCards = ['BR', 'EC', 'CO'].map((code) => {
      const co = m.C[code]
      const tCol = co.tBreach ? 'var(--warn)' : 'var(--ink)'
      const hCol = co.hBreach ? 'var(--warn)' : 'var(--ink)'
      return {
        code,
        name: co.name,
        region: co.region,
        lots: co.lots,
        statusColor: statusColor(co.status),
        statusBg: statusBg(co.status),
        statusLabel: statusLabel(co.status),
        spark: buildChart({ small: true, id: 'sp' + code, series: [{ vals: co.spark, color: statusColor(co.status), area: true }] }),
        tNow: co.sT,
        hNow: co.sH,
        tIdeal: co.idealT,
        hIdeal: co.idealH,
        tolT: co.tolT,
        tolH: co.tolH,
        tColor: tCol,
        hColor: hCol,
        tIcon: icon('temp', 13),
        hIcon: icon('drop', 13),
        onClick: () => selectPays(code, 'stocks'),
      }
    })
  }

  // ===== stocks =====
  if (st.view === 'stocks') {
    const tabDef = [{ k: 'all', l: 'Tous' }, { k: 'BR', l: 'Brésil' }, { k: 'EC', l: 'Équateur' }, { k: 'CO', l: 'Colombie' }]
    const tabStyle = (active) =>
      'border:none;border-radius:8px;padding:8px 15px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;transition:.2s;background:' +
      (active ? 'var(--primary)' : 'transparent') +
      ';color:' +
      (active ? '#fff' : 'var(--ink-soft)')
    out.countryTabs = tabDef.map((t) => ({ label: t.l, onClick: () => selectPays(t.k), style: tabStyle(st.country === t.k) }))

    const pool = m.lots.filter((l) => st.country === 'all' || l.c === st.country)
    const fCount = (s) => pool.filter((l) => s === 'all' || l.status === s).length
    const sfDef = [{ k: 'all', l: 'Tous' }, { k: 'conforme', l: 'Conformes' }, { k: 'alerte', l: 'Alertes' }, { k: 'perime', l: 'Périmés' }]
    const sfStyle = (active, k) => {
      const col = k === 'conforme' ? 'var(--ok)' : k === 'alerte' ? 'var(--warn)' : k === 'perime' ? 'var(--danger)' : 'var(--ink)'
      return (
        'border:1px solid ' +
        (active ? col : 'var(--border)') +
        ';border-radius:20px;padding:7px 14px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:.2s;background:' +
        (active ? (k === 'all' ? 'var(--surface-2)' : statusBg(k)) : 'var(--surface)') +
        ';color:' +
        (active && k !== 'all' ? col : 'var(--ink-soft)')
      )
    }
    out.statusFilters = sfDef.map((f) => ({ label: f.l, count: fCount(f.k), onClick: () => setState({ statusFilter: f.k }), style: sfStyle(st.statusFilter === f.k, f.k) }))

    let list = pool.filter((l) => st.statusFilter === 'all' || l.status === st.statusFilter)
    if (st.search.trim()) {
      const q = st.search.trim().toLowerCase()
      list = list.filter((l) => l.id.toLowerCase().indexOf(q) >= 0 || l.ex.toLowerCase().indexOf(q) >= 0 || l.wh.toLowerCase().indexOf(q) >= 0)
    }
    list = list.slice().sort((a, b) => b.age - a.age)
    out.search = st.search
    out.onSearch = (e) => setState({ search: e.target.value })
    out.noLots = list.length === 0
    out.filteredLots = list.map((l) => ({
      id: l.id,
      countryName: l.country.name,
      dot: statusColor(l.status),
      warehouse: l.wh,
      dateLabel: l.dateLabel,
      ageLabel: l.ageLabel,
      ageColor: l.age > 365 ? 'var(--danger)' : l.age > 300 ? 'var(--warn)' : 'var(--ink-soft)',
      tNow: l.tNow,
      tColor: l.tB ? 'var(--warn)' : 'var(--ink-soft)',
      statusColor: statusColor(l.status),
      statusBg: statusBg(l.status),
      statusLabel: statusLabel(l.status),
      onOpen: () => setState({ view: 'detail', selectedLot: l.id }),
    }))
  }

  // ===== detail =====
  if (st.view === 'detail' && sel) {
    const co = sel.country
    const metric = st.metric
    const mt = (active) =>
      'border:none;border-radius:8px;padding:7px 14px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:.2s;background:' +
      (active ? 'var(--surface)' : 'transparent') +
      ';color:' +
      (active ? 'var(--primary)' : 'var(--ink-soft)') +
      ';box-shadow:' +
      (active ? 'var(--shadow-sm)' : 'none')
    out.metricTabs = [{ k: 'temp', l: 'Température' }, { k: 'hum', l: 'Humidité' }, { k: 'both', l: 'Les deux' }].map((t) => ({ label: t.l, onClick: () => setState({ metric: t.k }), style: mt(metric === t.k) }))

    let chart, legend
    if (metric === 'temp') {
      chart = buildChart({ id: 'dt', dates: sel.dates, band: { lo: co.idealT - co.tolT, hi: co.idealT + co.tolT, ideal: co.idealT }, series: [{ vals: sel.temp, color: 'var(--coffee)', area: true, unit: '°' }] })
      legend = [{ label: 'Température', color: 'var(--coffee)', now: sel.tNow + '°C' }]
    } else if (metric === 'hum') {
      chart = buildChart({ id: 'dh', dates: sel.dates, band: { lo: co.idealH - co.tolH, hi: co.idealH + co.tolH, ideal: co.idealH }, series: [{ vals: sel.hum, color: 'var(--primary)', area: true, unit: '%' }] })
      legend = [{ label: 'Humidité', color: 'var(--primary)', now: sel.hNow + '%' }]
    } else {
      chart = buildChart({ id: 'db', dates: sel.dates, series: [{ vals: sel.temp, color: 'var(--coffee)', unit: '°' }, { vals: sel.hum, color: 'var(--primary)', unit: '%' }] })
      legend = [{ label: 'Température', color: 'var(--coffee)', now: sel.tNow + '°C' }, { label: 'Humidité', color: 'var(--primary)', now: sel.hNow + '%' }]
    }
    out.detailChart = chart
    out.chartLegend = legend
    out.metric = metric

    // events
    const ev = []
    ev.push({ icon: icon('calendar', 15), bg: 'var(--primary-soft)', color: 'var(--primary-strong)', title: 'Entrée en stockage', detail: sel.ex + ' → ' + sel.wh, time: sel.dateLabel })
    if (sel.status === 'alerte') {
      ev.push({ icon: icon('alert', 15), bg: 'var(--warn-soft)', color: 'var(--warn)', title: 'Dérive détectée', detail: 'Relevés sortis de la plage acceptable pour ' + co.name + '.', time: 'il y a quelques heures' })
      ev.push({ icon: icon('mail', 15), bg: 'var(--warn-soft)', color: 'var(--warn)', title: 'Email d’alerte envoyé', detail: 'Notification → ' + co.resp, time: 'automatique' })
    }
    if (sel.status === 'perime') {
      ev.push({ icon: icon('clock', 15), bg: 'var(--danger-soft)', color: 'var(--danger)', title: 'Seuil 365 j dépassé', detail: 'Lot stocké depuis ' + sel.age + ' jours.', time: 'il y a ' + (sel.age - 365) + ' j' })
      ev.push({ icon: icon('mail', 15), bg: 'var(--danger-soft)', color: 'var(--danger)', title: 'Email d’alerte envoyé', detail: 'Notification → ' + co.resp, time: 'automatique' })
    }
    ev.push({ icon: icon('check', 15), bg: 'var(--surface-2)', color: 'var(--ink-soft)', title: 'Dernier relevé IoT', detail: sel.tNow + '°C · ' + sel.hNow + '% d’humidité', time: 'à l’instant' })

    out.lot = {
      id: sel.id,
      statusColor: statusColor(sel.status),
      statusBg: statusBg(sel.status),
      statusLabel: statusLabel(sel.status),
      countryName: co.name,
      exploitation: sel.ex,
      warehouse: sel.wh,
      dateLabel: sel.dateLabel,
      ageLabel: sel.ageLabel,
      idealT: co.idealT,
      idealH: co.idealH,
      tolT: co.tolT,
      tolH: co.tolH,
      responsable: co.resp,
      hasAlert: sel.status !== 'conforme',
      alertIcon: icon(sel.status === 'perime' ? 'clock' : 'alert', 18),
      alertTitle: sel.status === 'perime' ? 'Lot trop ancien' : 'Conditions hors plage',
      alertMsg:
        sel.status === 'perime'
          ? 'Ce lot dépasse 365 jours de stockage (' + sel.age + ' j). Il doit être expédié ou déclassé en priorité selon la logique FIFO.'
          : 'Les conditions relevées sont sorties de la tolérance (' +
            (sel.tB ? '±' + co.tolT + '°C température' : '') +
            (sel.tB && sel.hB ? ', ' : '') +
            (sel.hB ? '±' + co.tolH + '% humidité' : '') +
            ') attendue pour ' + co.name + '.',
      events: ev,
    }
  }

  // ===== alerts =====
  if (st.view === 'alerts') {
    const tabDef = [{ k: 'all', l: 'Toutes' }, { k: 'condition', l: 'Conditions' }, { k: 'age', l: 'Ancienneté' }]
    const tabStyle = (active) =>
      'border:1px solid ' +
      (active ? 'var(--primary)' : 'var(--border)') +
      ';border-radius:20px;padding:8px 16px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;transition:.2s;background:' +
      (active ? 'var(--primary)' : 'var(--surface)') +
      ';color:' +
      (active ? '#fff' : 'var(--ink-soft)')
    const cnt = (k) => m.alerts.filter((a) => k === 'all' || a.type === k).length
    out.alertTabs = tabDef.map((t) => ({ label: t.l, count: cnt(t.k), onClick: () => setState({ alertTab: t.k }), style: tabStyle(st.alertTab === t.k) }))
    out.alertsList = m.alerts
      .filter((a) => st.alertTab === 'all' || a.type === st.alertTab)
      .map((a) => {
        const sev = a.sev === 'danger' ? 'perime' : 'alerte'
        return {
          title: a.title,
          msg: a.msg,
          time: a.time,
          email: a.email,
          color: statusColor(sev),
          bg: statusBg(sev),
          tag: a.type === 'age' ? 'Ancienneté' : a.scope === 'Entrepôt' ? 'Entrepôt' : 'Conditions',
          icon: icon(a.type === 'age' ? 'clock' : a.title.indexOf('Humidité') >= 0 ? 'drop' : a.title.indexOf('Température') >= 0 ? 'flame' : 'alert', 20),
          hasLot: !!a.lotId,
          lotId: a.lotId,
          onOpen: () => a.lotId && setState({ view: 'detail', selectedLot: a.lotId }),
        }
      })
  }

  return out
}
