import { PRECEDENTS_BY_AREA } from './content/precedents.js';
import { Rng, clamp, round } from './rng.js';
import type {
  AcquirerProfile,
  MarketEnvironment,
  RegulatoryOutcome,
  RegulatoryPosture,
  RemedyType,
  ReviewIntensity,
  TargetCompany,
} from './types.js';

/** Regulatory review (GDD §6 Phase 6). */

export interface MarketDefinition {
  id: 'narrow' | 'standard' | 'broad';
  name: string;
  description: string;
  /** Multiplier applied to both parties' shares. Narrow markets inflate shares. */
  shareMultiplier: number;
}

export const MARKET_DEFINITIONS: MarketDefinition[] = [
  {
    id: 'narrow',
    name: 'Narrow product market',
    description:
      'Define the market tightly around the overlapping product. Shares go up, and so does the presumption against the deal.',
    shareMultiplier: 1.45,
  },
  {
    id: 'standard',
    name: 'Standard market definition',
    description: 'The market as the agency’s own prior decisions have drawn it.',
    shareMultiplier: 1.0,
  },
  {
    id: 'broad',
    name: 'Broad market including adjacent substitutes',
    description:
      'Include adjacent products customers plausibly switch to. Shares fall, and clearance gets easier to argue.',
    shareMultiplier: 0.68,
  },
];

/**
 * Simplified HHI (GDD §6.2). We model the two merging parties explicitly and
 * treat the remainder of the market as a competitive fringe, which is the
 * standard simplification for a screening calculation.
 */
export function computeHhi(params: {
  acquirerSharePct: number;
  targetSharePct: number;
  shareMultiplier: number;
}): { pre: number; post: number; delta: number } {
  const a = clamp(params.acquirerSharePct * params.shareMultiplier, 0, 100);
  const t = clamp(params.targetSharePct * params.shareMultiplier, 0, 100);
  const remainder = Math.max(0, 100 - a - t);
  // Assume the fringe is five roughly equal players.
  const fringeShare = remainder / 5;
  const fringeHhi = 5 * fringeShare ** 2;

  const pre = a ** 2 + t ** 2 + fringeHhi;
  const post = (a + t) ** 2 + fringeHhi;
  return {
    pre: round(pre, 0),
    post: round(post, 0),
    delta: round(post - pre, 0),
  };
}

/** The 2500/200 screen from the merger guidelines (GDD §6.2). */
export function isPresumptivelyAnticompetitive(post: number, delta: number): boolean {
  return post > 2500 && delta > 200;
}

/** Probability weights for the Review Intensity draw (GDD §6.1). */
export function reviewIntensityWeights(params: {
  posture: RegulatoryPosture;
  presumptive: boolean;
  hhiDelta: number;
  market: MarketEnvironment;
  sectorSensitive: boolean;
  hostile: boolean;
}): [ReviewIntensity, number][] {
  const postureShift =
    params.posture === 'aggressive' ? 1.7 : params.posture === 'permissive' ? 0.55 : 1;
  const heat = 0.6 + params.market.regulatoryIntensity;
  const severity =
    (params.presumptive ? 1.9 : 1) *
    (1 + clamp(params.hhiDelta / 900, 0, 1.6)) *
    (params.sectorSensitive ? 1.25 : 1) *
    (params.hostile ? 1.2 : 1);

  const escalation = postureShift * heat * severity;

  return [
    ['quick-clear', 30 / Math.max(0.3, escalation)],
    ['information-request', 40],
    ['second-request', 25 * escalation],
    ['challenge', 5 * escalation * (params.presumptive ? 1.6 : 0.7)],
  ];
}

const INTENSITY_LABELS: Record<ReviewIntensity, string> = {
  'quick-clear': 'Quick Clear',
  'information-request': 'Information Request',
  'second-request': 'Second Request',
  challenge: 'Agency Challenge',
};

export function intensityLabel(intensity: ReviewIntensity): string {
  return INTENSITY_LABELS[intensity];
}

export interface RegulatoryInput {
  acquirer: AcquirerProfile;
  target: TargetCompany;
  market: MarketEnvironment;
  posture: RegulatoryPosture;
  marketDefinition: MarketDefinition;
  /** Remedy the parties are prepared to offer up front. */
  offeredRemedy: RemedyType;
  /** Deal value, used to size costs and divestitures. */
  dealValue: number;
  /** Reverse termination fee, as a percentage of deal value. */
  reverseTerminationFeePct: number;
  hostile: boolean;
  /** Influence points the buyer spends lobbying (GDD §4.4). */
  influenceSpent: number;
  rng: Rng;
}

export function runRegulatoryReview(input: RegulatoryInput): RegulatoryOutcome {
  const { rng, target, acquirer, dealValue } = input;
  const narrative: string[] = [];

  const sameSector = acquirer.overlapSectors.includes(target.sector);
  const acquirerShare = sameSector ? acquirer.marketSharePct : acquirer.marketSharePct * 0.15;

  const hhi = computeHhi({
    acquirerSharePct: acquirerShare,
    targetSharePct: target.marketSharePct,
    shareMultiplier: input.marketDefinition.shareMultiplier,
  });
  const presumptive = isPresumptivelyAnticompetitive(hhi.post, hhi.delta);

  narrative.push(
    `${input.marketDefinition.name}: combined share ${round(
      (acquirerShare + target.marketSharePct) * input.marketDefinition.shareMultiplier,
      1,
    )}%. Post-merger HHI ${hhi.post} (delta ${hhi.delta}).`,
  );
  narrative.push(
    presumptive
      ? 'That is above 2500 with a delta above 200 — the deal is presumptively anticompetitive and the burden shifts to the parties.'
      : 'That falls below the structural presumption, which is the single most useful fact in the filing.',
  );

  const sectorSensitive =
    target.sector === 'Defense / Aerospace' ||
    target.sector === 'Healthcare / Pharma' ||
    target.sector === 'Financial Services';

  let weights = reviewIntensityWeights({
    posture: input.posture,
    presumptive,
    hhiDelta: hhi.delta,
    market: input.market,
    sectorSensitive,
    hostile: input.hostile,
  });

  // Lobbying shifts weight toward clearance, with diminishing returns.
  if (input.influenceSpent > 0) {
    const pull = clamp(input.influenceSpent * 0.18, 0, 0.6);
    weights = weights.map(([intensity, weight]) => {
      if (intensity === 'quick-clear') return [intensity, weight * (1 + pull * 2)];
      if (intensity === 'challenge') return [intensity, weight * (1 - pull)];
      return [intensity, weight];
    });
    narrative.push(
      `${input.influenceSpent} Influence spent on agency engagement and third-party advocacy.`,
    );
  }

  // Offering a structural remedy up front materially de-risks the review.
  if (input.offeredRemedy === 'structural' || input.offeredRemedy === 'fix-it-first') {
    weights = weights.map(([intensity, weight]) =>
      intensity === 'challenge' ? [intensity, weight * 0.35] : [intensity, weight],
    );
  }

  const intensity = rng.weighted(weights);
  narrative.push(`Review outcome: ${INTENSITY_LABELS[intensity]}.`);

  let roundsAdded = 0;
  let costToBuyer = 0;
  let costToSeller = 0;
  let remedy: RemedyType = input.offeredRemedy;
  let divestitureValue = 0;
  let litigated = false;
  let litigationWon: boolean | undefined;
  let cleared = true;

  switch (intensity) {
    case 'quick-clear':
      narrative.push('The waiting period expired without action. Nothing to do but close.');
      break;

    case 'information-request':
      roundsAdded = 2;
      costToBuyer = round(dealValue * 0.004, 1);
      costToSeller = round(dealValue * 0.003, 1);
      narrative.push(
        'Staff asked voluntary questions. Answering them cost time and outside counsel fees, but the deal moved on.',
      );
      break;

    case 'second-request': {
      roundsAdded = 4;
      costToBuyer = round(dealValue * 0.016, 1);
      costToSeller = round(dealValue * 0.012, 1);
      narrative.push(
        'A Second Request landed. Document collection, custodian interviews, and an economist on both sides.',
      );
      // After the burn, the agency decides what it wants.
      const wantsStructural = presumptive || rng.bool(0.45);
      if (wantsStructural && remedy !== 'structural' && remedy !== 'fix-it-first') {
        remedy = 'structural';
        narrative.push(
          'Staff will not clear without a structural remedy. A divestiture package is required.',
        );
      } else if (!wantsStructural && remedy === 'none') {
        remedy = 'behavioral';
        narrative.push(
          'Staff accepted behavioural commitments — firewalls and non-discrimination undertakings.',
        );
      }
      break;
    }

    case 'challenge': {
      roundsAdded = 6;
      costToBuyer = round(dealValue * 0.028, 1);
      costToSeller = round(dealValue * 0.021, 1);
      narrative.push('The agency sued to block. Both sides now find out what a trial costs.');

      // The parties can settle with a remedy, or litigate.
      const precedent = rng.pick(PRECEDENTS_BY_AREA.antitrust);
      narrative.push(`Precedent drawn: ${precedent.name} — ${precedent.description}`);

      let agencyStrength = 0.4 + (presumptive ? 0.2 : -0.1) + precedent.modifier;
      agencyStrength += input.posture === 'aggressive' ? 0.08 : -0.05;
      agencyStrength -= clamp(input.influenceSpent * 0.02, 0, 0.1);
      agencyStrength = clamp(agencyStrength, 0.05, 0.95);

      if (remedy === 'structural' || remedy === 'fix-it-first') {
        // A credible remedy on the table usually settles the case.
        if (rng.bool(0.7)) {
          narrative.push(
            'The case settled on a consent decree before trial. The divestiture package did its job.',
          );
          break;
        }
      }

      litigated = true;
      const roll = rng.next();
      litigationWon = roll > agencyStrength;
      if (litigationWon) {
        narrative.push(
          `The court declined to enjoin the merger (agency case strength ${round(agencyStrength * 100, 0)}%). The deal may close.`,
        );
      } else {
        cleared = false;
        narrative.push(
          `The court enjoined the transaction (agency case strength ${round(agencyStrength * 100, 0)}%). The deal is blocked.`,
        );
      }
      break;
    }
  }

  if (cleared && (remedy === 'structural' || remedy === 'fix-it-first')) {
    // Divestitures sell at a discount to what the business is worth inside the deal.
    const overlapFraction = clamp(
      (Math.min(acquirerShare, target.marketSharePct) / Math.max(1, target.marketSharePct)) * 0.4,
      0.05,
      0.35,
    );
    divestitureValue = round(dealValue * overlapFraction * 0.55, 1);
    narrative.push(
      `Divestiture package sized at £${divestitureValue}M of deal value, sold to an agency-approved buyer at a discount.`,
    );
    if (remedy === 'fix-it-first') {
      narrative.push('Fix-it-first: the divestiture closed before the main transaction, removing the review risk entirely.');
    }
  }

  if (!cleared && input.reverseTerminationFeePct > 0) {
    const fee = round((dealValue * input.reverseTerminationFeePct) / 100, 1);
    costToBuyer += fee;
    narrative.push(
      `Reverse termination fee of £${fee}M is payable to the seller for failure to obtain clearance.`,
    );
  }

  return {
    posture: input.posture,
    preMergerHhi: hhi.pre,
    postMergerHhi: hhi.post,
    hhiDelta: hhi.delta,
    presumptivelyAnticompetitive: presumptive,
    intensity,
    roundsAdded,
    costToBuyer: round(costToBuyer, 1),
    costToSeller: round(costToSeller, 1),
    remedy,
    divestitureValue,
    litigated,
    litigationWon,
    cleared,
    narrative,
  };
}
