import { parseStyle } from '../lib/style'

// Centre d'alertes : filtres par type, liste détaillée des alertes actives.
export default function Alerts({ v }) {
  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', animation: 'viewIn .45s ease both' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {v.alertTabs.map((t, i) => (
          <button key={i} onClick={t.onClick} style={parseStyle(t.style)}>
            {t.label} <span style={{ opacity: 0.6 }}>{t.count}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {v.alertsList.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${a.color}`, borderRadius: 'var(--r)', padding: '18px 22px', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ flex: 'none', width: '42px', height: '42px', borderRadius: '11px', display: 'grid', placeItems: 'center', background: a.bg, color: a.color }}>{a.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '15px', fontWeight: 700 }}>{a.title}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: a.color, background: a.bg, padding: '3px 9px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{a.tag}</span>
                <span style={{ fontSize: '12px', color: 'var(--ink-faint)', marginLeft: 'auto' }}>{a.time}</span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>{a.msg}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '13px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                  {v.mailIcon} Email → <b style={{ color: 'var(--ink)' }}>{a.email}</b>
                </span>
                {a.hasLot && (
                  <button onClick={a.onOpen} style={{ background: 'none', border: 'none', color: 'var(--primary)', font: 'inherit', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    Voir le lot {a.lotId} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
