import type { AcquirerProfile, TargetCompany } from '../types.js';

/**
 * Target Company cards (GDD §4.3, Appendix A). All figures in $M.
 *
 * Share prices are calibrated against intrinsic value at a neutral market, so
 * that a control premium somewhere in the 10-50% range lands at fair value.
 * The ratio differs by target on purpose: Atlas trades at 90% of intrinsic and
 * breaks even at an 11% premium, while Beacon trades at 68% and tolerates 47%.
 * Nothing on the card says which is which — working that out is the point of
 * Phase 1, and it is why the valuation work is worth paying for.
 */
export const TARGET_COMPANIES: TargetCompany[] = [
  {
    id: 'nexagen',
    name: 'Nexagen Therapeutics, Inc.',
    sector: 'Healthcare / Pharma',
    subSector: 'Oncology',
    description:
      'Commercial-stage oncology company with three approved therapies and a late-stage pipeline. Growth is real but the lead asset’s exclusivity clock is loud.',
    revenue: [1980, 2210, 2400],
    ebitda: [352, 420, 480],
    netIncome: [148, 182, 215],
    totalDebt: 900,
    cash: 310,
    sharesOutstanding: 210,
    sharePrice: 18.05,
    employees: 1200,
    headquarters: 'Cambridge, MA',
    keyAssets: [
      'Three FDA-approved oncology therapies',
      'Phase III pipeline with two candidates',
      'Manufacturing facility with EU and US approvals',
    ],
    knownRisks: [
      'Lead drug patent expires in four years',
      'FDA warning letter (resolved) in 2024',
      'Top three PBMs represent 55% of revenue',
    ],
    marketSharePct: 14,
    hiddenFindingIds: [
      'dr-ip-patentchallenge',
      'dr-ip-noncompete',
      'dr-legal-quitam',
      'dr-comm-changeofcontrol',
    ],
    projectedGrowthPct: 7.5,
    projectedMarginPct: 21,
  },
  {
    id: 'meridian',
    name: 'Meridian Industrial Systems',
    sector: 'Industrials',
    subSector: 'Factory Automation',
    description:
      'Mid-market automation supplier with an installed base that generates high-margin service revenue. Unglamorous, cash-generative, and quietly under-invested.',
    revenue: [1420, 1495, 1560],
    ebitda: [227, 241, 258],
    netIncome: [96, 104, 112],
    totalDebt: 540,
    cash: 85,
    sharesOutstanding: 96,
    sharePrice: 12.7,
    employees: 4300,
    headquarters: 'Milwaukee, WI',
    keyAssets: [
      'Installed base of 14,000 systems under service contract',
      'Four manufacturing plants across two continents',
      'Long-tenured engineering workforce',
    ],
    knownRisks: [
      'Cyclical exposure to capital spending',
      'Two plants are over 40 years old',
      'Pension plan is 88% funded',
    ],
    marketSharePct: 22,
    hiddenFindingIds: [
      'dr-env-contamination',
      'dr-ops-deferredcapex',
      'dr-ops-singlesource',
      'dr-hr-misclass',
    ],
    projectedGrowthPct: 3.5,
    projectedMarginPct: 16.5,
  },
  {
    id: 'atlas-data',
    name: 'Atlas Data Platforms',
    sector: 'Technology',
    subSector: 'Enterprise Infrastructure Software',
    description:
      'High-growth data infrastructure vendor with enviable net retention and an engineering culture that may or may not survive an acquirer.',
    revenue: [610, 840, 1080],
    ebitda: [61, 118, 194],
    netIncome: [8, 41, 96],
    totalDebt: 150,
    cash: 420,
    sharesOutstanding: 140,
    sharePrice: 25.8,
    employees: 2600,
    headquarters: 'Seattle, WA',
    keyAssets: [
      'Distributed query engine with a substantial patent estate',
      'Net revenue retention of 131%',
      'Roughly 900 enterprise customers',
    ],
    knownRisks: [
      'Growth decelerating from 38% to 29%',
      'Heavy stock-based compensation understates true cost',
      'Founder-CTO has signalled she will leave post-closing',
    ],
    marketSharePct: 11,
    hiddenFindingIds: [
      'dr-ip-opensource',
      'dr-hr-keyman',
      'dr-fin-addbacks',
      'dr-ops-cyber',
    ],
    projectedGrowthPct: 24,
    projectedMarginPct: 22,
  },
  {
    id: 'cascade-retail',
    name: 'Cascade Retail Group',
    sector: 'Consumer / Retail',
    subSector: 'Specialty Retail',
    description:
      'Specialty retailer mid-way through a digital transition, with a store fleet that is half asset and half liability.',
    revenue: [3100, 3040, 3180],
    ebitda: [279, 243, 286],
    netIncome: [92, 61, 98],
    totalDebt: 1150,
    cash: 140,
    sharesOutstanding: 175,
    sharePrice: 5.85,
    employees: 21000,
    headquarters: 'Portland, OR',
    keyAssets: [
      '640 stores, 190 of them owned freehold',
      'Loyalty programme with 11M active members',
      'Private label lines at 34% of revenue',
    ],
    knownRisks: [
      'E-commerce penetration lags peers by 900bps',
      'Roughly 120 leases expire within 24 months',
      'Two consecutive years of negative comparable sales',
    ],
    marketSharePct: 9,
    hiddenFindingIds: [
      'dr-legal-classaction',
      'dr-fin-workingcapital',
      'dr-comm-pricing',
      'dr-hr-parachutes',
    ],
    projectedGrowthPct: 1.5,
    projectedMarginPct: 9,
  },
  {
    id: 'granite-energy',
    name: 'Granite Midstream Partners',
    sector: 'Energy',
    subSector: 'Midstream Infrastructure',
    description:
      'Contracted midstream assets with long-dated take-or-pay revenue. Boring cash flows, interesting counterparty risk.',
    revenue: [890, 940, 1010],
    ebitda: [445, 470, 515],
    netIncome: [138, 151, 172],
    totalDebt: 2100,
    cash: 60,
    sharesOutstanding: 118,
    sharePrice: 11.8,
    employees: 780,
    headquarters: 'Houston, TX',
    keyAssets: [
      '2,400 miles of gathering and transmission pipeline',
      'Take-or-pay contracts averaging 9 years remaining',
      'Two processing facilities with expansion permits',
    ],
    knownRisks: [
      'Leverage at 4.1x with a covenant at 4.75x',
      'Largest shipper accounts for 38% of throughput',
      'Right-of-way renewals concentrated in 2028',
    ],
    marketSharePct: 26,
    hiddenFindingIds: [
      'dr-comm-concentration',
      'dr-env-emissions',
      'dr-tax-transferpricing',
      'dr-legal-employment',
    ],
    projectedGrowthPct: 4,
    projectedMarginPct: 50,
  },
  {
    id: 'harbor-financial',
    name: 'Harbor Financial Technologies',
    sector: 'Financial Services',
    subSector: 'Payments Infrastructure',
    description:
      'Payments processor sitting between banks and merchants, with regulatory exposure on both sides of that sentence.',
    revenue: [1240, 1390, 1520],
    ebitda: [285, 334, 380],
    netIncome: [118, 141, 163],
    totalDebt: 620,
    cash: 240,
    sharesOutstanding: 130,
    sharePrice: 17.6,
    employees: 3100,
    headquarters: 'Charlotte, NC',
    keyAssets: [
      'Direct processing relationships with 34 issuing banks',
      'Licences in 48 states as a money transmitter',
      'Fraud engine with a decade of labelled transaction data',
    ],
    knownRisks: [
      'Interchange regulation under active review',
      'Two state examinations open',
      'Concentration in card-present volume',
    ],
    marketSharePct: 18,
    hiddenFindingIds: [
      'dr-legal-fcpa',
      'dr-ops-cyber',
      'dr-tax-audit',
      'dr-comm-concentration',
    ],
    projectedGrowthPct: 9,
    projectedMarginPct: 25,
  },
  {
    id: 'summit-defense',
    name: 'Summit Aerostructures',
    sector: 'Defense / Aerospace',
    subSector: 'Structural Components',
    description:
      'Tier-one supplier on two long-production defence programmes. Revenue visibility measured in decades, margins measured in basis points.',
    revenue: [1680, 1740, 1830],
    ebitda: [252, 268, 288],
    netIncome: [98, 107, 118],
    totalDebt: 700,
    cash: 130,
    sharesOutstanding: 88,
    sharePrice: 23.0,
    employees: 6200,
    headquarters: 'Wichita, KS',
    keyAssets: [
      'Sole-source positions on two production programmes',
      'Facility clearances and ITAR registration',
      'Automated composite line commissioned in 2024',
    ],
    knownRisks: [
      'Programme concentration: two customers, 71% of revenue',
      'Fixed-price contracts with inflation exposure',
      'Foreign ownership rules constrain the buyer universe',
    ],
    marketSharePct: 31,
    hiddenFindingIds: [
      'dr-fin-revrec',
      'dr-hr-parachutes',
      'dr-env-emissions',
      'dr-ops-singlesource',
    ],
    projectedGrowthPct: 4.5,
    projectedMarginPct: 15.5,
  },
  {
    id: 'beacon-media',
    name: 'Beacon Media Networks',
    sector: 'Media / Telecom',
    subSector: 'Regional Broadcast & Digital',
    description:
      'Regional broadcaster with a digital arm that is growing fast off a small base while the core business erodes slowly off a large one.',
    revenue: [1050, 1010, 995],
    ebitda: [262, 232, 224],
    netIncome: [76, 58, 51],
    totalDebt: 980,
    cash: 70,
    sharesOutstanding: 145,
    sharePrice: 2.7,
    employees: 3400,
    headquarters: 'Atlanta, GA',
    keyAssets: [
      '38 broadcast licences across 22 markets',
      'Retransmission agreements with four major distributors',
      'Digital arm growing at 26% annually',
    ],
    knownRisks: [
      'Core advertising revenue declining mid-single digits',
      'FCC ownership caps limit in-market consolidation',
      'Retransmission renewals concentrated in one year',
    ],
    marketSharePct: 24,
    hiddenFindingIds: [
      'dr-comm-changeofcontrol',
      'dr-fin-addbacks',
      'dr-legal-employment',
      'dr-hr-misclass',
    ],
    projectedGrowthPct: -1,
    projectedMarginPct: 22,
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
      'Middle-market sponsor on its fifth fund. Disciplined on entry multiples, aggressive on leverage, judged on IRR rather than empire size.',
    cashOnHand: 2400,
    debtCapacity: 6500,
    marketSharePct: 0,
    sector: 'Professional Services',
  },
  {
    id: 'vantage-strategic',
    name: 'Vantage Industries',
    kind: 'strategic',
    description:
      'Diversified strategic acquirer with real synergy potential — and real antitrust overlap wherever that synergy comes from.',
    cashOnHand: 3800,
    debtCapacity: 5200,
    marketSharePct: 19,
    sector: 'Industrials',
  },
  {
    id: 'northstar-tech',
    name: 'Northstar Technology Group',
    kind: 'strategic',
    description:
      'Platform acquirer in enterprise software. Pays up for growth, integrates hard, and attracts regulatory attention by reputation alone.',
    cashOnHand: 5200,
    debtCapacity: 4000,
    marketSharePct: 17,
    sector: 'Technology',
  },
  {
    id: 'kestrel-health',
    name: 'Kestrel Health Holdings',
    kind: 'strategic',
    description:
      'Healthcare consolidator with a portfolio that overlaps most oncology assets on the market.',
    cashOnHand: 4100,
    debtCapacity: 5800,
    marketSharePct: 16,
    sector: 'Healthcare / Pharma',
  },
];

export const ACQUIRER_BY_ID: Record<string, AcquirerProfile> = Object.fromEntries(
  ACQUIRERS.map((a) => [a.id, a]),
);
