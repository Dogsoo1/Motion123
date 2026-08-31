import type {
  DealStructure,
  DealStructureInfo,
  FinancingSource,
  FinancingSourceInfo,
  MacCarveOut,
  MacCarveOutId,
  TaxStructure,
  TaxStructureInfo,
} from '../types.js';

/** Transaction structures (GDD §4.1 Phase 4). */
export const DEAL_STRUCTURES: Record<DealStructure, DealStructureInfo> = {
  'stock-for-stock': {
    id: 'stock-for-stock',
    name: 'Stock-for-Stock Merger',
    summary:
      'Issue new shares to the target’s holders. Tax-deferred for them, no cash out the door for you — and you inherit every liability they have, known and unknown.',
    cashRequirement: 0,
    speed: 1.0,
    liabilityAssumption: 1.0,
    requiresTargetShareholderVote: true,
    requiresBuyerShareholderVote: true,
    consentRisk: 0.1,
    notes: [
      'Section 368 reorganisation treatment available',
      'Buyer shareholder approval required above a 20% share issuance',
      'Dilution flows straight into the accretion/dilution analysis',
    ],
  },
  'cash-tender': {
    id: 'cash-tender',
    name: 'Cash Tender Offer',
    summary:
      'Go straight to the shareholders with cash. Fastest route to control and the cleanest break — but you fund all of it, and the minimum tender condition can bite.',
    cashRequirement: 1.0,
    speed: 0.75,
    liabilityAssumption: 1.0,
    requiresTargetShareholderVote: false,
    requiresBuyerShareholderVote: false,
    consentRisk: 0.15,
    notes: [
      'Williams Act: must stay open 20 business days',
      'Can proceed over board objection, though the board still recommends',
      'Minimum tender condition is negotiated in the agreement',
    ],
  },
  'cash-merger': {
    id: 'cash-merger',
    name: 'Cash Merger',
    summary:
      'Board-approved, shareholder-voted, cash at closing. The workhorse structure: moderate speed, needs the board on side.',
    cashRequirement: 1.0,
    speed: 1.0,
    liabilityAssumption: 1.0,
    requiresTargetShareholderVote: true,
    requiresBuyerShareholderVote: false,
    consentRisk: 0.12,
    notes: [
      'Requires a target shareholder vote and proxy process',
      'Appraisal rights are live if the premium is thin',
    ],
  },
  'asset-purchase': {
    id: 'asset-purchase',
    name: 'Asset Purchase',
    summary:
      'Buy the assets you want and leave the rest behind. The best liability shield in the game, paid for in consents, transfer mechanics and time.',
    cashRequirement: 1.0,
    speed: 1.45,
    liabilityAssumption: 0.35,
    requiresTargetShareholderVote: true,
    requiresBuyerShareholderVote: false,
    consentRisk: 0.4,
    notes: [
      'Each material contract may need its own third-party consent',
      'Section 338(h)(10) election available for a basis step-up',
      'Successor liability still reaches some claims — the shield is not absolute',
    ],
  },
  'reverse-triangular': {
    id: 'reverse-triangular',
    name: 'Reverse Triangular Merger',
    summary:
      'A merger sub merges into the target, which survives as your subsidiary. Contracts and permits stay put, and you keep most structural flexibility.',
    cashRequirement: 0.5,
    speed: 1.1,
    liabilityAssumption: 0.9,
    requiresTargetShareholderVote: true,
    requiresBuyerShareholderVote: false,
    consentRisk: 0.08,
    notes: [
      'Target survives, so contracts and permits generally carry over',
      'Change-of-control clauses can still be triggered — read them',
      'Can qualify as a 368(a)(2)(E) reorganisation with enough stock',
    ],
  },
};

export const DEAL_STRUCTURE_LIST = Object.values(DEAL_STRUCTURES);

/** The financing stack (GDD §4.2 Phase 4). */
export const FINANCING_SOURCES: Record<FinancingSource, FinancingSourceInfo> = {
  'cash-on-hand': {
    id: 'cash-on-hand',
    name: 'Cash on Hand',
    baseRateBps: 0,
    fragility: 0,
    maxShare: 1,
    notes: 'Free and certain. Also finite — and spending it costs you optionality.',
  },
  revolver: {
    id: 'revolver',
    name: 'Revolving Credit',
    baseRateBps: 425,
    fragility: 0.1,
    maxShare: 0.2,
    notes: 'Cheap and quick, but it is bridge money — the market expects you to term it out.',
  },
  'senior-secured': {
    id: 'senior-secured',
    name: 'Senior Secured Debt',
    baseRateBps: 575,
    fragility: 0.2,
    maxShare: 0.55,
    notes: 'Collateralised and covenanted. The backbone of any leveraged structure.',
  },
  'senior-unsecured': {
    id: 'senior-unsecured',
    name: 'Senior Unsecured Debt',
    baseRateBps: 725,
    fragility: 0.3,
    maxShare: 0.4,
    notes: 'More flexible, no security package, priced for the privilege.',
  },
  mezzanine: {
    id: 'mezzanine',
    name: 'Mezzanine / Sub Debt',
    baseRateBps: 1100,
    fragility: 0.35,
    maxShare: 0.25,
    notes: 'Fills the gap between senior debt and equity. Expensive, patient, often warranted.',
  },
  'high-yield': {
    id: 'high-yield',
    name: 'High-Yield Bonds',
    baseRateBps: 900,
    fragility: 0.55,
    maxShare: 0.45,
    notes: 'Size and speed when the window is open — and nothing at all when it shuts.',
  },
  'equity-coinvest': {
    id: 'equity-coinvest',
    name: 'Equity Co-Investment',
    baseRateBps: 0,
    fragility: 0.05,
    maxShare: 0.4,
    notes: 'Brings a partner in beside you. No interest cost; you share the upside instead.',
  },
};

export const FINANCING_SOURCE_LIST = Object.values(FINANCING_SOURCES);

/** Tax structures (GDD §4.3 Phase 4). */
export const TAX_STRUCTURES: Record<TaxStructure, TaxStructureInfo> = {
  taxable: {
    id: 'taxable',
    name: 'Taxable Transaction',
    summary:
      'Simple and clean. The target’s shareholders write a cheque to the government, and they will want compensating for it in the price.',
    sellerPriceDemand: 0.03,
    buyerBenefit: 0,
    complexityCost: 0,
    requiresStockConsideration: false,
  },
  'reorg-368': {
    id: 'reorg-368',
    name: 'Tax-Free Reorganisation (§368)',
    summary:
      'Tax deferral for the target’s holders in exchange for taking your paper. Continuity-of-interest rules mean this only works with real stock consideration.',
    sellerPriceDemand: -0.02,
    buyerBenefit: 0,
    complexityCost: 8,
    requiresStockConsideration: true,
  },
  'election-338': {
    id: 'election-338',
    name: 'Section 338(h)(10) Election',
    summary:
      'Treat the stock purchase as an asset purchase for tax. You get a stepped-up basis; the seller gets a bigger tax bill and will price it in.',
    sellerPriceDemand: 0.055,
    buyerBenefit: 0.07,
    complexityCost: 12,
    requiresStockConsideration: false,
  },
  'cross-border': {
    id: 'cross-border',
    name: 'Cross-Border Structure',
    summary:
      'Treaty-driven holding structure with GILTI and BEAT consequences. Real savings, real complexity, real regulatory attention.',
    sellerPriceDemand: 0.01,
    buyerBenefit: 0.045,
    complexityCost: 25,
    requiresStockConsideration: false,
  },
};

export const TAX_STRUCTURE_LIST = Object.values(TAX_STRUCTURES);

/**
 * MAC carve-outs (GDD §5.2 B). The seller wants each of these in — every one
 * narrows the clause and makes it harder for the buyer to walk.
 */
export const MAC_CARVE_OUTS: MacCarveOut[] = [
  {
    id: 'general-economy',
    name: 'General economic conditions',
    description: 'Recessions, credit cycles and macro shocks are not the target’s fault.',
    weight: 0.11,
  },
  {
    id: 'industry-wide',
    name: 'Industry-wide conditions',
    description: 'If the whole sector is down, that is not company-specific deterioration.',
    weight: 0.13,
  },
  {
    id: 'law-change',
    name: 'Changes in law or regulation',
    description: 'A new statute or rule that hits everyone is carved out.',
    weight: 0.07,
  },
  {
    id: 'gaap-change',
    name: 'Changes in GAAP or accounting standards',
    description: 'Restatements driven by a standards change, not by the business.',
    weight: 0.04,
  },
  {
    id: 'acts-of-god',
    name: 'Natural disasters, pandemics, acts of God',
    description: 'The carve-out that got very expensive to litigate after 2020.',
    weight: 0.09,
  },
  {
    id: 'war-terrorism',
    name: 'War, terrorism, hostilities',
    description: 'Geopolitical shocks outside anyone’s control.',
    weight: 0.06,
  },
  {
    id: 'stock-price',
    name: 'Changes in the company’s stock price',
    description:
      'The price move itself is carved out — but the underlying cause is not, which is where the fight actually happens.',
    weight: 0.05,
  },
  {
    id: 'missed-projections',
    name: 'Failure to meet projections',
    description:
      'Missing the model is carved out; the reason for missing it stays in scope.',
    weight: 0.08,
  },
  {
    id: 'announcement-effects',
    name: 'Effects of announcing the transaction',
    description: 'Customer and employee reaction to the deal itself.',
    weight: 0.07,
  },
  {
    id: 'buyer-requested',
    name: 'Actions taken at the buyer’s request',
    description: 'You asked for it; you cannot then call it a MAC.',
    weight: 0.04,
  },
  {
    id: 'compliance-effects',
    name: 'Effects of complying with the agreement',
    description: 'Interim operating covenants constrain the business — that is the deal.',
    weight: 0.04,
  },
  {
    id: 'rates-fx',
    name: 'Changes in interest rates or FX',
    description: 'Rate and currency moves are market risk, not business deterioration.',
    weight: 0.05,
  },
  {
    id: 'disproportionate-exception',
    name: 'Disproportionate impact exception',
    description:
      'The carve-out of the carve-outs: if the company is hit materially worse than its peers, the carve-outs stop protecting the seller. Buyers fight hard for this one.',
    weight: 0.14,
    invertsForBuyer: true,
  },
];

export const MAC_CARVE_OUT_BY_ID: Record<MacCarveOutId, MacCarveOut> = Object.fromEntries(
  MAC_CARVE_OUTS.map((c) => [c.id, c]),
) as Record<MacCarveOutId, MacCarveOut>;
