import { useState, useCallback } from 'react'
import { getWorldState, triggerEvent as apiTriggerEvent, resetWorld as apiResetWorld } from '../services/api'

/**
 * Normalizes the nations array from the backend into a lookup map.
 * Also builds alliances as a set for fast membership checks.
 */
function normalizeWorld(raw) {
  if (!raw || !raw.nations) return null
  const nationMap = {}
  for (const n of raw.nations) {
    nationMap[n.id] = n
  }
  return { ...raw, nationMap }
}

export function useWorldState() {
  const [worldState, setWorldState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [turnSummary, setTurnSummary] = useState(null)

  const refreshState = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = await getWorldState()
      setWorldState(normalizeWorld(raw))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerEvent = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiTriggerEvent(payload)
      // Use the world state returned directly in the response (avoids extra round-trip)
      if (result.world) {
        setWorldState(normalizeWorld(result.world))
      } else {
        await refreshState()
      }
      // Store turn summary with AI reactions
      if (result.turnSummary) {
        setTurnSummary(result.turnSummary)
      }
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [refreshState])

  const resetSimulation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiResetWorld()
      if (result.world) {
        setWorldState(normalizeWorld(result.world))
      }
      setTurnSummary(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { worldState, loading, error, turnSummary, refreshState, triggerEvent, resetSimulation }
}
