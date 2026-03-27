/**
 * Full integration scenario test:
 * 1. Russia attacks Poland
 * 2. All other nations react (fallback mode — no API key)
 * 3. Trust updates verified
 * 4. Alliance changes verified
 * 5. Memory distributed
 * 6. No undefined values, no crashes
 */

const { initWorld, getWorld, getNation, getAllNationIds } = require("./engine/world");
const { updateTrust } = require("./engine/trust");
const { applyAllianceChanges, areAllied } = require("./engine/alliances");
const { distributeMemory } = require("./engine/memory");
const { createEvent } = require("./models/event");
const { fallbackDecision } = require("./ai/fallback");
const { getNationDecision } = require("./ai/index");
const { ACTIONS } = require("./data/actions");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function assertDefined(val, label) {
  assert(val !== undefined && val !== null, `${label} is defined (got: ${JSON.stringify(val)})`);
}

async function runIntegrationTest() {
  console.log("\n══════════════════════════════════════════");
  console.log("  FULL INTEGRATION SCENARIO TEST");
  console.log("══════════════════════════════════════════");

  // ─── Step 1: Init world ─────────────────────────
  console.log("\n--- Step 1: Initialize world ---");
  const world = initWorld();
  assertDefined(world, "world");
  assertDefined(world.config, "world.config");
  assert(world.config.turn === 0, "turn starts at 0");
  assert(world.nations.length === 6, "6 nations loaded");

  // Snapshot initial trust
  const polandTrustRussia_before = getNation("poland").trust["russia"];
  const germanyTrustRussia_before = getNation("germany").trust["russia"];

  // ─── Step 2: Russia attacks Poland ──────────────
  console.log("\n--- Step 2: Russia attacks Poland ---");
  const event = createEvent({
    type: ACTIONS.ATTACK,
    source: "russia",
    target: "poland",
    description: "Russia launches military aggression against Poland",
    turn: 0,
  });
  assertDefined(event.id, "event.id");
  assertDefined(event.timestamp, "event.timestamp");

  // Trust updates
  const trustChanges = updateTrust(world, "russia", "poland", ACTIONS.ATTACK);
  assertDefined(trustChanges, "trustChanges");

  const polandTrustRussia_after = getNation("poland").trust["russia"];
  assert(polandTrustRussia_after < polandTrustRussia_before, `Poland trust of Russia decreased (${polandTrustRussia_before} → ${polandTrustRussia_after})`);

  // Germany is allied with Poland — observer effect
  const germanyTrustRussia_after = getNation("germany").trust["russia"];
  assert(germanyTrustRussia_after < germanyTrustRussia_before, `Germany (ally of Poland) trust of Russia decreased (${germanyTrustRussia_before} → ${germanyTrustRussia_after})`);

  // Alliance changes
  applyAllianceChanges(world, "russia", "poland", ACTIONS.ATTACK);
  assert(!areAllied(world, "russia", "poland"), "Russia-Poland alliance broken (if any existed)");

  // Nation status updates
  const russia = getNation("russia");
  const poland = getNation("poland");
  russia.status = "war";
  poland.status = "war";
  assert(russia.status === "war", "Russia status set to war");
  assert(poland.status === "war", "Poland status set to war");

  // Distribute memory
  distributeMemory(world, 0, "russia", "poland", ACTIONS.ATTACK, event.description);
  assert(poland.memory.length >= 1, "Poland received memory");
  assert(russia.memory.length >= 1, "Russia received memory");
  assertDefined(poland.memory[0].summary, "Poland memory summary defined");
  assertDefined(poland.memory[0].turn, "Poland memory turn defined");

  // ─── Step 3: All nations react (fallback, no API) ─────
  console.log("\n--- Step 3: All nations react (AI fallback) ---");
  const allIds = getAllNationIds();
  const decisions = [];

  for (const nationId of allIds) {
    if (nationId === "russia") continue; // source skips
    const nation = getNation(nationId);
    const decision = await getNationDecision(nation, event, allIds, null);
    assertDefined(decision.decision, `${nationId} decision type`);
    assertDefined(decision.reasoning, `${nationId} reasoning`);
    assert(
      decision.source === "fallback" || decision.source === "ai" || decision.source === "skip",
      `${nationId} source is valid (got: ${decision.source})`
    );
    decisions.push({ nationId, ...decision });
  }

  assert(decisions.length === 5, "5 nations responded (excluding source)");

  // Poland should retaliate
  const polandDecision = decisions.find((d) => d.nationId === "poland");
  assert(polandDecision.decision === ACTIONS.ATTACK, "Poland retaliates (attack)");
  assert(polandDecision.target === "russia", "Poland targets Russia");

  // Germany (allied with Poland) should sanction Russia
  const germanyDecision = decisions.find((d) => d.nationId === "germany");
  assert(germanyDecision.decision === ACTIONS.SANCTION, "Germany sanctions aggressor of ally");
  assert(germanyDecision.target === "russia", "Germany targets Russia");

  // ─── Step 4: Verify no undefined values in world state ──
  console.log("\n--- Step 4: State integrity check ---");
  for (const nation of world.nations) {
    assertDefined(nation.id, `${nation.name} has id`);
    assertDefined(nation.name, `${nation.name} has name`);
    assertDefined(nation.personality, `${nation.name} has personality`);
    assert(Array.isArray(nation.alliances), `${nation.name} alliances is array`);
    assert(typeof nation.trust === "object", `${nation.name} trust is object`);
    assert(Array.isArray(nation.memory), `${nation.name} memory is array`);
    assertDefined(nation.status, `${nation.name} has status`);

    // Trust values within bounds
    for (const [target, score] of Object.entries(nation.trust)) {
      assert(score >= -100 && score <= 100, `${nation.name} trust of ${target} in range [-100,100] (${score})`);
    }
  }

  // Event log
  world.config.eventLog.push(event);
  world.config.turn += 1;
  assert(world.config.turn === 1, "Turn advanced to 1");
  assert(world.config.eventLog.length === 1, "Event log has 1 entry");

  // ─── Step 5: Second scenario — France allies UK ──
  console.log("\n--- Step 5: Second action — France allies UK ---");
  const event2 = createEvent({
    type: ACTIONS.ALLY,
    source: "france",
    target: "uk",
    description: "France proposes alliance with United Kingdom",
    turn: 1,
  });

  const trustChanges2 = updateTrust(world, "france", "uk", ACTIONS.ALLY);
  assertDefined(trustChanges2, "trust changes for ally event");

  applyAllianceChanges(world, "france", "uk", ACTIONS.ALLY);
  assert(areAllied(world, "france", "uk"), "France-UK alliance formed");

  distributeMemory(world, 1, "france", "uk", ACTIONS.ALLY, event2.description);
  const franceMem = getNation("france").memory;
  assert(franceMem.length >= 1, "France memory updated");

  // ─── Summary ────────────────────────────────────
  console.log(`\n${"═".repeat(44)}`);
  console.log(`Integration test: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("FULL INTEGRATION — All tests passed!");
    console.log("Phases 1–3 verified stable. Ready for Phase 4.");
  } else {
    console.error("INTEGRATION TEST FAILED — fix before proceeding.");
    process.exit(1);
  }
}

runIntegrationTest().catch((err) => {
  console.error("Integration test crashed:", err);
  process.exit(1);
});
