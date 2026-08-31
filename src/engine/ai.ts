import { Rng, clamp, round } from './rng.js';
import { targetIntrinsic, targetUnaffected, type GameState } from './state.js';
import type {
  CompetingBidder,
  DisclosureStrategy,
  ProcessType,
  RegulatoryPosture,
} from './types.js';

/**
 * AI opponents for the seats no human is holding.
 *
 * Each one plays its role's stated objective from GDD §5 rather than trying to
 * beat the player: the seller maximises value subject to fiduciary duty, the
 * banker wants the deal to close, the regulator protects competition.
 */

/** The seller's board picks a process (GDD §6 Phase 1 Seller Actions). */
export function chooseProcessType(state: GameState, rng: Rng): ProcessType {
  if (state.scenario.processType) return state.scenario.processType;
  const heat = state.market.competitionLevel;
  return rng.weighted<ProcessType>([
    ['auction', 25 + heat * 45],
    ['targeted', 40],
    ['exclusive', 25 - heat * 10],
    ['not-for-sale', 8],
  ]);
}

/** How forthcoming the seller is in the data room (GDD §3.3). */
export function chooseDisclosureStrategy(state: GameState, rng: Rng): DisclosureStrategy {
  const target = state.target;
  if (!target) return 'selective';
  // The more there is to hide, the more tempting burial becomes.
  const skeletons = target.hiddenFindingIds.length;
  return rng.weighted<DisclosureStrategy>([
    ['full', 14 - skeletons * 2],
    ['selective', 42],
    ['drip', 24],
    ['bury', 8 + skeletons * 5],
  ]);
}

/**
 * The seller's price expectations. Target is what the board wants; reserve is
 * where they would genuinely rather stay independent.
 */
export function sellerPriceExpectations(state: GameState): {
  target: number;
  reserve: number;
} {
  const intrinsic = targetIntrinsic(state);
  const unaffected = targetUnaffected(state);
  const heat = state.market.competitionLevel;
  const bidders = state.competingBidders.filter((b) => b.active).length;

  // The board anchors on the unaffected price plus a control premium, and on
  // what the banker says the business is worth.
  const anchor = Math.max(unaffected * (1.25 + heat * 0.2), intrinsic * 1.05);
  const target = anchor * (1 + bidders * 0.05);
  const reserve = Math.max(unaffected * 1.08, intrinsic * 0.86);
  return { target: round(target, 1), reserve: round(reserve, 1) };
}

/** The regulator sets enforcement tone at the top of the game (GDD §6 Phase 1). */
export function chooseRegulatorPosture(state: GameState, rng: Rng): RegulatoryPosture {
  const intensity = state.market.regulatoryIntensity;
  return rng.weighted<RegulatoryPosture>([
    ['permissive', 30 * (1 - intensity)],
    ['moderate', 45],
    ['aggressive', 25 + intensity * 55],
  ]);
}

/** Spin up competing bidders for an auction (GDD §2.3 Phase 2). */
export function createCompetingBidders(state: GameState, rng: Rng): CompetingBidder[] {
  const configured = state.scenario.competingBidders;
  const count =
    configured !== undefined
      ? configured
      : state.processType === 'auction'
        ? rng.int(1, 3)
        : rng.bool(state.market.competitionLevel * 0.6)
          ? 1
          : 0;

  const intrinsic = targetIntrinsic(state);
  const names = [
    'Ridgeway Partners',
    'Compass Strategic',
    'Alder Grove Capital',
    'Fairmont Holdings',
  ];

  const bidders: CompetingBidder[] = [];
  for (let i = 0; i < count; i++) {
    // Rivals value the asset differently — some are disciplined, some are not.
    const ceiling = intrinsic * rng.float(0.92, 1.32);
    bidders.push({
      id: `bidder-${i}`,
      name: names[i % names.length],
      ceiling: round(ceiling, 1),
      active: true,
      bid: round(ceiling * rng.float(0.78, 0.94), 1),
    });
  }
  return bidders;
}

/** A rival's response when the player's bid is on the table. */
export function competingBidderResponse(
  bidder: CompetingBidder,
  playerBid: number,
  rng: Rng,
): { bid: number; withdrew: boolean } {
  if (playerBid >= bidder.ceiling) {
    return { bid: bidder.bid, withdrew: true };
  }
  // Bump to just above the player, with a little noise, up to the ceiling.
  const bump = Math.min(bidder.ceiling, playerBid * rng.float(1.015, 1.06));
  return { bid: round(bump, 1), withdrew: false };
}

/**
 * The banker's fairness opinion. Bankers shade within a defensible range —
 * the incentive is to get the deal done (GDD §5.1 Banker).
 */
export function fairnessOpinion(params: {
  price: number;
  intrinsic: number;
  /** 0..1 — how much the banker wants this deal closed. */
  closingBias: number;
  rng: Rng;
}): { fair: boolean; low: number; high: number; commentary: string } {
  const { price, intrinsic, closingBias, rng } = params;
  const width = intrinsic * rng.float(0.1, 0.18);
  const shade = intrinsic * closingBias * 0.06;
  const low = round(intrinsic - width - shade, 1);
  const high = round(intrinsic + width + shade, 1);
  const fair = price >= low && price <= high * 1.12;
  return {
    fair,
    low,
    high,
    commentary: fair
      ? `The consideration is within the range of fair value from a financial point of view ($${low}M–$${high}M).`
      : price < low
        ? `At $${round(price, 1)}M the consideration falls below our range of $${low}M–$${high}M. We cannot opine that it is fair.`
        : `At $${round(price, 1)}M the consideration is above our range. Fair to the target's holders; your own board may have questions.`,
  };
}

/** How hard the seller pushes back in the Phase 5 negotiation. */
export function sellerAgreementResistance(state: GameState, rng: Rng): number {
  const bidders = state.competingBidders.filter((b) => b.active).length;
  const base = 4.5 + bidders * 1.4;
  const marketPull = state.market.competitionLevel * 2;
  return round(clamp(base + marketPull + rng.float(-1, 1), 1.5, 10), 2);
}

/** The seller's willingness to reprice after diligence findings (GDD §3.4). */
export function sellerRepriceAcceptance(params: {
  requestedCutPct: number;
  justifiedCutPct: number;
  competingBidders: number;
  rng: Rng;
}): { accepted: boolean; counterCutPct: number; commentary: string } {
  const { requestedCutPct, justifiedCutPct, competingBidders, rng } = params;

  // A seller with other options concedes less; a seller caught out concedes more.
  const tolerance = justifiedCutPct * (1.15 - competingBidders * 0.22) + rng.float(-1, 1.5);

  if (requestedCutPct <= tolerance) {
    return {
      accepted: true,
      counterCutPct: requestedCutPct,
      commentary:
        'The findings are what they are. The board accepts the adjustment rather than restart a process.',
    };
  }

  const counter = round(clamp(tolerance * rng.float(0.75, 0.95), 0, requestedCutPct), 2);
  return {
    accepted: false,
    counterCutPct: counter,
    commentary:
      competingBidders > 0
        ? `We have another bidder at the table. We will move ${counter}% and no further.`
        : `Your own diligence supports roughly ${round(tolerance, 1)}%. We will do ${counter}%.`,
  };
}

/**
 * Whether the seller walks rather than accept a repricing.
 *
 * Their reserve moves with the findings: a real problem in the data room
 * destroys value for them too, and they know a re-run process surfaces the
 * same issue for the next buyer. So a justified retrade is survivable and an
 * opportunistic one is not — which is the incentive the diligence phase needs.
 */
export function sellerWalksOnReprice(params: {
  requestedCutPct: number;
  justifiedCutPct: number;
  reservePrice: number;
  proposedPrice: number;
  rng: Rng;
}): boolean {
  const adjustedReserve =
    params.reservePrice * (1 - clamp(params.justifiedCutPct / 100, 0, 0.5) * 0.85);
  if (params.proposedPrice >= adjustedReserve) return false;
  const shortfall = (adjustedReserve - params.proposedPrice) / adjustedReserve;
  return params.rng.next() < clamp(shortfall * 3.5, 0, 0.9);
}
