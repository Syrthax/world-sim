import { useState } from 'react'
import './ActionBar.css'

const ACTIONS = [
  { id: 'attack',  label: 'Attack',  color: '#ef4444' },
  { id: 'ally',    label: 'Ally',    color: '#3b82f6' },
  { id: 'sanction',label: 'Sanction',color: '#f97316' },
  { id: 'trade',   label: 'Trade',   color: '#34d399' },
  { id: 'support', label: 'Support', color: '#a78bfa' },
  { id: 'betray',  label: 'Betray',  color: '#fb923c' },
]

/**
 * ActionBar — lets the user trigger game events.
 * Source = selectedNation (the nation clicked on the map).
 * Target = chosen from dropdown.
 * Action = one of the buttons.
 */
function ActionBar({ selectedNation, worldState, onAction, loading }) {
  const [target, setTarget] = useState('')
  const [pendingAction, setPendingAction] = useState(null)

  const nations = worldState?.nations ?? []
  const otherNations = nations.filter(n => n.id !== selectedNation)

  // Reset target when selected nation changes
  if (target && target === selectedNation) setTarget('')

  async function handleAction(actionId) {
    if (!selectedNation || !target) return
    setPendingAction(actionId)
    try {
      await onAction({ type: actionId, source: selectedNation, target })
    } finally {
      setPendingAction(null)
    }
  }

  const disabled = loading || !selectedNation || !target

  return (
    <div className="action-bar">
      <div className="action-bar-row">
        <span className="action-label">From:</span>
        <span className="action-source">
          {selectedNation
            ? (worldState?.nationMap?.[selectedNation]?.name ?? selectedNation)
            : <em className="no-selection">select a nation on the map</em>}
        </span>

        <span className="action-label">Target:</span>
        <select
          className="action-select"
          value={target}
          onChange={e => setTarget(e.target.value)}
          disabled={!selectedNation || loading}
        >
          <option value="">— choose —</option>
          {otherNations.map(n => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
      </div>

      <div className="action-bar-row">
        {ACTIONS.map(action => (
          <button
            key={action.id}
            className="action-btn"
            style={{ '--btn-color': action.color }}
            disabled={disabled || pendingAction !== null}
            onClick={() => handleAction(action.id)}
          >
            {pendingAction === action.id ? '…' : action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ActionBar
