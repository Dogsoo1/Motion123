import { SECTOR_COMPS } from './content/comps.js';
import { DATA_ROOM_BY_ID } from './content/dataroom.js';
import { Rng, clamp, round } from './rng.js';
import type {
  MarketEnvironment,
  TargetCompany,
  ValuationMethod,
  ValuationRange,
  ValuationSummary,
} from './types.js';

/**
 * Financial engine (GDD §8).
 *
 * Two numbers matter and they are deliberately different: what the player can
 * *observe* (a range, built from whichever method they paid for) and what the
 * company is actually worth (intrinsic value, which prices in the hidden
 * findings). The gap between them is the game.
 */

export interface ComparableCompany {
  id: string;
  name: string;
  evEbitda: number;
  evRevenue: number;
  peRatio: number;
  /** How genuinely comparable this company is — hidden from the player. */
  relevance: number;
  /** The hint the player actually sees when choosing. */
  descriptor: string;
}

export interface PrecedentTransaction {
  id: string;
  name: string;
  evEbitda: number;
  premiumPct: number;
  relevance: number;
  descriptor: string;
}

export interface DcfAssumptions {
  growthPct: number;
  marginPct: number;
  waccPct: number;
  terminalGrowthPct: number;
}

/** Latest year's figures, which every method starts from. */
export function latest(target: TargetCompany) {
  return {
    revenue: target.revenue[2],
    ebitda: target.ebitda[2],
    netIncome: target.netIncome[2],
    netDebt: target.totalDebt - target.cash,
  };
}

export function unaffectedEquityValue(target: TargetCompany): number {
  if (target.sharePrice && target.sharesOutstanding) {
    return round(target.sharePrice * target.sharesOutstanding, 1);
  }
  // Private target: mark it at a modest discount to the sector median.
  const comps = SECTOR_COMPS[target.sector];
  const { ebitda, netDebt } = latest(target);
  return round(ebitda * comps.evEbitda * 0.85 - netDebt, 1);
}

/** How much of a finding's headline price impact is genuine value destruction. */
export const HIDDEN_DRAG_FACTOR = 0.5;
/** Ceiling on total undisclosed value destruction, as a fraction of EV. */
export const MAX_HIDDEN_DRAG = 0.4;

/**
 * The engine's private view of what the business is worth, before any premium.
 * Hidden findings reduce it, which is why skipping diligence is expensive.
 */
export function intrinsicEquityValue(
  target: TargetCompany,
  market: MarketEnvironment,
): number {
  const comps = SECTOR_COMPS[target.sector];
  const { ebitda, netDebt } = latest(target);

  // Quality adjustment: growth and margin relative to what the sector expects.
  const growthAdj = clamp(1 + (target.projectedGrowthPct - 5) * 0.018, 0.7, 1.45);
  const marginAdj = clamp(1 + (target.projectedMarginPct - 18) * 0.006, 0.82, 1.2);
  const fairMultiple = comps.evEbitda * market.valuationMultiplier * growthAdj * marginAdj;

  const grossEv = ebitda * fairMultiple;

  // Hidden findings destroy real value, but a card's price impact is the
  // reduction a buyer can negotiate on the headline price, not the fraction of
  // enterprise value that evaporates. HIDDEN_DRAG_FACTOR converts between the
  // two, and the cap stops a stack of red cards from writing off the company.
  const hiddenDrag = target.hiddenFindingIds.reduce((sum, id) => {
    const card = DATA_ROOM_BY_ID[id];
    if (!card) return sum;
    const [lo, hi] = card.priceImpactPct;
    return sum + ((lo + hi) / 2 / 100) * HIDDEN_DRAG_FACTOR;
  }, 0);

  const ev = grossEv * (1 - clamp(hiddenDrag, 0, MAX_HIDDEN_DRAG));
  return round(ev - netDebt, 1);
}

/** Build the observable comparable set for a target (GDD §8.1). */
export function buildComparables(target: TargetCompany, rng: Rng): ComparableCompany[] {
  const base = SECTOR_COMPS[target.sector];
  const descriptors = [
    'Closest peer by size and end market',
    'Same sector, materially larger and more diversified',
    'Same sector, faster growing, higher margin',
    'Adjacent sub-sector with different economics',
    'Similar size but a distinctly different business model',
    'Regional peer with a narrower footprint',
    'Recently re-rated on an unrelated catalyst',
  ];
  const relevances = [0.95, 0.6, 0.55, 0.35, 0.4, 0.7, 0.25];

  return descriptors.map((descriptor, i) => {
    // Relevant comps cluster near the median; poor comps scatter.
    const relevance = relevances[i];
    const drift = rng.float(-1, 1) * base.spread * (1.6 - relevance);
    return {
      id: `comp-${target.id}-${i}`,
      name: `${['Ardent', 'Brightline', 'Corvus', 'Delphi', 'Evanmore', 'Fairhaven', 'Glenrock'][i]} ${
        target.sector === 'Technology' ? 'Systems' : 'Group'
      }`,
      evEbitda: round(base.evEbitda * (1 + drift), 2),
      evRevenue: round(base.evRevenue * (1 + drift * 0.9), 2),
      peRatio: round(base.peRatio * (1 + drift * 0.8), 1),
      relevance,
      descriptor,
    };
  });
}

/**
 * How much of the control premium is already embedded in a transaction
 * multiple. Transaction comps read above trading comps for exactly this
 * reason — but only partly, because the rest of the premium shows up in the
 * equity price paid rather than the multiple.
 */
export const CONTROL_PREMIUM_IN_MULTIPLE = 0.3;

export function buildPrecedentTransactions(
  target: TargetCompany,
  rng: Rng,
): PrecedentTransaction[] {
  const base = SECTOR_COMPS[target.sector];
  const descriptors = [
    'Same sub-sector, closed 8 months ago, competitive process',
    'Same sector, larger target, single-bidder negotiation',
    'Adjacent sector, strategic buyer paying for synergies',
    'Same sub-sector but a distressed seller',
    'Sponsor-to-sponsor trade at the top of the last cycle',
  ];
  const relevances = [0.95, 0.65, 0.4, 0.3, 0.45];

  return descriptors.map((descriptor, i) => {
    const relevance = relevances[i];
    const drift = rng.float(-1, 1) * base.spread * (1.4 - relevance);
    return {
      id: `prec-${target.id}-${i}`,
      name: `Project ${['Aurora', 'Bedrock', 'Cinder', 'Dovetail', 'Ember'][i]}`,
      evEbitda: round(base.evEbitda * (1 + base.controlPremium * CONTROL_PREMIUM_IN_MULTIPLE) * (1 + drift), 2),
      premiumPct: round(base.controlPremium * 100 * (1 + drift * 0.6), 1),
      relevance,
      descriptor,
    };
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Comparable companies analysis. Quick and cheap, but imprecise: the range
 * width comes off 2d6, per the design document's Phase 1 mechanic.
 */
export function runCompsAnalysis(
  target: TargetCompany,
  market: MarketEnvironment,
  selected: ComparableCompany[],
  rng: Rng,
): ValuationRange {
  const { ebitda, netDebt } = latest(target);
  const chosenMultiple = median(selected.map((c) => c.evEbitda)) * market.valuationMultiplier;
  const mid = chosenMultiple * ebitda - netDebt;

  const spreadRoll = rng.dice(2).reduce((a, b) => a + b, 0); // 2..12
  const widthPct = 0.06 + spreadRoll * 0.012; // ~7% to 20% either side

  const avgRelevance =
    selected.reduce((s, c) => s + c.relevance, 0) / Math.max(1, selected.length);

  return {
    method: 'comps',
    low: round(mid * (1 - widthPct), 1),
    mid: round(mid, 1),
    high: round(mid * (1 + widthPct), 1),
    notes: [
      `Selected ${selected.length} comparables; median EV/EBITDA of ${round(chosenMultiple, 2)}x`,
      `Applied to LTM EBITDA of $${round(ebitda, 0)}M, less net debt of $${round(netDebt, 0)}M`,
      `Range width set by market dispersion (2d6 = ${spreadRoll})`,
      avgRelevance > 0.7
        ? 'Comparable set is tight — the peers genuinely rhyme with this business'
        : 'Comparable set is loose — several names are not really peers',
    ],
  };
}

/**
 * Precedent transactions. Costlier and slower, better precision: 3d6 take the
 * best 2, so the range is narrower than comps on average.
 */
export function runPrecedentAnalysis(
  target: TargetCompany,
  market: MarketEnvironment,
  selected: PrecedentTransaction[],
  rng: Rng,
): ValuationRange {
  const { ebitda, netDebt } = latest(target);
  const chosenMultiple = median(selected.map((p) => p.evEbitda)) * market.valuationMultiplier;
  const mid = chosenMultiple * ebitda - netDebt;

  const rolls = rng.dice(3);
  const best2 = rolls[0] + rolls[1];
  const widthPct = 0.05 + (14 - best2) * 0.009;

  return {
    method: 'precedent',
    low: round(mid * (1 - widthPct), 1),
    mid: round(mid, 1),
    high: round(mid * (1 + widthPct), 1),
    notes: [
      `Selected ${selected.length} precedent transactions; median EV/EBITDA of ${round(chosenMultiple, 2)}x`,
      'Transaction multiples embed a control premium already',
      `Precision set by 3d6 keep-best-2 (${rolls.join(', ')} → ${best2})`,
    ],
  };
}

/**
 * Discounted cash flow. Expensive and slow, but the player sets the midpoint
 * directly through their assumptions — no dice.
 */
export function runDcfAnalysis(
  target: TargetCompany,
  market: MarketEnvironment,
  assumptions: DcfAssumptions,
): ValuationRange {
  const { revenue, netDebt } = latest(target);
  const wacc = assumptions.waccPct / 100;
  const g = assumptions.terminalGrowthPct / 100;
  const growth = assumptions.growthPct / 100;
  const margin = assumptions.marginPct / 100;

  if (wacc <= g) {
    throw new Error('WACC must exceed the terminal growth rate');
  }

  let pv = 0;
  let rev = revenue;
  let finalFcf = 0;
  for (let year = 1; year <= 5; year++) {
    rev *= 1 + growth;
    const ebitda = rev * margin;
    // Simplified free cash flow: tax the EBITDA, then hold back reinvestment.
    const fcf = ebitda * 0.76 - rev * 0.045;
    finalFcf = fcf;
    pv += fcf / (1 + wacc) ** year;
  }
  const terminalValue = (finalFcf * (1 + g)) / (wacc - g);
  const pvTerminal = terminalValue / (1 + wacc) ** 5;
  const ev = (pv + pvTerminal) * market.valuationMultiplier;
  const mid = ev - netDebt;

  return {
    method: 'dcf',
    low: round(mid * 0.92, 1),
    mid: round(mid, 1),
    high: round(mid * 1.08, 1),
    notes: [
      `Five-year projection at ${assumptions.growthPct}% growth and ${assumptions.marginPct}% EBITDA margin`,
      `Discounted at ${assumptions.waccPct}% WACC with ${assumptions.terminalGrowthPct}% terminal growth`,
      `Terminal value is ${round((pvTerminal / (pv + pvTerminal)) * 100, 0)}% of enterprise value`,
      'No dice: the answer is exactly as good as the assumptions',
    ],
  };
}

/** Default DCF assumptions, pre-filled from the target card. */
export function defaultDcfAssumptions(target: TargetCompany): DcfAssumptions {
  const comps = SECTOR_COMPS[target.sector];
  return {
    growthPct: target.projectedGrowthPct,
    marginPct: target.projectedMarginPct,
    waccPct: round(comps.wacc * 100, 1),
    terminalGrowthPct: round(comps.terminalGrowth * 100, 1),
  };
}

/** The football field: synthesise every method the buyer paid for (GDD §8.1). */
export function synthesise(
  ranges: ValuationRange[],
  target: TargetCompany,
  market: MarketEnvironment,
): ValuationSummary {
  const intrinsic = intrinsicEquityValue(target, market);
  if (ranges.length === 0) {
    const fallback = unaffectedEquityValue(target);
    return {
      ranges: [],
      recommendedLow: round(fallback * 1.15, 1),
      recommendedHigh: round(fallback * 1.4, 1),
      intrinsicValue: intrinsic,
      estimateErrorPct: 0,
    };
  }

  // Weight the methods the way a banker would: DCF anchors, comps sanity-check.
  const weights: Record<ValuationMethod, number> = { dcf: 0.4, precedent: 0.35, comps: 0.25 };
  let weightSum = 0;
  let lowSum = 0;
  let highSum = 0;
  let midSum = 0;
  for (const r of ranges) {
    const w = weights[r.method];
    weightSum += w;
    lowSum += r.low * w;
    highSum += r.high * w;
    midSum += r.mid * w;
  }
  const blendedMid = midSum / weightSum;

  return {
    ranges,
    recommendedLow: round(lowSum / weightSum, 1),
    recommendedHigh: round(highSum / weightSum, 1),
    intrinsicValue: intrinsic,
    estimateErrorPct: round(((blendedMid - intrinsic) / intrinsic) * 100, 1),
  };
}

/** Premium to the unaffected trading price — the number the seller's board cares about. */
export function premiumPct(price: number, target: TargetCompany): number {
  const unaffected = unaffectedEquityValue(target);
  if (unaffected <= 0) return 0;
  return round((price / unaffected - 1) * 100, 1);
}

/** Accretion/dilution for a stock-funded deal (GDD §8.2). */
export function accretionDilutionPct(
  target: TargetCompany,
  price: number,
  cashPct: number,
  buyerPe: number,
): number {
  const { netIncome } = latest(target);
  const stockPortion = price * (1 - cashPct);
  if (stockPortion <= 0) return 0;
  // Shares issued cost the buyer earnings at its own P/E; the target contributes its net income.
  const earningsGivenUp = stockPortion / buyerPe;
  return round(((netIncome - earningsGivenUp) / Math.max(1, earningsGivenUp)) * 100, 1);
}

/** LBO returns for the sponsor variant (GDD §8.3). */
export interface LboResult {
  entryEquity: number;
  exitEquity: number;
  moic: number;
  irrPct: number;
  holdYears: number;
}

export function lboReturns(params: {
  purchasePrice: number;
  debtRaised: number;
  entryEbitda: number;
  exitEbitda: number;
  exitMultiple: number;
  debtPaidDown: number;
  holdYears: number;
}): LboResult {
  const entryEquity = Math.max(1, params.purchasePrice - params.debtRaised);
  const exitEv = params.exitEbitda * params.exitMultiple;
  const exitEquity = Math.max(0, exitEv - (params.debtRaised - params.debtPaidDown));
  const moic = exitEquity / entryEquity;
  const irr = moic > 0 ? moic ** (1 / params.holdYears) - 1 : -1;
  return {
    entryEquity: round(entryEquity, 1),
    exitEquity: round(exitEquity, 1),
    moic: round(moic, 2),
    irrPct: round(irr * 100, 1),
    holdYears: params.holdYears,
  };
}
