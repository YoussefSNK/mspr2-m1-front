import Hover from './Hover'
import { parseStyle } from '../lib/style'

// Barre latérale : marque, navigation, contrôles thème/réduction.
// Styles inline repris à l'identique du template .dc.html d'origine.
export default function Sidebar({ v }) {
  return (
    <aside
      style={{
        flex: 'none',
        width: v.sidebarWidth,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .32s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      {/* brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 18px 16px', height: '72px', flex: 'none' }}>
        <div
          style={{
            flex: 'none', width: '38px', height: '38px', borderRadius: '11px',
            background: 'linear-gradient(150deg,var(--primary),var(--primary-strong))',
            display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px oklch(0.5 0.1 152/0.28)',
          }}
        >
          {v.brandLeaf}
        </div>
        {v.showBrandText && (
          <div style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontWeight: 600, fontSize: '20px', letterSpacing: '.2px' }}>FutureKawa</div>
            <div style={{ fontSize: '10.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: '3px', fontWeight: 600 }}>Suivi des stocks</div>
          </div>
        )}
      </div>

      {/* nav */}
      <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {v.navItems.map((item, i) => (
          <Hover
            key={i}
            as="button"
            onClick={item.onClick}
            title={item.label}
            baseStyle={parseStyle(item.rowStyle)}
            hoverStyle={{ background: 'var(--surface-2)' }}
          >
            <span style={{ flex: 'none', display: 'grid', placeItems: 'center', width: '22px', height: '22px' }}>{item.icon}</span>
            {v.showBrandText && (
              <span style={{ whiteSpace: 'nowrap', fontWeight: item.weight, fontSize: '14.5px' }}>{item.label}</span>
            )}
            {item.showBadge && (
              <span style={{ marginLeft: 'auto', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '11px', fontWeight: 700, minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '20px', display: 'grid', placeItems: 'center' }}>{item.badge}</span>
            )}
          </Hover>
        ))}
      </nav>

      {/* bottom controls */}
      <div style={{ flex: 'none', padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Hover
          as="button"
          onClick={v.toggleTheme}
          title="Thème"
          baseStyle={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '10px 12px', border: 'none', background: 'transparent', color: 'var(--ink-soft)', borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'inherit', textAlign: 'left', transition: 'background .2s' }}
          hoverStyle={{ background: 'var(--surface-2)' }}
        >
          <span style={{ flex: 'none', display: 'grid', placeItems: 'center', width: '22px', height: '22px' }}>{v.themeIcon}</span>
          {v.showBrandText && <span style={{ whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 500 }}>{v.themeLabel}</span>}
        </Hover>
        <Hover
          as="button"
          onClick={v.toggleSidebar}
          title="Réduire"
          baseStyle={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '10px 12px', border: 'none', background: 'transparent', color: 'var(--ink-soft)', borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'inherit', textAlign: 'left', transition: 'background .2s' }}
          hoverStyle={{ background: 'var(--surface-2)' }}
        >
          <span style={{ flex: 'none', display: 'grid', placeItems: 'center', width: '22px', height: '22px', transition: 'transform .3s' }}>{v.collapseIcon}</span>
          {v.showBrandText && <span style={{ whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 500 }}>Réduire</span>}
        </Hover>
      </div>
    </aside>
  )
}
