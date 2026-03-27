/**
 * NationRegion — A single clickable SVG nation polygon + label.
 */
function NationRegion({ nation, isSelected, onClick }) {
  return (
    <g
      className={`nation-region ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(nation.id)}
      style={{ cursor: 'pointer' }}
    >
      <polygon
        points={nation.points}
        fill={isSelected ? '#3b82f6' : '#1e2d45'}
        stroke="#4b6a8a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text
        x={nation.labelX}
        y={nation.labelY}
        textAnchor="middle"
        fill="#e0e0e0"
        fontSize="13"
        fontWeight="600"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        pointerEvents="none"
      >
        {nation.label}
      </text>
    </g>
  )
}

export default NationRegion
