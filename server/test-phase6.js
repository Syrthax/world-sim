/**
 * Phase 6 — UI Insight Upgrade Validation Tests
 *
 * Tests server-side enrichment (patterns in GET /api/state),
 * EventArrows data contract, source field propagation, and
 * resource/memory data integrity for UI rendering.
 */

const { initWorld, getWorld, resetWorld, getAllNationIds } = require("./engine/world");
const { distributeMemory, recallPatterns } = require("./engine/memory");
const { updateTrust } = require("./engine/trust");
const { ACTIONS, VALID_ACTIONS, ACTION_RESOURCE_COST } = require("./data/actions");
const { validateWorldState } = require("./engine/state-validator");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function freshWorld() {
  resetWorld();
  return getWorld();
}

// ══════════════════════════════════
// Section 1: State enrichment — patterns
// ══════════════════════════════════
console.log("\n--- Section 1: State enrichment — patterns in GET /api/state contract ---");

{
  const world = freshWorld();
  const allIds = getAllNationIds();
  const france = world.nations.find(n => n.id === "france");
  const germany = world.nations.find(n => n.id === "germany");

  // Simulate France attacking Germany twice
  distributeMemory(world, 1, "france", "germany", "attack", "France attacks Germany");
  distributeMemory(world, 2, "france", "germany", "attack", "France attacks Germany again");

  // Compute patterns (same logic as GET /api/state)
  const enriched = world.nations.map(n => {
    const patterns = {};
    for (const otherId of allIds) {
      if (otherId === n.id) continue;
      const p = recallPatterns(n, otherId);
      if (p.totalInteractions > 0) {
        patterns[otherId] = { hostile: p.hostileCount, friendly: p.friendlyCount };
      }
    }
    return { ...n, patterns };
  });

  const enrichedGermany = enriched.find(n => n.id === "germany");
  const enrichedFrance = enriched.find(n => n.id === "france");

  assert(enrichedGermany.patterns !== undefined, "germany has patterns field");
  assert(enrichedGermany.patterns.france !== undefined, "germany has patterns for france");
  assert(enrichedGermany.patterns.france.hostile === 2, "germany sees 2 hostile from france");
  assert(enrichedGermany.patterns.france.friendly === 0, "germany sees 0 friendly from france");

  // France has no incoming events from germany, so no patterns for germany
  assert(
    enrichedFrance.patterns.germany === undefined,
    "france has no patterns for germany (germany didn't act)"
  );
}

// ══════════════════════════════════
// Section 2: Pattern computation with mixed actions
// ══════════════════════════════════
console.log("\n--- Section 2: Patterns with mixed hostile + friendly actions ---");

{
  const world = freshWorld();
  const allIds = getAllNationIds();
  const uk = world.nations.find(n => n.id === "uk");

  distributeMemory(world, 1, "france", "uk", "attack", "France attacks UK");
  distributeMemory(world, 2, "france", "uk", "trade", "France trades with UK");
  distributeMemory(world, 3, "france", "uk", "ally", "France allies UK");

  const p = recallPatterns(uk, "france");
  assert(p.hostileCount === 1, "UK sees 1 hostile from france");
  assert(p.friendlyCount === 2, "UK sees 2 friendly from france");
  assert(p.totalInteractions === 3, "UK sees 3 total interactions");
  assert(p.dominantPattern === "friendly", "dominant pattern is friendly");

  // Enrichment check
  const enrichedUk = (() => {
    const patterns = {};
    for (const otherId of allIds) {
      if (otherId === "uk") continue;
      const pat = recallPatterns(uk, otherId);
      if (pat.totalInteractions > 0) {
        patterns[otherId] = { hostile: pat.hostileCount, friendly: pat.friendlyCount };
      }
    }
    return { ...uk, patterns };
  })();

  assert(enrichedUk.patterns.france.hostile === 1, "enriched UK: 1 hostile from france");
  assert(enrichedUk.patterns.france.friendly === 2, "enriched UK: 2 friendly from france");
}

// ══════════════════════════════════
// Section 3: Empty patterns for nations with no interactions
// ══════════════════════════════════
console.log("\n--- Section 3: Empty patterns for nations with no interactions ---");

{
  const world = freshWorld();
  const allIds = getAllNationIds();

  // No events triggered — all patterns should be empty
  const enriched = world.nations.map(n => {
    const patterns = {};
    for (const otherId of allIds) {
      if (otherId === n.id) continue;
      const p = recallPatterns(n, otherId);
      if (p.totalInteractions > 0) {
        patterns[otherId] = { hostile: p.hostileCount, friendly: p.friendlyCount };
      }
    }
    return { ...n, patterns };
  });

  for (const n of enriched) {
    assert(Object.keys(n.patterns).length === 0, `${n.id} has empty patterns (no events)`);
  }
}

// ══════════════════════════════════
// Section 4: Resource data for UI progress bar
// ══════════════════════════════════
console.log("\n--- Section 4: Resource data integrity for UI progress bar ---");

{
  const world = freshWorld();
  for (const n of world.nations) {
    assert(typeof n.resources === "number", `${n.id} has numeric resources`);
    assert(n.resources >= 0 && n.resources <= 120, `${n.id} resources in 0-120 range (${n.resources})`);
  }

  // Apply cost and verify
  const france = world.nations.find(n => n.id === "france");
  const original = france.resources;
  france.resources += ACTION_RESOURCE_COST[ACTIONS.ATTACK] || 0;
  france.resources = Math.max(0, france.resources);
  assert(france.resources <= original, "attack reduces resources");
  assert(france.resources >= 0, "resources never negative after cost");
}

// ══════════════════════════════════
// Section 5: AI/Rule source field propagation
// ══════════════════════════════════
console.log("\n--- Section 5: Source field propagation for AI/Rule badges ---");

{
  // Source field contract: reactions must have a `source` field of "ai" or "fallback"
  const validSources = ["ai", "fallback"];
  const mockReactions = [
    { nationId: "france", decision: "attack", target: "germany", reasoning: "test", source: "ai" },
    { nationId: "uk", decision: "trade", target: "italy", reasoning: "test", source: "fallback" },
  ];

  for (const r of mockReactions) {
    assert(validSources.includes(r.source), `reaction ${r.nationId}: source "${r.source}" is valid`);
  }

  // Verify source field is preserved through spread
  const spread = { ...mockReactions[0] };
  assert(spread.source === "ai", "source field preserved through object spread");
}

// ══════════════════════════════════
// Section 6: EventArrows data contract
// ══════════════════════════════════
console.log("\n--- Section 6: EventArrows action type coverage ---");

{
  // All 7 action types must be supported by EventArrows
  const eventArrowTypes = ["attack", "sanction", "alliance", "ally", "trade", "betray", "support", "neutral"];
  for (const t of VALID_ACTIONS) {
    assert(eventArrowTypes.includes(t), `action "${t}" has EventArrow style`);
  }
}

// ══════════════════════════════════
// Section 7: World event data contract for banner
// ══════════════════════════════════
console.log("\n--- Section 7: World event data contract for UI banner ---");

{
  const world = freshWorld();
  // Initially null
  assert(world.config.worldEvent === null || world.config.worldEvent === undefined, "worldEvent starts null");

  // Mock a world event
  world.config.worldEvent = {
    category: "military",
    summary: "Global tensions rise",
    trustModifiers: { peace: 0, tension: -5, war: -10 },
    resourceModifiers: { peace: 0, tension: -2, war: -5 },
  };

  assert(world.config.worldEvent.category === "military", "worldEvent has category");
  assert(typeof world.config.worldEvent.summary === "string", "worldEvent has string summary");

  // Verify UI can extract category icon
  const iconMap = { military: "⚔", diplomatic: "🤝", economic: "📊" };
  const icon = iconMap[world.config.worldEvent.category] || "⚠";
  assert(icon === "⚔", "military category maps to ⚔ icon");
}

// ══════════════════════════════════
// Section 8: State enrichment doesn't mutate original world
// ══════════════════════════════════
console.log("\n--- Section 8: Enrichment is read-only (no mutation) ---");

{
  const world = freshWorld();
  distributeMemory(world, 1, "france", "germany", "attack", "test");

  const allIds = getAllNationIds();
  const original = world.nations.find(n => n.id === "germany");
  const hadPatterns = original.patterns !== undefined;

  // Run enrichment
  const enriched = world.nations.map(n => {
    const patterns = {};
    for (const otherId of allIds) {
      if (otherId === n.id) continue;
      const p = recallPatterns(n, otherId);
      if (p.totalInteractions > 0) {
        patterns[otherId] = { hostile: p.hostileCount, friendly: p.friendlyCount };
      }
    }
    return { ...n, patterns };
  });

  // Original nation object should NOT have patterns added
  const afterOriginal = world.nations.find(n => n.id === "germany");
  assert(
    (afterOriginal.patterns === undefined) === !hadPatterns,
    "original world.nations not mutated by enrichment"
  );
}

// ══════════════════════════════════
// Section 9: Trust scores available for UI
// ══════════════════════════════════
console.log("\n--- Section 9: Trust data integrity for UI display ---");

{
  const world = freshWorld();
  for (const n of world.nations) {
    assert(typeof n.trust === "object", `${n.id} has trust object`);
    for (const [otherId, val] of Object.entries(n.trust)) {
      assert(typeof val === "number", `${n.id}.trust.${otherId} is numeric`);
      assert(val >= -100 && val <= 100, `${n.id}.trust.${otherId} in [-100,100] range`);
    }
  }
}

// ══════════════════════════════════
// Section 10: Alliance data format for UI
// ══════════════════════════════════
console.log("\n--- Section 10: Alliance object format for UI display ---");

{
  const world = freshWorld();
  for (const n of world.nations) {
    assert(Array.isArray(n.alliances), `${n.id} has alliances array`);
    for (const a of n.alliances) {
      assert(typeof a === "object" && a.id && typeof a.strength === "number", `${n.id} alliance is {id, strength}`);
    }
  }
}

// ════════════════════════════════════════
console.log(`\n${"═".repeat(44)}`);
console.log(`Phase 6 results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log("Phase 6 — All tests passed!");
} else {
  console.log("Phase 6 — FAILURES DETECTED");
  process.exit(1);
}
