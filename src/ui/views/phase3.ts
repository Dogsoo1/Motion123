import {
  AVAILABLE_RETAINERS,
  diligenceBudget,
  dpCashCost,
  referenceValue,
} from '../../engine/game.js';
import {
  DILIGENCE_PROVIDER_LIST,
  DISCLOSURE_BUNDLE_LABEL,
  type DiligenceProviderId,
} from '../../engine/content/advisers.js';
import { DILIGENCE_DEPTH_NAMES, DILIGENCE_CATEGORIES, DILIGENCE_CATEGORY_NAMES } from '../../engine/types.js';
import type { DiligenceCategory, DiligenceDepth } from '../../engine/types.js';
import { emptyAllocation, totalAllocationCost } from '../../engine/diligence.js';
import { currentPrice } from '../../engine/state.js';
import { h, field, panel, slider } from '../dom.js';
import { money, moneyExact, pct } from '../format.js';
import { callout, errorLine, findingRow, type Ctx, draftValue, setDraft } from './common.js';

/** Phase 3 — allocate the diligence budget (GDD §3.2). */
export function diligenceAllocationView(ctx: Ctx): HTMLElement {
  const { state } = ctx;
  const budget = diligenceBudget(state);
  const allocation = draftValue<Record<DiligenceCategory, DiligenceDepth>>(
    ctx,
    'allocation',
    emptyAllocation(),
  );
  const providerId = draftValue<DiligenceProviderId>(ctx, 'provider', 'santa-barbara');
  const provider = DILIGENCE_PROVIDER_LIST.find((p) => p.id === providerId)!;
  const spent = totalAllocationCost(allocation);
  const remaining = budget - spent;

  const setDepth = (category: DiligenceCategory, depth: DiligenceDepth) => {
    const next = { ...allocation, [category]: depth };
    if (totalAllocationCost(next) <= budget) {
      setDraft(ctx, 'allocation', next);
      ctx.rerender();
    }
  };

  return h(
    'div',
    null,
    panel(
      'Diligence Provider',
      provider.name,
      h(
        'p',
        { class: 'lede' },
        'Two firms have pitched. Both will produce a report in the same format, to the same headings, on the categories you fund.',
      ),
      h(
        'div',
        { class: 'grid two' },
        DILIGENCE_PROVIDER_LIST.map((option) =>
          h(
            'div',
            {
              class: `card ${providerId === option.id ? 'selected' : ''}`,
              onclick: () => {
                setDraft(ctx, 'provider', option.id);
                ctx.rerender();
              },
            },
            h('div', { class: 'title' }, option.name),
            h(
              'div',
              { class: 'meta' },
              `${option.discipline} · ${moneyExact(referenceValue(state) * option.feePct)} retainer · ${
                option.timetableCost > 0
                  ? `+${option.timetableCost} rounds`
                  : 'no timetable cost'
              }`,
            ),
            h('div', { class: 'desc' }, option.pitch),
          ),
        ),
      ),
    ),

    panel(
      'Additional Advisers',
      `${state.retainers.length} retained`,
      h(
        'div',
        { class: 'grid two' },
        AVAILABLE_RETAINERS.map((retainer) => {
          const held = state.retainers.includes(retainer.id);
          return h(
            'div',
            {
              class: `card ${held ? 'selected' : ''}`,
              onclick: () =>
                ctx.dispatch({ type: 'retain', retainerId: retainer.id, on: !held }),
            },
            h('div', { class: 'title' }, retainer.name),
            h(
              'div',
              { class: 'meta' },
              `${retainer.role} · ${moneyExact(referenceValue(state) * retainer.feePct)}`,
            ),
            h('div', { class: 'desc' }, retainer.pitch),
          );
        }),
      ),
    ),

    panel(
      `The Data Room — ${DISCLOSURE_BUNDLE_LABEL}`,
      `${spent} / ${budget} DP committed`,
      h(
        'p',
        { class: 'lede' },
        'You cannot deep-dive everything. Every point you spend here is a point you cannot spend elsewhere, and whatever you do not look at, you own.',
      ),
      state.disclosureStrategy === 'full'
        ? callout(
            'The seller has laid the entire data room face up. Unusual — either genuine confidence, or a very good way to make you stop looking.',
            'good',
          )
        : state.disclosureStrategy === 'bury'
          ? callout(
              'The index runs to several hundred pages and the folder structure makes no sense. Depth may be worth more than breadth here.',
              'bad',
            )
          : callout(
              'The seller is releasing material on its own timetable. Standard practice, and standard reason for suspicion.',
            ),
      h(
        'table',
        null,
        h(
          'thead',
          null,
          h(
            'tr',
            null,
            h('th', null, 'Category'),
            h('th', { style: 'width:52%' }, 'Depth'),
            h('th', { class: 'num' }, 'DP'),
          ),
        ),
        h(
          'tbody',
          null,
          DILIGENCE_CATEGORIES.map((category) =>
            h(
              'tr',
              null,
              h('td', null, DILIGENCE_CATEGORY_NAMES[category]),
              h(
                'td',
                null,
                h(
                  'div',
                  { class: 'seg' },
                  ([0, 1, 2, 3, 4] as DiligenceDepth[]).map((depth) =>
                    h(
                      'button',
                      {
                        class: allocation[category] === depth ? 'on' : '',
                        disabled: depth > allocation[category] && depth - allocation[category] > remaining,
                        title: DILIGENCE_DEPTH_NAMES[depth],
                        onclick: () => setDepth(category, depth),
                      },
                      depth === 0 ? '—' : String(depth),
                    ),
                  ),
                ),
                h(
                  'div',
                  { class: 'hint', style: 'margin-top:4px' },
                  DILIGENCE_DEPTH_NAMES[allocation[category]],
                ),
              ),
              h('td', { class: 'num' }, allocation[category] || '—'),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'grid three', style: 'margin-top:16px' },
        h(
          'div',
          { class: 'card static' },
          h('div', { class: 'meta' }, 'Committed'),
          h('div', { class: 'mono', style: 'font-size:20px' }, `${spent} DP`),
        ),
        h(
          'div',
          { class: 'card static' },
          h('div', { class: 'meta' }, 'Remaining'),
          h('div', { class: 'mono', style: `font-size:20px;color:${remaining === 0 ? 'var(--gold)' : 'inherit'}` }, `${remaining} DP`),
        ),
        h(
          'div',
          { class: 'card static' },
          h('div', { class: 'meta' }, 'Cash cost'),
          h(
            'div',
            { class: 'mono', style: 'font-size:20px' },
            moneyExact(
              spent * dpCashCost(state) * provider.costPerPoint +
                referenceValue(state) * provider.feePct,
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
            disabled: spent === 0,
            onclick: () =>
              ctx.dispatch({ type: 'allocate-diligence', allocation, provider: providerId }),
          },
          'Commit the diligence plan',
        ),
        h('small', { class: 'muted' }, '1 DP reveals the top file; 3 opens the whole category; 4 buys an expert read that strengthens your hand in negotiation.'),
      ),
      errorLine(ctx),
    ),
  );
}

/** Phase 3 — findings and the retrade decision (GDD §3.4). */
export function diligenceReviewView(ctx: Ctx): HTMLElement {
  const { state } = ctx;
  const result = state.diligence!;
  const price = currentPrice(state);
  const justified = result.priceAdjustmentPct;

  const requested = draftValue<number>(ctx, 'cut', Math.round(justified * 10) / 10);
  const newPrice = price * (1 - requested / 100);

  return h(
    'div',
    null,
    panel(
      'Diligence Findings',
      `${result.revealed.length} issue${result.revealed.length === 1 ? '' : 's'} identified`,
      result.findings.length === 0
        ? h('p', null, 'Nothing material surfaced in the files you opened. That is either good news or an expensive lesson in where you chose to look.')
        : result.findings
            .slice()
            .sort((a, b) => b.priceImpactPct - a.priceImpactPct)
            .map((finding) => findingRow(finding.card, finding.priceImpactPct)),
      result.expertCategories.length > 0
        ? callout(
            `Expert analysis commissioned in ${result.expertCategories.join(', ')} — you can argue the top of the range on those findings.`,
            'good',
          )
        : null,
    ),

    panel(
      'Price Adjustment',
      `Findings support ${pct(justified)}`,
      h(
        'p',
        null,
        'Your findings justify a reduction of roughly ',
        h('strong', null, pct(justified)),
        '. Ask for that and the board will grumble and sign. Ask for materially more and you are retrading — which they may answer by walking, and which will cost you a reputation you need for the next deal.',
      ),
      field(
        `Reduction requested — ${pct(requested)}`,
        slider(
          requested,
          (v) => {
            setDraft(ctx, 'cut', v);
            ctx.rerender();
          },
          { min: 0, max: Math.max(40, Math.ceil(justified) + 15), step: 0.5 },
        ),
        `${money(price)} → ${money(newPrice)}`,
      ),
      requested > justified + 6
        ? callout(
            'That is well beyond what your own findings support. Expect the seller to treat it as a retrade.',
            'bad',
          )
        : requested < justified - 3
          ? callout('You are leaving justified value on the table.', '')
          : null,
      h(
        'div',
        { class: 'actions' },
        h(
          'button',
          {
            class: 'primary',
            onclick: () => ctx.dispatch({ type: 'reprice', requestedCutPct: requested, walk: false }),
          },
          requested > 0 ? `Propose ${money(newPrice)}` : 'Proceed at the agreed price',
        ),
        h('span', { class: 'spacer' }),
        h(
          'button',
          {
            class: 'danger',
            onclick: () => ctx.dispatch({ type: 'reprice', requestedCutPct: 0, walk: true }),
          },
          'Terminate',
        ),
      ),
      errorLine(ctx),
    ),
  );
}
