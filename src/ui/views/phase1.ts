import { screeningFee, valuationCost } from '../../engine/game.js';
import { latest, unaffectedEquityValue } from '../../engine/valuation.js';
import { field, h, numberInput, panel, scrollTable } from '../dom.js';
import { money, moneyExact, pct } from '../format.js';
import { callout, errorLine, targetCardFront, type Ctx, draftValue, setDraft } from './common.js';

/** Phase 1 step 1 — screen the market and pick a target (GDD §6 Phase 1). */
export function screeningView(ctx: Ctx): HTMLElement {
  const { state } = ctx;

  return h(
    'div',
    null,
    panel(
      'The Market',
      `${state.marketTargets.length} targets`,
      h(
        'p',
        { class: 'lede' },
        'Five companies are in the market. Screening one costs ',
        moneyExact(screeningFee(state)),
        ' and opens its financials to you. You can only pursue a target you have screened.',
      ),
      h(
        'div',
        { class: 'grid two' },
        state.marketTargets.map((target) => {
          const screened = state.screened.includes(target.id);
          const { revenue, ebitda } = latest(target);
          return h(
            'div',
            { class: `card ${screened ? 'selected' : ''}` },
            h('div', { class: 'title' }, target.name),
            h('div', { class: 'meta' }, `${target.sector} · ${target.subSector}`),
            screened
              ? targetCardFront(target)
              : h(
                  'div',
                  { class: 'desc' },
                  `${target.description.split('.')[0]}. Revenue in the region of ${money(revenue)}, EBITDA around ${money(ebitda)}.`,
                ),
            h(
              'div',
              { class: 'actions' },
              !screened
                ? h(
                    'button',
                    { onclick: () => ctx.dispatch({ type: 'screen-target', targetId: target.id }) },
                    `Screen — ${moneyExact(screeningFee(state))}`,
                  )
                : h(
                    'button',
                    {
                      class: 'primary',
                      onclick: () => ctx.dispatch({ type: 'select-target', targetId: target.id }),
                    },
                    'Pursue this target',
                  ),
            ),
          );
        }),
      ),
      errorLine(ctx),
    ),
  );
}

/** Phase 1 step 2 — valuation work (GDD §8.1). */
export function valuationView(ctx: Ctx): HTMLElement {
  const { state } = ctx;
  const target = state.target!;
  const done = new Set(state.valuationRanges.map((r) => r.method));

  const selectedComps = draftValue<string[]>(ctx, 'comps', []);
  const selectedPrecedents = draftValue<string[]>(ctx, 'precedents', []);
  const dcf = draftValue(ctx, 'dcf', { ...state.dcfAssumptions! });

  const toggle = (list: string[], id: string, key: string) => {
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    setDraft(ctx, key, next);
    ctx.rerender();
  };

  return h(
    'div',
    null,
    panel(
      target.name,
      'Target under evaluation',
      targetCardFront(target),
      callout(
        h(
          'span',
          null,
          'Unaffected equity value is ',
          h('strong', null, money(unaffectedEquityValue(target))),
          '. Everything above that is the premium you are asking your board to justify.',
        ),
      ),
    ),

    // --- Comparable companies ---------------------------------------------
    panel(
      'Comparable Companies Analysis',
      done.has('comps') ? 'Complete' : `${moneyExact(valuationCost(state, 'comps'))} · fast, imprecise`,
      done.has('comps')
        ? renderRange(ctx, 'comps')
        : h(
            'div',
            null,
            h(
              'p',
              null,
              'Pick the companies you consider genuinely comparable. The median EV/EBITDA of your selection drives the answer — which is why this is a judgment call, not arithmetic. Choose at least three.',
            ),
            scrollTable(
              h(
                'thead',
                null,
                h(
                  'tr',
                  null,
                  h('th', null, ''),
                  h('th', null, 'Company'),
                  h('th', null, 'Why it might be comparable'),
                  h('th', { class: 'num' }, 'EV/EBITDA'),
                ),
              ),
              h(
                'tbody',
                null,
                state.comparables.map((comp) =>
                  h(
                    'tr',
                    {
                      style: 'cursor:pointer',
                      onclick: () => toggle(selectedComps, comp.id, 'comps'),
                    },
                    h(
                      'td',
                      null,
                      h('input', {
                        type: 'checkbox',
                        checked: selectedComps.includes(comp.id),
                        style: 'width:auto;accent-color:#c9a961',
                      }),
                    ),
                    h('td', null, comp.name),
                    h('td', { class: 'muted' }, comp.descriptor),
                    h('td', { class: 'num' }, `${comp.evEbitda.toFixed(1)}x`),
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
                  disabled: selectedComps.length < 3,
                  onclick: () => ctx.dispatch({ type: 'run-comps', compIds: selectedComps }),
                },
                `Run analysis (${selectedComps.length} selected)`,
              ),
            ),
          ),
    ),

    // --- Precedent transactions -------------------------------------------
    panel(
      'Precedent Transactions Analysis',
      done.has('precedent')
        ? 'Complete'
        : `${moneyExact(valuationCost(state, 'precedent'))} · slower, better precision`,
      done.has('precedent')
        ? renderRange(ctx, 'precedent')
        : h(
            'div',
            null,
            h(
              'p',
              null,
              'Transaction multiples already contain a control premium, so this typically reads higher than trading comps. Pick at least two.',
            ),
            scrollTable(
              h(
                'thead',
                null,
                h(
                  'tr',
                  null,
                  h('th', null, ''),
                  h('th', null, 'Transaction'),
                  h('th', null, 'Context'),
                  h('th', { class: 'num' }, 'EV/EBITDA'),
                  h('th', { class: 'num' }, 'Premium'),
                ),
              ),
              h(
                'tbody',
                null,
                state.precedentTransactions.map((p) =>
                  h(
                    'tr',
                    {
                      style: 'cursor:pointer',
                      onclick: () => toggle(selectedPrecedents, p.id, 'precedents'),
                    },
                    h(
                      'td',
                      null,
                      h('input', {
                        type: 'checkbox',
                        checked: selectedPrecedents.includes(p.id),
                        style: 'width:auto;accent-color:#c9a961',
                      }),
                    ),
                    h('td', null, p.name),
                    h('td', { class: 'muted' }, p.descriptor),
                    h('td', { class: 'num' }, `${p.evEbitda.toFixed(1)}x`),
                    h('td', { class: 'num' }, pct(p.premiumPct)),
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
                  disabled: selectedPrecedents.length < 2,
                  onclick: () =>
                    ctx.dispatch({ type: 'run-precedent', precedentIds: selectedPrecedents }),
                },
                `Run analysis (${selectedPrecedents.length} selected)`,
              ),
            ),
          ),
    ),

    // --- DCF ---------------------------------------------------------------
    panel(
      'Discounted Cash Flow',
      done.has('dcf') ? 'Complete' : `${moneyExact(valuationCost(state, 'dcf'))} · expensive, no dice`,
      done.has('dcf')
        ? renderRange(ctx, 'dcf')
        : h(
            'div',
            null,
            h(
              'p',
              null,
              'No dice here. The answer is exactly as good as your assumptions, and the terminal value will do most of the work whether you like it or not.',
            ),
            h(
              'div',
              { class: 'grid three' },
              field(
                'Revenue growth %',
                numberInput(dcf.growthPct, (v) => {
                  dcf.growthPct = v;
                }, { step: 0.5, min: -20, max: 60 }),
                `Card guides to ${pct(target.projectedGrowthPct)}`,
              ),
              field(
                'EBITDA margin %',
                numberInput(dcf.marginPct, (v) => {
                  dcf.marginPct = v;
                }, { step: 0.5, min: 1, max: 70 }),
                `Card guides to ${pct(target.projectedMarginPct)}`,
              ),
              field(
                'WACC %',
                numberInput(dcf.waccPct, (v) => {
                  dcf.waccPct = v;
                }, { step: 0.1, min: 3, max: 25 }),
                'Must exceed terminal growth',
              ),
              field(
                'Terminal growth %',
                numberInput(dcf.terminalGrowthPct, (v) => {
                  dcf.terminalGrowthPct = v;
                }, { step: 0.1, min: 0, max: 6 }),
                'Long-run, in perpetuity',
              ),
            ),
            h(
              'div',
              { class: 'actions' },
              h(
                'button',
                {
                  class: 'primary',
                  onclick: () => ctx.dispatch({ type: 'run-dcf', assumptions: { ...dcf } }),
                },
                'Build the model',
              ),
            ),
          ),
    ),

    state.valuationRanges.length > 0 ? footballField(ctx) : null,

    h(
      'div',
      { class: 'actions' },
      h(
        'button',
        {
          class: 'primary',
          disabled: state.valuationRanges.length === 0,
          onclick: () => ctx.dispatch({ type: 'advance' }),
        },
        'Take a number to the board →',
      ),
      h(
        'small',
        { class: 'muted' },
        state.valuationRanges.length === 0
          ? 'Run at least one methodology first.'
          : `${state.valuationRanges.length} of 3 methodologies used.`,
      ),
    ),
    errorLine(ctx),
  );
}

function renderRange(ctx: Ctx, method: string): HTMLElement {
  const range = ctx.state.valuationRanges.find((r) => r.method === method)!;
  return h(
    'div',
    null,
    h(
      'div',
      { class: 'mono', style: 'font-size:17px;color:var(--gold);margin-bottom:10px' },
      `${money(range.low)} — ${money(range.high)}`,
      h('span', { class: 'muted', style: 'font-size:13px' }, `  (mid ${money(range.mid)})`),
    ),
    h(
      'ul',
      { class: 'muted', style: 'margin:0;padding-left:18px;font-size:12.5px' },
      range.notes.map((note) => h('li', null, note)),
    ),
  );
}

/** The football field chart (GDD §8.1 Valuation Synthesis). */
function footballField(ctx: Ctx): HTMLElement {
  const { state } = ctx;
  const target = state.target!;
  const unaffected = unaffectedEquityValue(target);

  const all = state.valuationRanges;
  const lo = Math.min(unaffected, ...all.map((r) => r.low)) * 0.92;
  const hi = Math.max(unaffected, ...all.map((r) => r.high)) * 1.08;
  const span = Math.max(1, hi - lo);
  const posOf = (value: number) => ((value - lo) / span) * 100;

  const names: Record<string, string> = {
    comps: 'Trading comps',
    precedent: 'Precedents',
    dcf: 'DCF',
  };

  return panel(
    'Valuation Football Field',
    `${money(lo)} – ${money(hi)}`,
    h(
      'div',
      { class: 'field-chart' },
      all.map((range) =>
        h(
          'div',
          { class: 'row' },
          h('div', { class: 'name' }, names[range.method]),
          h(
            'div',
            { class: 'track' },
            h('div', {
              class: 'bar',
              style: `left:${posOf(range.low)}%;width:${posOf(range.high) - posOf(range.low)}%`,
            }),
          ),
        ),
      ),
      h(
        'div',
        { class: 'row' },
        h('div', { class: 'name' }, 'Unaffected'),
        h(
          'div',
          { class: 'track' },
          h('div', { class: 'mark', style: `left:${posOf(unaffected)}%` }),
        ),
      ),
      h(
        'div',
        { class: 'legend' },
        h('span', null, h('span', { class: 'swatch', style: 'background:var(--gold)' }), 'Implied range'),
        h('span', null, h('span', { class: 'swatch', style: 'background:var(--blue)' }), `Unaffected ${money(unaffected)}`),
      ),
    ),
  );
}
