const RELATIONSHIP_COLORS = {
  self:    { fill: '#f59e0b', stroke: '#fcd34d' }, // gold — selected nation
  allied:  { fill: '#1d4ed8', stroke: '#93c5fd' }, // blue — allied
  hostile: { fill: '#991b1b', stroke: '#fca5a5' }, // red — hostile
  neutral: { fill: '#1e2d45', stroke: '#4b6a8a' }, // dark blue-gray — neutral
}

/**
 * NationRegion — A single clickable SVG nation polygon + label.
 */
function NationRegion({ nation, isSelected, relationship = 'neutral', onClick }) {
  const colors = isSelected
    ? RELATIONSHIP_COLORS.self
    : RELATIONSHIP_COLORS[relationship] ?? RELATIONSHIP_COLORS.neutral

  return (
    <g
      className={`nation-region ${isSelected ? 'selected' : relationship}`}
      onClick={() => onClick(nation.id)}
      style={{ cursor: 'pointer' }}
    >
      <polygon
        points={nation.points}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={isSelected ? 2.5 : 1.5}
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
