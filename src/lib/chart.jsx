import { createElement as h } from 'react'

// Constructeur de graphiques SVG (aires lissées + bande de tolérance).
// Portage fidèle des méthodes smooth()/buildChart() du .dc.html d'origine.

function smooth(pts) {
  if (pts.length < 2) return pts.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' ')
  let d = 'M ' + pts[0].x + ' ' + pts[0].y
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ' C ' + c1x + ' ' + c1y + ' ' + c2x + ' ' + c2y + ' ' + p2.x + ' ' + p2.y
  }
  return d
}

export function buildChart(opts) {
  const { vw = 720, vh = 290, series, band, dates, small, id = 'c' } = opts
  const pad = small ? { l: 4, r: 4, t: 6, b: 4 } : { l: 46, r: 18, t: 18, b: 30 }
  const pw = vw - pad.l - pad.r
  const ph = vh - pad.t - pad.b
  const n = series[0].vals.length
  const mapX = (i) => pad.l + (n <= 1 ? 0 : i / (n - 1)) * pw
  series.forEach((s) => {
    let mn = Math.min.apply(null, s.vals)
    let mx = Math.max.apply(null, s.vals)
    if (band && series.length === 1) {
      mn = Math.min(mn, band.lo)
      mx = Math.max(mx, band.hi)
    }
    const p = (mx - mn || 1) * 0.22
    s._mn = mn - p
    s._mx = mx + p
  })
  const mapY = (v, s) => pad.t + (1 - (v - s._mn) / ((s._mx - s._mn) || 1)) * ph
  const kids = []
  // grid
  if (!small) {
    for (let g = 0; g <= 3; g++) {
      const y = pad.t + (g / 3) * ph
      kids.push(h('line', { key: 'g' + g, x1: pad.l, x2: vw - pad.r, y1: y, y2: y, stroke: 'var(--border-soft)', strokeWidth: 1 }))
    }
  }
  // band
  if (band && series.length === 1 && !small) {
    const s0 = series[0]
    const yhi = mapY(band.hi, s0)
    const ylo = mapY(band.lo, s0)
    const yid = mapY(band.ideal, s0)
    kids.push(h('rect', { key: 'band', x: pad.l, y: yhi, width: pw, height: Math.max(0, ylo - yhi), fill: 'var(--ok-soft)', opacity: 0.7, rx: 4 }))
    kids.push(h('line', { key: 'ideal', x1: pad.l, x2: vw - pad.r, y1: yid, y2: yid, stroke: 'var(--ok)', strokeWidth: 1.3, strokeDasharray: '5 5', opacity: 0.7 }))
    kids.push(h('text', { key: 'idt', x: vw - pad.r, y: yid - 6, fill: 'var(--ok)', fontSize: 11, textAnchor: 'end', fontWeight: 600, fontFamily: 'JetBrains Mono' }, 'idéal ' + band.ideal))
  }
  series.forEach((s, si) => {
    const pts = s.vals.map((v, i) => ({ x: mapX(i), y: mapY(v, s) }))
    const d = smooth(pts)
    if (s.area) {
      const gid = id + '-grad' + si
      kids.push(
        h('defs', { key: 'def' + si },
          h('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 },
            h('stop', { offset: '0%', stopColor: s.color, stopOpacity: small ? 0.32 : 0.26 }),
            h('stop', { offset: '100%', stopColor: s.color, stopOpacity: 0 }),
          ),
        ),
      )
      kids.push(h('path', { key: 'area' + si, d: d + ' L ' + pts[pts.length - 1].x + ' ' + (pad.t + ph) + ' L ' + pts[0].x + ' ' + (pad.t + ph) + ' Z', fill: 'url(#' + gid + ')' }))
    }
    kids.push(h('path', { key: 'line' + si, d, fill: 'none', stroke: s.color, strokeWidth: small ? 2 : 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }))
    const last = pts[pts.length - 1]
    kids.push(h('circle', { key: 'dot' + si, cx: last.x, cy: last.y, r: small ? 2.6 : 4, fill: s.color, stroke: 'var(--surface)', strokeWidth: small ? 1.4 : 2.4 }))
  })
  // axes labels
  if (!small) {
    const s0 = series[0]
    ;[s0._mx, (s0._mx + s0._mn) / 2, s0._mn].forEach((v, gi) => {
      kids.push(h('text', { key: 'yl' + gi, x: pad.l - 10, y: pad.t + (gi / 2) * ph + 4, fill: 'var(--ink-faint)', fontSize: 11, textAnchor: 'end', fontFamily: 'JetBrains Mono' }, Math.round(v) + (s0.unit || '')))
    })
    if (dates) {
      const idxs = [0, Math.floor(n / 2), n - 1]
      idxs.forEach((i, gi) => {
        kids.push(h('text', { key: 'xl' + gi, x: mapX(i), y: vh - 8, fill: 'var(--ink-faint)', fontSize: 11, textAnchor: gi === 0 ? 'start' : gi === 2 ? 'end' : 'middle', fontFamily: 'JetBrains Mono' }, dates[i]))
      })
    }
  }
  return h('svg', { viewBox: '0 0 ' + vw + ' ' + vh, style: { width: '100%', height: small ? '46px' : '290px', display: 'block', overflow: 'visible' } }, ...kids)
}
