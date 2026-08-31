import {
  COMPROMISED_REPORT_MISS_RATE,
  DESTIN_CONRAD,
  DESTIN_CONRAD_REPS_BONUS,
  DIFFICULTY_PROFILES,
  DILIGENCE_PROVIDERS,
  LINETTI,
  LINETTI_LEAK_MULTIPLIER,
  LINETTI_SELF_PROMOTION_RATE,
  BELLION,
  CASE_OFFICER,
  SELLER_CHAIR,
  SELLER_NEGOTIATOR,
  type DiligenceProviderId,
} from './content/advisers.js';
import {
  chooseDisclosureStrategy,
  chooseProcessType,
  chooseRegulatorPosture,
  competingBidderResponse,
  createCompetingBidders,
  fairnessOpinion,
  sellerAgreementResistance,
  sellerPriceExpectations,
  sellerRepriceAcceptance,
  sellerWalksOnReprice,
} from './ai.js';
import {
  AGREEMENT_FRONTS,
  negotiateAgreement,
  type AgreementPushes,
} from './agreement.js';
import {
  drawIntegrationCards,
  drawInterimEvents,
  requiredScopeFor,
  resolveClaim,
  resolveMacDispute,
  workingCapitalAdjustment,
} from './closing.js';
import { MARKET_DEFINITIONS, runRegulatoryReview } from './regulatory.js';
import {
  buildDataRoom,
  burialPenalty,
  emptyAllocation,
  latentFindings,
  revealRandomHidden,
  runDiligence,
  totalAllocationCost,
} from './diligence.js';
import {
  buyerBatna,
  leverageScore,
  loiFromIoi,
  marketStandardLoi,
  sellerAccepts,
  sellerBatna,
  sellerCounter,
} from './negotiation.js';
import { clamp, round } from './rng.js';
import { scoreAll } from './scoring.js';
import {
  adjustReputation,
  advance,
  createGame,
  currentPrice,
  pushLog,
  spend,
  targetIntrinsic,
  targetUnaffected,
  terminate,
  withRng,
  type GameState,
  type NewGameOptions,
} from './state.js';
import { analyseFinancing, analyseStructure } from './structuring.js';
import {
  buildComparables,
  buildPrecedentTransactions,
  defaultDcfAssumptions,
  intrinsicEquityValue,
  latest,
  premiumPct,
  runCompsAnalysis,
  runDcfAnalysis,
  runPrecedentAnalysis,
  synthesise,
  unaffectedEquityValue,
} from './valuation.js';
import {
  DILIGENCE_CATEGORIES,
  type DiligenceCategory,
  type DiligenceDepth,
  type IndemnityClaim,
  type IndicationOfInterest,
  type LoiTerms,
  type RemedyType,
  type RepCategory,
  type StructuringDecision,
} from './types.js';
import type { DcfAssumptions } from './valuation.js';

export { createGame };
export type { GameState, NewGameOptions };

/** Costs, in $M, of each analytical method (GDD §6 Phase 1 Buyer Actions). */
export const VALUATION_COST_PCT = { comps: 0.0025, precedent: 0.005, dcf: 0.009 } as const;
/** Cash cost per Diligence Point, $M. */
export const DP_CASH_COST_PCT = 0.0018;
/** Retainers the buyer may take on before diligence opens. */
export const AVAILABLE_RETAINERS = [DESTIN_CONRAD, LINETTI];

/**
 * The value every fee is struck against. Before a target is chosen this is the
 * median of what is on the market; afterwards it is the target itself.
 */
export function referenceValue(state: GameState): number {
  if (state.target) return Math.max(20, unaffectedEquityValue(state.target));
  const values = state.marketTargets.map((t) => unaffectedEquityValue(t)).sort((a, b) => a - b);
  return Math.max(20, values[Math.floor(values.length / 2)] ?? 100);
}

/** Fee for screening one target (GDD §6 Phase 1). */
export function screeningFee(state: GameState): number {
  return round(referenceValue(state) * 0.0012, 2);
}

export function valuationCost(state: GameState, method: keyof typeof VALUATION_COST_PCT): number {
  return round(referenceValue(state) * VALUATION_COST_PCT[method], 2);
}

export function dpCashCost(state: GameState): number {
  return round(referenceValue(state) * DP_CASH_COST_PCT, 3);
}
/** Advisory fee as a fraction of deal value, paid on closing. */
export const ADVISORY_FEE_RATE = 0.012;

export type GameAction =
  | { type: 'screen-target'; targetId: string }
  | { type: 'run-comps'; compIds: string[] }
  | { type: 'run-precedent'; precedentIds: string[] }
  | { type: 'run-dcf'; assumptions: DcfAssumptions }
  | { type: 'select-target'; targetId: string }
  | { type: 'advance' }
  | { type: 'submit-ioi'; ioi: IndicationOfInterest }
  | { type: 'loi-respond'; response: 'accept' | 'counter' | 'walk'; terms?: LoiTerms }
  | { type: 'retain'; retainerId: string; on: boolean }
  | {
      type: 'allocate-diligence';
      allocation: Record<DiligenceCategory, DiligenceDepth>;
      provider: DiligenceProviderId;
    }
  | { type: 'reprice'; requestedCutPct: number; walk: boolean }
  | { type: 'set-structure'; decision: StructuringDecision }
  | {
      type: 'negotiate-agreement';
      pushes: AgreementPushes;
      rwInsurance: boolean;
      specialIndemnities: RepCategory[];
    }
  | {
      type: 'regulatory-strategy';
      marketDefinitionId: 'narrow' | 'standard' | 'broad';
      offeredRemedy: RemedyType;
      influenceSpent: number;
    }
  | { type: 'mac-decision'; invoke: boolean };

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Apply an action. The state is mutated in place; determinism is preserved by
 * threading the RNG state through `withRng`, so (seed, action list) always
 * reproduces the same game.
 */
export function applyAction(state: GameState, action: GameAction): ActionResult {
  if (state.status !== 'active' && action.type !== 'advance') {
    return { ok: false, error: 'The game is over.' };
  }

  const result = dispatch(state, action);
  if (result.ok) checkLongStop(state);
  return result;
}

function dispatch(state: GameState, action: GameAction): ActionResult {
  switch (action.type) {
    case 'screen-target':
      return screenTarget(state, action.targetId);
    case 'run-comps':
      return runComps(state, action.compIds);
    case 'run-precedent':
      return runPrecedent(state, action.precedentIds);
    case 'run-dcf':
      return runDcf(state, action.assumptions);
    case 'select-target':
      return selectTarget(state, action.targetId);
    case 'advance':
      return advancePhase(state);
    case 'submit-ioi':
      return submitIoi(state, action.ioi);
    case 'loi-respond':
      return loiRespond(state, action.response, action.terms);
    case 'retain':
      return setRetainer(state, action.retainerId, action.on);
    case 'allocate-diligence':
      return allocateDiligence(state, action.allocation, action.provider);
    case 'reprice':
      return reprice(state, action.requestedCutPct, action.walk);
    case 'set-structure':
      return setStructure(state, action.decision);
    case 'negotiate-agreement':
      return doNegotiateAgreement(
        state,
        action.pushes,
        action.rwInsurance,
        action.specialIndemnities,
      );
    case 'regulatory-strategy':
      return doRegulatory(
        state,
        action.marketDefinitionId,
        action.offeredRemedy,
        action.influenceSpent,
      );
    case 'mac-decision':
      return doMacDecision(state, action.invoke);
    default:
      return { ok: false, error: 'Unknown action.' };
  }
}

// ---------------------------------------------------------------------------
// Phase 1 — Origination & Screening
// ---------------------------------------------------------------------------

function screenTarget(state: GameState, targetId: string): ActionResult {
  if (state.step !== 'screening') return { ok: false, error: 'Screening is closed.' };
  if (state.screened.includes(targetId)) return { ok: true };
  const target = state.marketTargets.find((t) => t.id === targetId);
  if (!target) return { ok: false, error: 'That target is not in the market.' };

  state.screened.push(targetId);
  spend(state, screeningFee(state), `screening fee for ${target.name}`);
  state.clock += 1;
  return { ok: true };
}

function selectTarget(state: GameState, targetId: string): ActionResult {
  if (state.step !== 'screening') return { ok: false, error: 'A target has already been chosen.' };
  const target = state.marketTargets.find((t) => t.id === targetId);
  if (!target) return { ok: false, error: 'That target is not in the market.' };
  if (!state.screened.includes(targetId)) {
    return { ok: false, error: 'Screen the target before pursuing it.' };
  }

  state.target = target;

  withRng(state, (rng) => {
    state.comparables = buildComparables(target, rng);
    state.precedentTransactions = buildPrecedentTransactions(target, rng);
    state.dcfAssumptions = defaultDcfAssumptions(target);

    // The other seats make their opening decisions.
    state.processType = chooseProcessType(state, rng);
    state.players.regulator.reputation = 0;
    const posture = chooseRegulatorPosture(state, rng);
    state.competingBidders = createCompetingBidders(state, rng);

    if (state.processType === 'auction' || state.processType === 'targeted') {
      state.loiRoundsRemaining -= BELLION.timetablePressure;
      pushLog(state, {
        phase: 1,
        role: 'seller',
        text: `${BELLION.name} has been appointed to run the process.`,
        detail: [
          'They control the flow of information and the timetable. Expect a shorter road to a signed letter than you would like.',
        ],
        tone: 'warning',
      });
    }

    pushLog(state, {
      phase: 1,
      role: 'seller',
      text: `${SELLER_CHAIR}: the board will run a ${state.processType!.replace('-', ' ')} process.`,
      detail:
        state.processType === 'auction'
          ? ['A broad process maximises price competition but takes longer and leaks more.']
          : state.processType === 'exclusive'
            ? ['Exclusivity is fast, but a thin market check invites a Revlon problem.']
            : [],
    });
    pushLog(state, {
      phase: 1,
      role: 'regulator',
      text: `Enforcement posture set to ${posture}.`,
      detail: [
        posture === 'aggressive'
          ? 'The agency has signalled appetite for litigation in concentrated markets.'
          : posture === 'permissive'
            ? 'Review timelines are running short and remedies are being accepted readily.'
            : 'Standard review timelines apply.',
      ],
    });
    state.regulatoryPosture = posture;

    if (state.competingBidders.length > 0) {
      pushLog(state, {
        phase: 1,
        role: 'system',
        text: `${state.competingBidders.length} competing bidder${state.competingBidders.length > 1 ? 's are' : ' is'} circling.`,
        detail: state.competingBidders.map((b) => `${b.name} is in the process.`),
        tone: 'warning',
      });
    }
  });

  pushLog(state, {
    phase: 1,
    role: 'buyer',
    text: `Pursuing ${target.name}.`,
    detail: [target.description],
  });

  advance(state, 1, 'valuation-review');
  return { ok: true };
}

function requireTarget(state: GameState) {
  if (!state.target) throw new Error('No target selected');
  return state.target;
}

function runComps(state: GameState, compIds: string[]): ActionResult {
  if (state.step !== 'valuation-review') return { ok: false, error: 'Not in the valuation step.' };
  if (state.valuationRanges.some((r) => r.method === 'comps')) {
    return { ok: false, error: 'Comparable companies analysis has already been run.' };
  }
  if (compIds.length < 3) {
    return { ok: false, error: 'Select at least three comparable companies.' };
  }
  const target = requireTarget(state);
  const selected = state.comparables.filter((c) => compIds.includes(c.id));

  const range = withRng(state, (rng) => runCompsAnalysis(target, state.market, selected, rng));
  state.valuationRanges.push(range);
  spend(state, valuationCost(state, 'comps'), 'comparable companies analysis');
  state.clock += 1;
  pushLog(state, {
    phase: 1,
    role: 'banker',
    text: `Comps: £${range.low}M – £${range.high}M (mid £${range.mid}M)`,
    detail: range.notes,
  });
  return { ok: true };
}

function runPrecedent(state: GameState, ids: string[]): ActionResult {
  if (state.step !== 'valuation-review') return { ok: false, error: 'Not in the valuation step.' };
  if (state.valuationRanges.some((r) => r.method === 'precedent')) {
    return { ok: false, error: 'Precedent transaction analysis has already been run.' };
  }
  if (ids.length < 2) return { ok: false, error: 'Select at least two precedent transactions.' };
  const target = requireTarget(state);
  const selected = state.precedentTransactions.filter((p) => ids.includes(p.id));

  const range = withRng(state, (rng) =>
    runPrecedentAnalysis(target, state.market, selected, rng),
  );
  state.valuationRanges.push(range);
  spend(state, valuationCost(state, 'precedent'), 'precedent transaction analysis');
  state.clock += 2;
  pushLog(state, {
    phase: 1,
    role: 'banker',
    text: `Precedents: £${range.low}M – £${range.high}M (mid £${range.mid}M)`,
    detail: range.notes,
  });
  return { ok: true };
}

function runDcf(state: GameState, assumptions: DcfAssumptions): ActionResult {
  if (state.step !== 'valuation-review') return { ok: false, error: 'Not in the valuation step.' };
  if (state.valuationRanges.some((r) => r.method === 'dcf')) {
    return { ok: false, error: 'A DCF has already been run.' };
  }
  const target = requireTarget(state);
  let range;
  try {
    range = runDcfAnalysis(target, state.market, assumptions);
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
  state.dcfAssumptions = assumptions;
  state.valuationRanges.push(range);
  spend(state, valuationCost(state, 'dcf'), 'discounted cash flow analysis');
  state.clock += 3;
  pushLog(state, {
    phase: 1,
    role: 'banker',
    text: `DCF: £${range.low}M – £${range.high}M (mid £${range.mid}M)`,
    detail: range.notes,
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Phase transitions
// ---------------------------------------------------------------------------

function advancePhase(state: GameState): ActionResult {
  switch (state.step) {
    case 'valuation-review': {
      if (state.valuationRanges.length === 0) {
        return {
          ok: false,
          error: 'Run at least one valuation before approaching the board with a number.',
        };
      }
      const target = requireTarget(state);
      state.valuation = synthesise(state.valuationRanges, target, state.market);
      pushLog(state, {
        phase: 1,
        role: 'banker',
        text: `Recommended range: £${state.valuation.recommendedLow}M – £${state.valuation.recommendedHigh}M`,
        detail: [
          `Unaffected equity value is £${round(targetUnaffected(state), 0)}M.`,
          `${state.valuationRanges.length} of 3 methodologies used.`,
        ],
      });
      advance(state, 2, 'ioi');
      return { ok: true };
    }
    case 'diligence-review':
      return { ok: false, error: 'Decide how to handle the findings first.' };
    case 'scoring':
      return { ok: true };
    default:
      return { ok: false, error: 'Nothing to advance from here.' };
  }
}

// ---------------------------------------------------------------------------
// Phase 2 — Preliminary Engagement
// ---------------------------------------------------------------------------

function computeLeverage(state: GameState): number {
  const intrinsic = targetIntrinsic(state);
  const activeBidders = state.competingBidders.filter((b) => b.active).length;
  const seriousFindings =
    state.diligence?.revealed.filter((c) => c.severity === 'red' || c.severity === 'black')
      .length ?? 0;

  const bBatna = buyerBatna({
    alternativeTargetsAvailable: state.marketTargets.length - 1,
    capitalHeadroom: clamp(state.players.buyer.capital / Math.max(1, intrinsic * 0.4), 0, 1),
    sunkCost: state.buyerSunkCost,
    dealValue: Math.max(1, intrinsic),
  });
  const sBatna = sellerBatna({
    standaloneGrowth: state.target?.projectedGrowthPct ?? 3,
    competingBidders: activeBidders,
    processType: state.processType ?? 'targeted',
    marketHeat: state.market.competitionLevel,
  });

  return leverageScore({
    competingBidders: activeBidders,
    seriousFindings,
    buyerBatna: bBatna,
    sellerBatna: sBatna,
    buyerReputation: state.players.buyer.reputation,
    sellerReputation: state.players.seller.reputation,
    exclusivity: (state.loi?.exclusivityDays ?? 0) > 0,
    marketHeat: state.market.competitionLevel,
  });
}

function submitIoi(state: GameState, ioi: IndicationOfInterest): ActionResult {
  if (state.step !== 'ioi') return { ok: false, error: 'Not at the indication of interest step.' };
  if (ioi.priceLow <= 0 || ioi.priceHigh < ioi.priceLow) {
    return { ok: false, error: 'The price range is not coherent.' };
  }
  const target = requireTarget(state);

  state.ioi = ioi;
  state.clock += 1;
  const opening = loiFromIoi(ioi);
  state.loiExchanges.push({
    round: 1,
    from: 'buyer',
    terms: opening,
    commentary: `Indication of interest at £${round(opening.price, 0)}M, ${ioi.consideration}.`,
  });

  pushLog(state, {
    phase: 2,
    role: 'buyer',
    text: `IOI submitted: £${ioi.priceLow}M – £${ioi.priceHigh}M, ${ioi.consideration}.`,
    detail: [
      `Exclusivity requested: ${ioi.exclusivityDays} days`,
      `Break-up fee: ${ioi.breakFeePct}%; deposit: ${ioi.depositPct}%`,
      `No-shop: ${ioi.noShop}`,
      `Premium to unaffected: ${premiumPct(opening.price, target)}%`,
    ],
  });

  // Competing bidders react to the number on the table.
  withRng(state, (rng) => {
    for (const bidder of state.competingBidders) {
      if (!bidder.active) continue;
      const response = competingBidderResponse(bidder, opening.price, rng);
      if (response.withdrew) {
        bidder.active = false;
        pushLog(state, {
          phase: 2,
          role: 'system',
          text: `${bidder.name} has withdrawn from the process.`,
          tone: 'good',
        });
      } else {
        bidder.bid = response.bid;
        pushLog(state, {
          phase: 2,
          role: 'system',
          text: `${bidder.name} is understood to be bidding around £${bidder.bid}M.`,
          tone: 'warning',
        });
      }
    }
  });

  advance(state, 2, 'loi-negotiation');
  return sellerRespondToLoi(state, opening);
}

function sellerRespondToLoi(state: GameState, offer: LoiTerms): ActionResult {
  const expectations = sellerPriceExpectations(state);
  const leverage = computeLeverage(state);

  const accepted = withRng(state, (rng) =>
    sellerAccepts({
      terms: offer,
      sellerTargetPrice: expectations.target,
      sellerReservePrice: expectations.reserve,
      roundsRemaining: state.loiRoundsRemaining,
      rng,
    }),
  );

  if (accepted) {
    state.loi = offer;
    pushLog(state, {
      phase: 2,
      role: 'seller',
      text: `${SELLER_CHAIR}: the board has approved the letter of intent at £${round(offer.price, 0)}M.`,
      tone: 'good',
    });
    return signLoi(state);
  }

  state.loiRoundsRemaining -= 1;
  if (state.loiRoundsRemaining <= 0) {
    // Unresolved terms fall to market standard (GDD Appendix B, Core Rule).
    const target = requireTarget(state);
    const fallback = marketStandardLoi(target, (offer.price + expectations.target) / 2);
    state.loi = fallback;
    state.loiExchanges.push({
      round: 4,
      from: 'seller',
      terms: fallback,
      commentary:
        'Neither side moved far enough in the time available. The open terms defaulted to market standard — worse for both of you than a negotiated outcome.',
    });
    pushLog(state, {
      phase: 2,
      role: 'system',
      text: 'LOI terms defaulted to market standard.',
      detail: ['Time ran out on the negotiation. Nobody got what they wanted.'],
      tone: 'warning',
    });
    return signLoi(state);
  }

  const bellionEngaged =
    state.processType === 'auction' || state.processType === 'targeted';
  const counter = withRng(state, (rng) =>
    sellerCounter({
      buyerOffer: offer,
      sellerTargetPrice: expectations.target,
      sellerReservePrice: expectations.reserve,
      roundsRemaining: state.loiRoundsRemaining,
      leverage,
      rng,
    }),
  );

  if (bellionEngaged) {
    counter.exclusivityDays = Math.round(
      counter.exclusivityDays * BELLION.exclusivityGrantRate,
    );
  }

  const activeBidders = state.competingBidders.filter((b) => b.active).length;
  state.loiExchanges.push({
    round: state.loiExchanges.length + 1,
    from: 'seller',
    terms: counter,
    commentary:
      activeBidders > 0
        ? `We have interest at higher levels. The board can recommend £${round(counter.price, 0)}M.`
        : `The board's view of value is £${round(counter.price, 0)}M. We are prepared to move on the other terms.`,
  });

  pushLog(state, {
    phase: 2,
    role: 'seller',
    text: `${SELLER_NEGOTIATOR} counters at £${round(counter.price, 0)}M.`,
    detail: [
      `Exclusivity: ${counter.exclusivityDays} days`,
      `Break-up fee: ${counter.breakFeePct}%`,
      `No-shop: ${counter.noShop}; deposit ${counter.depositPct}%`,
    ],
  });

  state.clock += 1;
  return { ok: true };
}

function loiRespond(
  state: GameState,
  response: 'accept' | 'counter' | 'walk',
  terms?: LoiTerms,
): ActionResult {
  if (state.step !== 'loi-negotiation') return { ok: false, error: 'No LOI is on the table.' };

  if (response === 'walk') {
    adjustReputation(state, 'buyer', -1, 'walked away after engaging');
    terminate(state, 'The buyer walked away during LOI negotiation.');
    finaliseScores(state);
    return { ok: true };
  }

  if (response === 'accept') {
    const last = state.loiExchanges[state.loiExchanges.length - 1];
    if (!last || last.from !== 'seller') {
      return { ok: false, error: 'There is no seller counter to accept.' };
    }
    state.loi = last.terms;
    pushLog(state, {
      phase: 2,
      role: 'buyer',
      text: `Accepted the seller's terms at £${round(last.terms.price, 0)}M.`,
    });
    return signLoi(state);
  }

  if (!terms) return { ok: false, error: 'A counter needs terms.' };
  state.clock += 1;
  state.loiExchanges.push({
    round: state.loiExchanges.length + 1,
    from: 'buyer',
    terms,
    commentary: `Counter at £${round(terms.price, 0)}M.`,
  });
  pushLog(state, {
    phase: 2,
    role: 'buyer',
    text: `Counter at £${round(terms.price, 0)}M.`,
  });
  return sellerRespondToLoi(state, terms);
}

function signLoi(state: GameState): ActionResult {
  const target = requireTarget(state);

  withRng(state, (rng) => {
    state.disclosureStrategy = chooseDisclosureStrategy(state, rng);
    state.dataRoom = buildDataRoom(target, state.disclosureStrategy, rng);
  });

  pushLog(state, {
    phase: 3,
    role: 'seller',
    text: `Data room opened — disclosure posture: ${state.disclosureStrategy}.`,
    detail:
      state.disclosureStrategy === 'full'
        ? ['Everything is face up. That is either confidence or a very good bluff.']
        : state.disclosureStrategy === 'bury'
          ? ['The index runs to 400 pages. Good luck.']
          : ['Material is being released on the seller’s timetable.'],
  });

  advance(state, 3, 'diligence-allocation');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Phase 3 — Due Diligence
// ---------------------------------------------------------------------------

export function diligenceBudget(state: GameState): number {
  return state.scenario.diligenceBudget ?? DIFFICULTY_PROFILES[state.difficulty].diligenceBudget;
}

function setRetainer(state: GameState, retainerId: string, on: boolean): ActionResult {
  if (state.step !== 'diligence-allocation') {
    return { ok: false, error: 'Retainers are appointed before the fieldwork starts.' };
  }
  const retainer = AVAILABLE_RETAINERS.find((r) => r.id === retainerId);
  if (!retainer) return { ok: false, error: 'No such adviser.' };
  const held = state.retainers.includes(retainerId);
  if (on === held) return { ok: true };

  if (on) {
    state.retainers.push(retainerId);
    spend(state, round(referenceValue(state) * retainer.feePct, 2), `${retainer.name} retainer`);
  } else {
    state.retainers = state.retainers.filter((id) => id !== retainerId);
  }
  return { ok: true };
}

function allocateDiligence(
  state: GameState,
  allocation: Record<DiligenceCategory, DiligenceDepth>,
  providerId: DiligenceProviderId,
): ActionResult {
  if (state.step !== 'diligence-allocation') {
    return { ok: false, error: 'Diligence is not open.' };
  }
  const full = { ...emptyAllocation(), ...allocation };
  const cost = totalAllocationCost(full);
  const budget = diligenceBudget(state);
  if (cost > budget) {
    return { ok: false, error: `That allocation costs ${cost} DP against a budget of ${budget}.` };
  }
  if (!state.dataRoom) return { ok: false, error: 'No data room.' };

  const provider = DILIGENCE_PROVIDERS[providerId];
  if (!provider) return { ok: false, error: 'No such provider.' };
  state.diligenceProvider = providerId;

  // Where the reports themselves are compromised, no provider reaches truth.
  const tier = DIFFICULTY_PROFILES[state.difficulty];
  const missRate = tier.reportsCompromised
    ? Math.max(provider.missRate, COMPROMISED_REPORT_MISS_RATE)
    : provider.missRate;

  const result = withRng(state, (rng) =>
    runDiligence(state.dataRoom!, full, rng, {
      missRate,
      reachesDeeper: provider.reachesDeeper,
    }),
  );
  state.diligence = result;
  const dealScale = referenceValue(state);
  spend(state, round(dealScale * provider.feePct, 2), `${provider.name} retainer`);
  spend(
    state,
    round(cost * dpCashCost(state) * provider.costPerPoint, 2),
    `diligence fieldwork (${cost} DP)`,
  );
  state.clock += Math.ceil(cost / 3) + provider.timetableCost;

  pushLog(state, {
    phase: 3,
    role: 'buyer',
    text: `${provider.name} reports: ${cost} of ${budget} DP deployed.`,
    detail: DILIGENCE_CATEGORIES.filter((c) => full[c] > 0).map(
      (c) => `${c}: ${full[c]} DP`,
    ),
  });

  for (const finding of result.findings) {
    pushLog(state, {
      phase: 3,
      role: 'buyer',
      text: `[${finding.card.severity.toUpperCase()}] ${finding.card.title}`,
      detail: [finding.card.body, `Supports a ${finding.priceImpactPct}% price reduction.`],
      tone: finding.card.severity === 'green' ? 'good' : 'bad',
    });
  }

  // A leak or whistleblower can surface something the buyer did not pay to find.
  const leakMultiplier = state.retainers.includes(LINETTI.id) ? LINETTI_LEAK_MULTIPLIER : 1;
  withRng(state, (rng) => {
    if (rng.bool((0.22 + state.market.volatility * 0.2) * leakMultiplier)) {
      const card = revealRandomHidden(state.dataRoom!, rng);
      if (card) {
        pushLog(state, {
          phase: 3,
          role: 'system',
          text: `Whistleblower disclosure: ${card.title}`,
          detail: [card.body, 'This surfaced outside the process. It is now on the table.'],
          tone: 'warning',
        });
        state.diligence!.revealed.push(card);
        state.diligence!.missed = state.diligence!.missed.filter((c) => c.id !== card.id);
        const [lo, hi] = card.priceImpactPct;
        const impact = round((lo + hi) / 2, 2);
        state.diligence!.priceAdjustmentPct = round(
          state.diligence!.priceAdjustmentPct + impact,
          2,
        );
        state.diligence!.findings.push({
          card,
          priceImpactPct: impact,
          demandsSpecialIndemnity: card.severity === 'red' || card.severity === 'black',
        });
      }
    }
  });

  // Linetti runs its own profile alongside yours, and a raised profile draws
  // exactly the attention a live process does not need.
  if (state.retainers.includes(LINETTI.id)) {
    withRng(state, (rng) => {
      if (rng.bool(LINETTI_SELF_PROMOTION_RATE) && state.competingBidders.every((b) => !b.active)) {
        const revived = state.competingBidders[0];
        if (revived) {
          revived.active = true;
          pushLog(state, {
            phase: 3,
            role: 'system',
            text: `${LINETTI.name} placed a profile piece. ${revived.name} has re-entered the process.`,
            tone: 'bad',
          });
        }
      }
    });
  }

  const penalty = burialPenalty(state.disclosureStrategy ?? 'selective', state.diligence!);
  if (penalty !== 0) {
    adjustReputation(
      state,
      'seller',
      penalty,
      'material findings were buried in the data room and dug out anyway',
    );
  }

  advance(state, 3, 'diligence-review');
  return { ok: true };
}

function reprice(state: GameState, requestedCutPct: number, walk: boolean): ActionResult {
  if (state.step !== 'diligence-review') return { ok: false, error: 'Not at the repricing step.' };
  if (!state.loi) return { ok: false, error: 'No LOI in place.' };

  if (walk) {
    adjustReputation(state, 'buyer', 1, 'walked rather than proceed on findings the diligence did not support');
    terminate(state, 'The buyer terminated after diligence.');
    finaliseScores(state);
    return { ok: true };
  }

  const justified = state.diligence?.priceAdjustmentPct ?? 0;
  const activeBidders = state.competingBidders.filter((b) => b.active).length;

  const response = withRng(state, (rng) =>
    sellerRepriceAcceptance({
      requestedCutPct,
      justifiedCutPct: justified,
      competingBidders: activeBidders,
      rng,
    }),
  );

  const agreedCut = response.accepted ? requestedCutPct : response.counterCutPct;
  const newPrice = round(state.loi.price * (1 - agreedCut / 100), 1);
  const expectations = sellerPriceExpectations(state);

  const sellerWalks = withRng(state, (rng) =>
    sellerWalksOnReprice({
      requestedCutPct,
      justifiedCutPct: justified,
      reservePrice: expectations.reserve,
      proposedPrice: newPrice,
      rng,
    }),
  );

  pushLog(state, {
    phase: 3,
    role: 'seller',
    text: response.commentary,
    detail: [
      `Requested: ${round(requestedCutPct, 2)}%. Diligence findings support roughly ${justified}%.`,
    ],
  });

  if (sellerWalks) {
    terminate(
      state,
      `The seller terminated rather than accept a ${round(requestedCutPct, 1)}% reduction. Their reserve was £${expectations.reserve}M.`,
    );
    finaliseScores(state);
    return { ok: true };
  }

  if (requestedCutPct > justified + 6) {
    adjustReputation(
      state,
      'buyer',
      -2,
      'used diligence as a pretext to retrade well beyond what the findings supported',
    );
  } else if (requestedCutPct <= justified + 1 && requestedCutPct > 0) {
    adjustReputation(state, 'buyer', 1, 'repriced only to the extent the findings justified');
  }

  state.repricedValue = newPrice;
  state.clock += 1;
  pushLog(state, {
    phase: 3,
    role: 'system',
    text: `Price adjusted to £${newPrice}M (${round(agreedCut, 2)}% reduction).`,
    tone: agreedCut > 0 ? 'good' : 'neutral',
  });

  advance(state, 4, 'structuring');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Phase 4 — Deal Structuring
// ---------------------------------------------------------------------------

function setStructure(state: GameState, decision: StructuringDecision): ActionResult {
  if (state.step !== 'structuring') return { ok: false, error: 'Not at the structuring step.' };
  const target = requireTarget(state);
  const price = currentPrice(state);

  const structureAnalysis = analyseStructure(decision, !!target.sharePrice);
  if (structureAnalysis.errors.length > 0) {
    return { ok: false, error: structureAnalysis.errors[0] };
  }

  const cashConsideration = round(price * decision.cashPct, 1);
  const financingAnalysis = analyseFinancing({
    plan: decision.financing,
    cashConsideration,
    acquirer: state.acquirer,
    targetEbitda: latest(target).ebitda,
    market: state.market,
  });
  if (financingAnalysis.errors.length > 0) {
    return { ok: false, error: financingAnalysis.errors[0] };
  }

  state.structuring = decision;
  state.structureAnalysis = structureAnalysis;
  state.financingAnalysis = financingAnalysis;

  // The seller demands compensation for an unfavourable tax treatment.
  if (structureAnalysis.sellerPriceDemandPct > 0) {
    const uplift = round(price * (structureAnalysis.sellerPriceDemandPct / 100), 1);
    state.repricedValue = round(price + uplift, 1);
    pushLog(state, {
      phase: 4,
      role: 'seller',
      text: `Price increased by £${uplift}M to compensate for the tax treatment.`,
      detail: [`${structureAnalysis.sellerPriceDemandPct}% uplift on a £${round(price, 0)}M deal.`],
      tone: 'bad',
    });
  }

  if (structureAnalysis.complexityCost > 0) {
    spend(state, round(price * structureAnalysis.complexityCost, 2), 'structuring and tax advisory');
  }

  state.clock += Math.round(structureAnalysis.speed * 2);

  pushLog(state, {
    phase: 4,
    role: 'buyer',
    text: `Structure set: ${decision.structure.replace(/-/g, ' ')}, ${Math.round(decision.cashPct * 100)}% cash, ${decision.tax}.`,
    detail: [
      `Financing: £${financingAnalysis.totalDebt}M debt at ${financingAnalysis.blendedRateBps}bps, ${financingAnalysis.leverageTurns}x leverage.`,
      `Equity cheque: £${financingAnalysis.equityCheck}M.`,
      ...financingAnalysis.warnings,
    ],
  });

  advance(state, 5, 'agreement');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Phase 5 — Definitive Agreement
// ---------------------------------------------------------------------------

function doNegotiateAgreement(
  state: GameState,
  pushes: AgreementPushes,
  rwInsurance: boolean,
  specialIndemnities: RepCategory[],
): ActionResult {
  if (state.step !== 'agreement') return { ok: false, error: 'Not at the agreement step.' };

  const totalPush = AGREEMENT_FRONTS.reduce((s, f) => s + (pushes[f] ?? 0), 0);
  const available = state.players.buyer.negotiationPoints;
  if (totalPush > available) {
    return { ok: false, error: `You have ${available} Negotiation Points; that plan commits ${totalPush}.` };
  }

  const leverage = computeLeverage(state);
  const price = currentPrice(state);

  const result = withRng(state, (rng) => {
    const base = sellerAgreementResistance(state, rng);
    const resistance = {
      reps: round(base * rng.float(0.85, 1.15), 2),
      mac: round(base * rng.float(0.95, 1.3), 2),
      indemnity: round(base * rng.float(0.9, 1.25), 2),
      conditions: round(base * rng.float(0.8, 1.1), 2),
    };
    const counselBonus = state.retainers.includes(DESTIN_CONRAD.id)
      ? DESTIN_CONRAD_REPS_BONUS
      : 0;
    return negotiateAgreement({
      pushes: { ...pushes, reps: pushes.reps + counselBonus },
      sellerResistance: resistance,
      leverage,
      specialIndemnityRequests: specialIndemnities,
      rwInsurance,
      price,
      rng,
    });
  });

  state.players.buyer.negotiationPoints = round(available - totalPush, 1);
  state.agreement = result.agreement;
  state.agreementNarrative = result.narrative;

  if (rwInsurance) {
    const premium = round(price * 0.031, 1);
    spend(state, premium, 'representation & warranty insurance premium');
  }

  state.clock += 3;

  pushLog(state, {
    phase: 5,
    role: 'system',
    text: 'Definitive agreement signed.',
    detail: result.narrative,
  });

  // The banker delivers a fairness opinion on the signed price.
  const opinion = withRng(state, (rng) =>
    fairnessOpinion({
      price,
      intrinsic: targetIntrinsic(state),
      closingBias: 0.7,
      rng,
    }),
  );
  pushLog(state, {
    phase: 5,
    role: 'banker',
    text: 'Fairness opinion delivered.',
    detail: [opinion.commentary],
    tone: opinion.fair ? 'neutral' : 'warning',
  });

  advance(state, 6, 'regulatory');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Phase 6 — Regulatory Review
// ---------------------------------------------------------------------------

function doRegulatory(
  state: GameState,
  marketDefinitionId: 'narrow' | 'standard' | 'broad',
  offeredRemedy: RemedyType,
  influenceSpent: number,
): ActionResult {
  if (state.step !== 'regulatory') return { ok: false, error: 'Not at the regulatory step.' };
  if (!state.agreement) return { ok: false, error: 'No signed agreement to file.' };

  const available = state.players.buyer.influence;
  if (influenceSpent > available) {
    return { ok: false, error: `You have ${available} Influence Points.` };
  }
  state.players.buyer.influence = round(available - influenceSpent, 1);

  const definition = MARKET_DEFINITIONS.find((d) => d.id === marketDefinitionId)!;
  const target = requireTarget(state);

  const outcome = withRng(state, (rng) =>
    runRegulatoryReview({
      acquirer: state.acquirer,
      target,
      market: state.market,
      posture: state.regulatoryPosture ?? 'moderate',
      marketDefinition: definition,
      offeredRemedy,
      dealValue: currentPrice(state),
      reverseTerminationFeePct: state.agreement!.protections.reverseTerminationFeePct,
      hostile: false,
      influenceSpent,
      rng,
    }),
  );

  state.regulatory = outcome;
  state.clock += outcome.roundsAdded;
  if (outcome.costToBuyer > 0) spend(state, outcome.costToBuyer, 'regulatory review costs');

  pushLog(state, {
    phase: 6,
    role: 'regulator',
    text: `${CASE_OFFICER}: ${outcome.intensity.replace(/-/g, ' ')} — ${outcome.cleared ? 'deal may proceed' : 'deal blocked'}`,
    detail: outcome.narrative,
    tone: outcome.cleared ? 'good' : 'bad',
  });

  if (!outcome.cleared) {
    terminate(state, 'The transaction was blocked on antitrust grounds.');
    finaliseScores(state);
    return { ok: true };
  }

  // Draw the interim period now, so the MAC decision has facts to work with.
  const eventCount = state.scenario.id === 'broken-deal' ? 3 : 1;
  const events = withRng(state, (rng) => drawInterimEvents(eventCount, state.market, rng));
  state.interimEvents = events;

  advance(state, 7, 'interim');
  for (const event of events) {
    pushLog(state, {
      phase: 7,
      role: 'system',
      text: `Interim period: ${event.name}`,
      detail: [
        event.description,
        event.ebitdaHitPct > 0 ? `EBITDA impact: -${event.ebitdaHitPct}%.` : 'No earnings impact.',
      ],
      tone: event.ebitdaHitPct > 12 ? 'bad' : event.ebitdaHitPct > 0 ? 'warning' : 'good',
    });
  }

  advance(state, 7, 'mac-decision');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Phase 7 — Closing & Integration
// ---------------------------------------------------------------------------

function doMacDecision(state: GameState, invoke: boolean): ActionResult {
  if (state.step !== 'mac-decision') return { ok: false, error: 'Not at the MAC decision.' };
  if (!state.agreement) return { ok: false, error: 'No agreement.' };

  const events = state.interimEvents ?? [];
  const dispute = withRng(state, (rng) =>
    resolveMacDispute({ invoke, agreement: state.agreement!, events, market: state.market, rng }),
  );

  if (invoke) {
    state.clock += 3;
    pushLog(state, {
      phase: 7,
      role: 'buyer',
      text: 'Material Adverse Effect asserted.',
      detail: dispute.narrative,
      tone: dispute.outcome === 'buyer-walks' ? 'good' : 'warning',
    });
    adjustReputation(
      state,
      'buyer',
      dispute.outcome === 'forced-to-close' ? -3 : -1,
      'invoked the MAC clause',
    );
  }

  if (dispute.outcome === 'buyer-walks') {
    state.closing = {
      closed: false,
      terminationReason: 'Buyer terminated on a Material Adverse Effect.',
      interimEvents: events,
      macDispute: dispute,
      integrationCards: [],
      claims: [],
      workingCapitalAdjustment: 0,
      realisedValue: 0,
      totalCost: state.buyerSunkCost,
      narrative: dispute.narrative,
    };
    terminate(state, 'Buyer terminated on a Material Adverse Effect.');
    finaliseScores(state);
    return { ok: true };
  }

  return closeAndIntegrate(state, dispute.priceCutPct, dispute);
}

function closeAndIntegrate(
  state: GameState,
  priceCutPct: number,
  dispute: ReturnType<typeof resolveMacDispute>,
): ActionResult {
  const target = requireTarget(state);
  const agreement = state.agreement!;
  const narrative: string[] = [...dispute.narrative];

  let price = currentPrice(state);
  if (priceCutPct > 0) {
    price = round(price * (1 - priceCutPct / 100), 1);
    agreement.price = price;
    state.repricedValue = price;
  }

  const budget = diligenceBudget(state);
  const diligenceCoverage = clamp((state.diligence?.spent ?? 0) / budget, 0, 1);

  const integrationCards = withRng(state, (rng) =>
    drawIntegrationCards(3, {
      diligenceCoverage,
      synergyAggression: clamp(price / Math.max(1, targetIntrinsic(state)) - 1, 0, 1),
      rng,
    }),
  );

  for (const card of integrationCards) {
    pushLog(state, {
      phase: 7,
      role: 'system',
      text: `Integration: ${card.name} (${card.valueImpactPct > 0 ? '+' : ''}${card.valueImpactPct}%)`,
      detail: [card.description],
      tone: card.valueImpactPct > 0 ? 'good' : 'bad',
    });
  }

  // Latent findings the buyer never uncovered now come home.
  const latent = state.dataRoom ? latentFindings(state.dataRoom) : [];
  const claims: IndemnityClaim[] = [];
  let recoveredTotal = 0;

  const claimSources: {
    source: string;
    repCategory: RepCategory | undefined;
    grossLoss: number;
    knownAtSigning: boolean;
    requiresScope: ReturnType<typeof requiredScopeFor>;
  }[] = [];

  for (const card of latent) {
    const [lo, hi] = card.priceImpactPct;
    const loss = round(price * (((lo + hi) / 2) / 100), 1);
    claimSources.push({
      source: card.title,
      repCategory: card.repCategory,
      grossLoss: loss,
      knownAtSigning: false,
      requiresScope: requiredScopeFor(card),
    });
    pushLog(state, {
      phase: 7,
      role: 'system',
      text: `Undiscovered liability surfaced: ${card.title}`,
      detail: [card.body, `Loss of £${loss}M. Whether you recover it is now a contract question.`],
      tone: 'bad',
    });
  }

  for (const card of integrationCards) {
    if (card.claimPct && card.repCategory) {
      claimSources.push({
        source: card.name,
        repCategory: card.repCategory,
        grossLoss: round(price * (card.claimPct / 100), 1),
        knownAtSigning: false,
        requiresScope: 'standard',
      });
    }
  }

  withRng(state, (rng) => {
    for (const source of claimSources) {
      const claim = resolveClaim({
        ...source,
        discoveredMonth: rng.int(3, 44),
        agreement,
        dealValue: price,
        alreadyRecovered: recoveredTotal,
      });
      claims.push(claim);
      recoveredTotal = round(recoveredTotal + claim.recovered, 1);
      pushLog(state, {
        phase: 7,
        role: 'system',
        text: claim.barred
          ? `Claim barred: ${claim.source}`
          : `Recovered £${claim.recovered}M of £${claim.grossLoss}M — ${claim.source}`,
        detail: claim.barReason ? [claim.barReason] : undefined,
        tone: claim.barred ? 'bad' : 'good',
      });
    }
  });

  const wcAdjustment = withRng(state, (rng) =>
    workingCapitalAdjustment({
      carefulPeg: (state.diligence?.allocation.financial ?? 0) >= 2,
      dealValue: price,
      rng,
    }),
  );

  // What the asset is actually worth after the integration cards land.
  const integrationImpact = integrationCards.reduce((s, c) => s + c.valueImpactPct, 0);
  const intrinsic = intrinsicEquityValue(target, state.market);
  const divestiture = state.regulatory?.divestitureValue ?? 0;
  const realisedValue = round(
    intrinsic * (1 + integrationImpact / 100) - divestiture + recoveredTotal,
    1,
  );

  const interest = state.financingAnalysis ? state.financingAnalysis.annualInterest * 3 : 0;
  const totalCost = round(price + state.buyerSunkCost + interest - wcAdjustment, 1);

  const advisoryFee = round(price * ADVISORY_FEE_RATE, 1);
  state.bankerFees = advisoryFee;
  state.players.banker.fees = advisoryFee;

  narrative.push(
    `Closed at £${price}M. Realised value of £${realisedValue}M against a total cost of £${totalCost}M.`,
  );

  state.closing = {
    closed: true,
    interimEvents: state.interimEvents ?? [],
    macDispute: dispute,
    integrationCards,
    claims,
    workingCapitalAdjustment: wcAdjustment,
    realisedValue,
    totalCost,
    narrative,
  };

  pushLog(state, {
    phase: 7,
    role: 'system',
    text: `Deal closed at £${price}M.`,
    detail: [
      `Realised value: £${realisedValue}M`,
      `Total cost including fees and carry: £${totalCost}M`,
      `Working capital true-up: ${wcAdjustment >= 0 ? '+' : ''}£${wcAdjustment}M`,
      `Indemnity recovered: £${recoveredTotal}M of £${round(
        claims.reduce((s, c) => s + c.grossLoss, 0),
        1,
      )}M claimed`,
    ],
    tone: realisedValue > totalCost ? 'good' : 'bad',
  });

  state.status = 'complete';
  advance(state, 8, 'scoring');
  finaliseScores(state);
  return { ok: true };
}

/**
 * The long stop date. Once the clock passes it, either party may terminate —
 * and a seller with other options usually does.
 */
function checkLongStop(state: GameState): boolean {
  if (state.status !== 'active') return false;
  if (state.clock <= state.longStopRounds) return false;

  const overrun = state.clock - state.longStopRounds;
  const sellerWalks = withRng(state, (rng) => rng.bool(clamp(0.25 + overrun * 0.12, 0, 0.9)));

  pushLog(state, {
    phase: state.phase,
    role: 'system',
    text: `Long stop date passed (${state.longStopDate}).`,
    detail: [
      `The timetable has run ${overrun} round${overrun === 1 ? '' : 's'} beyond the outside date. Both parties are now free to walk.`,
    ],
    tone: 'bad',
  });

  if (sellerWalks) {
    terminate(
      state,
      `The long stop date passed on ${state.longStopDate} and the seller terminated rather than extend.`,
    );
    finaliseScores(state);
    return true;
  }

  pushLog(state, {
    phase: state.phase,
    role: 'seller',
    text: `${SELLER_CHAIR}: the board will extend the outside date. Once.`,
    tone: 'warning',
  });
  state.longStopRounds += 4;
  return false;
}

function finaliseScores(state: GameState): void {
  state.scores = scoreAll(state);
  const buyerScore = state.scores.find((s) => s.role === 'buyer')!;
  pushLog(state, {
    phase: 8,
    role: 'system',
    text: `Final score: ${buyerScore.total} of ${buyerScore.max}`,
    detail: buyerScore.lines.map((l) => `${l.label}: ${l.points}`),
  });
}
