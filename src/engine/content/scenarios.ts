import type { Scenario } from '../types.js';

/** Scenario library (GDD §12.1). */
export const SCENARIOS: Scenario[] = [
  {
    id: 'friendly-merger',
    name: 'The Friendly Merger',
    premise:
      'Two complementary businesses have agreed to talk. The board is receptive, the process is orderly, and the work is in getting the terms right.',
    complexity: 'beginner',
    focus: ['Valuation', 'Deal structure', 'Standard negotiation'],
    processType: 'targeted',
    diligenceBudget: 12,
    competingBidders: 0,
    regulatoryModule: 'basic',
    specialRules: ['No defence mechanisms', 'Clean learning scenario'],
  },
  {
    id: 'competitive-auction',
    name: 'The Competitive Auction',
    premise:
      'The sell-side has run a broad process and there is another bidder in the room. Speed and certainty are worth as much as price.',
    complexity: 'advanced',
    focus: ['Auction dynamics', 'Bid strategy', 'Information management'],
    processType: 'auction',
    diligenceBudget: 10,
    competingBidders: 2,
    regulatoryModule: 'basic',
    specialRules: [
      'Competing bidders submit sealed bids',
      'Reduced diligence budget — the process timetable is tight',
      'Seller may run a second round',
    ],
  },
  {
    id: 'leveraged-buyout',
    name: 'The Leveraged Buyout',
    premise:
      'A sponsor is taking a public company private on substantial leverage. The debt package is as negotiated as the merger agreement.',
    complexity: 'advanced',
    focus: ['LBO modelling', 'Financing structure', 'Debt markets'],
    market: 'volatile',
    processType: 'exclusive',
    acquirerId: 'crestline',
    diligenceBudget: 14,
    competingBidders: 1,
    regulatoryModule: 'basic',
    specialRules: [
      'Financing risk cards are active',
      'Returns are scored on IRR and MOIC, not deal size',
      'A financing condition is available but expensive in price terms',
    ],
  },
  {
    id: 'regulatory-gauntlet',
    name: 'The Regulatory Gauntlet',
    premise:
      'The strategic logic is obvious, which is exactly the problem. The overlap that creates the synergies also creates the antitrust case.',
    complexity: 'expert',
    focus: ['HSR process', 'Market definition', 'Remedy negotiation'],
    market: 'regulatory-tightening',
    processType: 'targeted',
    acquirerId: 'vantage-strategic',
    diligenceBudget: 12,
    competingBidders: 0,
    regulatoryModule: 'full',
    specialRules: [
      'Second Request probability is materially elevated',
      'Structural remedies may be required to clear',
      'Reverse termination fee is heavily negotiated',
    ],
  },
  {
    id: 'broken-deal',
    name: 'The Broken Deal',
    premise:
      'The agreement is signed. Between signing and closing, the world moves. Everything now turns on words negotiated weeks ago.',
    complexity: 'expert',
    focus: ['MAC invocation', 'Closing conditions', 'Specific performance'],
    market: 'volatile',
    processType: 'exclusive',
    diligenceBudget: 12,
    competingBidders: 1,
    regulatoryModule: 'basic',
    specialRules: [
      'Interim period draws three events instead of one',
      'MAC invocation sub-game is always available',
      'Deal protections carry unusual weight in scoring',
    ],
  },
];

export const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);
