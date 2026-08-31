import { INTEGRATION_CARDS, INTERIM_EVENTS } from './content/events.js';
import { PRECEDENTS_BY_AREA } from './content/precedents.js';
import { assessMac } from './agreement.js';
import { Rng, clamp, round } from './rng.js';
import { REP_CATEGORY_NAMES } from './types.js';
import type {
  DataRoomCard,
  DefinitiveAgreement,
  IndemnityClaim,
  IntegrationCard,
  InterimEvent,
  MacDisputeResult,
  MarketEnvironment,
  RepCategory,
  RepScope,
} from './types.js';

/** Closing and post-merger integration (GDD §6 Phase 7). */

const SCOPE_RANK: Record<RepScope, number> = { narrow: 0, standard: 1, broad: 2 };

/** Draw the interim-period events between signing and closing (GDD §7.1). */
export function drawInterimEvents(
  count: number,
  market: MarketEnvironment,
  rng: Rng,
): InterimEvent[] {
  const events: InterimEvent[] = [];
  const pool = INTERIM_EVENTS.filter((e) => e.id !== 'ev-quiet');
  for (let i = 0; i < count; i++) {
    if (rng.next() > market.volatility) {
      events.push(INTERIM_EVENTS.find((e) => e.id === 'ev-quiet')!);
    } else {
      const candidate = rng.pick(pool);
      if (!events.some((e) => e.id === candidate.id)) events.push(candidate);
    }
  }
  return events;
}

/**
 * The MAC invocation sub-game (GDD §7.1).
 *
 * The buyer decides whether to try to walk. The contract decides whether they
 * can. A precedent card supplies the judicial temperament.
 */
export function resolveMacDispute(params: {
  invoke: boolean;
  agreement: DefinitiveAgreement;
  events: InterimEvent[];
  market: MarketEnvironment;
  rng: Rng;
}): MacDisputeResult {
  const { invoke, agreement, events, rng } = params;
  if (!invoke) {
    return {
      invoked: false,
      buyerStrength: 0,
      outcome: 'not-invoked',
      priceCutPct: 0,
      narrative: [],
    };
  }

  const worst = events.reduce(
    (acc, e) => (e.ebitdaHitPct > acc.ebitdaHitPct ? e : acc),
    events[0],
  );
  if (!worst || worst.ebitdaHitPct === 0) {
    return {
      invoked: true,
      buyerStrength: 0.02,
      outcome: 'forced-to-close',
      priceCutPct: 0,
      narrative: [
        'You invoked the MAC against an interim period in which nothing happened. The seller sued for specific performance and won in a walk.',
      ],
    };
  }

  // Was the target hit worse than its peers? Sector-wide events hit everyone.
  const industryWide = worst.carveOutIds.includes('industry-wide') ||
    worst.carveOutIds.includes('general-economy');
  const disproportionateRatio = industryWide
    ? rng.float(0.8, 1.4)
    : rng.float(1.6, 3.2);

  const assessment = assessMac({
    agreement,
    event: worst,
    disproportionateRatio,
  });

  const precedent = rng.pick(PRECEDENTS_BY_AREA.mac);
  const strength = clamp(assessment.strength + precedent.modifier, 0.02, 0.97);

  const narrative = [
    `Triggering event: ${worst.name} — a ${worst.ebitdaHitPct}% EBITDA decline.`,
    ...assessment.reasoning,
    `Precedent drawn: ${precedent.name} — ${precedent.description}`,
    `Buyer's position assessed at ${round(strength * 100, 0)}%.`,
  ];

  const roll = rng.next();
  let outcome: MacDisputeResult['outcome'];
  let priceCutPct = 0;

  if (roll < strength * 0.6) {
    outcome = 'buyer-walks';
    narrative.push(
      'The court found a Material Adverse Effect. The buyer is permitted to terminate.',
    );
  } else if (roll < strength * 0.6 + 0.35) {
    outcome = 'renegotiated';
    // A credible threat converts into a price cut roughly proportional to strength.
    priceCutPct = round(clamp(strength * worst.ebitdaHitPct * 0.55, 2, 28), 1);
    narrative.push(
      `Rather than litigate to judgment, the parties renegotiated. Price cut of ${priceCutPct}%.`,
    );
  } else {
    outcome = 'forced-to-close';
    narrative.push(
      agreement.protections.specificPerformance === 'none'
        ? 'The seller could not compel closing, but the buyer paid the reverse termination fee to walk.'
        : 'The seller obtained specific performance. The buyer is ordered to close on the original terms.',
    );
  }

  return {
    invoked: true,
    buyerStrength: strength,
    outcome,
    precedentId: precedent.id,
    priceCutPct,
    narrative,
  };
}

/** Draw post-closing integration cards (GDD §7.3). */
export function drawIntegrationCards(
  count: number,
  params: {
    /** 0..1 — how much diligence coverage the buyer bought. */
    diligenceCoverage: number;
    /** 0..1 — synergy claims made; over-claiming is punished. */
    synergyAggression: number;
    rng: Rng;
  },
): IntegrationCard[] {
  const { rng } = params;
  const positive = INTEGRATION_CARDS.filter((c) => c.valueImpactPct > 0);
  const negative = INTEGRATION_CARDS.filter((c) => c.valueImpactPct < 0);

  // Thorough diligence tilts the draw; aggressive synergy claims tilt it back.
  const positiveWeight = 0.3 + params.diligenceCoverage * 0.3 - params.synergyAggression * 0.25;

  const drawn: IntegrationCard[] = [];
  for (let i = 0; i < count; i++) {
    const pool = rng.bool(clamp(positiveWeight, 0.08, 0.75)) ? positive : negative;
    const candidate = rng.pick(pool);
    if (!drawn.some((c) => c.id === candidate.id)) drawn.push(candidate);
  }
  return drawn;
}

/**
 * Indemnification claim resolution (GDD §7.4).
 *
 * This is the moment Phase 5 pays off or does not. A claim has to clear four
 * gates in order: a representation broad enough to cover it, the survival
 * period, the sandbagging position, and then the basket and the cap.
 */
export function resolveClaim(params: {
  source: string;
  repCategory: RepCategory | undefined;
  grossLoss: number;
  /** True if the buyer knew about this at signing. */
  knownAtSigning: boolean;
  /** Months after closing when the claim surfaced. */
  discoveredMonth: number;
  /** Severity drives how broad a rep has to be to reach it. */
  requiresScope: RepScope;
  agreement: DefinitiveAgreement;
  dealValue: number;
  /** Running total already recovered, for cap purposes. */
  alreadyRecovered: number;
}): IndemnityClaim {
  const { agreement, dealValue } = params;
  const indemnity = agreement.indemnity;

  const bar = (reason: string): IndemnityClaim => ({
    source: params.source,
    repCategory: params.repCategory,
    grossLoss: round(params.grossLoss, 1),
    recovered: 0,
    barred: true,
    barReason: reason,
  });

  if (!params.repCategory) {
    return bar('No representation covers this — it is an integration outcome, not a breach.');
  }

  const special = indemnity.specialIndemnities.includes(params.repCategory);
  const scope = agreement.reps[params.repCategory];

  if (!special && SCOPE_RANK[scope] < SCOPE_RANK[params.requiresScope]) {
    return bar(
      `The ${REP_CATEGORY_NAMES[params.repCategory]} representation was drafted ${scope}; this claim needs a ${params.requiresScope} rep to reach it.`,
    );
  }

  const survival = special
    ? Math.max(indemnity.survivalMonths, 60)
    : indemnity.fundamentalRepsIndefinite && params.requiresScope === 'broad'
      ? Math.max(indemnity.survivalMonths, 72)
      : indemnity.survivalMonths;

  if (params.discoveredMonth > survival) {
    return bar(
      `Discovered in month ${params.discoveredMonth}; the survival period expired at ${survival} months.`,
    );
  }

  if (params.knownAtSigning && !indemnity.proSandbagging) {
    return bar(
      'You knew about this at signing and the agreement contains an anti-sandbagging clause.',
    );
  }

  // Basket.
  const basketAmount = (indemnity.basketPct / 100) * dealValue;
  let claimable: number;
  if (special) {
    // Specific indemnities are typically dollar-one, outside the basket.
    claimable = params.grossLoss;
  } else if (params.grossLoss <= basketAmount) {
    return bar(
      `Loss of $${round(params.grossLoss, 1)}M is below the $${round(basketAmount, 1)}M basket.`,
    );
  } else {
    claimable =
      indemnity.basketType === 'tipping' ? params.grossLoss : params.grossLoss - basketAmount;
  }

  // Cap.
  const capAmount = (indemnity.capPct / 100) * dealValue;
  const capHeadroom = Math.max(0, capAmount - params.alreadyRecovered);
  let recovered = Math.min(claimable, capHeadroom);
  let barReason: string | undefined;
  if (recovered < claimable) {
    barReason = `Capped at ${indemnity.capPct}% of deal value ($${round(capAmount, 1)}M).`;
  }

  // Practical collection: the escrow is the money you can actually reach.
  const escrowAmount = (indemnity.escrowPct / 100) * dealValue;
  if (indemnity.soleRemedy && recovered > escrowAmount - params.alreadyRecovered) {
    const reachable = Math.max(0, escrowAmount - params.alreadyRecovered);
    if (reachable < recovered) {
      recovered = reachable;
      barReason =
        'Indemnity is the sole remedy and the escrow is exhausted — there is nothing further to reach.';
    }
  } else if (!indemnity.soleRemedy && recovered > escrowAmount - params.alreadyRecovered) {
    // Pursuing the sellers directly works, but you lose some to time and cost.
    const beyondEscrow = recovered - Math.max(0, escrowAmount - params.alreadyRecovered);
    recovered -= beyondEscrow * 0.3;
    barReason = barReason ?? 'Amounts beyond the escrow were pursued directly, at a collection cost.';
  }

  // R&W insurance sits above its own retention and outside the seller's cap.
  if (indemnity.rwInsurance && recovered < claimable) {
    const retention = dealValue * 0.01;
    const policyLimit = dealValue * 0.1;
    const uncovered = claimable - recovered;
    const insured = clamp(uncovered - retention, 0, policyLimit);
    if (insured > 0) {
      recovered += insured;
      barReason = `${barReason ?? ''} R&W insurance responded for $${round(insured, 1)}M.`.trim();
    }
  }

  return {
    source: params.source,
    repCategory: params.repCategory,
    grossLoss: round(params.grossLoss, 1),
    recovered: round(Math.max(0, recovered), 1),
    barred: recovered <= 0,
    barReason,
  };
}

/** Scope a latent data room finding needs to be recoverable. */
export function requiredScopeFor(card: DataRoomCard): RepScope {
  switch (card.severity) {
    case 'black':
    case 'red':
      return 'broad';
    case 'yellow':
      return 'standard';
    default:
      return 'narrow';
  }
}

/** Working capital true-up (GDD §7.4). */
export function workingCapitalAdjustment(params: {
  /** True if the buyer set the peg off a trailing average rather than a snapshot. */
  carefulPeg: boolean;
  dealValue: number;
  rng: Rng;
}): number {
  const drift = params.carefulPeg
    ? params.rng.float(-0.002, 0.004)
    : params.rng.float(-0.012, 0.002);
  return round(params.dealValue * drift, 1);
}
