import { useState } from 'react'
import MapView from './components/MapView'
import './App.css'

function App() {
  const [selectedNation, setSelectedNation] = useState(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1>World Sim</h1>
        <p className="subtitle">AI-Driven Geopolitical Simulation</p>
      </header>

      <main className="app-main">
        <div className="map-container">
          <MapView
            selectedNation={selectedNation}
            onNationClick={setSelectedNation}
          />
        </div>
        {selectedNation && (
          <p className="selection-hint">Selected: <strong>{selectedNation.toUpperCase()}</strong></p>
        )}
      </main>
    </div>
  )
}

export default App
