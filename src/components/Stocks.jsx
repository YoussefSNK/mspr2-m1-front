import Hover from './Hover'
import { parseStyle } from '../lib/style'

const gridCols = '1.1fr 1fr 1.5fr 1.2fr .8fr .9fr .9fr'

// Stocks & lots : bannière FIFO, filtres pays/statut, recherche, table des lots.
export default function Stocks({ v }) {
  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', animation: 'viewIn .45s ease both' }}>
      {/* FIFO banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--coffee-soft)', borderRadius: '12px', padding: '13px 18px', marginBottom: '18px' }}>
        <span style={{ flex: 'none', color: 'var(--coffee)' }}>{v.fifoIcon}</span>
        <span style={{ fontSize: '13.5px', color: 'var(--coffee)', fontWeight: 500 }}>
          Tri <b>FIFO</b> — les lots les plus anciens sont en haut et doivent être expédiés en priorité.
        </span>
      </div>

      {/* controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '11px', padding: '4px', gap: '2px' }}>
          {v.countryTabs.map((t, i) => (
            <button key={i} onClick={t.onClick} style={parseStyle(t.style)}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {v.statusFilters.map((f, i) => (
            <button key={i} onClick={f.onClick} style={parseStyle(f.style)}>
              {f.label} <span style={{ opacity: 0.6 }}>{f.count}</span>
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '9px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '11px', padding: '0 14px', height: '40px', minWidth: '220px' }}>
          <span style={{ flex: 'none', color: 'var(--ink-faint)' }}>{v.searchIcon}</span>
          <input
            value={v.search}
            onChange={v.onSearch}
            placeholder="Rechercher un lot…"
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', font: 'inherit', fontSize: '14px', color: 'var(--ink)' }}
          />
        </div>
      </div>

      {/* table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '12px', padding: '14px 22px', borderBottom: '1px solid var(--border)', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          <span>Lot</span><span>Pays</span><span>Entrepôt</span><span>Date stockage</span><span>Âge</span><span>Temp.</span><span>Statut</span>
        </div>
        {v.filteredLots.map((l, i) => (
          <Hover
            key={i}
            as="button"
            onClick={l.onOpen}
            baseStyle={{ width: '100%', display: 'grid', gridTemplateColumns: gridCols, gap: '12px', padding: '16px 22px', border: 'none', borderBottom: '1px solid var(--border-soft)', background: 'transparent', cursor: 'pointer', font: 'inherit', textAlign: 'left', alignItems: 'center', transition: 'background .18s' }}
            hoverStyle={{ background: 'var(--surface-2)' }}
          >
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: '13.5px', color: 'var(--ink)' }}>{l.id}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--ink-soft)' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: l.dot }}></span>{l.countryName}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.warehouse}</span>
            <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{l.dateLabel}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: l.ageColor, fontWeight: 500 }}>{l.ageLabel}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: l.tColor, fontWeight: 500 }}>{l.tNow}°</span>
            <span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: l.statusColor, background: l.statusBg, padding: '5px 11px', borderRadius: '20px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: l.statusColor }}></span>{l.statusLabel}
              </span>
            </span>
          </Hover>
        ))}
        {v.noLots && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '14px' }}>Aucun lot ne correspond à ces filtres.</div>
        )}
      </div>
    </div>
  )
}
