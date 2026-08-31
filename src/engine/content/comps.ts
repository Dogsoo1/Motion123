import type { Sector } from '../types.js';

/**
 * Trading and transaction comparables by sector (GDD §8.1).
 *
 * `spread` is how wide the observable set of comparables is — the player picks
 * which names are "most comparable", and a wider spread means that judgment
 * call moves the answer more.
 */
export interface SectorComps {
  sector: Sector;
  /** Median EV/EBITDA multiple for trading comps. */
  evEbitda: number;
  /** Median EV/Revenue multiple. */
  evRevenue: number;
  /** Median P/E multiple. */
  peRatio: number;
  /** Half-width of the observable comp set, as a fraction of the median. */
  spread: number;
  /** Median control premium paid in precedent transactions, as a fraction. */
  controlPremium: number;
  /** Weighted average cost of capital used by the DCF template. */
  wacc: number;
  /** Long-run terminal growth rate. */
  terminalGrowth: number;
}

export const SECTOR_COMPS: Record<Sector, SectorComps> = {
  Technology: {
    sector: 'Technology',
    evEbitda: 17.5,
    evRevenue: 4.8,
    peRatio: 28,
    spread: 0.32,
    controlPremium: 0.32,
    wacc: 0.098,
    terminalGrowth: 0.03,
  },
  'Healthcare / Pharma': {
    sector: 'Healthcare / Pharma',
    evEbitda: 14.2,
    evRevenue: 3.6,
    peRatio: 22,
    spread: 0.3,
    controlPremium: 0.36,
    wacc: 0.09,
    terminalGrowth: 0.025,
  },
  'Financial Services': {
    sector: 'Financial Services',
    evEbitda: 10.5,
    evRevenue: 2.4,
    peRatio: 13,
    spread: 0.22,
    controlPremium: 0.26,
    wacc: 0.095,
    terminalGrowth: 0.02,
  },
  Energy: {
    sector: 'Energy',
    evEbitda: 6.8,
    evRevenue: 1.5,
    peRatio: 11,
    spread: 0.35,
    controlPremium: 0.24,
    wacc: 0.11,
    terminalGrowth: 0.01,
  },
  'Consumer / Retail': {
    sector: 'Consumer / Retail',
    evEbitda: 11.0,
    evRevenue: 1.4,
    peRatio: 18,
    spread: 0.24,
    controlPremium: 0.29,
    wacc: 0.088,
    terminalGrowth: 0.02,
  },
  Industrials: {
    sector: 'Industrials',
    evEbitda: 10.2,
    evRevenue: 1.7,
    peRatio: 17,
    spread: 0.2,
    controlPremium: 0.27,
    wacc: 0.086,
    terminalGrowth: 0.02,
  },
  'Media / Telecom': {
    sector: 'Media / Telecom',
    evEbitda: 8.6,
    evRevenue: 2.1,
    peRatio: 15,
    spread: 0.28,
    controlPremium: 0.3,
    wacc: 0.09,
    terminalGrowth: 0.015,
  },
  'Real Estate': {
    sector: 'Real Estate',
    evEbitda: 16.0,
    evRevenue: 6.5,
    peRatio: 24,
    spread: 0.18,
    controlPremium: 0.2,
    wacc: 0.075,
    terminalGrowth: 0.02,
  },
  'Defense / Aerospace': {
    sector: 'Defense / Aerospace',
    evEbitda: 13.4,
    evRevenue: 2.2,
    peRatio: 21,
    spread: 0.19,
    controlPremium: 0.28,
    wacc: 0.082,
    terminalGrowth: 0.02,
  },
  'Professional Services': {
    sector: 'Professional Services',
    evEbitda: 12.1,
    evRevenue: 2.0,
    peRatio: 19,
    spread: 0.26,
    controlPremium: 0.31,
    wacc: 0.092,
    terminalGrowth: 0.025,
  },
};
