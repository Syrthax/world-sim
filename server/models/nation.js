const PERSONALITIES = {
  AGGRESSIVE: "aggressive",
  DIPLOMATIC: "diplomatic",
  DEFENSIVE: "defensive",
  OPPORTUNISTIC: "opportunistic",
  ISOLATIONIST: "isolationist",
};

function createNation({
  id,
  name,
  personality,
  alliances = [],
  trust = {},
  memory = [],
  resources = 100,
  status = "peace",
  intent = null,
  experience = null,
}) {
  return {
    id,
    name,
    personality,
    alliances: alliances.map((a) => ({ ...a })),
    trust: { ...trust },
    memory: [...memory],
    resources,
    status, // "peace" | "tension" | "war"
    intent: intent ? { ...intent } : null,
    experience: experience ? { ...experience } : { hostilityReceived: 0, cooperationReceived: 0 },
  };
}

function cloneNation(nation) {
  return {
    ...nation,
    alliances: nation.alliances.map((a) => ({ ...a })),
    trust: { ...nation.trust },
    memory: nation.memory.map((m) => ({ ...m })),
    intent: nation.intent ? { ...nation.intent } : null,
    experience: nation.experience ? { ...nation.experience } : null,
  };
}

module.exports = { createNation, cloneNation, PERSONALITIES };
