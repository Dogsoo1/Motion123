import type { PrivateObjective } from '../types.js';

/** Private Objective cards (GDD §7.1). One is dealt to each player, kept secret. */
export const PRIVATE_OBJECTIVES: PrivateObjective[] = [
  {
    id: 'obj-speed',
    role: 'any',
    name: 'Maximise Closing Speed',
    description: 'Close the transaction without letting any phase run long. Momentum is the point.',
  },
  {
    id: 'obj-empire',
    role: 'buyer',
    name: 'Build the Empire',
    description: 'Close the largest deal you can. Scale is its own reward — score on total deal value.',
  },
  {
    id: 'obj-discipline',
    role: 'buyer',
    name: 'Price Discipline',
    description: 'Buy below intrinsic value, or walk. Overpaying scores nothing, however good the story.',
  },
  {
    id: 'obj-protection',
    role: 'buyer',
    name: 'Belt and Braces',
    description: 'Secure a genuinely protective agreement: broad reps, a real cap, and a long survival period.',
  },
  {
    id: 'obj-premium',
    role: 'seller',
    name: 'Protect Minority Shareholders',
    description: 'Deliver a premium above 30% to the unaffected trading price.',
  },
  {
    id: 'obj-certainty',
    role: 'seller',
    name: 'Certainty of Close',
    description: 'A signed deal that closes beats a higher price that does not. Minimise conditionality.',
  },
  {
    id: 'obj-process',
    role: 'seller',
    name: 'Unimpeachable Process',
    description: 'Run a market check thorough enough that no plaintiff’s lawyer can make anything of it.',
  },
  {
    id: 'obj-fees',
    role: 'banker',
    name: 'Fee Machine',
    description: 'Maximise advisory fees earned. Fees only accrue if the deal actually closes.',
  },
  {
    id: 'obj-accuracy',
    role: 'banker',
    name: 'Credible Fairness Opinion',
    description: 'Deliver a valuation that turns out to be close to the truth. Your reputation is the asset.',
  },
  {
    id: 'obj-hawk',
    role: 'regulator',
    name: 'Regulatory Hawk',
    description: 'Extract the maximum remedy the facts will support, or block the deal outright.',
  },
  {
    id: 'obj-efficiency',
    role: 'regulator',
    name: 'Enforcement Efficiency',
    description: 'Reach the right outcome without burning the investigation budget getting there.',
  },
  {
    id: 'obj-reputation',
    role: 'any',
    name: 'Reputation Builder',
    description: 'Finish the game with the highest reputation at the table. Deals repeat; behaviour is remembered.',
  },
];

export const OBJECTIVES_FOR_ROLE = (role: string): PrivateObjective[] =>
  PRIVATE_OBJECTIVES.filter((o) => o.role === role || o.role === 'any');
