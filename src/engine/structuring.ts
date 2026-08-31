import { DEAL_STRUCTURES, FINANCING_SOURCES, TAX_STRUCTURES } from './content/structures.js';
import { clamp, round } from './rng.js';
import type {
  AcquirerProfile,
  DealStructure,
  FinancingPlan,
  FinancingSource,
  MarketEnvironment,
  StructuringDecision,
  TaxStructure,
} from './types.js';

/** Deal structuring (GDD §6 Phase 4). */

export interface FinancingAnalysis {
  totalRaised: number;
  totalDebt: number;
  equityCheck: number;
  /** Blended annual cost of the debt, in basis points. */
  blendedRateBps: number;
  annualInterest: number;
  /** Leverage as a multiple of the target's EBITDA. */
  leverageTurns: number;
  /** 0..1 — probability-weighted exposure to a financing shock. */
  fragility: number;
  errors: string[];
  warnings: string[];
}

export function analyseFinancing(params: {
  plan: FinancingPlan;
  cashConsideration: number;
  acquirer: AcquirerProfile;
  targetEbitda: number;
  market: MarketEnvironment;
}): FinancingAnalysis {
  const { plan, cashConsideration, acquirer, targetEbitda, market } = params;
  const errors: string[] = [];
  const warnings: string[] = [];

  const entries = Object.entries(plan) as [FinancingSource, number][];
  const totalRaised = entries.reduce((s, [, amount]) => s + Math.max(0, amount), 0);

  let weightedBps = 0;
  let totalDebt = 0;
  let fragilityWeighted = 0;

  for (const [source, amount] of entries) {
    if (amount <= 0) continue;
    const info = FINANCING_SOURCES[source];
    const cap = info.maxShare * Math.max(1, cashConsideration);
    if (amount > cap + 0.5) {
      errors.push(
        `${info.name} is capped at ${Math.round(info.maxShare * 100)}% of the cash consideration ($${round(cap, 0)}M); you allocated $${round(amount, 0)}M.`,
      );
    }
    if (DEBT_SOURCES.includes(source)) {
      totalDebt += amount;
      weightedBps += amount * (info.baseRateBps + market.financingCostBps);
    }
    fragilityWeighted += amount * info.fragility;
  }

  // Tolerance absorbs rounding across tranches; it is well below $1M of signal.
  const EPS = 0.05;
  const cashUsed = plan['cash-on-hand'] ?? 0;
  if (cashUsed > acquirer.cashOnHand + EPS) {
    errors.push(
      `Cash on hand is $${acquirer.cashOnHand}M; you allocated $${round(cashUsed, 0)}M.`,
    );
  }
  if (totalDebt > acquirer.debtCapacity + EPS) {
    errors.push(
      `Debt capacity is $${acquirer.debtCapacity}M; your stack raises $${round(totalDebt, 0)}M.`,
    );
  }

  const shortfall = cashConsideration - totalRaised;
  if (Math.abs(shortfall) > Math.max(1, cashConsideration * 0.005)) {
    if (shortfall > 0) {
      errors.push(`Financing is short by $${round(shortfall, 0)}M of the cash consideration.`);
    } else {
      warnings.push(
        `You have raised $${round(-shortfall, 0)}M more than the deal needs — that is carry you are paying for nothing.`,
      );
    }
  }

  const leverageTurns = targetEbitda > 0 ? totalDebt / targetEbitda : 0;
  if (leverageTurns > 6) {
    warnings.push(
      `Leverage of ${round(leverageTurns, 1)}x is above what lenders will comfortably syndicate. Expect market flex.`,
    );
  }

  const blendedRateBps = totalDebt > 0 ? weightedBps / totalDebt : 0;

  return {
    totalRaised: round(totalRaised, 1),
    totalDebt: round(totalDebt, 1),
    equityCheck: round(Math.max(0, cashConsideration - totalDebt), 1),
    blendedRateBps: round(blendedRateBps, 0),
    annualInterest: round((totalDebt * blendedRateBps) / 10000, 1),
    leverageTurns: round(leverageTurns, 2),
    fragility: round(
      totalRaised > 0 ? clamp(fragilityWeighted / totalRaised, 0, 1) : 0,
      3,
    ),
    errors,
    warnings,
  };
}

/** Tranches that count against the acquirer's debt capacity. */
export const DEBT_SOURCES: FinancingSource[] = [
  'revolver',
  'senior-secured',
  'senior-unsecured',
  'mezzanine',
  'high-yield',
];

/**
 * The largest cash consideration this acquirer can actually fund.
 *
 * Cash on hand, plus its debt capacity, plus whatever an equity co-investor
 * will take. If the price is above this, the deal needs stock — which is a
 * real constraint, not an error.
 */
export function maxAffordableCash(acquirer: AcquirerProfile): number {
  // Co-investment is capped as a share of the deal, so solve for the total:
  // total = cash + debt + 0.4 * total  =>  total = (cash + debt) / 0.6
  const withoutCoinvest = acquirer.cashOnHand + acquirer.debtCapacity;
  return round(withoutCoinvest / (1 - FINANCING_SOURCES['equity-coinvest'].maxShare), 1);
}

/**
 * A sensible default stack, respecting both the per-tranche caps and the
 * acquirer's own balance sheet. Returns as much as can be raised; if that is
 * short of the cash consideration, `analyseFinancing` will say so.
 */
export function suggestFinancing(params: {
  cashConsideration: number;
  acquirer: AcquirerProfile;
}): FinancingPlan {
  const { cashConsideration, acquirer } = params;
  const plan: FinancingPlan = {};
  let remaining = cashConsideration;

  // Adds to a tranche rather than replacing it, so a source can be topped up.
  const take = (source: FinancingSource, limit: number): void => {
    if (remaining <= 0.05) return;
    const info = FINANCING_SOURCES[source];
    const used = plan[source] ?? 0;
    const headroom = Math.min(limit, info.maxShare * cashConsideration - used);
    const amount = Math.min(remaining, headroom);
    if (amount <= 0.05) return;
    plan[source] = round(used + amount, 1);
    remaining = round(remaining - amount, 1);
  };

  // Debt headroom is read back off the plan each time rather than tracked
  // separately, so per-tranche rounding cannot drift past the real capacity.
  const debtRaised = (): number =>
    DEBT_SOURCES.reduce((sum, source) => sum + (plan[source] ?? 0), 0);
  const takeDebt = (source: FinancingSource, share: number): void => {
    take(source, Math.min(acquirer.debtCapacity - debtRaised(), cashConsideration * share));
  };

  take('cash-on-hand', acquirer.cashOnHand * 0.7);
  takeDebt('senior-secured', 0.5);
  takeDebt('senior-unsecured', 0.28);
  take('equity-coinvest', cashConsideration);
  takeDebt('high-yield', 0.3);
  takeDebt('mezzanine', 0.2);
  take('cash-on-hand', acquirer.cashOnHand - (plan['cash-on-hand'] ?? 0));


  return plan;
}

export interface StructureAnalysis {
  /** Price uplift the seller demands for this structure and tax treatment. */
  sellerPriceDemandPct: number;
  /** Value the buyer captures from the tax structure. */
  buyerTaxBenefitPct: number;
  /** Extra transaction cost in $M. */
  complexityCost: number;
  /** 0..1 — probability a required consent is not obtained. */
  consentRisk: number;
  /** Fraction of unknown liabilities the buyer inherits. */
  liabilityAssumption: number;
  /** Multiplier on the time the deal takes to close. */
  speed: number;
  errors: string[];
  notes: string[];
}

export function analyseStructure(
  decision: StructuringDecision,
  targetIsPublic: boolean,
): StructureAnalysis {
  const structure = DEAL_STRUCTURES[decision.structure];
  const tax = TAX_STRUCTURES[decision.tax];
  const errors: string[] = [];
  const notes: string[] = [];

  if (decision.cashPct < structure.cashRequirement - 0.001) {
    errors.push(
      `${structure.name} requires at least ${Math.round(structure.cashRequirement * 100)}% cash consideration.`,
    );
  }
  if (tax.requiresStockConsideration && decision.cashPct > 0.6) {
    errors.push(
      `${tax.name} needs meaningful continuity of interest — cash consideration above 60% will not qualify.`,
    );
  }
  if (decision.structure === 'stock-for-stock' && decision.cashPct > 0) {
    notes.push('Any cash component erodes the tax-free treatment for the target’s holders.');
  }
  if (decision.collar !== 'none' && decision.cashPct >= 1) {
    notes.push('A collar does nothing in an all-cash deal — there is no exchange ratio to protect.');
  }
  if (decision.structure === 'cash-tender' && !targetIsPublic) {
    errors.push('A tender offer needs public shareholders to tender to.');
  }

  // A collar buys certainty on the exchange ratio; the seller pays for it in price.
  const collarDemand =
    decision.collar === 'none'
      ? 0
      : decision.collar === 'walk-away'
        ? 0.012
        : 0.006;

  // A CVR bridges a valuation gap but only pays if milestones land.
  const cvrDiscount = decision.cvrPct > 0 ? -decision.cvrPct / 100 * 0.55 : 0;

  return {
    sellerPriceDemandPct: round((tax.sellerPriceDemand + collarDemand + cvrDiscount) * 100, 2),
    buyerTaxBenefitPct: round(tax.buyerBenefit * 100, 2),
    complexityCost: tax.complexityCost + (decision.structure === 'asset-purchase' ? 15 : 0),
    consentRisk: structure.consentRisk,
    liabilityAssumption: structure.liabilityAssumption,
    speed: structure.speed,
    errors,
    notes: [...notes, ...structure.notes],
  };
}

export function structureInfo(id: DealStructure) {
  return DEAL_STRUCTURES[id];
}

export function taxInfo(id: TaxStructure) {
  return TAX_STRUCTURES[id];
}
