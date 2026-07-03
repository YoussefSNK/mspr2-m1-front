import Hover from './Hover'

// Vue d'ensemble : KPIs, carte réseau, alertes récentes, cartes pays.
export default function Dashboard({ v }) {
  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', animation: 'viewIn .45s ease both' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' }}>
        {v.kpis.map((k, i) => (
          <Hover
            key={i}
            baseStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)', transition: 'transform .25s,box-shadow .25s' }}
            hoverStyle={{ transform: 'translateY(-3px)', boxShadow: 'var(--shadow)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{k.label}</span>
              <span style={{ width: '30px', height: '30px', borderRadius: '9px', display: 'grid', placeItems: 'center', background: k.tintBg, color: k.tint }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1, marginTop: '14px', color: k.tint }}>{k.value}</div>
            <div style={{ fontSize: '12.5px', color: 'var(--ink-faint)', marginTop: '8px' }}>{k.sub}</div>
          </Hover>
        ))}
      </div>

      {/* map + alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: '16px', marginTop: '16px' }}>
        {/* MAP */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px 22px', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Réseau d'exploitations</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ink-faint)' }}>Amérique du Sud · 3 pays connectés au siège</p>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11.5px', color: 'var(--ink-faint)', letterSpacing: '.04em' }}>MQTT · LIVE</span>
          </div>

          <div style={{ position: 'relative', height: '340px', marginTop: '8px' }}>
            {/* topo rings */}
            <div style={{ position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%,-50%)', width: '420px', height: '420px', borderRadius: '50%', border: '1px solid var(--border-soft)', opacity: 0.6 }}></div>
            <div style={{ position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%,-50%)', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid var(--border-soft)', opacity: 0.5 }}></div>
            <div style={{ position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%,-50%)', width: '180px', height: '180px', borderRadius: '50%', border: '1px solid var(--border-soft)', opacity: 0.45 }}></div>

            {/* continent silhouette */}
            <svg viewBox="0 0 100 150" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              <path d="M 38 6 C 49 4 58 9 56 19 C 61 23 73 24 70 37 C 81 42 89 61 78 79 C 74 96 66 106 60 119 C 56 129 53 141 46 143 C 41 145 39 136 40 127 C 35 119 29 112 32 99 C 27 87 21 78 24 63 C 19 53 15 43 22 35 C 25 25 28 15 38 6 Z" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="0.6" strokeOpacity="0.5" strokeLinejoin="round" />
            </svg>

            {/* siège label */}
            <div style={{ position: 'absolute', right: '6%', top: '6%', display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--coffee-soft)', color: 'var(--coffee)', fontSize: '11.5px', fontWeight: 700, padding: '6px 11px', borderRadius: '20px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--coffee)' }}></span>Siège · Consolidation
            </div>

            {/* pins */}
            {v.mapPins.map((p, i) => (
              <button key={i} onClick={p.onClick} style={{ position: 'absolute', left: p.left, top: p.top, transform: 'translate(-50%,-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', font: 'inherit' }}>
                <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: '18px', height: '18px' }}>
                  <span style={{ position: 'absolute', width: '18px', height: '18px', borderRadius: '50%', background: p.color, opacity: 0.45, animation: 'ringPulse 2.6s ease-out infinite' }}></span>
                  <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: p.color, border: '3px solid var(--surface)', boxShadow: '0 2px 6px oklch(0 0 0/.25)' }}></span>
                </span>
                <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '9px', padding: '5px 10px', boxShadow: 'var(--shadow-sm)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>{p.name}</span>
                  <span style={{ display: 'block', fontSize: '11px', color: p.color, fontWeight: 600, marginTop: '1px' }}>{p.statusLabel}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ALERTS feed */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px 22px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Alertes récentes</h2>
            <button onClick={v.goAlerts} style={{ background: 'none', border: 'none', color: 'var(--primary)', font: 'inherit', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Tout voir →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '16px' }}>
            {v.recentAlerts.map((a, i) => (
              <Hover
                key={i}
                as="button"
                onClick={a.onClick}
                baseStyle={{ display: 'flex', gap: '13px', alignItems: 'flex-start', textAlign: 'left', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: '12px', padding: '13px 14px', cursor: 'pointer', font: 'inherit', transition: '.2s' }}
                hoverStyle={{ borderColor: a.color }}
              >
                <span style={{ flex: 'none', width: '34px', height: '34px', borderRadius: '9px', display: 'grid', placeItems: 'center', background: a.bg, color: a.color }}>{a.icon}</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>{a.title}</span>
                    <span style={{ fontSize: '11px', color: 'var(--ink-faint)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{a.time}</span>
                  </span>
                  <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--ink-soft)', marginTop: '3px', lineHeight: 1.4 }}>{a.msg}</span>
                </span>
              </Hover>
            ))}
          </div>
        </div>
      </div>

      {/* country sensor cards */}
      <h2 style={{ margin: '30px 0 14px', fontSize: '16px', fontWeight: 700 }}>
        Conditions par entrepôt <span style={{ fontWeight: 500, color: 'var(--ink-faint)', fontSize: '14px' }}>· relevés IoT en direct</span>
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
        {v.countryCards.map((c, i) => (
          <Hover
            key={i}
            as="button"
            onClick={c.onClick}
            baseStyle={{ textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', font: 'inherit', transition: 'transform .25s,box-shadow .25s' }}
            hoverStyle={{ transform: 'translateY(-3px)', boxShadow: 'var(--shadow)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
              <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary-strong)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 800, letterSpacing: '.02em' }}>{c.code}</span>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>{c.region} · {c.lots} lots</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: c.statusColor, background: c.statusBg, padding: '5px 10px', borderRadius: '20px' }}>{c.statusLabel}</span>
            </div>

            <div style={{ margin: '16px 0 4px' }}>{c.spark}</div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-faint)', fontWeight: 600 }}>{c.tIcon} Température</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '19px', fontWeight: 600, marginTop: '4px', color: c.tColor }}>{c.tNow}°C</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ink-faint)', marginTop: '1px' }}>idéal {c.tIdeal}°C ±{c.tolT}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-faint)', fontWeight: 600 }}>{c.hIcon} Humidité</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '19px', fontWeight: 600, marginTop: '4px', color: c.hColor }}>{c.hNow}%</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ink-faint)', marginTop: '1px' }}>idéal {c.hIdeal}% ±{c.tolH}</div>
              </div>
            </div>
          </Hover>
        ))}
      </div>
    </div>
  )
}
