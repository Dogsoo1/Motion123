import { ROLE_NAMES } from '../../engine/types.js';
import { currentPrice, targetIntrinsic, targetUnaffected } from '../../engine/state.js';
import { premiumPct } from '../../engine/valuation.js';
import { h, panel } from '../dom.js';
import { money, pct, signedPct } from '../format.js';
import { callout, type Ctx } from './common.js';

/** Phase 8 — the post-mortem (GDD §11). */
export function resultsView(ctx: Ctx, onNewGame: () => void): HTMLElement {
  const { state } = ctx;
  const scores = state.scores ?? [];
  const buyerScore = scores.find((s) => s.role === 'buyer');
  const closing = state.closing;
  const price = currentPrice(state);
  const intrinsic = targetIntrinsic(state);

  return h(
    'div',
    null,
    panel(
      state.status === 'complete' ? 'Deal Closed' : 'No Transaction',
      state.target?.name ?? null,
      state.status === 'terminated'
        ? callout(h('span', null, h('strong', null, 'Terminated. '), state.terminationReason ?? ''), 'bad')
        : null,
      closing?.closed
        ? h(
            'div',
            { class: 'grid three' },
            stat('Price paid', money(price)),
            stat('Intrinsic value', money(intrinsic)),
            stat(
              'Value created',
              money(closing.realisedValue - closing.totalCost),
              closing.realisedValue > closing.totalCost ? 'good' : 'bad',
            ),
            stat('Realised value', money(closing.realisedValue)),
            stat('Total cost', money(closing.totalCost)),
            stat(
              'Premium paid',
              state.target ? pct(premiumPct(price, state.target)) : '—',
            ),
          )
        : null,
      closing?.closed
        ? h(
            'div',
            { style: 'margin-top:18px' },
            h('h3', null, 'Where the money went'),
            h(
              'dl',
              { class: 'kv' },
              h('dt', null, 'Purchase price'),
              h('dd', null, money(price)),
              h('dt', null, 'Fees, diligence and advisory'),
              h('dd', null, money(state.buyerSunkCost)),
              h('dt', null, 'Working capital true-up'),
              h('dd', null, `${closing.workingCapitalAdjustment >= 0 ? '+' : ''}${money(closing.workingCapitalAdjustment)}`),
              h('dt', null, 'Indemnity recovered'),
              h('dd', null, money(closing.claims.reduce((s, c) => s + c.recovered, 0))),
              h('dt', null, 'Losses claimed'),
              h('dd', null, money(closing.claims.reduce((s, c) => s + c.grossLoss, 0))),
            ),
          )
        : null,
    ),

    closing && closing.claims.length > 0
      ? panel(
          'Indemnity Claims',
          'Where Phase 5 paid off — or did not',
          h(
            'table',
            null,
            h(
              'thead',
              null,
              h(
                'tr',
                null,
                h('th', null, 'Claim'),
                h('th', { class: 'num' }, 'Loss'),
                h('th', { class: 'num' }, 'Recovered'),
                h('th', null, 'Outcome'),
              ),
            ),
            h(
              'tbody',
              null,
              closing.claims.map((claim) =>
                h(
                  'tr',
                  null,
                  h('td', null, claim.source),
                  h('td', { class: 'num' }, money(claim.grossLoss)),
                  h(
                    'td',
                    {
                      class: 'num',
                      style: `color:${claim.recovered > 0 ? 'var(--green)' : 'var(--red)'}`,
                    },
                    money(claim.recovered),
                  ),
                  h('td', { class: 'muted', style: 'font-size:11.5px' }, claim.barReason ?? 'Recovered in full'),
                ),
              ),
            ),
          ),
        )
      : null,

    closing && closing.integrationCards.length > 0
      ? panel(
          'Integration',
          `${signedPct(closing.integrationCards.reduce((s, c) => s + c.valueImpactPct, 0))} on deal value`,
          closing.integrationCards.map((card) =>
            h(
              'div',
              { class: `finding ${card.valueImpactPct > 0 ? 'green' : 'red'}` },
              h(
                'div',
                { class: 'head' },
                h('span', { class: 'name' }, card.name),
                h(
                  'span',
                  { class: 'mono', style: `margin-left:auto;color:${card.valueImpactPct > 0 ? 'var(--green)' : 'var(--red)'}` },
                  signedPct(card.valueImpactPct, 0),
                ),
              ),
              h('div', { class: 'text' }, card.description),
            ),
          ),
        )
      : null,

    buyerScore
      ? panel(
          'Your Score',
          `${buyerScore.total} of ${buyerScore.max}`,
          h('div', { class: 'score-total' }, String(buyerScore.total)),
          h(
            'div',
            { class: 'muted', style: 'margin-bottom:16px' },
            `out of a possible ${buyerScore.max}`,
          ),
          buyerScore.lines.map((line) =>
            h(
              'div',
              { class: 'score-line' },
              h(
                'div',
                null,
                h('div', { class: 'lbl' }, line.label),
                h('div', { class: 'det' }, line.detail),
              ),
              h(
                'div',
                { class: 'pts' },
                h(
                  'span',
                  { style: `color:${line.points > 0 ? 'var(--gold)' : line.points < 0 ? 'var(--red)' : 'var(--ink-faint)'}` },
                  line.points.toFixed(1),
                ),
                h('span', { class: 'max' }, ` / ${line.max}`),
              ),
            ),
          ),
        )
      : null,

    panel(
      'The Table',
      'How everyone else did',
      h(
        'table',
        null,
        h(
          'thead',
          null,
          h('tr', null, h('th', null, 'Role'), h('th', null, 'Objective'), h('th', { class: 'num' }, 'Score')),
        ),
        h(
          'tbody',
          null,
          scores.map((score) =>
            h(
              'tr',
              null,
              h('td', null, ROLE_NAMES[score.role]),
              h(
                'td',
                { class: 'muted', style: 'font-size:12px' },
                score.role === 'seller' ? '—' : state.players[score.role].objective.name,
              ),
              h('td', { class: 'num' }, `${score.total} / ${score.max}`),
            ),
          ),
        ),
      ),
      h(
        'p',
        { class: 'muted', style: 'margin-top:14px;font-size:12.5px' },
        'Private objectives were hidden during play. The banker and the regulator were each pursuing their own — which is why their advice was never quite disinterested. What the seller was actually playing for is not disclosed, and will not be.',
      ),
    ),

    h(
      'div',
      { class: 'actions' },
      h('button', { class: 'primary', onclick: onNewGame }, 'New deal'),
      h('small', { class: 'muted' }, `Seed: ${state.seed}`),
    ),
  );
}

function stat(label: string, value: string, tone = ''): HTMLElement {
  return h(
    'div',
    { class: 'card static' },
    h('div', { class: 'meta' }, label),
    h(
      'div',
      {
        class: 'mono',
        style: `font-size:19px;color:${tone === 'good' ? 'var(--green)' : tone === 'bad' ? 'var(--red)' : 'inherit'}`,
      },
      value,
    ),
  );
}
