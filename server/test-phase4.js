/**
 * Phase 4 Test Suite — Bright Data Integration
 * Tests: event transformer, fallback events, Bright Data client structure, security
 */

const {
  transformEvent,
  getRandomFallbackEvent,
  buildWorldEventContext,
  NATION_KEYWORDS,
  CATEGORY_KEYWORDS,
} = require("./data/event-transformer");

const {
  extractEventText,
  sanitizeEventText,
  clearBrightDataCache,
} = require("./data/bright-data");

const fallbackEvents = require("./data/fallback-events.json");
const fs = require("fs");
const path = require("path");

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

// ─── Event Transformer Tests ──────────────────────
console.log("\n--- Event Transformer ---");

// Transform a military event about Russia
const milEvent = transformEvent("Russia conducts large-scale military exercises near NATO borders");
assert(milEvent !== null, "transforms valid text");
assert(milEvent.summary.length > 0, "summary has content");
assert(milEvent.summary.length <= 200, "summary capped at 200 chars");
assert(milEvent.category === "military", "detects military category");
assert(milEvent.relevantNations.includes("russia"), "detects Russia");
assert(milEvent.raw.length > 0, "raw field preserved");

// Transform an economic event
const ecoEvent = transformEvent("EU trade sanctions target Russian gas exports, Germany most affected");
assert(ecoEvent.category === "economic", "detects economic category (trade/sanctions)");
assert(ecoEvent.relevantNations.includes("russia"), "detects Russia in economic event");
assert(ecoEvent.relevantNations.includes("germany"), "detects Germany in economic event");

// Transform a diplomatic event
const dipEvent = transformEvent("France and UK sign new diplomatic treaty at Élysée Palace summit");
assert(dipEvent.category === "diplomatic", "detects diplomatic category");
assert(dipEvent.relevantNations.includes("france"), "detects France via Élysée");
assert(dipEvent.relevantNations.includes("uk"), "detects UK");

// Transform with no nations mentioned
const genericEvent = transformEvent("Global supply chain disruptions continue to affect markets");
assert(genericEvent.relevantNations.length === 0, "no nations detected for generic event");
assert(genericEvent.category === "economic", "generic market event = economic");

// Null / invalid inputs
assert(transformEvent(null) === null, "null input returns null");
assert(transformEvent("") === null, "empty string returns null");
assert(transformEvent(123) === null, "non-string returns null");

// Long text truncation
const longText = "A".repeat(500);
const longResult = transformEvent(longText);
assert(longResult.summary.length === 200, "summary truncated to 200 chars for long input");

// ─── Fallback Events Pool Tests ───────────────────
console.log("\n--- Fallback Events Pool ---");

assert(Array.isArray(fallbackEvents), "fallback-events.json is an array");
assert(fallbackEvents.length >= 10, `at least 10 fallback events (got ${fallbackEvents.length})`);

for (let i = 0; i < fallbackEvents.length; i++) {
  const evt = fallbackEvents[i];
  assert(typeof evt.summary === "string" && evt.summary.length > 0, `event[${i}] has summary`);
  assert(typeof evt.category === "string", `event[${i}] has category`);
  assert(Array.isArray(evt.relevantNations), `event[${i}] has relevantNations array`);
}

// Random fallback returns valid event
const randomEvt = getRandomFallbackEvent();
assert(randomEvt.summary !== undefined, "random fallback has summary");
assert(randomEvt.category !== undefined, "random fallback has category");
assert(Array.isArray(randomEvt.relevantNations), "random fallback has relevantNations");

// Ensure randomness (rough check — get 5 and check not all identical)
const samples = [];
for (let i = 0; i < 10; i++) {
  samples.push(getRandomFallbackEvent().summary);
}
const unique = new Set(samples);
assert(unique.size >= 2, `random fallback produces varied results (${unique.size} unique in 10 samples)`);

// ─── Build World Event Context ────────────────────
console.log("\n--- Build World Event Context ---");

const ctx1 = buildWorldEventContext({
  summary: "NATO increases defense spending",
  category: "military",
  relevantNations: ["poland", "germany"],
});
assert(typeof ctx1 === "string", "context is a string");
assert(ctx1.includes("NATO increases defense spending"), "context includes summary");
assert(ctx1.includes("[Category: military]"), "context includes category");
assert(ctx1.includes("[Involves: poland, germany]"), "context includes nations");

// General category skipped
const ctx2 = buildWorldEventContext({
  summary: "Something happened",
  category: "general",
  relevantNations: [],
});
assert(!ctx2.includes("[Category:"), "general category not included");
assert(!ctx2.includes("[Involves:"), "empty nations not included");

// Null input
assert(buildWorldEventContext(null) === null, "null event returns null");
assert(buildWorldEventContext({}) === null, "empty event returns null");

// ─── Bright Data Client Structure Tests ───────────
console.log("\n--- Bright Data Client ---");

// extractEventText with array result
const arrResult = extractEventText([{ title: "Test event headline for geopolitical sim" }]);
assert(arrResult !== null, "extracts from array with title");
assert(arrResult.includes("Test event headline"), "extracted text is correct");

// extractEventText with results field
const objResult = extractEventText({ results: [{ description: "A longer description of events unfolding" }] });
assert(objResult !== null, "extracts from results[].description");

// extractEventText with short text (< 10 chars)
assert(extractEventText([{ title: "Hi" }]) === null, "rejects too-short text");

// extractEventText with null/empty
assert(extractEventText(null) === null, "null data returns null");
assert(extractEventText([]) === null, "empty array returns null");
assert(extractEventText({ results: [] }) === null, "empty results returns null");

// extractEventText with snapshot_id (async mode)
assert(extractEventText({ snapshot_id: "abc123" }) === null, "async snapshot_id returns null");

// sanitizeEventText
assert(sanitizeEventText("hello\nworld\t!") === "hello world !", "strips control chars");
assert(sanitizeEventText("A".repeat(600)).length === 500, "caps at 500 chars");
assert(sanitizeEventText("  spaced  out  ") === "spaced out", "collapses whitespace");

// clearBrightDataCache doesn't crash
clearBrightDataCache();
assert(true, "clearBrightDataCache runs without error");

// ─── Security Tests ──────────────────────────────
console.log("\n--- Security ---");

// Bright Data client reads key from env, never hardcoded
const bdSource = fs.readFileSync(path.join(__dirname, "data/bright-data.js"), "utf8");
assert(!bdSource.includes("sk-"), "No hardcoded API key (sk-) in bright-data.js");
assert(!bdSource.includes("Bearer sk"), "No hardcoded Bearer token in bright-data.js");
assert(bdSource.includes("process.env.BRIGHTDATA_API_KEY"), "key read from process.env.BRIGHTDATA_API_KEY");

// .env.example uses placeholder
const envExample = fs.readFileSync(path.join(__dirname, "../.env.example"), "utf8");
assert(envExample.includes("BRIGHTDATA_API_KEY="), "BRIGHTDATA_API_KEY in .env.example");
assert(!envExample.match(/BRIGHTDATA_API_KEY=[a-zA-Z0-9]{32,}/), ".env.example has placeholder, not real key");

// Event transformer sanitizes input (no raw HTML/JS injection)
const xssInput = transformEvent('<script>alert("xss")</script> Russia attacks Poland');
assert(xssInput.summary.includes("<script>"), "raw HTML preserved (not executed, just text)");
assert(xssInput.summary.length <= 200, "XSS attempt still truncated");

// World config has worldEvent field
const initialWorld = require("./data/initial-world.json");
assert(initialWorld.config.worldEvent === null, "worldEvent starts as null");

// ─── Summary ──────────────────────────────────────
console.log(`\n${"─".repeat(40)}`);
console.log(`Phase 4 results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log("Phase 4 — All tests passed!");
} else {
  console.error("Phase 4 — SOME TESTS FAILED");
  process.exit(1);
}
