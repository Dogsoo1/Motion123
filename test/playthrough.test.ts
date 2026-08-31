import assert from 'node:assert/strict';
import test from 'node:test';

import { applyAction, createGame, diligenceBudget, type GameAction } from '../src/engine/game.js';
import { emptyAllocation } from '../src/engine/diligence.js';
import { suggestFinancing } from '../src/engine/structuring.js';
import type { GameState } from '../src/engine/state.js';
import { currentPrice, targetIntrinsic } from '../src/engine/state.js';
import { DILIGENCE_CATEGORIES, type DiligenceDepth } from '../src/engine/types.js';

/** Play a whole game with a straightforward, competent strategy. */
function playFullGame(seed: string, scenarioId = 'friendly-merger'): GameState {
  const state = createGame({ seed, scenarioId });
  const act = (action: GameAction) => {
    const result = applyAction(state, action);
    if (!result.ok && state.status === 'active') {
      throw new Error(`${action.type} failed: ${result.error}`);
    }
    return result;
  };

  // Phase 1 — screen every target, pursue the first, run all three methods.
  for (const target of state.marketTargets) {
    act({ type: 'screen-target', targetId: target.id });
  }
  act({ type: 'select-target', targetId: state.marketTargets[0].id });

  act({ type: 'run-comps', compIds: state.comparables.slice(0, 4).map((c) => c.id) });
  act({
    type: 'run-precedent',
    precedentIds: state.precedentTransactions.slice(0, 3).map((p) => p.id),
  });
  act({ type: 'run-dcf', assumptions: state.dcfAssumptions! });
  act({ type: 'advance' });

  // Phase 2 — open near the bottom of the recommended range, then take the counter.
  const rec = state.valuation!;
  act({
    type: 'submit-ioi',
    ioi: {
      priceLow: rec.recommendedLow,
      priceHigh: rec.recommendedLow * 1.06,
      consideration: 'cash',
      exclusivityDays: 45,
      breakFeePct: 3,
      noShop: 'strict',
      depositPct: 0,
    },
  });
  let guard = 0;
  while (state.step === 'loi-negotiation' && state.status === 'active' && guard++ < 6) {
    act({ type: 'loi-respond', response: 'accept' });
  }
  if (state.status !== 'active') return state;

  // Phase 3 — spread the diligence budget with depth where it matters.
  const allocation = emptyAllocation();
  let budget = diligenceBudget(state);
  for (const category of DILIGENCE_CATEGORIES) {
    const want: DiligenceDepth = budget >= 3 ? 2 : budget >= 1 ? 1 : 0;
    allocation[category] = want;
    budget -= want;
  }
  act({ type: 'allocate-diligence', allocation });
  act({
    type: 'reprice',
    requestedCutPct: state.diligence!.priceAdjustmentPct,
    walk: false,
  });
  if (state.status !== 'active') return state;

  // Phase 4 — an all-cash merger on a conventional stack.
  const price = currentPrice(state);
  act({
    type: 'set-structure',
    decision: {
      structure: 'cash-merger',
      financing: suggestFinancing({ cashConsideration: price, acquirer: state.acquirer }),
      tax: 'taxable',
      cashPct: 1,
      collar: 'none',
      cvrPct: 0,
    },
  });

  // Phase 5 — push hardest on indemnity and the MAC.
  act({
    type: 'negotiate-agreement',
    pushes: { reps: 4, mac: 4, indemnity: 4, conditions: 2 },
    rwInsurance: false,
    specialIndemnities: [
      ...new Set(
        state.diligence!.findings
          .filter((f) => f.demandsSpecialIndemnity && f.card.repCategory)
          .map((f) => f.card.repCategory!),
      ),
    ],
  });

  // Phase 6 — argue for a broad market, offer nothing up front.
  act({
    type: 'regulatory-strategy',
    marketDefinitionId: 'broad',
    offeredRemedy: 'none',
    influenceSpent: 2,
  });
  if (state.status !== 'active') return state;

  // Phase 7 — close.
  act({ type: 'mac-decision', invoke: false });
  return state;
}

test('a full game reaches a terminal state and produces scores', () => {
  const state = playFullGame('regression-seed-1');
  assert.ok(state.status === 'complete' || state.status === 'terminated');
  assert.equal(state.phase, 8);
  assert.ok(state.scores, 'scores were produced');
  assert.equal(state.scores!.length, 4);
  for (const score of state.scores!) {
    assert.ok(Number.isFinite(score.total), `${score.role} total is finite`);
    assert.ok(score.max > 0);
  }
});

test('the same seed reproduces the same game exactly', () => {
  const a = playFullGame('determinism-seed');
  const b = playFullGame('determinism-seed');
  assert.equal(a.status, b.status);
  assert.equal(currentPrice(a), currentPrice(b));
  assert.deepEqual(
    a.scores!.map((s) => s.total),
    b.scores!.map((s) => s.total),
  );
  assert.equal(a.log.length, b.log.length);
});

test('different seeds produce different games', () => {
  const results = new Set<string>();
  for (let i = 0; i < 12; i++) {
    const state = playFullGame(`variety-${i}`);
    results.add(`${state.target?.id}:${currentPrice(state)}:${state.status}`);
  }
  assert.ok(results.size > 4, `expected varied outcomes, got ${results.size}`);
});

test('every scenario is playable end to end', () => {
  for (const scenarioId of [
    'friendly-merger',
    'competitive-auction',
    'leveraged-buyout',
    'regulatory-gauntlet',
    'broken-deal',
  ]) {
    for (let i = 0; i < 4; i++) {
      const state = playFullGame(`${scenarioId}-${i}`, scenarioId);
      assert.equal(state.phase, 8, `${scenarioId} reached scoring`);
      assert.ok(state.scores, `${scenarioId} produced scores`);
    }
  }
});

test('the buyer never spends more capital than it has without the engine noticing', () => {
  const state = playFullGame('capital-seed');
  assert.ok(
    state.buyerSunkCost > 0,
    'pursuing a deal costs money even before the purchase price',
  );
});

test('intrinsic value stays positive and finite for every target', () => {
  const state = createGame({ seed: 'intrinsic-check' });
  for (const target of state.marketTargets) {
    state.target = target;
    const value = targetIntrinsic(state);
    assert.ok(Number.isFinite(value), `${target.name} intrinsic value is finite`);
    assert.ok(value > 0, `${target.name} intrinsic value is positive`);
  }
});
