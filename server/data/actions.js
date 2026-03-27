const ACTIONS = {
  ATTACK: "attack",
  ALLY: "ally",
  SANCTION: "sanction",
  TRADE: "trade",
  BETRAY: "betray",
  SUPPORT: "support",
  NEUTRAL: "neutral",
};

const ACTION_TRUST_DELTAS = {
  [ACTIONS.ATTACK]: -30,
  [ACTIONS.ALLY]: +25,
  [ACTIONS.SANCTION]: -15,
  [ACTIONS.TRADE]: +10,
  [ACTIONS.BETRAY]: -40,
  [ACTIONS.SUPPORT]: +20,
  [ACTIONS.NEUTRAL]: 0,
};

const VALID_ACTIONS = Object.values(ACTIONS);

module.exports = { ACTIONS, ACTION_TRUST_DELTAS, VALID_ACTIONS };
