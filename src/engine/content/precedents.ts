import type { DefenseCard, PrecedentCard } from '../types.js';

/**
 * Precedent cards (GDD §7.1). These reflect the *patterns* Delaware and the
 * federal courts have established, not the holdings of any specific case.
 * Each one shifts the odds in a dispute.
 */
export const PRECEDENT_CARDS: PrecedentCard[] = [
  {
    id: 'prec-mac-durational',
    name: 'Durational Significance',
    area: 'mac',
    description:
      'A buyer must show the decline is durationally significant — measured in years, not quarters. Short-term shocks rarely clear the bar.',
    modifier: -0.22,
  },
  {
    id: 'prec-mac-heavy-burden',
    name: 'Heavy Burden on the Buyer',
    area: 'mac',
    description:
      'The party invoking the clause carries a heavy burden. Buyer’s remorse dressed as a MAC is a losing argument.',
    modifier: -0.28,
  },
  {
    id: 'prec-mac-sustained-decline',
    name: 'Sustained and Company-Specific Decline',
    area: 'mac',
    description:
      'Where the decline is severe, sustained and specific to the target rather than the sector, courts have permitted the buyer to walk.',
    modifier: 0.3,
  },
  {
    id: 'prec-mac-disproportionate',
    name: 'Disproportionate Impact Controls',
    area: 'mac',
    description:
      'Carve-outs do not protect a seller whose business is hit materially worse than its peers — the exception swallows the carve-out.',
    modifier: 0.2,
  },
  {
    id: 'prec-mac-regulatory-breach',
    name: 'Regulatory Compliance Rep Breach',
    area: 'mac',
    description:
      'A breach of the compliance representation, serious enough to threaten the business itself, has supported termination.',
    modifier: 0.24,
  },
  {
    id: 'prec-mac-ordinary-course',
    name: 'Ordinary Course Covenant',
    area: 'mac',
    description:
      'The interim operating covenant is judged against the target’s own past practice, not against what a reasonable operator might do in a crisis.',
    modifier: 0.14,
  },
  {
    id: 'prec-anti-litigate',
    name: 'Agency Willing to Litigate',
    area: 'antitrust',
    description:
      'The agency has recently taken a marginal case to trial rather than settling for a behavioural remedy.',
    modifier: 0.18,
  },
  {
    id: 'prec-anti-vertical-loss',
    name: 'Vertical Theory Rejected',
    area: 'antitrust',
    description:
      'Courts have been sceptical of input-foreclosure theories absent concrete evidence of incentive and ability.',
    modifier: -0.24,
  },
  {
    id: 'prec-anti-structural-preferred',
    name: 'Structural Remedies Preferred',
    area: 'antitrust',
    description:
      'Divestiture of a standalone business is far more likely to be accepted than a promise about future conduct.',
    modifier: 0.1,
  },
  {
    id: 'prec-anti-efficiencies',
    name: 'Efficiencies Defence Credited',
    area: 'antitrust',
    description:
      'Verifiable, merger-specific efficiencies passed through to consumers were given real weight.',
    modifier: -0.2,
  },
  {
    id: 'prec-fid-revlon',
    name: 'Revlon Market Check',
    area: 'fiduciary',
    description:
      'Once the company is in sale mode, the board must have reasonable grounds to believe it obtained the best price reasonably available.',
    modifier: 0.16,
  },
  {
    id: 'prec-fid-unocal',
    name: 'Unocal Proportionality',
    area: 'fiduciary',
    description:
      'A defensive measure must be proportionate to the threat. Preclusive or coercive defences do not survive review.',
    modifier: 0.2,
  },
];

export const PRECEDENTS_BY_AREA = {
  mac: PRECEDENT_CARDS.filter((p) => p.area === 'mac'),
  antitrust: PRECEDENT_CARDS.filter((p) => p.area === 'antitrust'),
  fiduciary: PRECEDENT_CARDS.filter((p) => p.area === 'fiduciary'),
};

/** Defense mechanism cards available to the seller against a hostile bid (GDD §7.1). */
export const DEFENSE_CARDS: DefenseCard[] = [
  {
    id: 'def-poison-pill',
    name: 'Poison Pill (Shareholder Rights Plan)',
    description:
      'Rights plan triggering at 10% ownership, diluting any acquirer that crosses without board approval. Buys time and forces the bidder to negotiate.',
    costToBuyer: 0.06,
    reputationCost: 1,
    proportionality: 0.75,
  },
  {
    id: 'def-white-knight',
    name: 'White Knight Solicitation',
    description:
      'Solicit a friendlier bidder to compete. Serves shareholders and complicates the hostile bidder’s arithmetic at the same time.',
    costToBuyer: 0.09,
    reputationCost: 0,
    proportionality: 0.9,
  },
  {
    id: 'def-crown-jewel',
    name: 'Crown Jewel Defence',
    description:
      'Sell or option the asset the bidder actually wants. Effective, and very hard to defend as proportionate.',
    costToBuyer: 0.14,
    reputationCost: 3,
    proportionality: 0.25,
  },
  {
    id: 'def-staggered-board',
    name: 'Staggered Board',
    description:
      'Only a third of directors stand each year, so a proxy fight takes two cycles to win. Structural, slow, and effective.',
    costToBuyer: 0.05,
    reputationCost: 0,
    proportionality: 0.85,
  },
  {
    id: 'def-golden-parachute',
    name: 'Golden Parachutes',
    description:
      'Enhanced change-of-control payments raise the cost of replacing management and signal that the board is dug in.',
    costToBuyer: 0.04,
    reputationCost: 2,
    proportionality: 0.5,
  },
  {
    id: 'def-litigation',
    name: 'Litigation',
    description:
      'Sue over disclosure defects in the tender offer materials. Rarely wins; reliably costs the bidder weeks.',
    costToBuyer: 0.05,
    reputationCost: 1,
    proportionality: 0.6,
  },
  {
    id: 'def-just-say-no',
    name: 'Just Say No',
    description:
      'Refuse to engage and let the shareholders decide at the annual meeting. Cheap, and only as strong as the board’s standing.',
    costToBuyer: 0.03,
    reputationCost: 1,
    proportionality: 0.7,
  },
];
