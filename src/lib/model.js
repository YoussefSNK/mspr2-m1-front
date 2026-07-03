// ============================================================================
//  model.js — logique métier FutureKawa (données, mappers API, statuts).
//  Portage fidèle des méthodes de la classe Component du .dc.html d'origine.
//  Aucune dépendance React ici : uniquement du calcul pur.
// ============================================================================

// ---------- helpers numériques / hash / rng ----------
export function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function round1(v) {
  return Math.round(v * 10) / 10
}

// ---------- statuts ----------
export function statusColor(s) {
  return s === 'conforme' ? 'var(--ok)' : s === 'alerte' ? 'var(--warn)' : 'var(--danger)'
}
export function statusBg(s) {
  return s === 'conforme' ? 'var(--ok-soft)' : s === 'alerte' ? 'var(--warn-soft)' : 'var(--danger-soft)'
}
export function statusLabel(s) {
  return s === 'conforme' ? 'Conforme' : s === 'alerte' ? 'En alerte' : 'Périmé'
}

// ---------- référence pays (non exposée par les backends) ----------
export function countryRef() {
  return {
    BR: { code: 'BR', name: 'Brésil', region: 'Minas Gerais', idealT: 29, idealH: 55, tolT: 3, tolH: 2, resp: 'João Almeida' },
    EC: { code: 'EC', name: 'Équateur', region: 'Loja', idealT: 31, idealH: 60, tolT: 3, tolH: 2, resp: 'María Castro' },
    CO: { code: 'CO', name: 'Colombie', region: 'Huila', idealT: 26, idealH: 80, tolT: 3, tolH: 2, resp: 'Andrés Gómez' },
  }
}
export function defaultRef(code, pays) {
  return { code, name: pays || code, region: '—', idealT: 28, idealH: 60, tolT: 3, tolH: 3, resp: 'Responsable ' + (pays || code) }
}

// "bresil" / "Brésil" / "BR" → "BR"
export function paysCode(pays) {
  const s = (pays || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
  const map = {
    bresil: 'BR', brasil: 'BR', brazil: 'BR', br: 'BR',
    equateur: 'EC', ecuador: 'EC', ec: 'EC',
    colombie: 'CO', colombia: 'CO', co: 'CO',
  }
  return map[s] || s.slice(0, 2).toUpperCase()
}

// Central peut renvoyer un tableau plat, un objet groupé par pays, ou une
// enveloppe {data:[...], errors:{}, total:N} → on aplatit vers un tableau.
export function flatten(x) {
  if (Array.isArray(x)) return x
  if (x && typeof x === 'object') {
    if (Array.isArray(x.data)) return x.data
    let out = []
    Object.values(x).forEach((v) => {
      if (Array.isArray(v)) out = out.concat(v)
      else if (v && typeof v === 'object') out.push(v)
    })
    return out
  }
  return []
}

export function humanizeType(t) {
  const m = {
    temperature: 'Température élevée',
    humidite: 'Humidité élevée',
    humidity: 'Humidité élevée',
    lot_ancien: 'Lot périmé',
    lot_perime: 'Lot périmé',
    age: 'Lot périmé',
    condition: 'Conditions hors plage',
  }
  t = (t || '').toString()
  return m[t.toLowerCase()] || (t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Alerte')
}

export function relTime(d, now) {
  const s = Math.max(0, (now - d) / 1000)
  if (s < 60) return 'à l’instant'
  const mn = Math.floor(s / 60)
  if (mn < 60) return 'il y a ' + mn + ' min'
  const hh = Math.floor(mn / 60)
  if (hh < 24) return 'il y a ' + hh + ' h'
  const dd = Math.floor(hh / 24)
  return dd === 1 ? 'hier' : 'il y a ' + dd + ' j'
}

// Série synthétique si un lot n'a aucune mesure (évite un graphe vide).
export function synthSeries(seed, co) {
  const n = 24
  const rnd = rng(hash(seed))
  const temp = [], hum = [], dates = []
  const base = Date.now() - n * 3600000
  const dm = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' })
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1)
    temp.push(round1(co.idealT + (rnd() - 0.5) * co.tolT * 1.1))
    hum.push(Math.round(co.idealH + (rnd() - 0.5) * co.tolH * 1.2))
    dates.push(dm.format(new Date(base + f * n * 3600000)))
  }
  return { temp, hum, dates }
}

// ---------- construction du modèle depuis l'API ----------
export function buildModel(lotsRaw, mesuresRaw, alertesRaw) {
  const today = new Date()
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  const dm = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' })
  const C = countryRef()
  lotsRaw = flatten(lotsRaw)
  mesuresRaw = flatten(mesuresRaw)
  alertesRaw = flatten(alertesRaw)

  // index des mesures : par lot_id (historique) et capteurs entrepôt (lot_id null)
  const byLot = {}, entrepotMes = []
  mesuresRaw.forEach((mz) => {
    const rec = {
      t: +mz.temperature,
      hu: +mz.humidite,
      when: new Date(mz.date_mesure || mz.created_at || Date.now()),
      pays: mz.pays,
      entrepot: mz.entrepot,
    }
    if (mz.lot_id != null) {
      ;(byLot[mz.lot_id] = byLot[mz.lot_id] || []).push(rec)
    } else entrepotMes.push(rec)
  })
  Object.values(byLot).forEach((a) => a.sort((x, y) => x.when - y.when))

  // ----- lots (on exclut les lots expédiés = sortis du stock) -----
  const lots = lotsRaw
    .filter((l) => (l.statut || '').toLowerCase() !== 'expedie')
    .map((l) => {
      const code = paysCode(l.pays)
      let co = C[code]
      if (!co) {
        co = defaultRef(code, l.pays)
        C[code] = co
      }
      const dt = new Date(l.date_stockage)
      const age = Math.max(0, Math.floor((today - dt) / 86400000))
      let temp, hum, dates
      const series = byLot[l.id] || []
      if (series.length) {
        temp = series.map((r) => round1(r.t))
        hum = series.map((r) => Math.round(r.hu))
        dates = series.map((r) => dm.format(r.when))
      } else {
        const g = synthSeries(l.lot_code || 'L' + l.id, co)
        temp = g.temp
        hum = g.hum
        dates = g.dates
      }
      const tNow = temp[temp.length - 1], hNow = hum[hum.length - 1]
      const tB = temp.some((v) => Math.abs(v - co.idealT) > co.tolT)
      const hB = hum.some((v) => Math.abs(v - co.idealH) > co.tolH)
      const st = (l.statut || '').toLowerCase()
      const status =
        st === 'perime' || age > 365
          ? 'perime'
          : st === 'en_alerte' || st === 'alerte' || tB || hB
            ? 'alerte'
            : 'conforme'
      return {
        dbId: l.id,
        id: l.lot_code || '#' + l.id,
        c: code,
        country: co,
        ex: l.exploitation,
        wh: l.entrepot,
        d: age,
        age,
        ageLabel: age + ' j',
        date: dt,
        dateLabel: fmt.format(dt),
        temp, hum, dates, tNow, hNow, tB, hB, status,
      }
    })

  const counts = { total: lots.length, conforme: 0, alerte: 0, perime: 0 }
  lots.forEach((l) => {
    if (counts[l.status] != null) counts[l.status]++
  })

  // ----- agrégats par pays -----
  Object.values(C).forEach((co) => {
    const cl = lots.filter((l) => l.c === co.code)
    co.lots = cl.length
    const em = entrepotMes.filter((r) => paysCode(r.pays) === co.code).sort((a, b) => a.when - b.when)
    if (em.length) {
      co.sT = round1(em[em.length - 1].t)
      co.sH = Math.round(em[em.length - 1].hu)
      co.spark = em.slice(-20).map((r) => round1(r.t))
    } else if (cl.length) {
      co.sT = round1(cl.reduce((s, l) => s + l.tNow, 0) / cl.length)
      co.sH = Math.round(cl.reduce((s, l) => s + l.hNow, 0) / cl.length)
      co.spark = cl.slice(-20).map((l) => l.tNow)
    } else {
      co.sT = co.idealT
      co.sH = co.idealH
      co.spark = [co.idealT]
    }
    if (co.spark.length < 2) co.spark = [co.spark[0], co.spark[0]]
    co.tBreach = Math.abs(co.sT - co.idealT) > co.tolT
    co.hBreach = Math.abs(co.sH - co.idealH) > co.tolH
    const hasPerime = cl.some((l) => l.status === 'perime')
    const hasAlerte = cl.some((l) => l.status === 'alerte') || co.tBreach || co.hBreach
    co.status = hasPerime ? 'perime' : hasAlerte ? 'alerte' : 'conforme'
  })

  // ----- alertes (uniquement les alertes ouvertes) -----
  const lotById = {}
  lots.forEach((l) => (lotById[l.dbId] = l))
  const alerts = alertesRaw
    .filter((a) => (a.statut || 'ouverte').toLowerCase() === 'ouverte')
    .map((a) => {
      const code = paysCode(a.pays)
      const co = C[code] || defaultRef(code, a.pays)
      const isAge = /anc|age|365|perim/i.test((a.type_alerte || '') + ' ' + (a.message || ''))
      const sev = isAge || /(crit|danger|perim|haut|high|3|urgent)/i.test(a.niveau || '') ? 'danger' : 'warn'
      const lot = a.lot_id != null ? lotById[a.lot_id] : null
      return {
        type: isAge ? 'age' : 'condition',
        sev,
        scope: a.lot_id != null ? 'Lot' : 'Entrepôt',
        co,
        title: humanizeType(a.type_alerte) + ' · ' + (lot ? lot.id : co.name),
        msg: a.message || '',
        email: co.resp,
        lotId: lot ? lot.id : null,
        _when: new Date(a.created_at || Date.now()),
      }
    })
  alerts.sort((a, b) => (a.sev === 'danger' ? 0 : 1) - (b.sev === 'danger' ? 0 : 1) || b._when - a._when)
  alerts.forEach((a) => (a.time = relTime(a._when, today)))

  return { C, lots, counts, alerts, today }
}

// ---------- données de démonstration (repli hors-ligne) ----------
export function buildMockModel() {
  const today = new Date(2026, 5, 17)
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  const C = countryRef()
  C.BR.sT = 32.6; C.BR.sH = 56
  C.EC.sT = 31.4; C.EC.sH = 63
  C.CO.sT = 26.4; C.CO.sH = 79
  const base = [
    { id: 'BR-2511', c: 'BR', ex: 'Fazenda Bom Jardim', wh: 'Entrepôt Santos A1', d: 12, tB: 0, hB: 0 },
    { id: 'BR-2503', c: 'BR', ex: 'Fazenda Serra Verde', wh: 'Entrepôt Santos A2', d: 28, tB: 0, hB: 0 },
    { id: 'BR-2419', c: 'BR', ex: 'Fazenda Bom Jardim', wh: 'Entrepôt Santos B1', d: 96, tB: 0, hB: 0 },
    { id: 'BR-2406', c: 'BR', ex: 'Fazenda Serra Verde', wh: 'Entrepôt Varginha C1', d: 158, tB: 1, hB: 0 },
    { id: 'BR-2347', c: 'BR', ex: 'Sítio Aurora', wh: 'Entrepôt Varginha C1', d: 372, tB: 0, hB: 0 },
    { id: 'EC-2509', c: 'EC', ex: 'Hacienda Vilcabamba', wh: 'Entrepôt Loja 2', d: 19, tB: 0, hB: 0 },
    { id: 'EC-2502', c: 'EC', ex: 'Hacienda Loja Alta', wh: 'Entrepôt Loja 1', d: 34, tB: 0, hB: 0 },
    { id: 'EC-2438', c: 'EC', ex: 'Finca El Cisne', wh: 'Entrepôt Loja 2', d: 80, tB: 0, hB: 1 },
    { id: 'EC-2410', c: 'EC', ex: 'Hacienda Loja Alta', wh: 'Entrepôt Catamayo 1', d: 142, tB: 0, hB: 0 },
    { id: 'EC-2351', c: 'EC', ex: 'Finca El Cisne', wh: 'Entrepôt Loja 1', d: 388, tB: 0, hB: 0 },
    { id: 'CO-2508', c: 'CO', ex: 'Hacienda Pitalito', wh: 'Entrepôt Huila 2', d: 23, tB: 0, hB: 0 },
    { id: 'CO-2504', c: 'CO', ex: 'Finca La Esperanza', wh: 'Entrepôt Huila 1', d: 41, tB: 0, hB: 0 },
    { id: 'CO-2461', c: 'CO', ex: 'Finca El Roble', wh: 'Entrepôt Neiva 1', d: 67, tB: 0, hB: 0 },
    { id: 'CO-2427', c: 'CO', ex: 'Hacienda Pitalito', wh: 'Entrepôt Huila 2', d: 104, tB: 0, hB: 0 },
    { id: 'CO-2413', c: 'CO', ex: 'Finca La Esperanza', wh: 'Entrepôt Neiva 1', d: 165, tB: 1, hB: 1 },
    { id: 'CO-2342', c: 'CO', ex: 'Finca El Roble', wh: 'Entrepôt Huila 1', d: 401, tB: 0, hB: 0 },
  ]

  const lots = base.map((b) => {
    const co = C[b.c]
    const status = b.d > 365 ? 'perime' : b.tB || b.hB ? 'alerte' : 'conforme'
    const dt = new Date(today.getTime() - b.d * 86400000)
    const n = 24
    const rnd = rng(hash(b.id))
    const temp = [], hum = [], dates = []
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1)
      let tv = co.idealT + (rnd() - 0.5) * co.tolT * 1.1
      let hv = co.idealH + (rnd() - 0.5) * co.tolH * 1.2
      if (b.tB && f > 0.62) {
        tv = co.idealT + co.tolT * (1.05 + (f - 0.62) * 2.4) + rnd() * 0.5
      }
      if (b.hB && f > 0.6) {
        hv = co.idealH + co.tolH * (1.1 + (f - 0.6) * 2.2) + rnd() * 0.4
      }
      temp.push(round1(tv))
      hum.push(Math.round(hv))
      const dd = new Date(dt.getTime() + f * b.d * 86400000)
      dates.push(new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(dd))
    }
    return {
      ...b,
      country: co,
      status,
      date: dt,
      dateLabel: fmt.format(dt),
      age: b.d,
      ageLabel: b.d + ' j',
      temp, hum, dates,
      tNow: temp[n - 1],
      hNow: hum[n - 1],
    }
  })

  const counts = { total: lots.length, conforme: 0, alerte: 0, perime: 0 }
  lots.forEach((l) => counts[l.status]++)

  // breach flags + sparkline capteur pays
  Object.values(C).forEach((co) => {
    co.tBreach = Math.abs(co.sT - co.idealT) > co.tolT
    co.hBreach = Math.abs(co.sH - co.idealH) > co.tolH
    const cl = lots.filter((l) => l.c === co.code)
    co.lots = cl.length
    const hasPerime = cl.some((l) => l.status === 'perime')
    const hasAlerte = cl.some((l) => l.status === 'alerte') || co.tBreach || co.hBreach
    co.status = hasPerime ? 'perime' : hasAlerte ? 'alerte' : 'conforme'
    const r2 = rng(hash('S' + co.code))
    const sp = []
    for (let i = 0; i < 20; i++) {
      sp.push(round1(co.sT + (r2() - 0.5) * 1.6 + (co.tBreach && i > 13 ? 1.2 : 0)))
    }
    co.spark = sp
  })

  // alertes
  const alerts = []
  const tlabels = ['il y a 6 min', 'il y a 22 min', 'il y a 1 h', 'il y a 3 h', 'il y a 5 h', 'hier', 'il y a 2 j']
  Object.values(C).forEach((co) => {
    if (co.tBreach)
      alerts.push({ type: 'condition', sev: 'warn', scope: 'Entrepôt', co, title: 'Température élevée · ' + co.name, msg: 'Capteur entrepôt à ' + co.sT + '°C (idéal ' + co.idealT + '°C ±' + co.tolT + '). Aération recommandée.', email: co.resp, lotId: null, order: 1 })
    if (co.hBreach)
      alerts.push({ type: 'condition', sev: 'warn', scope: 'Entrepôt', co, title: 'Humidité élevée · ' + co.name, msg: 'Capteur entrepôt à ' + co.sH + '% (idéal ' + co.idealH + '% ±' + co.tolH + '). Risque pour les arômes.', email: co.resp, lotId: null, order: 1 })
  })
  lots.forEach((l) => {
    if (l.status === 'alerte') {
      const parts = []
      if (l.tB) parts.push('température ' + l.tNow + '°C')
      if (l.hB) parts.push('humidité ' + l.hNow + '%')
      alerts.push({ type: 'condition', sev: 'warn', scope: 'Lot', co: l.country, title: 'Conditions hors plage · ' + l.id, msg: 'Relevés du lot hors tolérance (' + parts.join(', ') + ') pour ' + l.country.name + '.', email: l.country.resp, lotId: l.id, order: 0 })
    }
    if (l.status === 'perime') {
      alerts.push({ type: 'age', sev: 'danger', scope: 'Lot', co: l.country, title: 'Lot périmé · ' + l.id, msg: 'Stockage de ' + l.age + ' jours (> 365 j). À déclasser ou expédier en priorité.', email: l.country.resp, lotId: l.id, order: 0 })
    }
  })
  alerts.sort((a, b) => (a.sev === 'danger' ? 0 : 1) - (b.sev === 'danger' ? 0 : 1) || a.order - b.order)
  alerts.forEach((a, i) => (a.time = tlabels[Math.min(i, tlabels.length - 1)]))

  return { C, lots, counts, alerts, today }
}
