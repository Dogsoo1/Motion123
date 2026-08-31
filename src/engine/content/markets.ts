import type { MarketEnvironment, MarketEnvironmentId } from '../types.js';

/** Market Environment cards (GDD §4.2). Set at setup, mutable via Event Cards. */
export const MARKET_ENVIRONMENTS: Record<MarketEnvironmentId, MarketEnvironment> = {
  bull: {
    id: 'bull',
    name: 'Bull Market',
    description:
      'Valuations are stretched, credit is cheap and abundant, and every good asset draws a crowd. Paying up is the price of admission — and the risk.',
    valuationMultiplier: 1.18,
    financingCostBps: -50,
    competitionLevel: 0.8,
    regulatoryIntensity: 0.5,
    volatility: 0.3,
  },
  bear: {
    id: 'bear',
    name: 'Bear Market',
    description:
      'Multiples have compressed and lenders have gone quiet. Fewer bidders, but financing is expensive and sellers are reluctant to accept the clearing price.',
    valuationMultiplier: 0.82,
    financingCostBps: 175,
    competitionLevel: 0.25,
    regulatoryIntensity: 0.4,
    volatility: 0.45,
  },
  volatile: {
    id: 'volatile',
    name: 'Volatile Market',
    description:
      'Direction changes weekly. Signing and closing can happen in two different worlds — collars and MAC definitions earn their keep here.',
    valuationMultiplier: 1.0,
    financingCostBps: 75,
    competitionLevel: 0.5,
    regulatoryIntensity: 0.5,
    volatility: 0.75,
  },
  'regulatory-tightening': {
    id: 'regulatory-tightening',
    name: 'Regulatory Tightening',
    description:
      'The agencies are litigating cases they would have settled two years ago. Timelines stretch, remedies get harder to sell, and deal certainty is scarce.',
    valuationMultiplier: 0.95,
    financingCostBps: 25,
    competitionLevel: 0.45,
    regulatoryIntensity: 0.85,
    volatility: 0.4,
  },
  'sector-rotation': {
    id: 'sector-rotation',
    name: 'Sector Rotation',
    description:
      'Capital is stampeding out of last year’s winners and into this year’s. What a target is worth depends enormously on which side of the rotation it sits.',
    valuationMultiplier: 1.05,
    financingCostBps: 40,
    competitionLevel: 0.6,
    regulatoryIntensity: 0.45,
    volatility: 0.6,
  },
};

export const MARKET_ENVIRONMENT_LIST: MarketEnvironment[] = Object.values(MARKET_ENVIRONMENTS);
