import {
  DEAL_STRUCTURE_LIST,
  FINANCING_SOURCE_LIST,
  TAX_STRUCTURE_LIST,
} from '../../engine/index.js';
import {
  analyseFinancing,
  analyseStructure,
  maxAffordableCash,
  suggestFinancing,
} from '../../engine/structuring.js';
import { currentPrice } from '../../engine/state.js';
import { latest } from '../../engine/valuation.js';
import type {
  DealStructure,
  FinancingPlan,
  FinancingSource,
  StructuringDecision,
  TaxStructure,
} from '../../engine/types.js';
import { field, h, numberInput, panel, scrollTable, slider } from '../dom.js';
import { money, pct } from '../format.js';
import { callout, errorLine, type Ctx, draftValue, setDraft } from './common.js';

/** Phase 4 — structure, financing and tax (GDD §6 Phase 4). */
export function structuringView(ctx: Ctx): HTMLElement {
  const { state } = ctx;
  const target = state.target!;
  const price = currentPrice(state);

  const decision = draftValue<StructuringDecision>(ctx, 'structure', {
    structure: 'cash-merger',
    financing: suggestFinancing({ cashConsideration: price, acquirer: state.acquirer }),
    tax: 'taxable',
    cashPct: 1,
    collar: 'none',
    cvrPct: 0,
  });

  const update = (patch: Partial<StructuringDecision>) => {
    const next = { ...decision, ...patch };
    // Re-solve the stack whenever the cash requirement moves.
    if (patch.cashPct !== undefined || patch.structure !== undefined) {
      const structureInfo = DEAL_STRUCTURE_LIST.find((s) => s.id === next.structure)!;
      if (patch.structure !== undefined) {
        next.cashPct = Math.max(next.cashPct, structureInfo.cashRequirement);
      }
      next.financing = suggestFinancing({
        cashConsideration: price * next.cashPct,
        acquirer: state.acquirer,
      });
    }
    setDraft(ctx, 'structure', next);
    ctx.rerender();
  };

  const cashConsideration = price * decision.cashPct;
  const structureAnalysis = analyseStructure(decision, !!target.sharePrice);
  const financingAnalysis = analyseFinancing({
    plan: decision.financing,
    cashConsideration,
    acquirer: state.acquirer,
    targetEbitda: latest(target).ebitda,
    market: state.market,
  });
  const affordable = maxAffordableCash(state.acquirer);

  return h(
    'div',
    null,
    panel(
      'Transaction Structure',
      money(price),
      h(
        'div',
        { class: 'grid two' },
        DEAL_STRUCTURE_LIST.map((info) =>
          h(
            'div',
            {
              class: `card ${decision.structure === info.id ? 'selected' : ''}`,
              onclick: () => update({ structure: info.id as DealStructure }),
            },
            h('div', { class: 'title' }, info.name),
            h(
              'div',
              { class: 'meta' },
              `${Math.round(info.cashRequirement * 100)}% cash minimum · ${
                info.liabilityAssumption >= 0.9 ? 'full' : info.liabilityAssumption >= 0.5 ? 'partial' : 'limited'
              } liability`,
            ),
            h('div', { class: 'desc' }, info.summary),
          ),
        ),
      ),
      h(
        'ul',
        { class: 'muted', style: 'margin:14px 0 0;padding-left:18px;font-size:12.5px' },
        structureAnalysis.notes.map((note) => h('li', null, note)),
      ),
    ),

    panel(
      'Consideration Mix',
      `${Math.round(decision.cashPct * 100)}% cash`,
      field(
        `Cash component — ${Math.round(decision.cashPct * 100)}%`,
        slider(Math.round(decision.cashPct * 100), (v) => update({ cashPct: v / 100 }), {
          min: 0,
          max: 100,
          step: 5,
        }),
        `${money(cashConsideration)} cash, ${money(price - cashConsideration)} in stock. You can fund up to ${money(affordable)} in cash.`,
      ),
      cashConsideration > affordable
        ? callout(
            `This acquirer cannot fund ${money(cashConsideration)} in cash. Cash on hand plus debt capacity plus a co-investor reaches ${money(affordable)}. Use stock, or pay less.`,
            'bad',
          )
        : null,
      decision.cashPct < 1
        ? field(
            'Collar',
            h(
              'div',
              { class: 'seg' },
              (['none', 'fixed', 'floating', 'walk-away'] as const).map((collar) =>
                h(
                  'button',
                  {
                    class: decision.collar === collar ? 'on' : '',
                    onclick: () => update({ collar }),
                  },
                  collar === 'none' ? 'None' : collar.replace('-', ' '),
                ),
              ),
            ),
            'Protects the exchange ratio against a move in your stock between signing and closing. The seller charges for it.',
          )
        : null,
      field(
        `Contingent value right — ${pct(decision.cvrPct)} of deal value`,
        slider(decision.cvrPct, (v) => update({ cvrPct: v }), { min: 0, max: 15, step: 1 }),
        'Bridges a valuation gap by deferring part of the price to a milestone. Also guarantees a post-closing dispute.',
      ),
    ),

    panel(
      'Financing Stack',
      financingAnalysis.errors.length > 0 ? 'Does not balance' : `${financingAnalysis.blendedRateBps}bps blended`,
      h(
        'p',
        null,
        'Raise exactly the cash consideration. More leverage lifts returns and lowers your ability to survive a bad quarter.',
      ),
      scrollTable(
        h(
          'thead',
          null,
          h(
            'tr',
            null,
            h('th', null, 'Source'),
            h('th', { class: 'num' }, 'Rate'),
            h('th', { style: 'width:34%' }, 'Amount ($M)'),
            h('th', null, ''),
          ),
        ),
        h(
          'tbody',
          null,
          FINANCING_SOURCE_LIST.map((source) =>
            h(
              'tr',
              null,
              h('td', null, source.name),
              h(
                'td',
                { class: 'num' },
                source.baseRateBps === 0 ? '—' : `${source.baseRateBps + state.market.financingCostBps}bps`,
              ),
              h(
                'td',
                null,
                numberInput(
                  Math.round(decision.financing[source.id as FinancingSource] ?? 0),
                  (v) => {
                    const financing: FinancingPlan = { ...decision.financing };
                    if (v <= 0) delete financing[source.id as FinancingSource];
                    else financing[source.id as FinancingSource] = v;
                    setDraft(ctx, 'structure', { ...decision, financing });
                    ctx.rerender();
                  },
                  { step: 50, min: 0 },
                ),
              ),
              h('td', { class: 'muted', style: 'font-size:11.5px' }, source.notes),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'grid three', style: 'margin-top:14px' },
        stat('Raised', money(financingAnalysis.totalRaised)),
        stat('Required', money(cashConsideration)),
        stat('Total debt', money(financingAnalysis.totalDebt)),
        stat('Leverage', `${financingAnalysis.leverageTurns.toFixed(1)}x`),
        stat('Equity cheque', money(financingAnalysis.equityCheck)),
        stat('Annual interest', money(financingAnalysis.annualInterest)),
      ),
      h(
        'div',
        { class: 'actions' },
        h(
          'button',
          {
            onclick: () =>
              update({
                financing: suggestFinancing({ cashConsideration, acquirer: state.acquirer }),
              }),
          },
          'Re-solve the stack',
        ),
      ),
      financingAnalysis.errors.map((error) => callout(error, 'bad')),
      financingAnalysis.warnings.map((warning) => callout(warning, '')),
    ),

    panel(
      'Tax Structure',
      null,
      h(
        'div',
        { class: 'grid two' },
        TAX_STRUCTURE_LIST.map((info) =>
          h(
            'div',
            {
              class: `card ${decision.tax === info.id ? 'selected' : ''}`,
              onclick: () => update({ tax: info.id as TaxStructure }),
            },
            h('div', { class: 'title' }, info.name),
            h(
              'div',
              { class: 'meta' },
              info.sellerPriceDemand > 0
                ? `Seller will want +${pct(info.sellerPriceDemand * 100)}`
                : info.sellerPriceDemand < 0
                  ? `Seller will accept ${pct(info.sellerPriceDemand * 100)}`
                  : 'Price neutral',
            ),
            h('div', { class: 'desc' }, info.summary),
          ),
        ),
      ),
    ),

    h(
      'div',
      { class: 'actions' },
      h(
        'button',
        {
          class: 'primary',
          disabled: financingAnalysis.errors.length > 0 || structureAnalysis.errors.length > 0,
          onclick: () => ctx.dispatch({ type: 'set-structure', decision: { ...decision } }),
        },
        'Lock the structure →',
      ),
      structureAnalysis.errors.length > 0
        ? h('small', { style: 'color:var(--red)' }, structureAnalysis.errors[0])
        : null,
    ),
    errorLine(ctx),
  );
}

function stat(label: string, value: string): HTMLElement {
  return h(
    'div',
    { class: 'card static' },
    h('div', { class: 'meta' }, label),
    h('div', { class: 'mono', style: 'font-size:17px' }, value),
  );
}
