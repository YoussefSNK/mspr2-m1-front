import { parseStyle } from '../lib/style'

// Détail d'un lot : en-tête, graphique d'historique, alerte, conditions
// idéales et journal du lot (timeline).
export default function LotDetail({ v }) {
  const lot = v.lot
  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', animation: 'viewIn .45s ease both' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* left: info + chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* header card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '22px', fontWeight: 600 }}>{lot.id}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 700, color: lot.statusColor, background: lot.statusBg, padding: '6px 13px', borderRadius: '20px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: lot.statusColor }}></span>{lot.statusLabel}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginTop: '20px' }}>
              <Field label="Pays" value={lot.countryName} />
              <Field label="Exploitation" value={lot.exploitation} />
              <Field label="Entrepôt" value={lot.warehouse} />
              <Field label="En stock depuis" value={`${lot.dateLabel} · ${lot.ageLabel}`} />
            </div>
          </div>

          {/* chart card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Historique des relevés</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--ink-faint)' }}>Zone verte = plage acceptable pour {lot.countryName}</p>
              </div>
              <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                {v.metricTabs.map((m, i) => (
                  <button key={i} onClick={m.onClick} style={parseStyle(m.style)}>{m.label}</button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '18px' }}>{v.detailChart}</div>
            <div style={{ display: 'flex', gap: '22px', marginTop: '8px', flexWrap: 'wrap' }}>
              {v.chartLegend.map((g, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                  <span style={{ width: '14px', height: '3px', borderRadius: '2px', background: g.color }}></span>
                  {g.label} <b style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--ink)' }}>{g.now}</b>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* right: alert + timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {lot.hasAlert && (
            <div style={{ background: lot.statusBg, border: `1px solid ${lot.statusColor}`, borderRadius: 'var(--r)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: lot.statusColor }}>
                <span>{lot.alertIcon}</span>
                <span style={{ fontSize: '14.5px', fontWeight: 700 }}>{lot.alertTitle}</span>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>{lot.alertMsg}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${lot.statusColor}` }}>
                <span style={{ color: lot.statusColor }}>{v.mailIcon}</span>
                <span style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                  Email envoyé à <b style={{ color: 'var(--ink)' }}>{lot.responsable}</b> (resp. {lot.countryName})
                </span>
              </div>
            </div>
          )}

          {/* ideal conditions */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700 }}>Conditions idéales</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, textAlign: 'center', background: 'var(--surface-2)', borderRadius: '11px', padding: '16px 10px' }}>
                <div style={{ color: 'var(--ink-faint)', display: 'flex', justifyContent: 'center' }}>{v.tIconBig}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '22px', fontWeight: 600, marginTop: '8px', color: 'var(--primary-strong)' }}>{lot.idealT}°C</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '3px' }}>tolérance ±{lot.tolT}°C</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', background: 'var(--surface-2)', borderRadius: '11px', padding: '16px 10px' }}>
                <div style={{ color: 'var(--ink-faint)', display: 'flex', justifyContent: 'center' }}>{v.hIconBig}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '22px', fontWeight: 600, marginTop: '8px', color: 'var(--primary-strong)' }}>{lot.idealH}%</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '3px' }}>tolérance ±{lot.tolH}%</div>
              </div>
            </div>
          </div>

          {/* timeline */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 700 }}>Journal du lot</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {lot.events.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', paddingBottom: '18px', position: 'relative' }}>
                  <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: e.bg, color: e.color, display: 'grid', placeItems: 'center', zIndex: 1 }}>{e.icon}</span>
                    <span style={{ width: '2px', flex: 1, background: 'var(--border)', marginTop: '4px' }}></span>
                  </div>
                  <div style={{ paddingTop: '3px' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>{e.title}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginTop: '3px', lineHeight: 1.45 }}>{e.detail}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '4px' }}>{e.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontSize: '14.5px', fontWeight: 600, marginTop: '5px' }}>{value}</div>
    </div>
  )
}
