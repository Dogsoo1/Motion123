/** Public surface of the Deal Room engine. */
export * from './types.js';
export * from './rng.js';
export * from './state.js';
export * from './game.js';
export * from './valuation.js';
export * from './diligence.js';
export * from './negotiation.js';
export * from './structuring.js';
export * from './agreement.js';
export * from './regulatory.js';
export * from './closing.js';
export * from './scoring.js';
export * from './ai.js';

export { MARKET_ENVIRONMENTS, MARKET_ENVIRONMENT_LIST } from './content/markets.js';
export { SECTOR_COMPS } from './content/comps.js';
export {
  DEAL_STRUCTURES,
  DEAL_STRUCTURE_LIST,
  FINANCING_SOURCES,
  FINANCING_SOURCE_LIST,
  TAX_STRUCTURES,
  TAX_STRUCTURE_LIST,
  MAC_CARVE_OUTS,
  MAC_CARVE_OUT_BY_ID,
} from './content/structures.js';
export { DATA_ROOM_CARDS, DATA_ROOM_BY_ID, RISK_CARDS } from './content/dataroom.js';
export { TARGET_COMPANIES, TARGET_BY_ID, ACQUIRERS, ACQUIRER_BY_ID } from './content/targets.js';
export { INTERIM_EVENTS, INTEGRATION_CARDS } from './content/events.js';
export { PRECEDENT_CARDS, PRECEDENTS_BY_AREA, DEFENSE_CARDS } from './content/precedents.js';
export { PRIVATE_OBJECTIVES, OBJECTIVES_FOR_ROLE } from './content/objectives.js';
export { SCENARIOS, SCENARIO_BY_ID } from './content/scenarios.js';
