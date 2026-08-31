import { DIFFICULTY_PROFILES, RIVALS, type RivalId } from './content/advisers.js';
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

/**
 * How forthcoming the seller is in the data room (GDD §3.3).
 *
 * The difficulty tier sets the floor; within Red Flag the seller still has a
 * choice about how far to push it.
 */
export function chooseDisclosureStrategy(state: GameState, rng: Rng): DisclosureStrategy {
  const tier = DIFFICULTY_PROFILES[state.difficulty];
  if (tier.disclosure !== 'selective') return tier.disclosure;
  const skeletons = state.target?.hiddenFindingIds.length ?? 0;
  return rng.weighted<DisclosureStrategy>([
    ['selective', 52],
    ['drip', 30 + skeletons * 2],
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

/**
 * Spin up rival bidders (GDD §2.3 Phase 2, NAMING.md advisers).
 *
 * Two archetypes, and they behave differently in the endgame: Masego is
 * disciplined and walks rather than exceed its own view of value; Tanerélle
 * exceeds it whenever the asset fits what the family is assembling.
 */
export function createCompetingBidders(state: GameState, rng: Rng): CompetingBidder[] {
  const configured = state.scenario.competingBidders;
  const count =
    configured !== undefined
      ? configured
      : state.processType === 'auction'
        ? rng.int(1, 2)
        : rng.bool(state.market.competitionLevel * 0.6)
          ? 1
          : 0;

  const intrinsic = targetIntrinsic(state);
  const sector = state.target?.sector ?? '';

  // Masego enters first; Tanerélle appears in the deals it actually wants.
  const order: RivalId[] = rng.bool(0.5) ? ['masego', 'tanerelle'] : ['tanerelle', 'masego'];

  const bidders: CompetingBidder[] = [];
  for (let i = 0; i < Math.min(count, order.length); i++) {
    const profile = RIVALS[order[i]];
    const fits = profile.overpaysOnFit && (profile.fitSectors ?? []).includes(sector);
    const [lo, hi] = profile.ceilingMultiple;
    const ceiling = intrinsic * rng.float(lo, hi) * (fits ? 1.15 : 1);
    const [oLo, oHi] = profile.openingFraction;
    bidders.push({
      id: profile.id,
      name: profile.name,
      ceiling: round(ceiling, 1),
      active: true,
      bid: round(ceiling * rng.float(oLo, oHi), 1),
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
  const profile = RIVALS[bidder.id as RivalId];

  if (playerBid >= bidder.ceiling) {
    // Masego walks. Tanerélle sometimes finds another turn of the screw.
    if (profile?.overpaysOnFit && rng.bool(0.45)) {
      const stretched = playerBid * rng.float(1.03, 1.11);
      return { bid: round(stretched, 1), withdrew: false };
    }
    return { bid: bidder.bid, withdrew: true };
  }

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
      ? `The consideration is within the range of fair value from a financial point of view (£${low}M–£${high}M).`
      : price < low
        ? `At £${round(price, 1)}M the consideration falls below our range of £${low}M–£${high}M. We cannot opine that it is fair.`
        : `At £${round(price, 1)}M the consideration is above our range. Fair to the target's holders; your own board may have questions.`,
  };
}

/** How hard the seller pushes back in the Phase 5 negotiation. */
export function sellerAgreementResistance(state: GameState, rng: Rng): number {
  const bidders = state.competingBidders.filter((b) => b.active).length;
  const base = 4.5 + bidders * 1.4;
  const marketPull = state.market.competitionLevel * 2;
  const tier = DIFFICULTY_PROFILES[state.difficulty].sellerResistance;
  return round(clamp((base + marketPull + rng.float(-1, 1)) * tier, 1.5, 11), 2);
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
