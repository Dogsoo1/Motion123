/**
 * Domain types for Deal Room.
 *
 * Every name here maps to a concept in GAME_DESIGN_DOCUMENT.md. Section
 * references in comments point back to the part of the document a rule
 * implements, so the spec and the code stay traceable to each other.
 */

// ---------------------------------------------------------------------------
// Roles (GDD §5)
// ---------------------------------------------------------------------------

export type RoleId = 'buyer' | 'seller' | 'banker' | 'regulator';

export const ROLE_IDS: readonly RoleId[] = ['buyer', 'seller', 'banker', 'regulator'];

export const ROLE_NAMES: Record<RoleId, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  banker: 'Banker',
  regulator: 'Regulator',
};

// ---------------------------------------------------------------------------
// Market environment (GDD §4.2)
// ---------------------------------------------------------------------------

export type MarketEnvironmentId =
  | 'bull'
  | 'bear'
  | 'volatile'
  | 'regulatory-tightening'
  | 'sector-rotation';

export interface MarketEnvironment {
  id: MarketEnvironmentId;
  name: string;
  description: string;
  /** Multiplier applied to sector trading multiples. 1.0 is neutral. */
  valuationMultiplier: number;
  /** Basis points added to every debt tranche's base rate. */
  financingCostBps: number;
  /** 0..1 — probability that a competing bidder shows up in an auction. */
  competitionLevel: number;
  /** 0..1 — shifts the regulator's review-intensity draw. */
  regulatoryIntensity: number;
  /** 0..1 — probability an interim-period event fires each draw. */
  volatility: number;
}

// ---------------------------------------------------------------------------
// Companies (GDD §4.3)
// ---------------------------------------------------------------------------

export type Sector =
  | 'Transport & Logistics'
  | 'Leisure & Hospitality'
  | 'Food & Beverage'
  | 'Textiles & Apparel'
  | 'Technology'
  | 'Healthcare / Pharma'
  | 'Financial Services'
  | 'Energy'
  | 'Consumer / Retail'
  | 'Industrials'
  | 'Media / Telecom'
  | 'Real Estate'
  | 'Defense / Aerospace'
  | 'Professional Services';

export interface TargetCompany {
  id: string;
  name: string;
  sector: Sector;
  subSector: string;
  description: string;
  /** Three years of history, oldest first. All figures in $M. */
  revenue: [number, number, number];
  ebitda: [number, number, number];
  netIncome: [number, number, number];
  totalDebt: number;
  cash: number;
  /** Shares outstanding in millions; undefined for private targets. */
  sharesOutstanding?: number;
  /** Unaffected trading price per share, if public. */
  sharePrice?: number;
  employees: number;
  headquarters: string;
  keyAssets: string[];
  /** Disclosed on the front of the card (GDD §4.3). */
  knownRisks: string[];
  /** Share of the relevant antitrust market, in percent (GDD §6.2). */
  marketSharePct: number;
  /** Ids of data room cards seeded into this target's data room. */
  hiddenFindingIds: string[];
  /** Growth and margin assumptions the DCF template starts from. */
  projectedGrowthPct: number;
  projectedMarginPct: number;
}

export interface AcquirerProfile {
  id: string;
  name: string;
  kind: 'strategic' | 'sponsor';
  description: string;
  /** Cash on hand, $M. */
  cashOnHand: number;
  /** Maximum total debt the buyer can raise, $M. */
  debtCapacity: number;
  /** Overlap with the target's market, in percent — drives HHI. */
  marketSharePct: number;
  /** Primary sector, used for descriptive copy. */
  sector: Sector;
  /**
   * Sectors where the acquirer already holds the position above. A target
   * outside this list produces only incidental overlap, which is what makes
   * the regulatory phase turn on which company you chose to buy.
   */
  overlapSectors: Sector[];
}

// ---------------------------------------------------------------------------
// Valuation (GDD §8.1)
// ---------------------------------------------------------------------------

export type ValuationMethod = 'comps' | 'precedent' | 'dcf';

export interface ValuationRange {
  method: ValuationMethod;
  low: number;
  mid: number;
  high: number;
  /** Narrative of how the range was derived, shown in the UI. */
  notes: string[];
}

export interface ValuationSummary {
  ranges: ValuationRange[];
  /** Blended recommendation the banker anchors negotiations to. */
  recommendedLow: number;
  recommendedHigh: number;
  /** The engine's private view of what the company is actually worth. */
  intrinsicValue: number;
  /** How far the buyer's estimate sits from intrinsic value, as a fraction. */
  estimateErrorPct: number;
}

// ---------------------------------------------------------------------------
// Diligence (GDD §3, §7.1)
// ---------------------------------------------------------------------------

export type DiligenceCategory =
  | 'financial'
  | 'legal'
  | 'operational'
  | 'commercial'
  | 'hr'
  | 'tax'
  | 'environmental'
  | 'ip';

export const DILIGENCE_CATEGORIES: readonly DiligenceCategory[] = [
  'financial',
  'legal',
  'operational',
  'commercial',
  'hr',
  'tax',
  'environmental',
  'ip',
];

export const DILIGENCE_CATEGORY_NAMES: Record<DiligenceCategory, string> = {
  financial: 'Financial',
  legal: 'Legal',
  operational: 'Operational',
  commercial: 'Commercial',
  hr: 'HR / Labor',
  tax: 'Tax',
  environmental: 'Environmental',
  ip: 'IP / Technology',
};

export type Severity = 'green' | 'yellow' | 'red' | 'black';

/** Rep categories from the R&W scope table (GDD §5.2 A). */
export type RepCategory =
  | 'financialStatements'
  | 'materialContracts'
  | 'litigation'
  | 'ip'
  | 'compliance'
  | 'environmental'
  | 'tax'
  | 'employees';

export const REP_CATEGORIES: readonly RepCategory[] = [
  'financialStatements',
  'materialContracts',
  'litigation',
  'ip',
  'compliance',
  'environmental',
  'tax',
  'employees',
];

export const REP_CATEGORY_NAMES: Record<RepCategory, string> = {
  financialStatements: 'Financial Statements',
  materialContracts: 'Material Contracts',
  litigation: 'Litigation',
  ip: 'Intellectual Property',
  compliance: 'Compliance',
  environmental: 'Environmental',
  tax: 'Tax',
  employees: 'Employees',
};

export interface DataRoomCard {
  id: string;
  category: DiligenceCategory;
  severity: Severity;
  title: string;
  body: string;
  /** Price reduction the finding justifies, as a percentage range. */
  priceImpactPct: [number, number];
  /** What the buyer must extract to live with the finding. */
  remedy?: string;
  /** Deal value hit in Phase 7 if the finding was never discovered. */
  latentIntegrationPct?: number;
  /** Which representation would have to be broad enough to cover a claim. */
  repCategory?: RepCategory;
  /** Real-world context printed on the card (GDD §7.2). */
  flavor?: string;
}

export type DiligenceDepth = 0 | 1 | 2 | 3 | 4;

export const DILIGENCE_DEPTH_NAMES: Record<DiligenceDepth, string> = {
  0: 'Skip',
  1: 'Surface Review',
  2: 'Standard Review',
  3: 'Deep Dive',
  4: 'Expert Analysis',
};

export interface DataRoomSlot {
  card: DataRoomCard;
  /** Position within the category; deeper cards need more DP to reach. */
  depth: number;
  revealed: boolean;
  /** How the card came to light — affects reputation and negotiation. */
  revealedBy?: 'diligence' | 'disclosure' | 'event' | 'expert';
}

export type DisclosureStrategy = 'full' | 'selective' | 'drip' | 'bury';

export interface DiligenceResult {
  spent: number;
  allocation: Record<DiligenceCategory, DiligenceDepth>;
  revealed: DataRoomCard[];
  missed: DataRoomCard[];
  /** Total justified price reduction, as a fraction of headline price. */
  priceAdjustmentPct: number;
  /** Categories where the buyer bought the "risk assessment" modifier. */
  expertCategories: DiligenceCategory[];
  findings: DiligenceFinding[];
}

export interface DiligenceFinding {
  card: DataRoomCard;
  priceImpactPct: number;
  /** Specific indemnity the buyer may demand in Phase 5. */
  demandsSpecialIndemnity: boolean;
}

// ---------------------------------------------------------------------------
// Preliminary engagement (GDD §6 Phase 2)
// ---------------------------------------------------------------------------

export type ProcessType = 'auction' | 'targeted' | 'exclusive' | 'not-for-sale';

export const PROCESS_TYPE_NAMES: Record<ProcessType, string> = {
  auction: 'Broad Auction',
  targeted: 'Targeted Outreach',
  exclusive: 'Exclusive Negotiation',
  'not-for-sale': 'Not For Sale',
};

export type ConsiderationType = 'cash' | 'stock' | 'mixed';

export interface IndicationOfInterest {
  priceLow: number;
  priceHigh: number;
  consideration: ConsiderationType;
  /** Days of exclusivity requested, 0-90. */
  exclusivityDays: number;
  /** Break-up fee as a percentage of deal value, 0-5. */
  breakFeePct: number;
  noShop: 'strict' | 'modified' | 'go-shop';
  /** Deposit as a percentage of deal value, 0-10. */
  depositPct: number;
}

export type LoiTermId =
  | 'price'
  | 'consideration'
  | 'exclusivity'
  | 'breakFee'
  | 'noShop'
  | 'deposit';

export interface LoiTerms {
  /** Headline equity value agreed in the LOI, $M. */
  price: number;
  consideration: ConsiderationType;
  exclusivityDays: number;
  breakFeePct: number;
  noShop: 'strict' | 'modified' | 'go-shop';
  depositPct: number;
}

// ---------------------------------------------------------------------------
// Structuring (GDD §6 Phase 4)
// ---------------------------------------------------------------------------

export type DealStructure =
  | 'stock-for-stock'
  | 'cash-tender'
  | 'cash-merger'
  | 'asset-purchase'
  | 'reverse-triangular';

export interface DealStructureInfo {
  id: DealStructure;
  name: string;
  summary: string;
  /** Fraction of consideration that must be cash. */
  cashRequirement: number;
  /** Multiplier on time cost: >1 is slower. */
  speed: number;
  /** 0..1 — how much of the target's unknown liabilities the buyer inherits. */
  liabilityAssumption: number;
  requiresTargetShareholderVote: boolean;
  requiresBuyerShareholderVote: boolean;
  /** Extra closing risk from third-party consents. */
  consentRisk: number;
  notes: string[];
}

export type FinancingSource =
  | 'cash-on-hand'
  | 'revolver'
  | 'senior-secured'
  | 'senior-unsecured'
  | 'mezzanine'
  | 'high-yield'
  | 'equity-coinvest';

export interface FinancingSourceInfo {
  id: FinancingSource;
  name: string;
  /** Annual cost in basis points before market adjustment. */
  baseRateBps: number;
  /** 0..1 — probability weight this tranche is pulled on a credit shock. */
  fragility: number;
  /** Cap as a fraction of deal value. */
  maxShare: number;
  notes: string;
}

export type FinancingPlan = Partial<Record<FinancingSource, number>>;

export type TaxStructure = 'taxable' | 'reorg-368' | 'election-338' | 'cross-border';

export interface TaxStructureInfo {
  id: TaxStructure;
  name: string;
  summary: string;
  /** Price uplift the seller demands to accept this treatment, as a fraction. */
  sellerPriceDemand: number;
  /** Value of the step-up or other benefit to the buyer, as a fraction. */
  buyerBenefit: number;
  /** Extra complexity cost in $M. */
  complexityCost: number;
  requiresStockConsideration: boolean;
}

export interface StructuringDecision {
  structure: DealStructure;
  financing: FinancingPlan;
  tax: TaxStructure;
  /** Fraction of consideration paid in cash, 0..1. */
  cashPct: number;
  /** Optional collar protecting against stock price moves. */
  collar: 'none' | 'fixed' | 'floating' | 'walk-away';
  /** Contingent value right bridging a valuation gap, as % of deal value. */
  cvrPct: number;
}

// ---------------------------------------------------------------------------
// Definitive agreement (GDD §6 Phase 5)
// ---------------------------------------------------------------------------

export type RepScope = 'narrow' | 'standard' | 'broad';

export type MacCarveOutId =
  | 'general-economy'
  | 'industry-wide'
  | 'law-change'
  | 'gaap-change'
  | 'acts-of-god'
  | 'war-terrorism'
  | 'stock-price'
  | 'missed-projections'
  | 'announcement-effects'
  | 'buyer-requested'
  | 'compliance-effects'
  | 'rates-fx'
  | 'disproportionate-exception';

export interface MacCarveOut {
  id: MacCarveOutId;
  name: string;
  description: string;
  /** How much including it narrows the MAC (0..1). */
  weight: number;
  /** True for the carve-out-of-carve-outs, which cuts the other way. */
  invertsForBuyer?: boolean;
}

export type BasketType = 'tipping' | 'deductible';

export interface IndemnityTerms {
  /** Cap as a percentage of deal value. */
  capPct: number;
  /** Basket as a percentage of deal value. */
  basketPct: number;
  basketType: BasketType;
  /** Survival period in months. */
  survivalMonths: number;
  fundamentalRepsIndefinite: boolean;
  /** Escrow as a percentage of deal value. */
  escrowPct: number;
  proSandbagging: boolean;
  soleRemedy: boolean;
  /** Rep categories covered by a bespoke indemnity from diligence findings. */
  specialIndemnities: RepCategory[];
  /** Whether the buyer bought R&W insurance (GDD §7.4). */
  rwInsurance: boolean;
}

export interface ClosingConditions {
  regulatoryApproval: true;
  financingCondition: boolean;
  minimumTenderPct: number;
  thirdPartyConsentsRequired: number;
  /** Standard for bringing down the reps at closing. */
  bringDownStandard: 'all-respects' | 'material-respects' | 'mae';
  noMac: boolean;
}

export interface DealProtections {
  matchingRights: number;
  terminationFeePct: number;
  reverseTerminationFeePct: number;
  forceTheVote: boolean;
  fiduciaryOut: boolean;
  specificPerformance: 'none' | 'one-way-seller' | 'mutual';
}

export interface DefinitiveAgreement {
  reps: Record<RepCategory, RepScope>;
  /** Carve-outs the seller successfully included; each narrows the MAC. */
  macCarveOuts: MacCarveOutId[];
  /** Quantitative MAC threshold as a percentage EBITDA decline. */
  macThresholdPct: number;
  indemnity: IndemnityTerms;
  conditions: ClosingConditions;
  protections: DealProtections;
  /** Final signed equity value, $M. */
  price: number;
}

// ---------------------------------------------------------------------------
// Negotiation (GDD §10)
// ---------------------------------------------------------------------------

export interface NegotiationPosition {
  /** Normalised 0..1 where 0 is maximally seller-friendly. */
  buyerTarget: number;
  buyerReserve: number;
  sellerTarget: number;
  sellerReserve: number;
}

export interface NegotiationOutcome {
  /** Settled value on the 0..1 scale. */
  value: number;
  /** True when neither side could reach the other's reserve. */
  impasse: boolean;
  rounds: number;
  buyerNpSpent: number;
  sellerNpSpent: number;
}

// ---------------------------------------------------------------------------
// Regulatory (GDD §6 Phase 6)
// ---------------------------------------------------------------------------

export type RegulatoryPosture = 'permissive' | 'moderate' | 'aggressive';

export type ReviewIntensity =
  | 'quick-clear'
  | 'information-request'
  | 'second-request'
  | 'challenge';

export type RemedyType = 'none' | 'behavioral' | 'structural' | 'fix-it-first';

export interface RegulatoryOutcome {
  posture: RegulatoryPosture;
  preMergerHhi: number;
  postMergerHhi: number;
  hhiDelta: number;
  presumptivelyAnticompetitive: boolean;
  intensity: ReviewIntensity;
  /** Extra action rounds the review consumed. */
  roundsAdded: number;
  /** Direct cost to the buyer, $M. */
  costToBuyer: number;
  costToSeller: number;
  remedy: RemedyType;
  /** Divestiture value given up, $M. */
  divestitureValue: number;
  litigated: boolean;
  litigationWon?: boolean;
  cleared: boolean;
  narrative: string[];
}

// ---------------------------------------------------------------------------
// Closing and integration (GDD §6 Phase 7)
// ---------------------------------------------------------------------------

export interface InterimEvent {
  id: string;
  name: string;
  description: string;
  /** EBITDA decline the event causes, in percent. */
  ebitdaHitPct: number;
  /** True when the hit is industry-wide, so seller carve-outs may catch it. */
  carveOutIds: MacCarveOutId[];
  /** Whether the event threatens financing rather than the business. */
  financingShock?: boolean;
  toppingBid?: boolean;
}

export interface IntegrationCard {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Change in deal value, as a percentage. Positive cards exist too. */
  valueImpactPct: number;
  /** Rep this maps to if it surfaces as an indemnity claim. */
  repCategory?: RepCategory;
  /** Claim size as a percentage of deal value, if it is a liability. */
  claimPct?: number;
}

export interface MacDisputeResult {
  invoked: boolean;
  /** Strength of the buyer's position, 0..1. */
  buyerStrength: number;
  outcome: 'forced-to-close' | 'buyer-walks' | 'renegotiated' | 'not-invoked';
  precedentId?: string;
  /** Price cut agreed if renegotiated, as a fraction. */
  priceCutPct: number;
  narrative: string[];
}

export interface IndemnityClaim {
  source: string;
  repCategory?: RepCategory;
  /** Gross loss, $M. */
  grossLoss: number;
  /** Amount actually recovered after basket, cap and survival, $M. */
  recovered: number;
  barred: boolean;
  barReason?: string;
}

export interface ClosingOutcome {
  closed: boolean;
  terminationReason?: string;
  interimEvents: InterimEvent[];
  macDispute: MacDisputeResult;
  integrationCards: IntegrationCard[];
  claims: IndemnityClaim[];
  /** Working capital true-up, $M (positive favours the buyer). */
  workingCapitalAdjustment: number;
  /** Final enterprise value delivered post-integration, $M. */
  realisedValue: number;
  /** Total the buyer paid including fees and adjustments, $M. */
  totalCost: number;
  narrative: string[];
}

// ---------------------------------------------------------------------------
// Scoring (GDD §11)
// ---------------------------------------------------------------------------

export interface ScoreLine {
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface RoleScore {
  role: RoleId;
  lines: ScoreLine[];
  total: number;
  max: number;
}

export interface PrivateObjective {
  id: string;
  role: RoleId | 'any';
  name: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Precedents and events (GDD §7.1)
// ---------------------------------------------------------------------------

export interface PrecedentCard {
  id: string;
  name: string;
  area: 'mac' | 'antitrust' | 'fiduciary';
  description: string;
  /** Added to the invoking party's strength, -0.3..+0.3. */
  modifier: number;
}

export interface DefenseCard {
  id: string;
  name: string;
  description: string;
  /** How much it raises the buyer's cost, as a fraction of deal value. */
  costToBuyer: number;
  /** Reputation cost to the seller for deploying it. */
  reputationCost: number;
  /** Unocal proportionality: 0..1, higher is easier to defend in court. */
  proportionality: number;
}

// ---------------------------------------------------------------------------
// Difficulty (NAMING.md — system defaults)
// ---------------------------------------------------------------------------

export type DifficultyTier = 'clean-team' | 'red-flag' | 'shutter-island';

export interface DifficultyProfile {
  id: DifficultyTier;
  name: string;
  summary: string;
  disclosure: DisclosureStrategy;
  /** Diligence Points granted for the engagement. */
  diligenceBudget: number;
  /** Multiplier on how hard the seller pushes back in every negotiation. */
  sellerResistance: number;
  /**
   * True where the diligence report is itself unreliable regardless of who
   * produced it — ground truth is unreachable before signing.
   */
  reportsCompromised: boolean;
}

// ---------------------------------------------------------------------------
// Scenario (GDD §12)
// ---------------------------------------------------------------------------

export type Complexity = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Scenario {
  id: string;
  name: string;
  premise: string;
  complexity: Complexity;
  focus: string[];
  /** Forces a market environment, or leaves it to the draw. */
  market?: MarketEnvironmentId;
  processType?: ProcessType;
  /** Fixes which target is in play, for scripted scenarios. */
  targetId?: string;
  acquirerId?: string;
  /** Buyer's diligence budget in DP; the default is 12 (GDD §3.2). */
  diligenceBudget?: number;
  /** Rules toggles. */
  hostileEnabled?: boolean;
  competingBidders?: number;
  regulatoryModule?: 'basic' | 'full';
  specialRules: string[];
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const PHASE_NAMES: Record<PhaseId, string> = {
  1: 'Origination & Screening',
  2: 'Preliminary Engagement',
  3: 'Due Diligence',
  4: 'Deal Structuring',
  5: 'Definitive Agreement',
  6: 'Regulatory Review',
  7: 'Closing & Integration',
  8: 'Final Scoring',
};

export interface LogEntry {
  phase: PhaseId;
  role: RoleId | 'system';
  text: string;
  /** Optional detail lines shown under the entry. */
  detail?: string[];
  tone?: 'good' | 'bad' | 'neutral' | 'warning';
}

export interface PlayerState {
  role: RoleId;
  capital: number;
  influence: number;
  reputation: number;
  negotiationPoints: number;
  objective: PrivateObjective;
  /** Fees earned; meaningful for the banker. */
  fees: number;
  /** True when a human is playing this seat. */
  human: boolean;
}

export interface CompetingBidder {
  id: string;
  name: string;
  /** Maximum equity value this bidder will pay, $M. */
  ceiling: number;
  /** Whether they have entered the process yet. */
  active: boolean;
  /** Their standing bid, $M. */
  bid: number;
}
