import { assessMac } from '../../engine/agreement.js';
import { MAC_CARVE_OUT_BY_ID } from '../../engine/content/structures.js';
import { currentPrice } from '../../engine/state.js';
import { h, panel } from '../dom.js';
import { money, pct } from '../format.js';
import { callout, errorLine, type Ctx } from './common.js';

/** Phase 7 — the interim period and the MAC decision (GDD §7.1). */
export function macDecisionView(ctx: Ctx): HTMLElement {
  const { state } = ctx;
  const agreement = state.agreement!;
  const events = state.interimEvents ?? [];
  const price = currentPrice(state);

  const worst = events.reduce(
    (acc, e) => (e.ebitdaHitPct > (acc?.ebitdaHitPct ?? -1) ? e : acc),
    events[0],
  );

  // Show the player the same contractual analysis the engine will run, minus
  // the precedent draw and the roll — this is a legal read, not a prediction.
  const assessment =
    worst && worst.ebitdaHitPct > 0
      ? assessMac({ agreement, event: worst, disproportionateRatio: 2.0 })
      : undefined;

  return h(
    'div',
    null,
    panel(
      'The Interim Period',
      `${events.length} event${events.length === 1 ? '' : 's'}`,
      events.map((event) =>
        h(
          'div',
          { class: `finding ${event.ebitdaHitPct > 15 ? 'red' : event.ebitdaHitPct > 0 ? 'yellow' : 'green'}` },
          h(
            'div',
            { class: 'head' },
            h('span', { class: 'name' }, event.name),
            h(
              'span',
              { class: 'mono muted', style: 'margin-left:auto' },
              event.ebitdaHitPct > 0 ? `−${event.ebitdaHitPct}% EBITDA` : 'no impact',
            ),
          ),
          h('div', { class: 'text' }, event.description),
          event.carveOutIds.length > 0
            ? h(
                'div',
                { class: 'text muted', style: 'margin-top:6px' },
                'Potentially carved out under: ',
                event.carveOutIds.map((id) => MAC_CARVE_OUT_BY_ID[id].name.toLowerCase()).join(', '),
              )
            : null,
        ),
      ),
    ),

    assessment
      ? panel(
          'Material Adverse Effect — Contract Analysis',
          `Threshold ${pct(agreement.macThresholdPct)}`,
          h(
            'p',
            null,
            'This is what the clause you negotiated actually says about what just happened.',
          ),
          h(
            'ul',
            { style: 'margin:0 0 14px;padding-left:18px;font-size:13px;color:var(--ink-dim)' },
            assessment.reasoning.map((reason) => h('li', { style: 'margin-bottom:6px' }, reason)),
          ),
          callout(
            h(
              'span',
              null,
              h('strong', null, `Position assessed at ${Math.round(assessment.strength * 100)}%. `),
              assessment.strength > 0.6
                ? 'A court would likely find a Material Adverse Effect. Invoking is defensible.'
                : assessment.strength > 0.35
                  ? 'Genuinely contestable. A credible threat is often worth more as a price cut than as a judgment.'
                  : 'Weak. Invoking here reads as buyer’s remorse, and the seller will sue for specific performance.',
            ),
            assessment.strength > 0.6 ? 'good' : assessment.strength > 0.35 ? '' : 'bad',
          ),
          h(
            'p',
            { class: 'muted', style: 'font-size:12.5px' },
            'A precedent card will be drawn when you invoke, and the outcome is not certain either way. ',
            agreement.protections.specificPerformance === 'none'
              ? 'You did not concede specific performance, so the worst case is paying the reverse termination fee.'
              : 'The seller can compel closing through specific performance, so the worst case is closing at the original price having spent the goodwill.',
          ),
        )
      : callout(
          'Nothing material happened between signing and closing. The conditions are satisfied and the deal is ready to fund.',
          'good',
        ),

    h(
      'div',
      { class: 'actions' },
      h(
        'button',
        {
          class: 'primary',
          onclick: () => ctx.dispatch({ type: 'mac-decision', invoke: false }),
        },
        `Close at ${money(price)}`,
      ),
      assessment
        ? h(
            'button',
            {
              class: 'danger',
              onclick: () => ctx.dispatch({ type: 'mac-decision', invoke: true }),
            },
            'Invoke the MAC clause',
          )
        : null,
    ),
    errorLine(ctx),
  );
}
