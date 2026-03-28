const { callFeatherless } = require("./featherless");
const { buildPrompt, buildAutonomousPrompt, SYSTEM_PROMPT } = require("./prompt-builder");
const { parseDecision, logCreativeDecision } = require("./decision-parser");
const { fallbackDecision } = require("./fallback");

/**
 * Get a decision for a nation in response to an event.
 * Tries AI first, falls back to rule-based logic on failure.
 *
 * @param {object} nation - The nation making the decision
 * @param {object} event - The event to respond to
 * @param {string[]} allNationIds - All valid nation IDs
 * @param {string|null} worldEvent - Optional real-world context string
 * @returns {Promise<{ decision: string, target: string|null, reasoning: string, source: "ai"|"fallback" }>}
 */
async function getNationDecision(nation, event, allNationIds, worldEvent) {
  // Don't ask a nation to decide about its own action
  if (nation.id === event.source) {
    return {
      decision: "neutral",
      target: null,
      reasoning: `${nation.name} initiated this action.`,
      source: "skip",
    };
  }

  const validTargets = allNationIds.filter((id) => id !== nation.id);

  // Attempt AI decision
  try {
    const userPrompt = buildPrompt(nation, event, worldEvent);
    const rawResponse = await callFeatherless(SYSTEM_PROMPT, userPrompt);

    if (rawResponse) {
      const parsed = parseDecision(rawResponse, validTargets);
      if (parsed) {
        logCreativeDecision(nation, parsed.decision, parsed.target);
        return { ...parsed, source: "ai" };
      }
      console.error(`[AI] Failed to parse response for ${nation.id} — using fallback`);
    }
  } catch (err) {
    console.error(`[AI] Error for ${nation.id}: ${err.message} — using fallback`);
  }

  // Fallback to rule-based decision
  const fb = fallbackDecision(nation, event, allNationIds);
  return { ...fb, source: "fallback" };
}

/**
 * Get an autonomous (proactive) decision for a nation — no triggering event.
 * AI decides what action to take based on the current geopolitical situation.
 * Falls back to null (no action) on failure — caller handles fallback.
 *
 * @param {object} nation - The nation making the decision
 * @param {string[]} allNationIds - All valid nation IDs
 * @param {object} world - The world state (for context)
 * @returns {Promise<{ type: string, target: string, reason: string, source: "ai" }|null>}
 */
async function getAutonomousDecision(nation, allNationIds, world) {
  const validTargets = allNationIds.filter((id) => id !== nation.id);

  try {
    const worldEvent = world.config.worldEvent || null;
    const userPrompt = buildAutonomousPrompt(nation, world, worldEvent);
    const rawResponse = await callFeatherless(SYSTEM_PROMPT, userPrompt);

    if (rawResponse) {
      const parsed = parseDecision(rawResponse, validTargets);
      if (parsed && parsed.decision && parsed.decision !== "neutral") {
        logCreativeDecision(nation, parsed.decision, parsed.target);
        return {
          type: parsed.decision,
          target: parsed.target,
          reason: `[AI] ${parsed.reasoning || `${nation.name} acts strategically.`}`,
          source: "ai",
        };
      }
    }
  } catch (err) {
    console.error(`[AI-Auto] Error for ${nation.id}: ${err.message}`);
  }

  return null; // Caller falls back to rule-based pickAutonomousAction
}

module.exports = { getNationDecision, getAutonomousDecision };
