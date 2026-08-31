/**
 * Balance harness: plays every scenario with three strategies of increasing
 * care and reports the score distribution. The game is only working if better
 * play scores better.
 *
 *   npm run balance
 */
import { applyAction, createGame, diligenceBudget } from '../dist/src/engine/game.js';
import { emptyAllocation } from '../dist/src/engine/diligence.js';
import { suggestFinancing } from '../dist/src/engine/structuring.js';
import { currentPrice, targetIntrinsic } from '../dist/src/engine/state.js';
import { DILIGENCE_CATEGORIES } from '../dist/src/engine/types.js';

// Three strategies, from careless to careful.
export const STRATEGIES = {
  reckless: { provider: 'santa-barbara', screenAll: false, methods: ['comps'], bidAt: 'high', dp: 2, pushes: { reps: 1, mac: 1, indemnity: 1, conditions: 1 }, retrade: 0, marketDef: 'narrow', remedy: 'none', influence: 0 },
  competent: { provider: 'santa-barbara', screenAll: true, methods: ['comps', 'precedent', 'dcf'], bidAt: 'mid', dp: 'full', pushes: { reps: 3, mac: 3, indemnity: 4, conditions: 3 }, retrade: 'justified', marketDef: 'standard', remedy: 'none', influence: 2 },
  disciplined: { provider: 'monk', screenAll: true, methods: ['comps', 'precedent', 'dcf'], bidAt: 'low', dp: 'deep', pushes: { reps: 3, mac: 3, indemnity: 5, conditions: 3 }, retrade: 'justified', marketDef: 'broad', remedy: 'behavioral', influence: 3 },
};

export function play(seed, scenarioId, strat, tier) {
  const s = createGame({ seed, scenarioId, difficulty: tier ?? DIFFICULTY });
  const act = (a) => applyAction(s, a);
  const targets = s.marketTargets;

  // Phase 1
  const toScreen = strat.screenAll ? targets : [targets[0]];
  for (const t of toScreen) act({ type: 'screen-target', targetId: t.id });
  // Pick the target the valuation work will like best: cheapest vs unaffected.
  let pick = toScreen[0];
  if (strat.screenAll) {
    let best = -Infinity;
    for (const t of toScreen) {
      s.target = t;
      const edge = targetIntrinsic(s) / (t.sharePrice * t.sharesOutstanding);
      if (strat.bidAt === 'low' && edge > best) { best = edge; pick = t; }
    }
    s.target = undefined;
    if (strat.bidAt !== 'low') pick = toScreen[0];
  }
  act({ type: 'select-target', targetId: pick.id });

  if (strat.methods.includes('comps')) act({ type: 'run-comps', compIds: s.comparables.slice(0, 4).map(c => c.id) });
  if (strat.methods.includes('precedent')) act({ type: 'run-precedent', precedentIds: s.precedentTransactions.slice(0, 3).map(p => p.id) });
  if (strat.methods.includes('dcf')) act({ type: 'run-dcf', assumptions: s.dcfAssumptions });
  act({ type: 'advance' });
  if (s.status !== 'active') return s;

  // Phase 2
  const v = s.valuation;
  const anchor = strat.bidAt === 'low' ? v.recommendedLow * 0.94
    : strat.bidAt === 'mid' ? (v.recommendedLow + v.recommendedHigh) / 2
    : v.recommendedHigh;
  act({ type: 'submit-ioi', ioi: { priceLow: anchor, priceHigh: anchor * 1.05, consideration: 'cash', exclusivityDays: 45, breakFeePct: 3, noShop: 'strict', depositPct: 0 } });
  let g = 0;
  while (s.step === 'loi-negotiation' && s.status === 'active' && g++ < 6) {
    const last = s.loiExchanges[s.loiExchanges.length - 1];
    // A disciplined buyer will not chase past its own ceiling.
    if (strat.bidAt === 'low' && last?.from === 'seller' && last.terms.price > anchor * 1.18) {
      act({ type: 'loi-respond', response: 'counter', terms: { ...last.terms, price: anchor * 1.08 } });
    } else {
      act({ type: 'loi-respond', response: 'accept' });
    }
  }
  if (s.status !== 'active') return s;

  // Phase 3
  const alloc = emptyAllocation();
  let budget = diligenceBudget(s);
  if (strat.dp === 'deep') {
    // Depth beats breadth, especially against a seller that buries.
    for (const c of DILIGENCE_CATEGORIES) { if (budget >= 3) { alloc[c] = 3; budget -= 3; } }
    for (const c of DILIGENCE_CATEGORIES) { if (alloc[c] === 0 && budget >= 1) { alloc[c] = 1; budget -= 1; } }
  } else if (strat.dp === 'full') {
    for (const c of DILIGENCE_CATEGORIES) { const w = budget >= 2 ? 2 : budget; alloc[c] = w; budget -= w; }
  } else {
    for (const c of DILIGENCE_CATEGORIES) { if (budget > 0) { alloc[c] = 1; budget -= 1; } if (budget <= 12 - strat.dp) break; }
  }
  act({ type: 'allocate-diligence', allocation: alloc, provider: strat.provider ?? 'monk' });
  const justified = s.diligence.priceAdjustmentPct;
  act({ type: 'reprice', requestedCutPct: strat.retrade === 'justified' ? justified : 0, walk: false });
  if (s.status !== 'active') return s;

  // Phase 4
  const price = currentPrice(s);
  act({ type: 'set-structure', decision: { structure: 'cash-merger', financing: suggestFinancing({ cashConsideration: price, acquirer: s.acquirer }), tax: 'taxable', cashPct: 1, collar: 'none', cvrPct: 0 } });
  if (s.step !== 'agreement') { // couldn't fund all-cash; go mixed
    act({ type: 'set-structure', decision: { structure: 'reverse-triangular', financing: suggestFinancing({ cashConsideration: price * 0.5, acquirer: s.acquirer }), tax: 'taxable', cashPct: 0.5, collar: 'none', cvrPct: 0 } });
  }
  if (s.step !== 'agreement') return s;

  // Phase 5
  const specials = [...new Set(s.diligence.findings.filter(f => f.demandsSpecialIndemnity && f.card.repCategory).map(f => f.card.repCategory))];
  act({ type: 'negotiate-agreement', pushes: strat.pushes, rwInsurance: strat.bidAt === 'low', specialIndemnities: specials });

  // Phase 6
  act({ type: 'regulatory-strategy', marketDefinitionId: strat.marketDef, offeredRemedy: strat.remedy, influenceSpent: Math.min(strat.influence, s.players.buyer.influence) });
  if (s.status !== 'active') return s;

  // Phase 7
  act({ type: 'mac-decision', invoke: false });
  return s;
}

export const SCENARIOS_USED = ['friendly-merger', 'competitive-auction', 'leveraged-buyout', 'regulatory-gauntlet', 'broken-deal'];

export const DIFFICULTY = process.env.TIER || 'red-flag';
const scenarios = ['friendly-merger', 'competitive-auction', 'leveraged-buyout', 'regulatory-gauntlet', 'broken-deal'];
const N = 120;
if (import.meta.url === `file://${process.argv[1]}`) {
console.log('strategy'.padEnd(13), 'mean'.padStart(7), 'median'.padStart(7), 'closed'.padStart(7), 'value+'.padStart(7), 'walked'.padStart(7));
for (const [name, strat] of Object.entries(STRATEGIES)) {
  const totals = [];
  let closed = 0, valueCreating = 0, walked = 0;
  for (let i = 0; i < N; i++) {
    const sc = scenarios[i % scenarios.length];
    let st;
    try { st = play(`bal-${i}`, sc, strat); } catch (e) { console.log('ERR', name, i, e.message); continue; }
    const score = st.scores?.find(x => x.role === 'buyer');
    if (score) totals.push(score.total);
    if (st.closing?.closed) { closed++; if (st.closing.realisedValue > st.closing.totalCost) valueCreating++; }
    else walked++;
  }
  totals.sort((a, b) => a - b);
  const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
  console.log(
    name.padEnd(13),
    mean.toFixed(1).padStart(7),
    totals[Math.floor(totals.length / 2)].toFixed(1).padStart(7),
    `${((closed / N) * 100).toFixed(0)}%`.padStart(7),
    `${((valueCreating / Math.max(1, closed)) * 100).toFixed(0)}%`.padStart(7),
    `${((walked / N) * 100).toFixed(0)}%`.padStart(7),
  );
}
}
