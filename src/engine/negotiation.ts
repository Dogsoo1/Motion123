import { Rng, clamp, round } from './rng.js';
import type {
  ConsiderationType,
  IndicationOfInterest,
  LoiTerms,
  TargetCompany,
} from './types.js';

/**
 * Negotiation system (GDD §10).
 *
 * Everything reduces to one idea: each side has a target and a reserve, and
 * where a term settles between them is decided by leverage plus how much
 * Negotiation Point stamina each side is willing to burn holding position.
 */

/** Sigmoid used to turn a leverage advantage into a share of the gap. */
function share(advantage: number): number {
  return 1 / (1 + Math.exp(-advantage));
}

export interface LeverageInputs {
  /** Competing bidders actively in the process — bad for the buyer. */
  competingBidders: number;
  /** Serious diligence findings the buyer can point at — good for the buyer. */
  seriousFindings: number;
  /** Buyer's walk-away strength, 0..1 (GDD §10.3). */
  buyerBatna: number;
  /** Seller's walk-away strength, 0..1. */
  sellerBatna: number;
  /** Reputation differential, roughly -10..+10. */
  buyerReputation: number;
  sellerReputation: number;
  /** Whether the seller granted exclusivity — removes the auction threat. */
  exclusivity: boolean;
  /** 0..1 — how hot the market is; hot markets favour sellers. */
  marketHeat: number;
}

/**
 * Net leverage on a scale where positive favours the buyer. Roughly -3..+3.
 */
export function leverageScore(inputs: LeverageInputs): number {
  let score = 0;
  score -= inputs.competingBidders * 0.75;
  if (inputs.exclusivity) score += 0.6;
  score += Math.min(inputs.seriousFindings, 5) * 0.42;
  score += (inputs.buyerBatna - inputs.sellerBatna) * 1.4;
  score += (inputs.buyerReputation - inputs.sellerReputation) * 0.04;
  score -= (inputs.marketHeat - 0.5) * 1.2;
  return round(clamp(score, -3.5, 3.5), 3);
}

/**
 * Resolve one term on the normalised 0..1 scale, where 1 is the buyer's
 * preferred end and 0 is the seller's.
 *
 * `buyerPush` and `sellerResistance` are Negotiation Points committed to this
 * term. Spending NP is how you hold a position (GDD §10.2).
 */
export function resolveTerm(params: {
  buyerPush: number;
  sellerResistance: number;
  leverage: number;
  /** How much the seller intrinsically cares — high means they fight harder. */
  sellerPriority?: number;
  rng: Rng;
}): { value: number; buyerWon: boolean } {
  const priority = params.sellerPriority ?? 1;
  const npAdvantage = (params.buyerPush - params.sellerResistance * priority) * 0.55;
  const noise = params.rng.float(-0.35, 0.35);
  const value = share(npAdvantage + params.leverage * 0.8 + noise);
  return { value: round(clamp(value, 0, 1), 3), buyerWon: value > 0.5 };
}

// ---------------------------------------------------------------------------
// LOI negotiation (GDD §2.2 Phase 2)
// ---------------------------------------------------------------------------

/** Relative weight each LOI term carries in a package evaluation. */
export const LOI_WEIGHTS = {
  price: 0.55,
  consideration: 0.08,
  exclusivity: 0.1,
  breakFee: 0.09,
  noShop: 0.09,
  deposit: 0.09,
} as const;

/** Normalise each non-price term to 0..1, where 1 is buyer-friendly. */
export function normaliseLoi(terms: LoiTerms): Record<string, number> {
  const considerationScore: Record<ConsiderationType, number> = {
    stock: 1,
    mixed: 0.5,
    cash: 0,
  };
  const noShopScore = { strict: 1, modified: 0.5, 'go-shop': 0 } as const;
  return {
    consideration: considerationScore[terms.consideration],
    exclusivity: clamp(terms.exclusivityDays / 90, 0, 1),
    breakFee: clamp(terms.breakFeePct / 5, 0, 1),
    noShop: noShopScore[terms.noShop],
    deposit: clamp(1 - terms.depositPct / 10, 0, 1),
  };
}

/**
 * How attractive a package is to the seller, 0..1. Price dominates, as it
 * should — but not so much that the other terms are free.
 */
export function sellerUtility(
  terms: LoiTerms,
  sellerPriceReserve: number,
  sellerPriceTarget: number,
): number {
  const span = Math.max(1, sellerPriceTarget - sellerPriceReserve);
  const priceScore = clamp((terms.price - sellerPriceReserve) / span, -0.5, 1.3);
  const normalised = normaliseLoi(terms);
  let other = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(LOI_WEIGHTS)) {
    if (key === 'price') continue;
    other += (1 - normalised[key]) * weight;
    weightSum += weight;
  }
  const otherScore = weightSum > 0 ? other / weightSum : 0.5;
  return round(priceScore * LOI_WEIGHTS.price + otherScore * (1 - LOI_WEIGHTS.price), 4);
}

export interface LoiRound {
  round: number;
  /** Who made this offer. */
  from: 'buyer' | 'seller';
  terms: LoiTerms;
  /** Seller's read on the package, for the log. */
  utility: number;
  response: 'accept' | 'counter' | 'reject';
  commentary: string;
}

/** Convert an IOI into an opening LOI package. */
export function loiFromIoi(ioi: IndicationOfInterest): LoiTerms {
  return {
    price: (ioi.priceLow + ioi.priceHigh) / 2,
    consideration: ioi.consideration,
    exclusivityDays: ioi.exclusivityDays,
    breakFeePct: ioi.breakFeePct,
    noShop: ioi.noShop,
    depositPct: ioi.depositPct,
  };
}

/**
 * The seller's counter: concede toward the buyer in proportion to how little
 * runway is left and how weak their alternatives are (GDD §10.1).
 */
export function sellerCounter(params: {
  buyerOffer: LoiTerms;
  sellerTargetPrice: number;
  sellerReservePrice: number;
  roundsRemaining: number;
  leverage: number;
  rng: Rng;
}): LoiTerms {
  const { buyerOffer, sellerTargetPrice, sellerReservePrice, roundsRemaining } = params;
  // Concede more as rounds run out, and more when the buyer holds the leverage.
  const urgency = clamp(1 - roundsRemaining / 3, 0, 1);
  const leverageConcession = clamp(params.leverage * 0.12, -0.2, 0.35);
  const concession = clamp(0.22 + urgency * 0.4 + leverageConcession, 0, 0.85);

  const priceAsk = sellerTargetPrice - (sellerTargetPrice - buyerOffer.price) * concession;
  const price = Math.max(sellerReservePrice, priceAsk);

  return {
    price: round(price, 1),
    // The seller wants cash certainty but will take a mixed deal to bridge a gap.
    consideration:
      buyerOffer.consideration === 'stock' && concession > 0.5 ? 'mixed' : 'cash',
    exclusivityDays: Math.round(
      clamp(buyerOffer.exclusivityDays * (0.35 + concession * 0.5), 0, 90),
    ),
    breakFeePct: round(clamp(buyerOffer.breakFeePct * (0.3 + concession * 0.55), 0, 5), 2),
    noShop: concession > 0.6 ? buyerOffer.noShop : 'modified',
    depositPct: round(
      clamp(Math.max(buyerOffer.depositPct, 2 + (1 - concession) * 5), 0, 10),
      1,
    ),
  };
}

/** Whether the seller accepts a package outright. */
export function sellerAccepts(params: {
  terms: LoiTerms;
  sellerTargetPrice: number;
  sellerReservePrice: number;
  roundsRemaining: number;
  rng: Rng;
}): boolean {
  const utility = sellerUtility(
    params.terms,
    params.sellerReservePrice,
    params.sellerTargetPrice,
  );
  // The bar drops as the process drags on — deal fatigue is real.
  const bar = 0.62 - (3 - params.roundsRemaining) * 0.12 + params.rng.float(-0.05, 0.05);
  return utility >= bar;
}

/** The "market standard" fallback when a term cannot be agreed (GDD Appendix B). */
export function marketStandardLoi(target: TargetCompany, anchorPrice: number): LoiTerms {
  return {
    price: round(anchorPrice, 1),
    consideration: 'cash',
    exclusivityDays: 45,
    breakFeePct: 3,
    noShop: 'modified',
    depositPct: 0,
  };
}

/**
 * BATNA strength for each side (GDD §10.3). Stronger alternatives mean more
 * Negotiation Points and more credible walk-away threats.
 */
export function buyerBatna(params: {
  alternativeTargetsAvailable: number;
  capitalHeadroom: number;
  sunkCost: number;
  dealValue: number;
}): number {
  const options = clamp(params.alternativeTargetsAvailable / 4, 0, 1);
  const headroom = clamp(params.capitalHeadroom, 0, 1);
  const sunk = clamp(params.sunkCost / Math.max(1, params.dealValue * 0.02), 0, 1);
  return round(clamp(options * 0.5 + headroom * 0.35 - sunk * 0.25 + 0.2, 0, 1), 3);
}

export function sellerBatna(params: {
  standaloneGrowth: number;
  competingBidders: number;
  processType: string;
  marketHeat: number;
}): number {
  const growth = clamp((params.standaloneGrowth + 5) / 25, 0, 1);
  const bidders = clamp(params.competingBidders / 3, 0, 1);
  const forced = params.processType === 'auction' ? -0.1 : 0.05;
  return round(clamp(growth * 0.35 + bidders * 0.4 + params.marketHeat * 0.25 + forced, 0, 1), 3);
}

/** Negotiation Points awarded at the start of a negotiation (GDD §10.2). */
export function startingNegotiationPoints(batna: number, reputation: number): number {
  return Math.round(10 + batna * 8 + clamp(reputation, -10, 10) * 0.3);
}
