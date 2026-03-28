import { useState, useCallback, useEffect, useRef } from 'react'
import EventArrows from './EventArrows'
import { DUMMY_EVENTS } from '../data/worldData'
import { ACTIVE_NATIONS, INACTIVE_NATIONS, NATION_CENTROIDS, ACTIVE_NATION_IDS } from '../assets/europe-paths'
import './MapView.css'

const ARROW_LIFETIME_MS = 4000

const RELATIONSHIP_COLORS = {
  self:    { fill: '#2d1f00', stroke: '#f59e0b', width: 2.5 },
  target:  { fill: '#002e1c', stroke: '#00ff88', width: 2.5 },
  allied:  { fill: '#0d1f3d', stroke: '#2563eb', width: 1.5 },
  hostile: { fill: '#2d0d0d', stroke: '#991b1b', width: 1.5 },
  neutral: { fill: '#111d2b', stroke: '#1b3a5a', width: 1 },
}

function getRelationship(perspectiveId, nationId, worldState, targetId) {
  if (nationId === targetId && targetId !== perspectiveId) return 'target'
  if (!perspectiveId || perspectiveId === nationId) return 'self'
  const map = worldState?.nationMap
  const perspective = map?.[perspectiveId]
  if (!perspective) return 'neutral'
  if (perspective.alliances.some(a => (typeof a === 'string' ? a : a.id) === nationId)) return 'allied'
  const trust = perspective.trust[nationId] ?? 0
  if (trust <= -15) return 'hostile'
  return 'neutral'
}

function MapView({ selectedNation, targetNation, onNationClick, worldState }) {
  const [zoom, setZoom] = useState(1)
  const [mouseCoords, setMouseCoords] = useState({ lat: '52.5200', lng: '13.4050' })
  const [visibleArrows, setVisibleArrows] = useState([])
  const seenEventsRef = useRef(new Set())

  // Track new events from the log and auto-expire them after ARROW_LIFETIME_MS
  const liveLog = worldState?.config?.eventLog
  useEffect(() => {
    if (!liveLog || liveLog.length === 0) return

    const newArrows = []
    liveLog.slice(-8).forEach((e, i) => {
      const key = `${e.turn}-${e.source}-${e.target}-${e.type}`
      if (seenEventsRef.current.has(key)) return
      if (!e.source || !e.target || !NATION_CENTROIDS[e.source] || !NATION_CENTROIDS[e.target]) return
      seenEventsRef.current.add(key)
      newArrows.push({
        id: key,
        type: e.type,
        attacker: e.source,
        target: e.target,
        label: e.description?.substring(0, 30) ?? e.type,
        time: `T${e.turn ?? i}`,
        createdAt: Date.now(),
      })
    })

    if (newArrows.length > 0) {
      setVisibleArrows(prev => [...prev, ...newArrows])
    }
  }, [liveLog])

  // Cleanup expired arrows
  useEffect(() => {
    if (visibleArrows.length === 0) return
    const now = Date.now()
    const nextExpiry = visibleArrows.reduce((min, a) => {
      const remaining = ARROW_LIFETIME_MS - (now - a.createdAt)
      return remaining < min ? remaining : min
    }, ARROW_LIFETIME_MS)

    const timer = setTimeout(() => {
      setVisibleArrows(prev => prev.filter(a => Date.now() - a.createdAt < ARROW_LIFETIME_MS))
    }, Math.max(nextExpiry, 50))

    return () => clearTimeout(timer)
  }, [visibleArrows])

  const arrowEvents = visibleArrows.length > 0
    ? visibleArrows.map(a => ({ ...a, fading: Date.now() - a.createdAt > ARROW_LIFETIME_MS - 800 }))
    : DUMMY_EVENTS

  const handleMouseMove = useCallback((e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 800
    const y = ((e.clientY - rect.top) / rect.height) * 600
    const lat = (72 - (y / 600) * 37).toFixed(4)
    const lng = (-10 + (x / 800) * 55).toFixed(4)
    setMouseCoords({ lat, lng })
  }, [])

  const baseW = 800, baseH = 600
  const w = baseW / zoom, h = baseH / zoom
  const vbX = (baseW - w) / 2, vbY = (baseH - h) / 2

  const selectedCenter = selectedNation ? NATION_CENTROIDS[selectedNation] : null
  const targetCenter = targetNation && targetNation !== selectedNation ? NATION_CENTROIDS[targetNation] : null

  return (
    <div className="map-view">
      <svg
        viewBox={`${vbX} ${vbY} ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        className="europe-svg"
        onMouseMove={handleMouseMove}
      >
        <rect x={vbX} y={vbY} width={w} height={h} fill="#080c12" />

        {/* Grid lines */}
        <g stroke="#0e1a28" strokeWidth="0.5" opacity="0.3">
          {[100, 200, 300, 400, 500, 600, 700].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="600" />
          ))}
          {[100, 200, 300, 400, 500].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="800" y2={y} />
          ))}
        </g>

        {/* Inactive countries (greyed out, non-interactive) */}
        <g className="inactive-nations">
          {INACTIVE_NATIONS.map(c => (
            <path
              key={c.id}
              d={c.d}
              fill="#1a1f28"
              stroke="#252b35"
              strokeWidth="0.5"
              opacity="0.35"
              pointerEvents="none"
            />
          ))}
        </g>

        {/* Active nations (interactive) */}
        {ACTIVE_NATIONS.map(nation => {
          const isSelected = selectedNation === nation.id
          const isTarget = targetNation === nation.id
          const rel = getRelationship(selectedNation, nation.id, worldState, targetNation)
          const colors = isSelected
            ? RELATIONSHIP_COLORS.self
            : isTarget
            ? RELATIONSHIP_COLORS.target
            : RELATIONSHIP_COLORS[rel] ?? RELATIONSHIP_COLORS.neutral

          const center = NATION_CENTROIDS[nation.id]

          return (
            <g
              key={nation.id}
              className={`nation-region ${isSelected ? 'selected' : isTarget ? 'target' : rel}`}
              onClick={() => onNationClick(nation.id)}
              style={{ cursor: 'pointer' }}
            >
              <path
                d={nation.d}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={colors.width}
                strokeLinejoin="round"
                fillRule="evenodd"
              />
              {center && (
                <text
                  x={center.x}
                  y={center.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isSelected ? '#f59e0b' : isTarget ? '#00ff88' : '#5a6a7a'}
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="'Share Tech Mono', 'Courier New', monospace"
                  letterSpacing="0.1em"
                  pointerEvents="none"
                >
                  {nation.label}
                </text>
              )}
            </g>
          )
        })}

        <EventArrows events={arrowEvents} />

        {/* "Home Region" label */}
        {selectedCenter && (
          <g transform={`translate(${selectedCenter.x - 50}, ${selectedCenter.y + 25})`}>
            <rect width="100" height="20" fill="rgba(8,12,18,0.7)" stroke="#f59e0b" strokeWidth="1" rx="1" />
            <text x="50" y="14" textAnchor="middle" fill="#f59e0b" fontSize="9"
              fontFamily="'Share Tech Mono', monospace" letterSpacing="0.06em">
              Home Region
            </text>
          </g>
        )}

        {/* "Target" label */}
        {targetCenter && (
          <g transform={`translate(${targetCenter.x - 30}, ${targetCenter.y - 45})`}>
            <rect width="60" height="18" fill="rgba(8,12,18,0.7)" stroke="#00ff88" strokeWidth="1" rx="1" />
            <text x="30" y="13" textAnchor="middle" fill="#00ff88" fontSize="9"
              fontFamily="'Share Tech Mono', monospace" letterSpacing="0.06em">
              Target
            </text>
          </g>
        )}
      </svg>

      {/* HUD Overlay */}
      <div className="map-hud">
        <div className="map-zoom">
          <button className="zoom-btn" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>+</button>
          <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>−</button>
        </div>
        <div className="map-coords">
          <div className="coord-line">
            <span className="coord-icon">◎</span>
            <span className="coord-label">LAT:</span>
            <span className="coord-value">{mouseCoords.lat}° {Number(mouseCoords.lat) >= 0 ? 'N' : 'S'}</span>
          </div>
          <div className="coord-line">
            <span className="coord-icon" style={{ visibility: 'hidden' }}>◎</span>
            <span className="coord-label">LNG:</span>
            <span className="coord-value">{mouseCoords.lng}° {Number(mouseCoords.lng) >= 0 ? 'E' : 'W'}</span>
          </div>
          <div className="coord-line">
            <span className="coord-status-icon">■</span>
            <span className="coord-status">SYSTEM_LINK: ESTABLISHED</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapView
