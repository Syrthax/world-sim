// Test script: Verify AI is being called for every nation
const PORT = process.env.PORT || 3002;
const BASE = `http://localhost:${PORT}`;

async function main() {
  console.log(`\nTesting against ${BASE}...\n`);

  // Step 1: Check initial state
  const stateRes = await fetch(`${BASE}/api/state`);
  const state = await stateRes.json();
  console.log("=== INITIAL STATE ===");
  console.log("hasApiKey:", state.debug?.hasApiKey);
  console.log("totalApiCalls:", state.debug?.totalApiCalls);
  console.log("nations:", state.nations?.length);

  if (!state.debug?.hasApiKey) {
    console.error("\n❌ NO API KEY — AI cannot work!");
    process.exit(1);
  }

  // Step 2: Trigger an event
  console.log("\n=== TRIGGERING EVENT: france attacks russia ===\n");
  const eventRes = await fetch(`${BASE}/api/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "attack",
      source: "france",
      target: "russia",
      description: "France launches military operation against Russia",
    }),
  });
  const eventData = await eventRes.json();

  // Step 3: Check reactions
  const reactions = eventData.turnSummary?.reactions || [];
  console.log("=== REACTIONS ===");
  console.log("Total reactions:", reactions.length);
  
  let aiCount = 0;
  let fallbackCount = 0;
  let selfCount = 0;
  
  for (const r of reactions) {
    const icon = r.source === "ai" ? "🤖" : r.source === "self" ? "👤" : "📋";
    console.log(`  ${icon} ${r.nation}: ${r.decision} → ${r.target || "none"} [${r.source}]`);
    console.log(`     Reasoning: ${(r.reasoning || "").substring(0, 100)}`);
    if (r.source === "ai") aiCount++;
    else if (r.source === "self") selfCount++;
    else fallbackCount++;
  }

  // Step 4: Check final stats
  const finalState = await fetch(`${BASE}/api/state`).then((r) => r.json());
  console.log("\n=== FINAL AI STATS ===");
  console.log("totalApiCalls:", finalState.debug?.totalApiCalls);
  console.log("totalApiSuccesses:", finalState.debug?.totalApiSuccesses);
  console.log("totalApiFailures:", finalState.debug?.totalApiFailures);
  console.log("aiDecisionCount:", finalState.debug?.aiDecisionCount);
  console.log("fallbackDecisionCount:", finalState.debug?.fallbackDecisionCount);

  // Step 5: Verdict
  console.log("\n=== VERDICT ===");
  console.log(`AI decisions: ${aiCount}`);
  console.log(`Fallback decisions: ${fallbackCount}`);
  console.log(`Self decisions: ${selfCount}`);

  if (aiCount > 0) {
    console.log(`\n✅ AI IS WORKING! ${aiCount}/${reactions.length} decisions made by AI`);
  } else {
    console.error(`\n❌ AI STILL NOT WORKING! 0/${reactions.length} AI decisions`);
    console.error("All decisions:", reactions.map((r) => r.source));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Test failed:", e.message);
  process.exit(1);
});
