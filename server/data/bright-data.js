/**
 * Bright Data API client.
 * Fetches one real-world geopolitical news event per session.
 * API key is read from environment — never hardcoded.
 */

const BRIGHTDATA_BASE_URL = "https://api.brightdata.com/datasets/v3/trigger";
const DATASET_ID = "gd_lnsb4033t0szhrvpu7"; // Web search dataset
const TIMEOUT_MS = 20000;
const MAX_RETRIES = 2;

// Session cache — one fetch per game session
let cachedEvent = null;

/**
 * Fetch a real-world geopolitical event from Bright Data.
 * Returns a raw text result or null on failure.
 *
 * @param {string} [query="European geopolitical news today"] - Search query
 * @returns {Promise<string|null>} Raw event text or null
 */
async function fetchBrightDataEvent(query = "European geopolitical news today") {
  // Return cached if we already fetched this session
  if (cachedEvent) {
    return cachedEvent;
  }

  const apiKey = process.env.BRIGHTDATA_API_KEY;
  if (!apiKey) {
    console.error("[BrightData] BRIGHTDATA_API_KEY not set — skipping fetch");
    return null;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`${BRIGHTDATA_BASE_URL}?dataset_id=${encodeURIComponent(DATASET_ID)}&include_errors=true&type=discover_new&discover_by=keyword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify([{ keyword: query }]),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const statusText = response.statusText || "Unknown error";
        console.error(`[BrightData] HTTP ${response.status}: ${statusText} (attempt ${attempt}/${MAX_RETRIES})`);
        continue;
      }

      const data = await response.json();

      // Bright Data returns a snapshot with results
      const eventText = extractEventText(data);
      if (eventText) {
        cachedEvent = eventText;
        return cachedEvent;
      }

      console.error(`[BrightData] No usable data in response (attempt ${attempt}/${MAX_RETRIES})`);
    } catch (err) {
      const reason = err.name === "AbortError" ? "timeout" : err.message;
      console.error(`[BrightData] Request failed: ${reason} (attempt ${attempt}/${MAX_RETRIES})`);
    }
  }

  console.error("[BrightData] All retries exhausted — returning null");
  return null;
}

/**
 * Extract a usable event string from the Bright Data response.
 * Handles various response shapes gracefully.
 *
 * @param {any} data - Raw API response body
 * @returns {string|null} Extracted event text or null
 */
function extractEventText(data) {
  if (!data) return null;

  // If data is a snapshot ID (async dataset), we can't use it immediately
  if (typeof data === "string") return null;
  if (data.snapshot_id) {
    // Async mode — data not ready yet. Fall back.
    console.error("[BrightData] Received snapshot_id (async mode) — cannot use immediately");
    return null;
  }

  // If data is an array of results
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    // Look for common fields: title, description, snippet, text
    const text = first.title || first.description || first.snippet || first.text || first.content;
    if (typeof text === "string" && text.length > 10) {
      return sanitizeEventText(text);
    }
  }

  // If data has a results array
  if (data.results && Array.isArray(data.results) && data.results.length > 0) {
    const first = data.results[0];
    const text = first.title || first.description || first.snippet || first.text || first.content;
    if (typeof text === "string" && text.length > 10) {
      return sanitizeEventText(text);
    }
  }

  return null;
}

/**
 * Sanitize event text — truncate and strip control characters.
 *
 * @param {string} text - Raw event text
 * @returns {string} Cleaned event text
 */
function sanitizeEventText(text) {
  return text
    .replace(/[\x00-\x1f\x7f]/g, " ") // strip control chars
    .replace(/\s+/g, " ")              // collapse whitespace
    .trim()
    .slice(0, 500);                     // cap at 500 chars
}

/**
 * Clear the session cache (for reset/new game).
 */
function clearBrightDataCache() {
  cachedEvent = null;
}

module.exports = {
  fetchBrightDataEvent,
  extractEventText,
  sanitizeEventText,
  clearBrightDataCache,
};
