// Convertit une chaîne CSS "color:red;font-size:12px" en objet style React
// {color:'red', fontSize:'12px'}. Repris du moteur support.js d'origine : la
// logique de rendu (renderVals) produit parfois des styles sous forme de chaîne
// (item.rowStyle, tab.style, ...) qu'il faut passer à JSX comme objet.
export function parseStyle(css) {
  const out = {}
  if (typeof css !== 'string') return css || {}
  css.split(';').forEach((decl) => {
    const idx = decl.indexOf(':')
    if (idx < 0) return
    const prop = decl.slice(0, idx).trim()
    const val = decl.slice(idx + 1).trim()
    if (!prop) return
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    out[camel] = val
  })
  return out
}
