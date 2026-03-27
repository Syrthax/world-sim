import { useState, useEffect } from 'react'
import MapView from './components/MapView'
import SidePanel from './components/SidePanel'
import ActionBar from './components/ActionBar'
import { useWorldState } from './hooks/useWorldState'
import './App.css'

function App() {
  const [selectedNation, setSelectedNation] = useState(null)
  const { worldState, loading, error, turnSummary, refreshState, triggerEvent, resetSimulation } = useWorldState()

  // Load world state on mount
  useEffect(() => { refreshState() }, [refreshState])

  return (
    <div className="app">
      <header className="app-header">
        <h1>World Sim</h1>
        <p className="subtitle">AI-Driven Geopolitical Simulation</p>
        <div className="header-controls">
          <span className="turn-badge">
            Turn {worldState?.config?.turn ?? '—'}
          </span>
          <button
            className="reset-btn"
            onClick={resetSimulation}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          ⚠ {error} — <button onClick={refreshState}>Retry</button>
        </div>
      )}

      <main className="app-main">
        <div className="map-column">
          <div className="map-container">
            {loading && !worldState && <div className="loading-overlay">Loading world…</div>}
            <MapView
              selectedNation={selectedNation}
              onNationClick={setSelectedNation}
              worldState={worldState}
            />
          </div>
          <ActionBar
            selectedNation={selectedNation}
            worldState={worldState}
            onAction={triggerEvent}
            loading={loading}
          />
        </div>
        <SidePanel selectedNation={selectedNation} worldState={worldState} turnSummary={turnSummary} />
      </main>
    </div>
  )
}

export default App
