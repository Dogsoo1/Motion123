import { MARKET_ENVIRONMENTS, MARKET_ENVIRONMENT_LIST } from './content/markets.js';
import { OBJECTIVES_FOR_ROLE } from './content/objectives.js';
import { SCENARIO_BY_ID, SCENARIOS } from './content/scenarios.js';
import { ACQUIRERS, ACQUIRER_BY_ID, TARGET_BY_ID, TARGET_COMPANIES } from './content/targets.js';
import type { DataRoom } from './diligence.js';
import { Rng, round } from './rng.js';
import type { FinancingAnalysis, StructureAnalysis } from './structuring.js';
import type {
  ComparableCompany,
  DcfAssumptions,
  PrecedentTransaction,
} from './valuation.js';
import { intrinsicEquityValue, unaffectedEquityValue } from './valuation.js';
import {
  ROLE_IDS,
  type AcquirerProfile,
  type ClosingOutcome,
  type CompetingBidder,
  type DefinitiveAgreement,
  type DiligenceResult,
  type DisclosureStrategy,
  type IndicationOfInterest,
  type InterimEvent,
  type LogEntry,
  type LoiTerms,
  type MarketEnvironment,
  type PhaseId,
  type PlayerState,
  type ProcessType,
  type RegulatoryOutcome,
  type RegulatoryPosture,
  type RoleId,
  type RoleScore,
  type Scenario,
  type StructuringDecision,
  type TargetCompany,
  type ValuationRange,
  type ValuationSummary,
} from './types.js';

/** Sub-step within the current phase; drives what the UI asks for next. */
export type GameStep =
  | 'screening'
  | 'valuation-review'
  | 'ioi'
  | 'loi-negotiation'
  | 'diligence-allocation'
  | 'diligence-review'
  | 'structuring'
  | 'agreement'
  | 'regulatory'
  | 'interim'
  | 'mac-decision'
  | 'integration'
  | 'scoring';

export interface LoiExchange {
  round: number;
  from: 'buyer' | 'seller';
  terms: LoiTerms;
  commentary: string;
}

export interface GameState {
  seed: string;
  rngState: number;
  scenario: Scenario;
  market: MarketEnvironment;
  phase: PhaseId;
  step: GameStep;

  players: Record<RoleId, PlayerState>;
  humanRole: RoleId;

  acquirer: AcquirerProfile;
  /** The five targets face up in the market (GDD §6 Phase 1). */
  marketTargets: TargetCompany[];
  /** Targets the buyer paid a screening fee to examine. */
  screened: string[];
  target?: TargetCompany;

  comparables: ComparableCompany[];
  precedentTransactions: PrecedentTransaction[];
  dcfAssumptions?: DcfAssumptions;
  valuationRanges: ValuationRange[];
  valuation?: ValuationSummary;

  processType?: ProcessType;
  disclosureStrategy?: DisclosureStrategy;
  regulatoryPosture?: RegulatoryPosture;
  competingBidders: CompetingBidder[];

  ioi?: IndicationOfInterest;
  loiExchanges: LoiExchange[];
  loi?: LoiTerms;
  loiRoundsRemaining: number;

  dataRoom?: DataRoom;
  diligence?: DiligenceResult;
  /** Price after diligence repricing, $M. */
  repricedValue?: number;

  structuring?: StructuringDecision;
  financingAnalysis?: FinancingAnalysis;
  structureAnalysis?: StructureAnalysis;

  agreement?: DefinitiveAgreement;
  agreementNarrative: string[];

  regulatory?: RegulatoryOutcome;
  /** Events drawn for the period between signing and closing. */
  interimEvents?: InterimEvent[];
  closing?: ClosingOutcome;
  scores?: RoleScore[];

  /** Running economics, all $M. */
  buyerSunkCost: number;
  bankerFees: number;
  /** Action rounds elapsed; drives the speed component of scoring. */
  clock: number;
  /**
   * Baseline pace the scenario expects, in action rounds. A thorough buyer —
   * screening the market, running all three valuation methods and spending a
   * full diligence budget — lands close to this; rushing beats it, and a
   * Second Request blows past it.
   */
  parClock: number;

  log: LogEntry[];
  status: 'active' | 'terminated' | 'complete';
  terminationReason?: string;
}

export interface NewGameOptions {
  seed?: string;
  scenarioId?: string;
  humanRole?: RoleId;
}

/** Screening fee per target examined, $M (GDD §6 Phase 1). */
export const SCREENING_FEE = 2.5;

export function createGame(options: NewGameOptions = {}): GameState {
  const seed = options.seed ?? `deal-${Date.now()}`;
  const rng = new Rng(seed);
  const scenario =
    (options.scenarioId ? SCENARIO_BY_ID[options.scenarioId] : undefined) ?? SCENARIOS[0];

  const market = scenario.market
    ? MARKET_ENVIRONMENTS[scenario.market]
    : rng.pick(MARKET_ENVIRONMENT_LIST);

  const acquirer = scenario.acquirerId
    ? ACQUIRER_BY_ID[scenario.acquirerId]
    : rng.pick(ACQUIRERS);

  const marketTargets = scenario.targetId
    ? [TARGET_BY_ID[scenario.targetId], ...rng.sample(
        TARGET_COMPANIES.filter((t) => t.id !== scenario.targetId),
        4,
      )]
    : rng.sample(TARGET_COMPANIES, 5);

  const players = {} as Record<RoleId, PlayerState>;
  // Objectives are dealt without replacement — no two seats chase the same one.
  const dealt = new Set<string>();
  for (const role of ROLE_IDS) {
    const pool = OBJECTIVES_FOR_ROLE(role).filter((o) => !dealt.has(o.id));
    players[role] = {
      role,
      capital: role === 'buyer' ? acquirer.cashOnHand : 500,
      influence: role === 'regulator' ? 8 : 5,
      reputation: 0,
      negotiationPoints: 14,
      objective: (() => {
        const objective = rng.pick(pool.length > 0 ? pool : OBJECTIVES_FOR_ROLE(role));
        dealt.add(objective.id);
        return objective;
      })(),
      fees: 0,
      human: role === (options.humanRole ?? 'buyer'),
    };
  }

  const state: GameState = {
    seed,
    rngState: rng.snapshot(),
    scenario,
    market,
    phase: 1,
    step: 'screening',
    players,
    humanRole: options.humanRole ?? 'buyer',
    acquirer,
    marketTargets,
    screened: [],
    comparables: [],
    precedentTransactions: [],
    valuationRanges: [],
    competingBidders: [],
    loiExchanges: [],
    loiRoundsRemaining: 3,
    agreementNarrative: [],
    buyerSunkCost: 0,
    bankerFees: 0,
    clock: 0,
    parClock: 20,
    log: [],
    status: 'active',
  };

  pushLog(state, {
    phase: 1,
    role: 'system',
    text: `${scenario.name} — ${market.name}`,
    detail: [scenario.premise, market.description],
  });
  pushLog(state, {
    phase: 1,
    role: 'system',
    text: `You are advising as ${acquirer.name}.`,
    detail: [acquirer.description],
  });

  return state;
}

/** Restore the RNG, run some work, and store the advanced state back. */
export function withRng<T>(state: GameState, fn: (rng: Rng) => T): T {
  const rng = new Rng(0);
  rng.restore(state.rngState);
  const result = fn(rng);
  state.rngState = rng.snapshot();
  return result;
}

export function pushLog(state: GameState, entry: LogEntry): void {
  state.log.push(entry);
}

export function buyer(state: GameState): PlayerState {
  return state.players.buyer;
}

/** Headline price currently on the table, $M. */
export function currentPrice(state: GameState): number {
  if (state.agreement) return state.agreement.price;
  if (state.repricedValue !== undefined) return state.repricedValue;
  if (state.loi) return state.loi.price;
  if (state.ioi) return (state.ioi.priceLow + state.ioi.priceHigh) / 2;
  return 0;
}

export function targetIntrinsic(state: GameState): number {
  if (!state.target) return 0;
  return intrinsicEquityValue(state.target, state.market);
}

export function targetUnaffected(state: GameState): number {
  if (!state.target) return 0;
  return unaffectedEquityValue(state.target);
}

/** Spend capital and record it as sunk cost. */
export function spend(state: GameState, amount: number, reason: string): void {
  state.players.buyer.capital = round(state.players.buyer.capital - amount, 1);
  state.buyerSunkCost = round(state.buyerSunkCost + amount, 1);
  pushLog(state, {
    phase: state.phase,
    role: 'buyer',
    text: `$${round(amount, 1)}M — ${reason}`,
    tone: 'neutral',
  });
}

export function adjustReputation(
  state: GameState,
  role: RoleId,
  delta: number,
  reason: string,
): void {
  if (delta === 0) return;
  state.players[role].reputation = round(state.players[role].reputation + delta, 1);
  pushLog(state, {
    phase: state.phase,
    role,
    text: `Reputation ${delta > 0 ? '+' : ''}${round(delta, 1)} — ${reason}`,
    tone: delta > 0 ? 'good' : 'bad',
  });
}

export function terminate(state: GameState, reason: string): void {
  state.status = 'terminated';
  state.terminationReason = reason;
  state.phase = 8;
  state.step = 'scoring';
  pushLog(state, {
    phase: 8,
    role: 'system',
    text: 'Transaction terminated',
    detail: [reason],
    tone: 'bad',
  });
}

export function advance(state: GameState, phase: PhaseId, step: GameStep): void {
  state.phase = phase;
  state.step = step;
}
