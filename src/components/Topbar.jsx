import Hover from './Hover'

// Barre supérieure : bouton retour, titre de page, badge live, badge siège.
export default function Topbar({ v }) {
  return (
    <header
      style={{
        flex: 'none', height: '72px', display: 'flex', alignItems: 'center', gap: '18px',
        padding: '0 28px', borderBottom: '1px solid var(--border)',
        background: 'color-mix(in oklab,var(--surface) 75%,transparent)',
        backdropFilter: 'blur(8px)', zIndex: 4,
      }}
    >
      {v.showBack && (
        <Hover
          as="button"
          onClick={v.goBack}
          baseStyle={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '7px', height: '38px', padding: '0 14px 0 11px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink-soft)', borderRadius: '10px', cursor: 'pointer', font: 'inherit', fontSize: '13.5px', fontWeight: 600, transition: '.2s' }}
          hoverStyle={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          {v.backIcon}
          <span>Retour</span>
        </Hover>
      )}
      <div style={{ minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.1 }}>{v.pageTitle}</h1>
        <div style={{ fontSize: '13px', color: 'var(--ink-faint)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.pageSub}</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '30px', fontSize: '13px', color: 'var(--ink-soft)', fontWeight: 500 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ok)', boxShadow: '0 0 0 3px var(--ok-soft)' }}></span>
          {v.liveLabel}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 14px 6px 8px', background: 'var(--coffee-soft)', borderRadius: '30px' }}>
          <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--coffee)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '12.5px', fontWeight: 700 }}>SG</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--coffee)' }}>Siège · Global</span>
        </div>
      </div>
    </header>
  )
}
