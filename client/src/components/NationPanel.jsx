import { DUMMY_WORLD, DUMMY_EVENTS } from '../data/worldData'
import './NationPanel.css'

const PERSONALITY_COLORS = {
  diplomatic:    '#34d399',
  opportunistic: '#fbbf24',
  aggressive:    '#f87171',
  defensive:     '#818cf8',
}

const EVENT_TYPE_COLORS = {
  attack:   '#f87171',
  sanction: '#fb923c',
  alliance: '#60a5fa',
}

function TrustBar({ label, score }) {
  // Map score from [-100, +100] to [0%, 100%]
  const pct = Math.max(0, Math.min(100, ((score + 100) / 200) * 100))
  const color = score >= 30 ? '#34d399' : score >= 0 ? '#fbbf24' : '#f87171'
  return (
    <div className="trust-row">
      <span className="trust-label">{label}</span>
      <div className="trust-bar-bg">
        <div className="trust-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="trust-score" style={{ color }}>
        {score > 0 ? '+' : ''}{score}
      </span>
    </div>
  )
}

function NationPanel({ selectedNation }) {
  if (!selectedNation) return null
  const nation = DUMMY_WORLD[selectedNation]
  if (!nation) return null

  const personalityColor = PERSONALITY_COLORS[nation.personality] ?? '#9ca3af'
  const relevantEvents = DUMMY_EVENTS.filter(
    e => e.attacker === selectedNation || e.target === selectedNation
  )

  return (
    <div className="nation-panel">
      <div className="panel-header">
        <h2 className="panel-nation-name">{nation.label}</h2>
        <span className="personality-badge" style={{ color: personalityColor, borderColor: personalityColor }}>
          {nation.personality}
        </span>
      </div>

      <section className="panel-section">
        <h3 className="section-title">Alliances</h3>
        {nation.alliances.length > 0 ? (
          <div className="alliance-list">
            {nation.alliances.map(a => {
              const allyId = typeof a === 'string' ? a : a.id;
              return (
                <span key={allyId} className="alliance-badge">
                  {DUMMY_WORLD[allyId]?.label ?? allyId}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="no-data">No active alliances</p>
        )}
      </section>

      <section className="panel-section">
        <h3 className="section-title">Trust Scores</h3>
        <div className="trust-list">
          {Object.entries(nation.trust)
            .sort((a, b) => b[1] - a[1])
            .map(([id, score]) => (
              <TrustBar key={id} label={DUMMY_WORLD[id]?.label ?? id} score={score} />
            ))}
        </div>
      </section>

      <section className="panel-section">
        <h3 className="section-title">Recent Events</h3>
        {relevantEvents.length > 0 ? (
          <ul className="event-list">
            {relevantEvents.map(evt => {
              const isAttacker = evt.attacker === selectedNation
              const otherId    = isAttacker ? evt.target : evt.attacker
              const otherLabel = DUMMY_WORLD[otherId]?.label ?? otherId
              const color      = EVENT_TYPE_COLORS[evt.type] ?? '#9ca3af'
              return (
                <li key={evt.id} className="event-item">
                  <span className="event-time">{evt.time}</span>
                  <span className="event-dot" style={{ background: color }} />
                  <span className="event-text">
                    {evt.label}{' '}
                    <span className="event-other">{isAttacker ? '→' : '←'} {otherLabel}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="no-data">No recent events</p>
        )}
      </section>

      <section className="panel-section">
        <h3 className="section-title">Memory Log</h3>
        <p className="no-data">AI decisions will appear here during simulation.</p>
      </section>
    </div>
  )
}

export default NationPanel
