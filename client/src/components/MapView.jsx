import { useState } from 'react'
import NationRegion from './NationRegion'
import './MapView.css'

/**
 * Simplified Europe map — 6 nations as polygon regions.
 * ViewBox: 800 x 550. Nations are positioned roughly geographically.
 */
const NATIONS = [
  {
    id: 'uk',
    label: 'UK',
    labelX: 162,
    labelY: 138,
    // Island shape, northwest
    points: '128,92 168,76 198,88 202,138 186,172 158,182 128,168 118,138',
  },
  {
    id: 'france',
    label: 'France',
    labelX: 215,
    labelY: 268,
    // Roughly hexagonal, west-center
    points: '155,202 218,188 272,206 288,252 268,318 228,348 182,342 152,296 146,248',
  },
  {
    id: 'germany',
    label: 'Germany',
    labelX: 325,
    labelY: 222,
    // Roughly rectangular, center
    points: '278,152 342,145 368,168 374,228 356,275 306,282 274,252 266,192',
  },
  {
    id: 'poland',
    label: 'Poland',
    labelX: 422,
    labelY: 228,
    // East of Germany
    points: '378,162 442,155 464,176 468,238 456,288 402,294 372,262 370,198',
  },
  {
    id: 'italy',
    label: 'Italy',
    labelX: 312,
    labelY: 418,
    // Boot-shaped peninsula
    points: '278,332 322,322 352,348 356,402 340,452 315,492 288,472 272,428 274,368',
  },
  {
    id: 'russia',
    label: 'Russia',
    labelX: 635,
    labelY: 238,
    // Large eastern region
    points: '472,102 685,92 802,142 802,392 645,412 492,388 462,292 458,188',
  },
]

function MapView({ selectedNation, onNationClick }) {
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

        {/* Nation regions */}
        {NATIONS.map(nation => (
          <NationRegion
            key={nation.id}
            nation={nation}
            isSelected={selectedNation === nation.id}
            onClick={onNationClick}
          />
        ))}
      </svg>
    </div>
  )
}

export default MapView
