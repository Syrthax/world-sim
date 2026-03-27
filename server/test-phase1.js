const { initWorld, getWorld, getNation, getAllNationIds } = require('./engine/world');
const { ACTIONS, ACTION_TRUST_DELTAS, VALID_ACTIONS } = require('./data/actions');
const { createEvent } = require('./models/event');

const world = initWorld();
console.log('=== World Initialized ===');
console.log('Turn:', world.config.turn);
console.log('Phase:', world.config.phase);
console.log('Nations:', getAllNationIds());
console.log('');

const france = getNation('france');
console.log('=== France ===');
console.log('Personality:', france.personality);
console.log('Alliances:', france.alliances);
console.log('Trust:', france.trust);
console.log('');

console.log('=== Actions ===');
console.log('Valid actions:', VALID_ACTIONS);
console.log('Attack trust delta:', ACTION_TRUST_DELTAS[ACTIONS.ATTACK]);
console.log('');

const event = createEvent({ type: 'attack', source: 'russia', target: 'poland', description: 'Russia attacks Poland', turn: 0 });
console.log('=== Event ===');
console.log(event);
console.log('');
console.log('Phase 1 — All tests passed!');
