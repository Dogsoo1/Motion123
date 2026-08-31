import { applyAction, createGame, type GameAction, type GameState } from '../engine/game.js';
import { SCENARIOS } from '../engine/content/scenarios.js';
import { currentPrice } from '../engine/state.js';
import { PHASE_NAMES, ROLE_NAMES, type PhaseId } from '../engine/types.js';
import { clear, h } from './dom.js';
import { money } from './format.js';
import type { Ctx } from './views/common.js';
import { screeningView, valuationView } from './views/phase1.js';
import { ioiView, loiView } from './views/phase2.js';
import { diligenceAllocationView, diligenceReviewView } from './views/phase3.js';
import { structuringView } from './views/phase4.js';
import { agreementSummary, agreementView } from './views/phase5.js';
import { regulatoryView } from './views/phase6.js';
import { macDecisionView } from './views/phase7.js';
import { resultsView } from './views/results.js';

const root = document.getElementById('app')!;

let state: GameState | null = null;
let error = '';
let draft: Record<string, unknown> = {};
let lastStep = '';

function ctx(): Ctx {
  return {
    state: state!,
    error,
    draft,
    dispatch(action: GameAction) {
      const before = state!.step;
      const result = applyAction(state!, action);
      error = result.ok ? '' : (result.error ?? 'That is not available.');
      if (state!.step !== before) {
        draft = {};
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      render();
    },
    rerender: render,
  };
}

/** The scenario chooser, shown before a game starts. */
function setupScreen(): HTMLElement {
  return h(
    'div',
    null,
    h(
      'section',
      { class: 'panel' },
      h('header', null, 'Select a Scenario'),
      h(
        'div',
        { class: 'body' },
        h(
          'p',
          { class: 'lede' },
          'You play the Buyer. The Seller, the Banker and the Regulator are each played by the engine, and each is pursuing an objective you cannot see.',
        ),
        h(
          'p',
          null,
          'Seven phases, from screening the market to arguing about indemnity claims two years after closing. Every term you negotiate has a mechanical consequence later — that is the whole point.',
        ),
        h(
          'div',
          { class: 'grid two' },
          SCENARIOS.map((scenario) =>
            h(
              'div',
              {
                class: 'card',
                onclick: () => startGame(scenario.id),
              },
              h('div', { class: 'title' }, scenario.name),
              h('div', { class: 'meta' }, `${scenario.complexity} · ${scenario.focus.join(' · ')}`),
              h('div', { class: 'desc' }, scenario.premise),
              h(
                'ul',
                { class: 'muted', style: 'margin:10px 0 0;padding-left:16px;font-size:11.5px' },
                scenario.specialRules.map((rule) => h('li', null, rule)),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function startGame(scenarioId: string): void {
  state = createGame({ scenarioId, seed: `deal-${Date.now()}-${Math.floor(Math.random() * 9999)}` });
  error = '';
  draft = {};
  render();
}

function masthead(): HTMLElement {
  return h(
    'div',
    { class: 'masthead' },
    h('h1', null, 'Deal Room'),
    h('span', { class: 'sub' }, 'M&A Simulation'),
    h('span', { class: 'spacer' }),
    state
      ? h('span', { class: 'sub' }, `${state.scenario.name} · ${state.market.name}`)
      : h('span', { class: 'sub' }, 'Select a scenario'),
  );
}

function ticker(): HTMLElement | null {
  if (!state) return null;
  const player = state.players.buyer;
  const price = currentPrice(state);
  const items: [string, string, string][] = [
    ['Capital', money(player.capital), player.capital < 200 ? 'bad' : ''],
    ['Influence', String(player.influence), ''],
    ['Neg. points', String(player.negotiationPoints), ''],
    [
      'Reputation',
      player.reputation > 0 ? `+${player.reputation}` : String(player.reputation),
      player.reputation > 0 ? 'good' : player.reputation < 0 ? 'bad' : '',
    ],
    ['Sunk cost', money(state.buyerSunkCost), ''],
    ['Clock', `${state.clock} / ${state.parClock}`, state.clock > state.parClock ? 'bad' : ''],
  ];
  if (price > 0) items.splice(1, 0, ['Price', money(price), 'gold']);

  return h(
    'div',
    { class: 'ticker' },
    items.map(([label, value, tone]) =>
      h(
        'div',
        { class: 'item' },
        h('span', { class: 'label' }, label),
        h('span', { class: `value ${tone}`.trim() }, value),
      ),
    ),
  );
}

function phaseRail(): HTMLElement {
  const phases: PhaseId[] = [1, 2, 3, 4, 5, 6, 7, 8];
  return h(
    'div',
    { class: 'rail' },
    phases.map((phase) =>
      h(
        'div',
        {
          class: `stage ${phase === state!.phase ? 'active' : phase < state!.phase ? 'done' : ''}`.trim(),
          title: PHASE_NAMES[phase],
        },
        h('span', { class: 'n' }, `Phase ${phase}`),
        PHASE_NAMES[phase],
      ),
    ),
  );
}

function logPanel(): HTMLElement {
  return h(
    'section',
    { class: 'panel' },
    h('header', null, 'Deal Log', h('span', { class: 'tag' }, `${state!.log.length}`)),
    h(
      'div',
      { class: 'log' },
      state!.log
        .slice()
        .reverse()
        .map((entry) =>
          h(
            'div',
            { class: `entry ${entry.tone ?? ''}`.trim() },
            h(
              'div',
              { class: 'who' },
              `P${entry.phase} · ${entry.role === 'system' ? 'Market' : ROLE_NAMES[entry.role]}`,
            ),
            h('div', { class: 'what' }, entry.text),
            entry.detail && entry.detail.length > 0
              ? h('div', { class: 'detail' }, entry.detail.map((line) => h('div', null, line)))
              : null,
          ),
        ),
    ),
  );
}

function stepView(context: Ctx): HTMLElement {
  switch (state!.step) {
    case 'screening':
      return screeningView(context);
    case 'valuation-review':
      return valuationView(context);
    case 'ioi':
      return ioiView(context);
    case 'loi-negotiation':
      return loiView(context);
    case 'diligence-allocation':
      return diligenceAllocationView(context);
    case 'diligence-review':
      return diligenceReviewView(context);
    case 'structuring':
      return structuringView(context);
    case 'agreement':
      return agreementView(context);
    case 'regulatory':
      return regulatoryView(context);
    case 'interim':
    case 'mac-decision':
      return macDecisionView(context);
    case 'scoring':
      return resultsView(context, () => {
        state = null;
        render();
      });
    default:
      return h('div', null, 'Nothing to do here.');
  }
}

function render(): void {
  clear(root);

  if (!state) {
    root.appendChild(masthead());
    root.appendChild(setupScreen());
    return;
  }

  if (state.step !== lastStep) lastStep = state.step;

  const context = ctx();
  const showAgreement =
    state.agreement && (state.step === 'regulatory' || state.step === 'mac-decision');

  root.appendChild(masthead());
  root.appendChild(ticker()!);
  root.appendChild(phaseRail());
  root.appendChild(
    h(
      'div',
      { class: 'columns' },
      h('div', null, stepView(context), showAgreement ? agreementSummary(context) : null),
      h('div', null, logPanel()),
    ),
  );
}

render();
