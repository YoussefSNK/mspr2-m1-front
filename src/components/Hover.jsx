import { useState, createElement } from 'react'

// Reproduit le comportement `style-hover` du template .dc.html d'origine :
// un élément dont le style fusionne un style de base et un style appliqué au
// survol. On garde une API générique (tag + baseStyle + hoverStyle) pour rester
// au plus près du markup original et préserver le rendu à l'identique.
export default function Hover({
  as = 'div',
  baseStyle,
  hoverStyle,
  children,
  ...rest
}) {
  const [hovered, setHovered] = useState(false)
  const style = { ...(baseStyle || {}), ...(hovered ? hoverStyle : null) }
  return createElement(
    as,
    {
      ...rest,
      style,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
    children,
  )
}
