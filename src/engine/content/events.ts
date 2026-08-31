import type { IntegrationCard, InterimEvent } from '../types.js';

/** Interim-period events between signing and closing (GDD §7.1 Phase 7). */
export const INTERIM_EVENTS: InterimEvent[] = [
  {
    id: 'ev-sector-downturn',
    name: 'Sector-Wide Downturn',
    description:
      'Demand across the sector falls sharply. Every comparable company guides down; the target falls roughly in line with its peers.',
    ebitdaHitPct: 16,
    carveOutIds: ['industry-wide', 'general-economy'],
  },
  {
    id: 'ev-customer-loss',
    name: 'Largest Customer Defects',
    description:
      'The target’s biggest customer moves its volume to a competitor, citing uncertainty about the pending transaction.',
    ebitdaHitPct: 22,
    carveOutIds: ['announcement-effects'],
  },
  {
    id: 'ev-missed-quarter',
    name: 'Badly Missed Quarter',
    description:
      'The target misses its own plan by a wide margin. Management blames execution, not the market — peers did fine.',
    ebitdaHitPct: 19,
    carveOutIds: ['missed-projections'],
  },
  {
    id: 'ev-credit-freeze',
    name: 'Credit Markets Freeze',
    description:
      'A major institution’s distress dislocates credit markets. High-yield issuance halts and leveraged loan syndication seizes up.',
    ebitdaHitPct: 4,
    carveOutIds: ['general-economy', 'rates-fx'],
    financingShock: true,
  },
  {
    id: 'ev-topping-bid',
    name: 'Topping Bid Emerges',
    description:
      'A rival approaches the target’s board with a materially higher offer. Whether the board can engage depends entirely on the no-shop and fiduciary out negotiated in Phase 5.',
    ebitdaHitPct: 0,
    carveOutIds: [],
    toppingBid: true,
  },
  {
    id: 'ev-regulatory-shift',
    name: 'Adverse Rule Change',
    description:
      'A new regulation lands squarely on the target’s core business. It applies to everyone in the sector, but the target is more exposed than most.',
    ebitdaHitPct: 14,
    carveOutIds: ['law-change'],
  },
  {
    id: 'ev-plant-fire',
    name: 'Facility Loss',
    description:
      'A fire destroys the target’s principal production facility. Insurance will cover the assets; it will not cover the eighteen months of lost position.',
    ebitdaHitPct: 26,
    carveOutIds: ['acts-of-god'],
  },
  {
    id: 'ev-employee-exodus',
    name: 'Key Talent Exodus',
    description:
      'A competitor lifts out a substantial part of the target’s senior technical team during the interim period.',
    ebitdaHitPct: 12,
    carveOutIds: ['announcement-effects'],
  },
  {
    id: 'ev-fx-swing',
    name: 'Currency Shock',
    description:
      'A sharp move in the target’s primary trading currency compresses reported earnings without changing the underlying business.',
    ebitdaHitPct: 9,
    carveOutIds: ['rates-fx', 'general-economy'],
  },
  {
    id: 'ev-quiet',
    name: 'Quiet Interim Period',
    description:
      'Nothing much happens. The business performs in line, the lawyers finish the schedules, and everyone gets to the closing dinner.',
    ebitdaHitPct: 0,
    carveOutIds: [],
  },
];

/** Post-closing Integration Challenge cards (GDD §7.3 Phase 7). */
export const INTEGRATION_CARDS: IntegrationCard[] = [
  {
    id: 'int-culture-clash',
    name: 'Culture Clash',
    category: 'People',
    description:
      'Target employees resist the acquirer’s policies and processes. Voluntary attrition hits 20% in the first year, concentrated in the people you wanted to keep.',
    valueImpactPct: -15,
  },
  {
    id: 'int-customer-churn',
    name: 'Customer Retention Shortfall',
    category: 'Commercial',
    description:
      'Key accounts defect to a competitor citing uncertainty. The revenue synergy case assumed they would stay.',
    valueImpactPct: -10,
  },
  {
    id: 'int-synergy-shortfall',
    name: 'Synergy Realisation Gap',
    category: 'Financial',
    description:
      'Projected cost synergies prove only 60% achievable. The rest were double-counted or politically impossible.',
    valueImpactPct: -8,
  },
  {
    id: 'int-systems',
    name: 'Systems Integration Overrun',
    category: 'Operational',
    description:
      'The two ERP estates cannot be reconciled on the planned timeline. An additional $30M and eighteen months are required.',
    valueImpactPct: -5,
  },
  {
    id: 'int-compliance',
    name: 'Post-Closing Compliance Findings',
    category: 'Legal',
    description:
      'A post-closing audit surfaces compliance obligations the diligence process did not scope.',
    valueImpactPct: -5,
    repCategory: 'compliance',
    claimPct: 3,
  },
  {
    id: 'int-hidden-liability',
    name: 'Hidden Liability Emerges',
    category: 'Legal',
    description:
      'A pre-closing liability surfaces after the deal. Whether you recover a dollar of it depends entirely on the reps, the basket, the cap and the survival period.',
    valueImpactPct: -20,
    repCategory: 'litigation',
    claimPct: 12,
  },
  {
    id: 'int-tax-assessment',
    name: 'Pre-Closing Tax Assessment',
    category: 'Tax',
    description:
      'An authority assesses additional tax for pre-closing periods. The tax rep and any special indemnity now do the work.',
    valueImpactPct: -7,
    repCategory: 'tax',
    claimPct: 5,
  },
  {
    id: 'int-synergy-upside',
    name: 'Synergy Upside',
    category: 'Financial',
    description:
      'Revenue synergies exceed the plan. Cross-selling into the acquirer’s base lands faster than anyone modelled.',
    valueImpactPct: 10,
  },
  {
    id: 'int-talent-win',
    name: 'Talent Acquisition Pays Off',
    category: 'People',
    description:
      'The target’s engineering team ships a breakthrough on the combined platform within eighteen months.',
    valueImpactPct: 15,
  },
  {
    id: 'int-market-timing',
    name: 'Market Timing',
    category: 'Market',
    description:
      'The deal closed near the bottom of the cycle. Sector recovery lifts the asset independent of anything management did.',
    valueImpactPct: 12,
  },
  {
    id: 'int-clean-integration',
    name: 'Textbook Integration',
    category: 'Operational',
    description:
      'Day one goes to plan, the retention packages hold, and the integration management office actually earns its keep.',
    valueImpactPct: 6,
  },
  {
    id: 'int-regulatory-remedy-cost',
    name: 'Remedy Costs Bite',
    category: 'Regulatory',
    description:
      'The divested business was worth more inside the combination than the sale price implied. The remedy cost more than the model said.',
    valueImpactPct: -6,
  },
];
