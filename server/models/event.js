let eventIdCounter = 1;

function createEvent({ type, source, target, description, turn }) {
  return {
    id: eventIdCounter++,
    type,
    source,
    target: target || null,
    description,
    turn,
    timestamp: Date.now(),
  };
}

function resetEventCounter() {
  eventIdCounter = 1;
}

module.exports = { createEvent, resetEventCounter };
