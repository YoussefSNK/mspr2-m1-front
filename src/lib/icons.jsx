import { createElement as h } from 'react'

// Jeu d'icônes SVG repris tel quel du composant .dc.html d'origine (méthode
// icon()). Conserve exactement les mêmes tracés pour un rendu identique.
export function Icon({ name, size = 20 }) {
  const s = size
  const svg = (...ch) =>
    h(
      'svg',
      {
        width: s,
        height: s,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      ...ch,
    )
  const P = (d) => h('path', { d })
  switch (name) {
    case 'grid':
      return svg(
        h('rect', { x: 3, y: 3, width: 7, height: 7, rx: 1.5 }),
        h('rect', { x: 14, y: 3, width: 7, height: 7, rx: 1.5 }),
        h('rect', { x: 3, y: 14, width: 7, height: 7, rx: 1.5 }),
        h('rect', { x: 14, y: 14, width: 7, height: 7, rx: 1.5 }),
      )
    case 'box':
      return svg(P('M21 8 12 3 3 8v8l9 5 9-5Z'), P('M3 8l9 5 9-5'), P('M12 13v8'))
    case 'bell':
      return svg(
        P('M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9'),
        P('M13.7 21a2 2 0 0 1-3.4 0'),
      )
    case 'leaf':
      return h(
        'svg',
        {
          width: s,
          height: s,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: '#fff',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        h('path', { d: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.18 2 8a7 7 0 0 1-13 4' }),
        h('path', { d: 'M2 21c0-3 1.85-5.36 5.08-6' }),
      )
    case 'sun':
      return svg(
        h('circle', { cx: 12, cy: 12, r: 4 }),
        P('M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'),
      )
    case 'moon':
      return svg(P('M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'))
    case 'chev':
      return svg(P('M15 18l-6-6 6-6'))
    case 'back':
      return svg(P('M19 12H5M12 19l-7-7 7-7'))
    case 'temp':
      return svg(P('M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z'))
    case 'drop':
      return svg(P('M12 2.7S5 9.3 5 14a7 7 0 0 0 14 0c0-4.7-7-11.3-7-11.3Z'))
    case 'mail':
      return svg(h('rect', { x: 3, y: 5, width: 18, height: 14, rx: 2 }), P('M3 7l9 6 9-6'))
    case 'clock':
      return svg(h('circle', { cx: 12, cy: 12, r: 9 }), P('M12 7v5l3 2'))
    case 'search':
      return svg(h('circle', { cx: 11, cy: 11, r: 7 }), P('M21 21l-4-4'))
    case 'alert':
      return svg(
        P('M12 9v4M12 17h.01'),
        P('M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z'),
      )
    case 'calendar':
      return svg(P('M8 2v3M16 2v3'), h('rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }), P('M3 10h18'))
    case 'archive':
      return svg(
        P('M3 7v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7'),
        h('rect', { x: 2, y: 3, width: 20, height: 4, rx: 1 }),
        P('M10 12h4'),
      )
    case 'check':
      return svg(P('M20 6 9 17l-5-5'))
    case 'pin':
      return svg(P('M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'), h('circle', { cx: 12, cy: 10, r: 3 }))
    case 'flame':
      return svg(P('M12 2c1 3-1 4-2 6-1.5 3 .5 5 2 5 1.2 0 3-1 3-3.5 1.5 1.3 2 3 2 4.5a5 5 0 0 1-10 0c0-3.5 3-5 5-12Z'))
    default:
      return svg(h('circle', { cx: 12, cy: 12, r: 9 }))
  }
}

// Helper pratique : renvoie un élément <Icon/> (équivalent de this.icon(name,size)).
export const icon = (name, size) => h(Icon, { name, size })
