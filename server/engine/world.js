const initialWorldData = require("../data/initial-world.json");
const { cloneNation } = require("../models/nation");
const { resetEventCounter } = require("../models/event");

let worldState = null;

function deepCloneWorld(data) {
  return {
    config: {
      ...data.config,
      eventLog: data.config.eventLog.map((e) => ({ ...e })),
      trustRange: [...data.config.trustRange],
    },
    nations: data.nations.map((n) => cloneNation(n)),
  };
}

function initWorld() {
  resetEventCounter();
  worldState = deepCloneWorld(initialWorldData);
  return worldState;
}

function getWorld() {
  if (!worldState) {
    return initWorld();
  }
  return worldState;
}

function resetWorld() {
  return initWorld();
}

function getNation(nationId) {
  const world = getWorld();
  return world.nations.find((n) => n.id === nationId) || null;
}

function getAllNationIds() {
  return getWorld().nations.map((n) => n.id);
}

module.exports = { initWorld, getWorld, resetWorld, getNation, getAllNationIds };
