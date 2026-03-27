/**
 * Event transformer: converts raw Bright Data text into simulation-compatible event context.
 * Also provides the fallback event pool.
 */

const fallbackEvents = require("./fallback-events.json");

// Nation keywords used to detect relevance
const NATION_KEYWORDS = {
  france: ["france", "french", "macron", "paris", "élysée"],
  germany: ["germany", "german", "scholz", "berlin", "bundestag"],
  uk: ["uk", "britain", "british", "london", "parliament", "downing"],
  russia: ["russia", "russian", "putin", "moscow", "kremlin"],
  poland: ["poland", "polish", "warsaw", "tusk", "duda"],
  italy: ["italy", "italian", "rome", "meloni", "palazzo"],
};

// Geopolitical category keywords
const CATEGORY_KEYWORDS = {
  military: ["military", "army", "war", "invasion", "attack", "missile", "troops", "defense", "nato"],
  economic: ["trade", "sanctions", "economic", "tariff", "energy", "gas", "oil", "market", "gdp"],
  diplomatic: ["summit", "treaty", "alliance", "negotiation", "diplomat", "ambassador", "agreement"],
  crisis: ["crisis", "refugee", "humanitarian", "protest", "election", "coup", "conflict"],
};

/**
 * Transform raw event text from Bright Data into a structured world event.
 *
 * @param {string} rawText - Raw event description from Bright Data
 * @returns {{ summary: string, category: string, relevantNations: string[], raw: string }}
 */
function transformEvent(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return null;
  }

  const lower = rawText.toLowerCase();

  // Detect relevant nations
  const relevantNations = [];
  for (const [nationId, keywords] of Object.entries(NATION_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      relevantNations.push(nationId);
    }
  }

  // Detect category
  let category = "general";
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      category = cat;
      break;
    }
  }

  // Build a clean summary (truncate to 200 chars for prompt injection)
  const summary = rawText.trim().slice(0, 200);

  return {
    summary,
    category,
    relevantNations,
    raw: rawText,
  };
}

/**
 * Get a random fallback event from the hardcoded pool.
 *
 * @returns {{ summary: string, category: string, relevantNations: string[] }}
 */
function getRandomFallbackEvent() {
  const idx = Math.floor(Math.random() * fallbackEvents.length);
  return { ...fallbackEvents[idx] };
}

/**
 * Build the world event context string for AI prompts.
 * Combines Bright Data event with game-relevant metadata.
 *
 * @param {{ summary: string, category: string, relevantNations: string[] }} event
 * @returns {string} Formatted context string for AI prompts
 */
function buildWorldEventContext(event) {
  if (!event || !event.summary) return null;

  const lines = [];
  lines.push(event.summary);
  if (event.category && event.category !== "general") {
    lines.push(`[Category: ${event.category}]`);
  }
  if (event.relevantNations && event.relevantNations.length > 0) {
    lines.push(`[Involves: ${event.relevantNations.join(", ")}]`);
  }
  return lines.join(" ");
}

module.exports = {
  transformEvent,
  getRandomFallbackEvent,
  buildWorldEventContext,
  NATION_KEYWORDS,
  CATEGORY_KEYWORDS,
};
