import { MAC_CARVE_OUTS, MAC_CARVE_OUT_BY_ID } from './content/structures.js';
import { leverageScore, resolveTerm } from './negotiation.js';
import { Rng, clamp, round } from './rng.js';
import {
  REP_CATEGORIES,
  type ClosingConditions,
  type DealProtections,
  type DefinitiveAgreement,
  type IndemnityTerms,
  type InterimEvent,
  type MacCarveOutId,
  type RepCategory,
  type RepScope,
} from './types.js';

/**
 * Definitive agreement negotiation (GDD §6 Phase 5).
 *
 * The buyer allocates Negotiation Points across four fronts. Each front
 * resolves on the 0..1 scale — 1 being fully buyer-friendly — and the settled
 * value is then rendered back into real contract terms. Those terms are the
 * literal rulebook for Phases 6 and 7 (GDD §9.3).
 */

export interface AgreementPushes {
  /** NP committed to widening the representations. */
  reps: number;
  /** NP committed to keeping the MAC broad (fewer carve-outs). */
  mac: number;
  /** NP committed to indemnification protection. */
  indemnity: number;
  /** NP committed to closing conditions and deal protections. */
  conditions: number;
}

export const AGREEMENT_FRONTS = ['reps', 'mac', 'indemnity', 'conditions'] as const;
export type AgreementFront = (typeof AGREEMENT_FRONTS)[number];

export const AGREEMENT_FRONT_LABELS: Record<AgreementFront, string> = {
  reps: 'Representations & Warranties',
  mac: 'MAC Definition',
  indemnity: 'Indemnification',
  conditions: 'Conditions & Deal Protection',
};

export const AGREEMENT_FRONT_BLURBS: Record<AgreementFront, string> = {
  reps: 'How much the seller has to promise is true. Broad reps are what an indemnity claim hangs on later.',
  mac: 'Every carve-out the seller wins narrows your right to walk. The disproportionate impact exception is worth fighting for.',
  indemnity: 'Cap, basket, survival and escrow. This is where diligence findings turn into recoverable dollars.',
  conditions: 'Financing conditions, consents, termination fees, specific performance. Certainty of close cuts both ways.',
};

export interface AgreementNegotiationInput {
  pushes: AgreementPushes;
  /** How hard the seller pushes back on each front. */
  sellerResistance: Record<AgreementFront, number>;
  leverage: number;
  /** Findings the buyer surfaced, which justify bespoke protection. */
  specialIndemnityRequests: RepCategory[];
  /** Whether the buyer bought R&W insurance. */
  rwInsurance: boolean;
  price: number;
  rng: Rng;
}

export interface AgreementResult {
  agreement: DefinitiveAgreement;
  /** Settled position on each front, 0..1. */
  settled: Record<AgreementFront, number>;
  npSpent: number;
  narrative: string[];
}

function scopeFromValue(value: number): RepScope {
  if (value >= 0.66) return 'broad';
  if (value >= 0.34) return 'standard';
  return 'narrow';
}

/** Turn a settled MAC position into a concrete list of carve-outs. */
export function carveOutsFromValue(value: number): MacCarveOutId[] {
  // At value 0 the seller gets every carve-out; at 1 the buyer strips them back
  // to the handful no buyer realistically refuses.
  const ordered = MAC_CARVE_OUTS.filter((c) => !c.invertsForBuyer).slice().sort(
    (a, b) => a.weight - b.weight,
  );
  const keepCount = Math.round(ordered.length * (1 - value * 0.72));
  const kept = ordered.slice(0, Math.max(2, keepCount)).map((c) => c.id);
  // The disproportionate impact exception is a buyer win, so it appears as the
  // buyer's position strengthens.
  if (value >= 0.55) kept.push('disproportionate-exception');
  return kept;
}

export function negotiateAgreement(input: AgreementNegotiationInput): AgreementResult {
  const narrative: string[] = [];
  const settled = {} as Record<AgreementFront, number>;

  const priorities: Record<AgreementFront, number> = {
    reps: 1.0,
    mac: 1.15,
    indemnity: 1.1,
    conditions: 0.95,
  };

  for (const front of AGREEMENT_FRONTS) {
    const outcome = resolveTerm({
      buyerPush: input.pushes[front],
      sellerResistance: input.sellerResistance[front],
      leverage: input.leverage,
      sellerPriority: priorities[front],
      rng: input.rng,
    });
    settled[front] = outcome.value;
  }

  // --- Representations ----------------------------------------------------
  const reps = {} as Record<RepCategory, RepScope>;
  for (const category of REP_CATEGORIES) {
    // Categories where the buyer found something get pulled toward broad.
    const boost = input.specialIndemnityRequests.includes(category) ? 0.18 : 0;
    reps[category] = scopeFromValue(clamp(settled.reps + boost, 0, 1));
  }
  const broadCount = Object.values(reps).filter((s) => s === 'broad').length;
  narrative.push(
    `Representations settled with ${broadCount} of ${REP_CATEGORIES.length} categories drafted broadly.`,
  );

  // --- MAC ----------------------------------------------------------------
  const macCarveOuts = carveOutsFromValue(settled.mac);
  const macThresholdPct = round(12 + (1 - settled.mac) * 23, 1);
  narrative.push(
    `MAC definition carries ${macCarveOuts.length} carve-outs with a quantitative threshold at a ${macThresholdPct}% EBITDA decline.` +
      (macCarveOuts.includes('disproportionate-exception')
        ? ' The disproportionate impact exception survived — that is a real buyer win.'
        : ' The seller kept the disproportionate impact exception out.'),
  );

  // --- Indemnity ----------------------------------------------------------
  const v = settled.indemnity;
  const indemnity: IndemnityTerms = {
    capPct: round(10 + v * 65, 1),
    basketPct: round(1.0 - v * 0.85, 2),
    basketType: v > 0.55 ? 'tipping' : 'deductible',
    survivalMonths: Math.round(12 + v * 42),
    fundamentalRepsIndefinite: v > 0.4,
    escrowPct: round(3 + v * 14, 1),
    proSandbagging: v > 0.62,
    soleRemedy: v < 0.45,
    specialIndemnities: input.specialIndemnityRequests.slice(),
    rwInsurance: input.rwInsurance,
  };
  narrative.push(
    `Indemnity: ${indemnity.capPct}% cap, ${indemnity.basketPct}% ${indemnity.basketType} basket, ${indemnity.survivalMonths}-month survival, ${indemnity.escrowPct}% escrow.` +
      (indemnity.proSandbagging
        ? ' Pro-sandbagging clause included.'
        : ' Anti-sandbagging: what you knew at signing, you cannot claim on.'),
  );
  if (indemnity.specialIndemnities.length > 0) {
    narrative.push(
      `Specific indemnities carved out for: ${indemnity.specialIndemnities.join(', ')}.`,
    );
  }

  // --- Conditions and protections ----------------------------------------
  const c = settled.conditions;
  const conditions: ClosingConditions = {
    regulatoryApproval: true,
    financingCondition: c > 0.68,
    minimumTenderPct: round(50.1 + (1 - c) * 39.9, 1),
    thirdPartyConsentsRequired: Math.round(1 + (1 - c) * 6),
    bringDownStandard: c > 0.7 ? 'all-respects' : c > 0.35 ? 'material-respects' : 'mae',
    noMac: true,
  };
  const protections: DealProtections = {
    matchingRights: Math.round(c * 3),
    terminationFeePct: round(1.5 + c * 2.5, 2),
    reverseTerminationFeePct: round(6 - c * 3.2, 2),
    forceTheVote: c > 0.6,
    fiduciaryOut: true,
    specificPerformance: c > 0.62 ? 'mutual' : c > 0.3 ? 'one-way-seller' : 'none',
  };
  narrative.push(
    `Conditions: ${conditions.financingCondition ? 'financing condition secured' : 'no financing condition — you close whether the banks fund or not'}; ` +
      `bring-down at "${conditions.bringDownStandard}"; ${conditions.thirdPartyConsentsRequired} consents required.`,
  );
  narrative.push(
    `Protections: ${protections.terminationFeePct}% termination fee, ${protections.reverseTerminationFeePct}% reverse fee, ` +
      `specific performance ${protections.specificPerformance}.`,
  );

  const npSpent =
    input.pushes.reps + input.pushes.mac + input.pushes.indemnity + input.pushes.conditions;

  return {
    agreement: {
      reps,
      macCarveOuts,
      macThresholdPct,
      indemnity,
      conditions,
      protections,
      price: input.price,
    },
    settled,
    npSpent,
    narrative,
  };
}

/**
 * How strong the buyer's MAC case is against a specific interim event
 * (GDD §7.1 MAC Invocation Sub-Game).
 *
 * Three tests, in the order a court would reach them: does the decline clear
 * the quantitative threshold, does a carve-out catch it, and if so does the
 * disproportionate impact exception pull it back in.
 */
export interface MacAssessment {
  strength: number;
  clearsThreshold: boolean;
  caughtByCarveOut: boolean;
  disproportionateApplies: boolean;
  reasoning: string[];
}

export function assessMac(params: {
  agreement: DefinitiveAgreement;
  event: InterimEvent;
  /** How much worse the target was hit than its peers, as a ratio. 1 = in line. */
  disproportionateRatio: number;
}): MacAssessment {
  const { agreement, event, disproportionateRatio } = params;
  const reasoning: string[] = [];

  const clearsThreshold = event.ebitdaHitPct >= agreement.macThresholdPct;
  reasoning.push(
    clearsThreshold
      ? `The ${event.ebitdaHitPct}% EBITDA decline clears the negotiated ${agreement.macThresholdPct}% threshold.`
      : `The ${event.ebitdaHitPct}% decline falls short of the ${agreement.macThresholdPct}% threshold you negotiated.`,
  );

  const matching = event.carveOutIds.filter((id) => agreement.macCarveOuts.includes(id));
  const caughtByCarveOut = matching.length > 0;
  if (caughtByCarveOut) {
    reasoning.push(
      `The seller carved this out: ${matching
        .map((id) => MAC_CARVE_OUT_BY_ID[id].name.toLowerCase())
        .join(', ')}.`,
    );
  } else if (event.carveOutIds.length > 0) {
    reasoning.push(
      'The event would have been carved out, but you kept those carve-outs out of the definition.',
    );
  }

  const hasDisproportionate = agreement.macCarveOuts.includes('disproportionate-exception');
  const disproportionateApplies =
    caughtByCarveOut && hasDisproportionate && disproportionateRatio >= 1.5;
  if (disproportionateApplies) {
    reasoning.push(
      `The company was hit ${round(disproportionateRatio, 1)}x harder than its peers, so the disproportionate impact exception pulls the event back into the MAC.`,
    );
  } else if (caughtByCarveOut && hasDisproportionate) {
    reasoning.push(
      'The disproportionate impact exception is in the contract but the company tracked its peers, so it does not bite.',
    );
  }

  let strength = 0.15;
  if (clearsThreshold) strength += 0.42;
  strength += clamp((event.ebitdaHitPct - agreement.macThresholdPct) / 60, -0.2, 0.22);
  if (caughtByCarveOut && !disproportionateApplies) strength -= 0.4;
  if (disproportionateApplies) strength += 0.18;
  // Durational significance: a court wants years, not a quarter.
  if (event.ebitdaHitPct < 15) strength -= 0.1;

  return {
    strength: round(clamp(strength, 0.02, 0.95), 3),
    clearsThreshold,
    caughtByCarveOut,
    disproportionateApplies,
    reasoning,
  };
}

/** Seller's default resistance, scaled by how much leverage they hold. */
export function defaultSellerResistance(
  leverage: number,
  rng: Rng,
): Record<AgreementFront, number> {
  const base = clamp(5 - leverage * 1.4, 1.5, 9);
  return {
    reps: round(base * rng.float(0.85, 1.15), 1),
    mac: round(base * rng.float(0.95, 1.3), 1),
    indemnity: round(base * rng.float(0.9, 1.25), 1),
    conditions: round(base * rng.float(0.8, 1.1), 1),
  };
}

export { leverageScore };
