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
  ally:     '#60a5fa',
  trade:    '#34d399',
  support:  '#a78bfa',
  betray:   '#fb923c',
  neutral:  '#6b7280',
}

const STATUS_COLORS = {
  peace:   '#34d399',
  tension: '#fbbf24',
  war:     '#f87171',
}

function TrustBar({ label, score }) {
  const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0
  const pct   = Math.max(0, Math.min(100, ((safeScore + 100) / 200) * 100))
  const color = safeScore >= 30 ? '#34d399' : safeScore >= 0 ? '#fbbf24' : '#f87171'
  return (
    <div className="trust-row">
      <span className="trust-label">{label}</span>
      <div className="trust-bar-bg">
        <div className="trust-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="trust-score" style={{ color }}>
        {safeScore > 0 ? '+' : ''}{safeScore}
      </span>
    </div>
  )
}

/**
 * SidePanel — shows live world state for the selected nation.
 * Falls back to empty state when nothing is selected.
 */
function SidePanel({ selectedNation, worldState, turnSummary }) {
  if (!selectedNation) {
    return (
      <div className="nation-panel">
        <p className="no-data" style={{ marginTop: '2rem', textAlign: 'center' }}>
          Click a nation to inspect it
        </p>
      </div>
    )
  }

  // Use live data if available; otherwise show loading placeholder
  const nation = worldState?.nationMap?.[selectedNation]

  if (!nation) {
    return (
      <div className="nation-panel">
        <p className="no-data" style={{ marginTop: '2rem', textAlign: 'center' }}>
          Loading nation data…
        </p>
      </div>
    )
  }

  const personalityColor  = PERSONALITY_COLORS[nation.personality] ?? '#9ca3af'
  const statusColor       = STATUS_COLORS[nation.status] ?? '#6b7280'
  const eventLog          = worldState?.config?.eventLog ?? []
  const relevantEvents    = eventLog
    .filter(e => e.source === selectedNation || e.target === selectedNation)
    .slice(-10)
    .reverse()

  return (
    <div className="nation-panel">
      {/* Header */}
      <div className="panel-header">
        <h2 className="panel-nation-name">{nation.name}</h2>
        <span
          className="personality-badge"
          style={{ color: personalityColor, borderColor: personalityColor }}
        >
          {nation.personality}
        </span>
        {nation.experience && (nation.experience.hostilityReceived > 0 || nation.experience.cooperationReceived > 0) && (
          <div style={{ display: 'flex', gap: '6px', fontSize: '0.65rem', marginTop: '4px' }}>
            {nation.experience.hostilityReceived > 0 && (
              <span style={{ color: '#f87171' }}>⚔ {nation.experience.hostilityReceived}</span>
            )}
            {nation.experience.cooperationReceived > 0 && (
              <span style={{ color: '#34d399' }}>♦ {nation.experience.cooperationReceived}</span>
            )}
          </div>
        )}
      </div>

      {/* Status + Resources */}
      <section className="panel-section">
        <h3 className="section-title">Status</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: statusColor, fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>
            ● {nation.status}
          </span>
        </div>
        {/* Resource bar */}
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: '3px' }}>
            <span>Resources</span>
            <span style={{ color: nation.resources < 30 ? '#f87171' : nation.resources < 60 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
              {nation.resources}/120
            </span>
          </div>
          <div style={{ height: '6px', background: '#1a2035', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (nation.resources / 120) * 100)}%`,
              background: nation.resources < 30 ? '#f87171' : nation.resources < 60 ? '#fbbf24' : '#34d399',
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </section>

      {/* Strategic Intent */}
      {nation.intent && (
        <section className="panel-section">
          <h3 className="section-title">Strategic Intent</h3>
          <div style={{ fontSize: '0.78rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
              background: EVENT_TYPE_COLORS[nation.intent.type] ? `${EVENT_TYPE_COLORS[nation.intent.type]}22` : '#1f2937',
              color: EVENT_TYPE_COLORS[nation.intent.type] ?? '#9ca3af',
              border: `1px solid ${EVENT_TYPE_COLORS[nation.intent.type] ?? '#374151'}`,
            }}>
              {nation.intent.type}
            </span>
            {nation.intent.target && (
              <>
                <span style={{ color: '#6b7280' }}>→</span>
                <span style={{ color: '#d1d5db' }}>
                  {worldState?.nationMap?.[nation.intent.target]?.name ?? nation.intent.target}
                </span>
              </>
            )}
            <span style={{ color: '#6b7280', fontSize: '0.65rem', marginLeft: 'auto' }}>
              {nation.intent.expiresIn}t left
            </span>
          </div>
        </section>
      )}

      {/* Alliances */}
      <section className="panel-section">
        <h3 className="section-title">Alliances</h3>
        {nation.alliances.length > 0 ? (
          <div className="alliance-list">
            {nation.alliances.map(a => {
              const allyId = typeof a === 'string' ? a : a.id;
              const strength = typeof a === 'string' ? 1 : (a.strength || 1);
              return (
                <span key={allyId} className="alliance-badge" title={`Strength ${strength}/3`}>
                  {worldState.nationMap[allyId]?.name ?? allyId}
                  {strength > 1 && <span style={{ marginLeft: '0.25rem', fontSize: '0.7rem', opacity: 0.7 }}>{'★'.repeat(strength)}</span>}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="no-data">No active alliances</p>
        )}
      </section>

      {/* Trust Scores */}
      <section className="panel-section">
        <h3 className="section-title">Trust Scores</h3>
        <div className="trust-list">
          {Object.entries(nation.trust)
            .sort((a, b) => b[1] - a[1])
            .map(([id, score]) => (
              <TrustBar
                key={id}
                label={worldState.nationMap[id]?.name ?? id}
                score={score}
              />
            ))}
        </div>
      </section>

      {/* Memory Patterns (Phase 6) */}
      {nation.patterns && Object.keys(nation.patterns).length > 0 && (
        <section className="panel-section">
          <h3 className="section-title">Memory Patterns</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.entries(nation.patterns)
              .sort((a, b) => (b[1].hostile + b[1].friendly) - (a[1].hostile + a[1].friendly))
              .map(([otherId, p]) => {
                const name = worldState.nationMap[otherId]?.name ?? otherId
                const isHostile = p.hostile > p.friendly
                const isFriendly = p.friendly > p.hostile
                return (
                  <div key={otherId} style={{ fontSize: '0.72rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ color: isHostile ? '#f87171' : isFriendly ? '#34d399' : '#fbbf24', width: '10px', textAlign: 'center' }}>
                      {isHostile ? '⚔' : isFriendly ? '♦' : '◆'}
                    </span>
                    <span style={{ color: '#9ca3af', flex: 1 }}>{name}</span>
                    {p.hostile > 0 && <span style={{ color: '#f87171', fontSize: '0.68rem' }}>{p.hostile}× hostile</span>}
                    {p.friendly > 0 && <span style={{ color: '#34d399', fontSize: '0.68rem' }}>{p.friendly}× friendly</span>}
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* Memory Log */}
      {nation.memory && nation.memory.length > 0 && (
        <section className="panel-section">
          <h3 className="section-title">Memory Log</h3>
          <ul className="event-list">
            {nation.memory.slice(-10).reverse().map((entry, i) => (
              <li key={i} className="event-item">
                <span className="event-time">T{entry.turn ?? i}</span>
                <span className="event-dot" style={{ background: '#818cf8' }} />
                <span className="event-text">
                  {typeof entry === 'string'
                    ? entry
                    : (entry.summary ?? `${entry.action ?? '?'} → ${entry.target ?? '?'}`)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* AI Reactions (Phase 7) */}
      {turnSummary && turnSummary.reactions && turnSummary.reactions.length > 0 && (
        <section className="panel-section">
          <h3 className="section-title">AI Reactions (Turn {turnSummary.turn})</h3>
          <ul className="event-list">
            {turnSummary.reactions.map((r, i) => {
              const color = EVENT_TYPE_COLORS[r.decision] ?? '#9ca3af'
              const isAI = r.source === 'ai'
              return (
                <li key={i} className="event-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: isAI ? '#1e3a5f' : '#1f2937',
                      color: isAI ? '#60a5fa' : '#6b7280',
                      border: `1px solid ${isAI ? '#2563eb' : '#374151'}`,
                      letterSpacing: '0.04em',
                    }}>
                      {isAI ? 'AI' : 'Rule'}
                    </span>
                    <span className="event-dot" style={{ background: color }} />
                    <strong style={{ color }}>{r.nationName}</strong>
                    <span style={{ color: '#9ca3af' }}>→</span>
                    <span style={{ color }}>{r.decision}</span>
                    {r.target && (
                      <span style={{ color: '#6b7280' }}>
                        {worldState?.nationMap?.[r.target]?.name ?? r.target}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', paddingLeft: '1.25rem' }}>
                    {r.reasoning}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Recent Events involving this nation */}
      <section className="panel-section">
        <h3 className="section-title">Recent Events</h3>
        {relevantEvents.length > 0 ? (
          <ul className="event-list">
            {relevantEvents.map((evt, i) => {
              const isSource  = evt.source === selectedNation
              const otherId   = isSource ? evt.target : evt.source
              const otherName = worldState.nationMap[otherId]?.name ?? otherId ?? '—'
              const color     = EVENT_TYPE_COLORS[evt.type] ?? '#9ca3af'
              return (
                <li key={i} className="event-item">
                  <span className="event-time">T{evt.turn ?? i}</span>
                  <span className="event-dot" style={{ background: color }} />
                  <span className="event-text">
                    <strong style={{ color }}>{evt.type}</strong>
                    {otherId && (
                      <span className="event-other"> {isSource ? '→' : '←'} {otherName}</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="no-data">No events yet this session</p>
        )}
      </section>
    </div>
  )
}

export default SidePanel
