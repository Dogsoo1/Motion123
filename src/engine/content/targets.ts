import type { AcquirerProfile, TargetCompany } from '../types.js';

/**
 * Target Company cards (GDD §4.3, Appendix A). All figures in $M.
 *
 * Names and profiles are fixed by NAMING.md; financials are generated to fit
 * the sector and size given there.
 *
 * Share prices are calibrated against intrinsic value at a neutral market, so
 * that a control premium somewhere in the 10-55% range lands at fair value.
 * The ratio differs by target on purpose: Singleton trades richly and breaks
 * even at a 12% premium, while Belgrave trades at a discount and tolerates
 * 52%. Nothing on the card says which is which — working that out is the point
 * of Phase 1, and it is why the valuation work is worth paying for.
 */
export const TARGET_COMPANIES: TargetCompany[] = [
  {
    id: 'avonmouth',
    name: 'Avonmouth Port Holdings',
    sector: 'Transport & Logistics',
    subSector: 'Ports & Terminals',
    description:
      'Mid-cap port infrastructure with long concession tails and a quay that has not been resurfaced since the nineties. Cash generative, capital hungry, and sitting on ground nobody has sampled properly in twenty years.',
    revenue: [386, 402, 421],
    ebitda: [131, 138, 148],
    netIncome: [41, 45, 51],
    totalDebt: 520,
    cash: 40,
    sharesOutstanding: 145,
    sharePrice: 5.78,
    employees: 1850,
    headquarters: 'Bristol',
    keyAssets: [
      'Three deep-water berths under concession to 2061',
      'Roughly 290 acres of freehold land inside the port estate',
      'Rail connection with a long-term access agreement',
    ],
    knownRisks: [
      'Capex programme deferred twice by the current board',
      'Concession renewal terms are at the authority’s discretion',
      'Two largest shipping customers on rolling annual terms',
    ],
    marketSharePct: 27,
    hiddenFindingIds: [
      'dr-env-contamination',
      'dr-ops-deferredcapex',
      'dr-comm-concentration',
      'dr-tax-transferpricing',
    ],
    projectedGrowthPct: 3.5,
    projectedMarginPct: 35,
  },
  {
    id: 'addlestone',
    name: 'Addlestone Leisure Group',
    sector: 'Leisure & Hospitality',
    subSector: 'Cinema & Family Entertainment',
    description:
      'Sixty-one sites, almost all leasehold, trading on thin margins in a business where the rent review is a bigger line item than the film rental. The estate is the whole story.',
    revenue: [571, 594, 612],
    ebitda: [66, 74, 79],
    netIncome: [12, 17, 21],
    totalDebt: 340,
    cash: 25,
    sharesOutstanding: 190,
    sharePrice: 0.55,
    employees: 4100,
    headquarters: 'Woking',
    keyAssets: [
      '61 sites, 8 freehold and 53 leasehold',
      'Loyalty programme with 2.4M enrolled members',
      'Refurbished premium screens at 14 of the top 20 sites',
    ],
    knownRisks: [
      'Weighted average lease length of 14 years, upward-only reviews',
      'Admissions have not recovered to pre-2020 levels',
      'Content slate concentration in two studio output deals',
    ],
    marketSharePct: 19,
    hiddenFindingIds: [
      'dr-fin-leases',
      'dr-comm-pricing',
      'dr-hr-parachutes',
      'dr-legal-employment',
    ],
    projectedGrowthPct: 1.5,
    projectedMarginPct: 13,
  },
  {
    id: 'march-holdings',
    name: 'March Holdings',
    sector: 'Industrials',
    subSector: 'Diversified Industrial',
    description:
      'Four divisions, none of them famous, all of them profitable. The kind of business that never appears in the trade press and never misses a quarter.',
    revenue: [812, 848, 881],
    ebitda: [92, 99, 106],
    netIncome: [38, 43, 47],
    totalDebt: 280,
    cash: 60,
    sharesOutstanding: 160,
    sharePrice: 3.46,
    employees: 5600,
    headquarters: 'Rugby',
    keyAssets: [
      'Four divisions with independent customer bases',
      'Nine manufacturing sites, seven freehold',
      'Order book covering 71% of the next year’s plan',
    ],
    knownRisks: [
      'Divisional performance has diverged for three years',
      'Group functions are thin for a business of this size',
      'Two divisions share a single ERP instance from 2011',
    ],
    marketSharePct: 16,
    hiddenFindingIds: [
      'dr-fin-addbacks',
      'dr-ops-singlesource',
      'dr-hr-misclass',
      'dr-tax-audit',
    ],
    projectedGrowthPct: 3,
    projectedMarginPct: 12,
  },
  {
    id: 'sedia',
    name: 'Sedia Group',
    sector: 'Consumer / Retail',
    subSector: 'Design-Led Furniture',
    description:
      'A furniture business with a genuine design reputation and a founder who still signs off every range. The brand is worth more than the factories, which is either the opportunity or the problem.',
    revenue: [278, 295, 311],
    ebitda: [38, 42, 46],
    netIncome: [15, 17, 19],
    totalDebt: 95,
    cash: 30,
    sharesOutstanding: 88,
    sharePrice: 3.24,
    employees: 1240,
    headquarters: 'High Wycombe',
    keyAssets: [
      'Registered designs across four flagship ranges',
      'Licensing income from three overseas manufacturing partners',
      'Direct specification relationships with major contract buyers',
    ],
    knownRisks: [
      'Founder is 68 and has no succession plan on record',
      'Licensing agreements renew on differing terms and dates',
      'Contract channel is lumpy and project-driven',
    ],
    marketSharePct: 11,
    hiddenFindingIds: [
      'dr-ip-license',
      'dr-ip-noncompete',
      'dr-ops-founder',
      'dr-comm-concentration',
    ],
    projectedGrowthPct: 5,
    projectedMarginPct: 15,
  },
  {
    id: 'singleton',
    name: 'Singleton Foods',
    sector: 'Food & Beverage',
    subSector: 'Breakfast Cereal & Grains',
    description:
      'A branded breakfast business with shelf space it has held for forty years and a specification file that has not kept up with what the packaging says.',
    revenue: [498, 521, 543],
    ebitda: [71, 76, 81],
    netIncome: [29, 32, 35],
    totalDebt: 210,
    cash: 35,
    sharesOutstanding: 120,
    sharePrice: 4.43,
    employees: 2200,
    headquarters: 'Melton Mowbray',
    keyAssets: [
      'Two brands with over 30% category share between them',
      'Long-standing listings with all four major grocers',
      'Milling and extrusion capacity at two owned sites',
    ],
    knownRisks: [
      'Own-label competition intensifying in the core category',
      'Commodity exposure hedged only twelve months out',
      'Reformulation programme running behind schedule',
    ],
    marketSharePct: 31,
    hiddenFindingIds: [
      'dr-legal-labelling',
      'dr-comm-changeofcontrol',
      'dr-ops-singlesource',
      'dr-fin-workingcapital',
    ],
    projectedGrowthPct: 2,
    projectedMarginPct: 15,
  },
  {
    id: 'belgrave',
    name: 'Belgrave Textiles',
    sector: 'Textiles & Apparel',
    subSector: 'Fast Fashion Manufacturing',
    description:
      'Leicester-based garment manufacturing supplying three of the large online retailers. Quick turnaround, short runs, and a subcontractor list longer than the employee list.',
    revenue: [218, 231, 243],
    ebitda: [22, 24, 26],
    netIncome: [7, 8, 9],
    totalDebt: 85,
    cash: 12,
    sharesOutstanding: 70,
    sharePrice: 0.67,
    employees: 890,
    headquarters: 'Leicester',
    keyAssets: [
      'Three cut-make-trim facilities within four miles of each other',
      'Two-week turnaround capability from design to delivery',
      'Preferred supplier status with two online retailers',
    ],
    knownRisks: [
      'Customer concentration: three accounts, 78% of revenue',
      'Ethical sourcing clauses in every major customer contract',
      'Sector has been subject to repeated press and regulatory attention',
    ],
    marketSharePct: 8,
    hiddenFindingIds: [
      'dr-hr-subcontracting',
      'dr-hr-misclass',
      'dr-comm-concentration',
      'dr-legal-employment',
    ],
    projectedGrowthPct: 4,
    projectedMarginPct: 11,
  },
];

export const TARGET_BY_ID: Record<string, TargetCompany> = Object.fromEntries(
  TARGET_COMPANIES.map((t) => [t.id, t]),
);

/** Acquirer Company cards (GDD §4.3). */
export const ACQUIRERS: AcquirerProfile[] = [
  {
    id: 'crestline',
    name: 'Crestline Capital Partners',
    kind: 'sponsor',
    description:
      'Mid-market sponsor on its fifth fund. Disciplined on entry multiples, aggressive on leverage, judged on IRR rather than empire size. No trading positions, so no overlap to explain to the regulator.',
    cashOnHand: 480,
    debtCapacity: 1300,
    marketSharePct: 0,
    sector: 'Professional Services',
    overlapSectors: [],
  },
  {
    id: 'vantage-strategic',
    name: 'Vantage Industries',
    kind: 'strategic',
    description:
      'Diversified strategic holding company with existing positions in industrials, ports and consumer manufacturing. Real synergies where it already operates — and a real antitrust case in exactly the same places.',
    cashOnHand: 760,
    debtCapacity: 1040,
    marketSharePct: 21,
    sector: 'Industrials',
    overlapSectors: ['Industrials', 'Transport & Logistics', 'Consumer / Retail'],
  },
];

export const ACQUIRER_BY_ID: Record<string, AcquirerProfile> = Object.fromEntries(
  ACQUIRERS.map((a) => [a.id, a]),
);
