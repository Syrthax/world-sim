import NationRegion from './NationRegion'
import EventArrows from './EventArrows'
import { NATIONS, DUMMY_WORLD, DUMMY_EVENTS, NATION_CENTERS } from '../data/worldData'
import './MapView.css'

/**
 * Derive the visual relationship of nationId relative to perspectiveId.
 * Uses live worldState.nationMap if available, falls back to DUMMY_WORLD.
 * Returns: 'self' | 'allied' | 'hostile' | 'neutral'
 */
function getRelationship(perspectiveId, nationId, worldState) {
  if (!perspectiveId || perspectiveId === nationId) return 'self'
  const map = worldState?.nationMap
  const perspective = map ? map[perspectiveId] : DUMMY_WORLD[perspectiveId]
  if (!perspective) return 'neutral'
  if (perspective.alliances.some(a => (typeof a === 'string' ? a : a.id) === nationId)) return 'allied'
  const trust = perspective.trust[nationId] ?? 0
  if (trust <= -15) return 'hostile'
  return 'neutral'
}

function MapView({ selectedNation, onNationClick, worldState, events }) {
  // Derive event arrows: use live eventLog (last 5) or fall back to dummy
  const liveLog = worldState?.config?.eventLog
  const arrowEvents = liveLog && liveLog.length > 0
    ? liveLog.slice(-5).map((e, i) => ({
        id: e.turn ?? i,
        type: e.type,
        attacker: e.source,
        target: e.target,
        label: e.description?.substring(0, 30) ?? e.type,
        time: `T${e.turn ?? i}`,
      })).filter(e => e.attacker && e.target && NATION_CENTERS[e.attacker] && NATION_CENTERS[e.target])
    : (events ?? DUMMY_EVENTS)
  return (
    <div className="map-view">
      <svg
        viewBox="0 0 800 550"
        xmlns="http://www.w3.org/2000/svg"
        className="europe-svg"
      >
        {/* Ocean background */}
        <rect width="800" height="550" fill="#0a1628" rx="8" />

        {/* Grid lines — subtle geographic feel */}
        <g stroke="#0e1f35" strokeWidth="1">
          {[100, 200, 300, 400, 500, 600, 700].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="550" />
          ))}
          {[100, 200, 300, 400, 500].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="800" y2={y} />
          ))}
        </g>

        {/* Nation regions — color coded by relationship to selected nation */}
        {NATIONS.map(nation => (
          <NationRegion
            key={nation.id}
            nation={nation}
            isSelected={selectedNation === nation.id}
            relationship={getRelationship(selectedNation, nation.id, worldState)}
            onClick={onNationClick}
          />
        ))}

        {/* Event arrows — rendered above nations */}
        <EventArrows events={arrowEvents} />

        {/* Legend */}
        <g transform="translate(14, 460)">
          <rect width="150" height="84" fill="#0a1628" fillOpacity="0.85" rx="6" />
          {[
            { color: '#f59e0b', label: 'Selected' },
            { color: '#1d4ed8', label: 'Allied' },
            { color: '#991b1b', label: 'Hostile' },
            { color: '#1e2d45', label: 'Neutral' },
          ].map(({ color, label }, i) => (
            <g key={label} transform={`translate(12, ${14 + i * 18})`}>
              <rect width="12" height="12" fill={color} rx="2" />
              <text x="20" y="10" fill="#9ca3af" fontSize="11" fontFamily="sans-serif">{label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

export default MapView
