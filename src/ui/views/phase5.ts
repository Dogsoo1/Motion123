import {
  AGREEMENT_FRONTS,
  AGREEMENT_FRONT_BLURBS,
  AGREEMENT_FRONT_LABELS,
  type AgreementFront,
  type AgreementPushes,
} from '../../engine/agreement.js';
import { REP_CATEGORY_NAMES } from '../../engine/types.js';
import type { RepCategory } from '../../engine/types.js';
import { currentPrice } from '../../engine/state.js';
import { h, field, panel, slider } from '../dom.js';
import { money, pct } from '../format.js';
import { callout, errorLine, type Ctx, draftValue, setDraft } from './common.js';

/** Phase 5 — the definitive agreement (GDD §6 Phase 5). */
export function agreementView(ctx: Ctx): HTMLElement {
  const { state } = ctx;
  const available = state.players.buyer.negotiationPoints;
  const price = currentPrice(state);

  const pushes = draftValue<AgreementPushes>(ctx, 'pushes', {
    reps: 3,
    mac: 3,
    indemnity: 3,
    conditions: 3,
  });
  const rwInsurance = draftValue<boolean>(ctx, 'rw', false);

  // Findings that justify asking for a bespoke indemnity.
  const requestable = [
    ...new Set(
      (state.diligence?.findings ?? [])
        .filter((f) => f.demandsSpecialIndemnity && f.card.repCategory)
        .map((f) => f.card.repCategory!),
    ),
  ];
  const specials = draftValue<RepCategory[]>(ctx, 'specials', requestable);

  const committed = AGREEMENT_FRONTS.reduce((sum, front) => sum + pushes[front], 0);
  const remaining = available - committed;

  const setPush = (front: AgreementFront, value: number) => {
    const next = { ...pushes, [front]: value };
    if (AGREEMENT_FRONTS.reduce((s, f) => s + next[f], 0) <= available) {
      setDraft(ctx, 'pushes', next);
      ctx.rerender();
    }
  };

  return h(
    'div',
    null,
    panel(
      'Term Sheet',
      `${committed} / ${available} NP committed`,
      h(
        'p',
        { class: 'lede' },
        'This is the rulebook for everything that follows. Every term you win here decides what happens in the regulatory review, in the interim period, and in the indemnity claims two years after closing.',
      ),
      h(
        'p',
        null,
        'You have ',
        h('strong', null, `${available} Negotiation Points`),
        ' of stamina. Spread them and you win nothing outright; concentrate them and you concede the fronts you left bare.',
      ),
      AGREEMENT_FRONTS.map((front) =>
        h(
          'div',
          { style: 'margin-bottom:20px' },
          field(
            `${AGREEMENT_FRONT_LABELS[front]} — ${pushes[front]} NP`,
            slider(pushes[front], (v) => setPush(front, v), {
              min: 0,
              max: Math.min(10, pushes[front] + Math.max(0, remaining)),
              step: 1,
            }),
            AGREEMENT_FRONT_BLURBS[front],
          ),
        ),
      ),
      remaining > 0
        ? callout(`${remaining} Negotiation Points uncommitted. Unspent stamina wins nothing.`)
        : null,
    ),

    requestable.length > 0
      ? panel(
          'Specific Indemnities',
          `${specials.length} requested`,
          h(
            'p',
            null,
            'Your diligence turned up issues serious enough to demand bespoke cover. A specific indemnity sits outside the basket, survives longer, and reaches past a narrow representation — but each one you ask for is a term the seller fights.',
          ),
          h(
            'div',
            { class: 'grid two' },
            requestable.map((category) =>
              h(
                'div',
                {
                  class: `card ${specials.includes(category) ? 'selected' : ''}`,
                  onclick: () => {
                    const next = specials.includes(category)
                      ? specials.filter((c) => c !== category)
                      : [...specials, category];
                    setDraft(ctx, 'specials', next);
                    ctx.rerender();
                  },
                },
                h('div', { class: 'title' }, REP_CATEGORY_NAMES[category]),
                h(
                  'div',
                  { class: 'desc' },
                  (state.diligence?.findings ?? [])
                    .filter((f) => f.card.repCategory === category)
                    .map((f) => f.card.title)
                    .join('; '),
                ),
              ),
            ),
          ),
        )
      : null,

    panel(
      'Representation & Warranty Insurance',
      rwInsurance ? `Premium ${money(price * 0.031)}` : 'Not purchased',
      h(
        'p',
        null,
        'A policy sits above its own retention and outside the seller’s cap, so it responds where the indemnity runs out. It costs roughly 3.1% of deal value, payable now, whether you ever claim or not.',
      ),
      h(
        'div',
        { class: 'seg' },
        h(
          'button',
          {
            class: rwInsurance ? '' : 'on',
            onclick: () => {
              setDraft(ctx, 'rw', false);
              ctx.rerender();
            },
          },
          'No insurance',
        ),
        h(
          'button',
          {
            class: rwInsurance ? 'on' : '',
            onclick: () => {
              setDraft(ctx, 'rw', true);
              ctx.rerender();
            },
          },
          `Buy the policy — ${money(price * 0.031)}`,
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
          onclick: () =>
            ctx.dispatch({
              type: 'negotiate-agreement',
              pushes: { ...pushes },
              rwInsurance,
              specialIndemnities: [...specials],
            }),
        },
        'Negotiate and sign →',
      ),
      h('small', { class: 'muted' }, `Signing at ${money(price)}.`),
    ),
    errorLine(ctx),
  );
}

/** A read-only summary of the signed agreement, shown from Phase 6 onward. */
export function agreementSummary(ctx: Ctx): HTMLElement | null {
  const agreement = ctx.state.agreement;
  if (!agreement) return null;
  const indemnity = agreement.indemnity;

  return panel(
    'Signed Agreement',
    money(agreement.price),
    h(
      'div',
      { class: 'grid two' },
      h(
        'div',
        null,
        h('h3', null, 'Representations'),
        h(
          'dl',
          { class: 'kv' },
          (Object.keys(REP_CATEGORY_NAMES) as RepCategory[]).flatMap((category) => [
            h('dt', null, REP_CATEGORY_NAMES[category]),
            h(
              'dd',
              {
                style: `color:${
                  agreement.reps[category] === 'broad'
                    ? 'var(--green)'
                    : agreement.reps[category] === 'narrow'
                      ? 'var(--red)'
                      : 'inherit'
                }`,
              },
              agreement.reps[category],
            ),
          ]),
        ),
      ),
      h(
        'div',
        null,
        h('h3', null, 'Indemnification'),
        h(
          'dl',
          { class: 'kv' },
          h('dt', null, 'Cap'),
          h('dd', null, pct(indemnity.capPct)),
          h('dt', null, 'Basket'),
          h('dd', null, `${pct(indemnity.basketPct)} ${indemnity.basketType}`),
          h('dt', null, 'Survival'),
          h('dd', null, `${indemnity.survivalMonths} mo`),
          h('dt', null, 'Escrow'),
          h('dd', null, pct(indemnity.escrowPct)),
          h('dt', null, 'Sandbagging'),
          h('dd', null, indemnity.proSandbagging ? 'pro' : 'anti'),
          h('dt', null, 'Sole remedy'),
          h('dd', null, indemnity.soleRemedy ? 'yes' : 'no'),
          h('dt', null, 'R&W insurance'),
          h('dd', null, indemnity.rwInsurance ? 'yes' : 'no'),
        ),
        h('h3', null, 'MAC'),
        h(
          'dl',
          { class: 'kv' },
          h('dt', null, 'Threshold'),
          h('dd', null, pct(agreement.macThresholdPct)),
          h('dt', null, 'Carve-outs'),
          h('dd', null, String(agreement.macCarveOuts.length)),
          h('dt', null, 'Disproportionate'),
          h(
            'dd',
            {
              style: `color:${
                agreement.macCarveOuts.includes('disproportionate-exception')
                  ? 'var(--green)'
                  : 'var(--red)'
              }`,
            },
            agreement.macCarveOuts.includes('disproportionate-exception') ? 'yes' : 'no',
          ),
        ),
      ),
    ),
    h(
      'ul',
      { class: 'muted', style: 'margin:14px 0 0;padding-left:18px;font-size:12.5px' },
      ctx.state.agreementNarrative.map((entry) => h('li', null, entry)),
    ),
  );
}
