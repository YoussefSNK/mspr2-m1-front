import { useEffect, useState } from 'react'
import Hover from './Hover'

const SOUTH_AMERICA_GEOJSON_URL =
  'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/south-america.geojson'

const SOUTH_AMERICA_HIGHLIGHTS = new Map([
  ['Brazil', 'var(--primary-soft)'],
  ['Ecuador', 'var(--coffee-soft)'],
  ['Colombia', 'var(--ok-soft)'],
])

// Vue d'ensemble : KPIs, carte réseau, alertes récentes, cartes pays.
export default function Dashboard({ v }) {
  const [mapLayers, setMapLayers] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch(SOUTH_AMERICA_GEOJSON_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status)
        }
        return response.json()
      })
      .then((geojson) => {
        if (cancelled) return
        setMapLayers(buildSouthAmericaMapLayers(geojson))
      })
      .catch(() => {
        if (!cancelled) setMapLayers(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

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

          <div style={{ position: 'relative', height: '340px', marginTop: '8px', borderRadius: '20px', background: 'linear-gradient(180deg,color-mix(in oklab,var(--surface) 84%,var(--primary-soft)) 0%,var(--surface) 100%)' }}>
            {mapLayers ? (
              <svg viewBox="0 0 520 640" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <filter id="saSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="oklch(0 0 0 / 0.12)" />
                  </filter>
                </defs>

                <rect x="0" y="0" width="520" height="640" rx="24" fill="transparent" />

                {mapLayers.base.map((layer) => (
                  <path
                    key={layer.name}
                    d={layer.path}
                    fill={layer.fill}
                    fillOpacity={layer.fillOpacity}
                    stroke={layer.stroke}
                    strokeOpacity={layer.strokeOpacity}
                    strokeWidth={layer.strokeWidth}
                    strokeLinejoin="round"
                    filter={layer.shadow ? 'url(#saSoftShadow)' : undefined}
                  />
                ))}

                {mapLayers.highlights.map((layer) => (
                  <path
                    key={layer.name}
                    d={layer.path}
                    fill={layer.fill}
                    fillOpacity={layer.fillOpacity}
                    stroke={layer.stroke}
                    strokeOpacity={layer.strokeOpacity}
                    strokeWidth={layer.strokeWidth}
                    strokeLinejoin="round"
                    filter="url(#saSoftShadow)"
                  />
                ))}

                {mapLayers.labels.map((label) => (
                  <g key={label.name} transform={`translate(${label.x} ${label.y})`}>
                    <rect x="-42" y="-14" width="84" height="28" rx="14" fill="var(--surface)" fillOpacity="0.82" stroke="var(--border)" strokeOpacity="0.7" />
                    <text x="0" y="5" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink-soft)">{label.shortName}</text>
                  </g>
                ))}
              </svg>
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--ink-faint)', fontSize: '13px', letterSpacing: '.02em' }}>
                Chargement de la carte vectorielle…
              </div>
            )}

            {/* siège label */}
            <div style={{ position: 'absolute', right: '6%', top: '6%', display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--coffee-soft)', color: 'var(--coffee)', fontSize: '11.5px', fontWeight: 700, padding: '6px 11px', borderRadius: '20px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--coffee)' }}></span>Siège · Consolidation
            </div>

            {/* pins */}
            {mapLayers?.pins?.map((p, i) => {
              const meta = v.mapPins.find((pin) => pin.code === p.code)
              if (!meta) return null

              return (
                <button key={i} onClick={meta.onClick} style={{ position: 'absolute', left: p.left + '%', top: p.top + '%', transform: 'translate(-50%,-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', font: 'inherit' }}>
                  <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: '18px', height: '18px' }}>
                    <span style={{ position: 'absolute', width: '18px', height: '18px', borderRadius: '50%', background: meta.color, opacity: 0.45, animation: 'ringPulse 2.6s ease-out infinite' }}></span>
                    <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: meta.color, border: '3px solid var(--surface)', boxShadow: '0 2px 6px oklch(0 0 0/.25)' }}></span>
                  </span>
                  <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '9px', padding: '5px 10px', boxShadow: 'var(--shadow-sm)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>{meta.name}</span>
                    <span style={{ display: 'block', fontSize: '11px', color: meta.color, fontWeight: 600, marginTop: '1px' }}>{meta.statusLabel}</span>
                  </span>
                </button>
              )
            })}
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

function buildSouthAmericaMapLayers(geojson) {
  const features = (geojson && Array.isArray(geojson.features) ? geojson.features : []).filter(
    (feature) => feature && feature.geometry && feature.properties && feature.properties.name,
  )
  if (!features.length) return null

  const points = []
  features.forEach((feature) => {
    collectGeoPoints(feature.geometry.coordinates, points)
  })

  if (!points.length) return null

  const lonMin = Math.min(...points.map((point) => point[0]))
  const lonMax = Math.max(...points.map((point) => point[0]))
  const latMin = Math.min(...points.map((point) => point[1]))
  const latMax = Math.max(...points.map((point) => point[1]))

  const width = 520
  const height = 640
  const padding = 22
  const xScale = (width - padding * 2) / (lonMax - lonMin || 1)
  const mercatorMin = mercatorY(latMin)
  const mercatorMax = mercatorY(latMax)
  const yScale = (height - padding * 2) / (mercatorMax - mercatorMin || 1)

  const project = ([lon, lat]) => {
    const x = padding + (lon - lonMin) * xScale
    const y = height - padding - (mercatorY(lat) - mercatorMin) * yScale
    return [x, y]
  }

  const base = []
  const highlights = []
  const labels = []
  const pins = []

  features.forEach((feature) => {
    const name = feature.properties.name.replace(/\s*\(.*\)\s*$/, '')
    const path = geometryToPath(feature.geometry, project)
    if (!path) return

    const highlightFill = SOUTH_AMERICA_HIGHLIGHTS.get(name)
    const centroid = featureCentroid(feature.geometry, project)
    const shortName = name === 'Ecuador' ? 'Équateur' : name

    base.push({
      name,
      path,
      fill: 'var(--surface-2)',
      fillOpacity: 0.14,
      stroke: 'var(--border)',
      strokeOpacity: 0.72,
      strokeWidth: 1.1,
      shadow: false,
    })

    if (highlightFill) {
      highlights.push({
        name,
        path,
        fill: highlightFill,
        fillOpacity: 0.72,
        stroke: name === 'Brazil' ? 'var(--primary)' : name === 'Ecuador' ? 'var(--coffee)' : 'var(--ok)',
        strokeOpacity: 0.9,
        strokeWidth: 1.4,
      })

      labels.push({
        name,
        shortName,
        x: centroid[0],
        y: centroid[1],
      })

      pins.push({
        code: name === 'Brazil' ? 'BR' : name === 'Ecuador' ? 'EC' : 'CO',
        left: (centroid[0] / width) * 100,
        top: (centroid[1] / height) * 100,
      })
    }
  })

  return { base, highlights, labels, pins }
}

function collectGeoPoints(coordinates, output) {
  if (!Array.isArray(coordinates)) return output
  if (coordinates.length && typeof coordinates[0] === 'number') {
    output.push(coordinates)
    return output
  }
  coordinates.forEach((item) => collectGeoPoints(item, output))
  return output
}

function mercatorY(lat) {
  const clamped = Math.max(-85, Math.min(85, lat))
  const rad = (clamped * Math.PI) / 180
  return Math.log(Math.tan(Math.PI / 4 + rad / 2))
}

function geometryToPath(geometry, project) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return ''

  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : []
  const commands = []

  polygons.forEach((polygon) => {
    polygon.forEach((ring) => {
      if (!ring.length) return
      const [startX, startY] = project(ring[0])
      commands.push('M' + startX.toFixed(2) + ' ' + startY.toFixed(2))
      for (let i = 1; i < ring.length; i++) {
        const [x, y] = project(ring[i])
        commands.push('L' + x.toFixed(2) + ' ' + y.toFixed(2))
      }
      commands.push('Z')
    })
  })

  return commands.join(' ')
}

function featureCentroid(geometry, project) {
  const points = []
  collectGeoPoints(geometry.coordinates, points)
  if (!points.length) return [260, 320]

  const xs = points.map((point) => point[0])
  const ys = points.map((point) => point[1])
  const lonCenter = (Math.min(...xs) + Math.max(...xs)) / 2
  const latCenter = (Math.min(...ys) + Math.max(...ys)) / 2
  return project([lonCenter, latCenter])
}
