import type { DifficultyProfile, DifficultyTier } from '../types.js';

/**
 * Advisers and counterparties (NAMING.md).
 *
 * Every entry here carries a mechanical function. The name is the label on the
 * function, and nothing in the UI explains it.
 */

// ---------------------------------------------------------------------------
// Diligence providers
// ---------------------------------------------------------------------------

export type DiligenceProviderId = 'monk' | 'santa-barbara';

export interface DiligenceProvider {
  id: DiligenceProviderId;
  name: string;
  discipline: string;
  /** Shown to the player when choosing. Says nothing about reliability. */
  pitch: string;
  /** Retainer, as a fraction of deal value. */
  feePct: number;
  /** Multiplier on the cash cost of each Diligence Point. */
  costPerPoint: number;
  /** Extra action rounds the engagement consumes. */
  timetableCost: number;
  /**
   * Probability that a finding the fieldwork reached is nonetheless reported
   * clean. The player is never told a read was missed — the card simply stays
   * unrevealed and surfaces post-closing as a latent liability.
   */
  missRate: number;
  /** Categories reviewed at this depth also reveal one slot deeper. */
  reachesDeeper: boolean;
}

export const DILIGENCE_PROVIDERS: Record<DiligenceProviderId, DiligenceProvider> = {
  monk: {
    id: 'monk',
    name: 'Monk Forensic',
    discipline: 'Financial diligence',
    pitch:
      'Forensic accountants. They will reconcile the bank statements themselves, they will not sign anything they have not seen, and they will hold up the timetable to get it.',
    feePct: 0.008,
    costPerPoint: 1.5,
    timetableCost: 3,
    missRate: 0,
    reachesDeeper: true,
  },
  'santa-barbara': {
    id: 'santa-barbara',
    name: 'Santa Barbara Advisory',
    discipline: 'Commercial diligence',
    pitch:
      'Fast, commercial, and used to working to a deal timetable. The report will be on your desk in the format you asked for, on the date you asked for it.',
    feePct: 0.002,
    costPerPoint: 0.8,
    timetableCost: 0,
    missRate: 0.42,
    reachesDeeper: false,
  },
};

export const DILIGENCE_PROVIDER_LIST = Object.values(DILIGENCE_PROVIDERS);

// ---------------------------------------------------------------------------
// Optional retainers
// ---------------------------------------------------------------------------

export interface Retainer {
  id: string;
  name: string;
  role: string;
  pitch: string;
  /** Fee, as a fraction of deal value. */
  feePct: number;
}

/**
 * US counsel. Drafting quality decides which warranties survive: the retainer
 * adds a standing bonus to the representations front in Phase 5.
 */
export const DESTIN_CONRAD: Retainer = {
  id: 'destin-conrad',
  name: 'Destin & Conrad LLP',
  role: 'Buy-side counsel',
  pitch:
    'Cross-border practice with a deep warranty and indemnity bench. Their first mark-up will be longer than the agreement.',
  feePct: 0.011,
};

/** Bonus applied to the representations negotiation when retained. */
export const DESTIN_CONRAD_REPS_BONUS = 1.8;

/**
 * PR and communications. Reduces the chance of a leak during diligence, but
 * runs its own profile alongside yours — and a raised profile draws bidders.
 */
export const LINETTI: Retainer = {
  id: 'linetti',
  name: 'Linetti Communications',
  role: 'Communications',
  pitch:
    'Announcement strategy, leak containment, and a managing partner who will be quoted in the trade press whether or not you were planning an announcement.',
  feePct: 0.004,
};

/** Multiplier applied to leak probability while Linetti is retained. */
export const LINETTI_LEAK_MULTIPLIER = 0.35;
/** Probability Linetti generates its own coverage, drawing in a rival bidder. */
export const LINETTI_SELF_PROMOTION_RATE = 0.3;

// ---------------------------------------------------------------------------
// Sell-side bank
// ---------------------------------------------------------------------------

/**
 * Bellion Partners runs the process. Where they are engaged, exclusivity is
 * harder to obtain and the timetable is shorter — one fewer round of LOI
 * negotiation before the open terms drop to market standard.
 */
export const BELLION = {
  id: 'bellion',
  name: 'Bellion Partners',
  role: 'Sell-side adviser',
  /** Fraction of the exclusivity the buyer asks for that is actually granted. */
  exclusivityGrantRate: 0.45,
  /** Rounds removed from the LOI negotiation. */
  timetablePressure: 1,
} as const;

// ---------------------------------------------------------------------------
// Rival bidders
// ---------------------------------------------------------------------------

export type RivalId = 'masego' | 'tanerelle';

export interface RivalProfile {
  id: RivalId;
  name: string;
  kind: 'sponsor' | 'family-office';
  /** Ceiling as a multiple of intrinsic value. */
  ceilingMultiple: [number, number];
  /** Opening bid as a fraction of its own ceiling. */
  openingFraction: [number, number];
  /**
   * Where a rival will exceed its own ceiling. Masego never does; Tanerélle
   * does when the asset fits the portfolio.
   */
  overpaysOnFit: boolean;
  /** Sectors the family office is trying to assemble. */
  fitSectors?: string[];
}

export const RIVALS: Record<RivalId, RivalProfile> = {
  masego: {
    id: 'masego',
    name: 'Masego Capital',
    kind: 'sponsor',
    ceilingMultiple: [0.88, 1.06],
    openingFraction: [0.8, 0.93],
    overpaysOnFit: false,
  },
  tanerelle: {
    id: 'tanerelle',
    name: 'Tanerélle Office',
    kind: 'family-office',
    ceilingMultiple: [0.95, 1.24],
    openingFraction: [0.72, 0.9],
    overpaysOnFit: true,
    fitSectors: ['Consumer / Retail', 'Food & Beverage', 'Leisure & Hospitality'],
  },
};

export const RIVAL_LIST = Object.values(RIVALS);

// ---------------------------------------------------------------------------
// Individuals
// ---------------------------------------------------------------------------

export const SELLER_CHAIR = 'Eleanor March';
export const SELLER_NEGOTIATOR = 'Chief';
export const CASE_OFFICER = 'Mari';

// ---------------------------------------------------------------------------
// Difficulty tiers
// ---------------------------------------------------------------------------

export const DIFFICULTY_PROFILES: Record<DifficultyTier, DifficultyProfile> = {
  'clean-team': {
    id: 'clean-team',
    name: 'Clean Team',
    summary:
      'Full disclosure, a generous budget, and a seller that negotiates in good faith. Everything that is wrong with the company is findable.',
    disclosure: 'full',
    diligenceBudget: 16,
    sellerResistance: 0.75,
    reportsCompromised: false,
  },
  'red-flag': {
    id: 'red-flag',
    name: 'Red Flag',
    summary:
      'Partial disclosure, a constrained budget, and a seller that withholds. What you find depends on where you look.',
    disclosure: 'selective',
    diligenceBudget: 12,
    sellerResistance: 1,
    reportsCompromised: false,
  },
  'shutter-island': {
    id: 'shutter-island',
    name: 'Shutter Island',
    summary:
      'The seller has buried the liability, and the report you commission to find it is wrong. There is no combination of spend and diligence that reaches the truth before you sign.',
    disclosure: 'bury',
    diligenceBudget: 10,
    sellerResistance: 1.3,
    reportsCompromised: true,
  },
};

export const DIFFICULTY_LIST = Object.values(DIFFICULTY_PROFILES);

/** Miss rate floor imposed when the reports themselves are compromised. */
export const COMPROMISED_REPORT_MISS_RATE = 0.45;

// ---------------------------------------------------------------------------
// Deal codenames
// ---------------------------------------------------------------------------

export const DEAL_CODENAMES = [
  'Kyoto',
  'Delight',
  'Heniwe',
  'Braid',
  'Shutter',
  'Butterfly',
  'Veni',
] as const;

/** Reserved for the tutorial deal. */
export const TUTORIAL_CODENAME = 'Easter';
/** Reserved for scenarios where the diligence report is unreliable. */
export const COMPROMISED_REPORT_CODENAME = 'Shutter';

/** The disclosure bundle is labelled this throughout the UI. */
export const DISCLOSURE_BUNDLE_LABEL = 'the Exposé';

/** Long stop date defaults to 23 March of the following year. */
export const LONG_STOP_DAY = 23;
export const LONG_STOP_MONTH = 3;
