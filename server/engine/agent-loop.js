const { getNationDecision } = require("../ai/index");
const { updateTrust } = require("./trust");
const { applyAllianceChanges } = require("./alliances");
const { appendMemory, buildMemoryEntry } = require("./memory");
const { createEvent } = require("../models/event");
const { ACTIONS } = require("../data/actions");

// Max nations that get AI calls per reaction cycle (0 = unlimited)
const MAX_AI_CALLS = 5;

// Per-nation timeout guard: if AI takes longer than this, force fallback
const PER_NATION_TIMEOUT_MS = 12000;

/**
 * Run agent reactions: every nation except the event source evaluates and responds.
 * AI is the primary decision maker; fallback kicks in on AI failure.
 *
 * @param {object} event - The triggering event { type, source, target, description, turn }
 * @param {object} world - The mutable world state
 * @returns {Promise<object[]>} Array of reaction objects
 */
async function runAgentReactions(event, world) {
  const reactions = [];
  const allIds = world.nations.map((n) => n.id);
  let aiCallCount = 0;

  for (const nation of world.nations) {
    // Skip the nation that triggered the event
    if (nation.id === event.source) continue;

    try {
      // --- Step 1: AI-first decision (with timeout guard) ---
      const worldEvent = world.config.worldEvent || null;
      const shouldTryAI = MAX_AI_CALLS === 0 || aiCallCount < MAX_AI_CALLS;

      let result;
      if (shouldTryAI) {
        result = await Promise.race([
          getNationDecision(nation, event, allIds, worldEvent),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI decision timeout")), PER_NATION_TIMEOUT_MS)
          ),
        ]).catch((err) => {
          console.error(`[AgentLoop] AI timeout for ${nation.id}:`, err.message);
          // getNationDecision handles its own fallback, but if the whole
          // promise times out we need a manual fallback import
          const { fallbackDecision } = require("../ai/fallback");
          return { ...fallbackDecision(nation, event, allIds), source: "fallback" };
        });
        aiCallCount++;
      } else {
        // AI cap reached — use fallback directly
        const { fallbackDecision } = require("../ai/fallback");
        result = { ...fallbackDecision(nation, event, allIds), source: "fallback" };
      }

      const reaction = {
        nation: nation.id,
        nationName: nation.name,
        decision: result.decision,
        target: result.target,
        reasoning: result.reasoning,
        source: result.source || "fallback",
        turn: event.turn,
      };

      // --- Step 2: Apply effects ---
      applyReactionEffects(world, nation, reaction, event.turn);

      reactions.push(reaction);
    } catch (err) {
      console.error(`[AgentLoop] Reaction failed for ${nation.id}:`, err.message);
      // Skip this nation's reaction — don't crash the whole loop
    }
  }

  return reactions;
}

/**
 * Apply the trust, alliance, and memory effects of a single nation's reaction.
 */
function applyReactionEffects(world, nation, reaction, turn) {
  const { decision, target } = reaction;

  // Trust updates — only when reacting toward a specific target
  if (target) {
    updateTrust(world, nation.id, target, decision);

    // Alliance changes for explicit ally/betray/attack reactions
    applyAllianceChanges(world, nation.id, target, decision);
  }

  // Memory — the reacting nation remembers its own decision
  const summary = target
    ? `${nation.name} chose to ${decision} toward ${target}`
    : `${nation.name} chose to remain ${decision}`;

  const memEntry = buildMemoryEntry(turn, nation.id, target, decision, summary);
  appendMemory(nation, memEntry);

  // Create an event log entry for this reaction
  const sourceTag = reaction.source === "ai" ? "[AI]" : "[Rule]";
  const reactionEvent = createEvent({
    type: decision,
    source: nation.id,
    target: target || null,
    description: `${sourceTag} ${summary} — ${reaction.reasoning}`,
    turn,
  });
  world.config.eventLog.push(reactionEvent);
}

module.exports = { runAgentReactions };
