import { MARKET_DEFINITIONS, computeHhi, isPresumptivelyAnticompetitive } from '../../engine/regulatory.js';
import type { RemedyType } from '../../engine/types.js';
import { h, field, panel, slider } from '../dom.js';
import { pct } from '../format.js';
import { callout, errorLine, type Ctx, draftValue, setDraft } from './common.js';

const REMEDIES: { id: RemedyType; name: string; blurb: string }[] = [
  {
    id: 'none',
    name: 'Offer nothing',
    blurb:
      'File and argue the deal is clean. Cheapest if you are right, and the most exposed if the staff disagree.',
  },
  {
    id: 'behavioral',
    name: 'Behavioural commitments',
    blurb:
      'Firewalls, non-discrimination and open-access undertakings. Cheap to give, and agencies have grown sceptical of them.',
  },
  {
    id: 'structural',
    name: 'Structural divestiture',
    blurb:
      'Sell the overlapping business to an approved buyer. Expensive, and by far the most likely to clear.',
  },
  {
    id: 'fix-it-first',
    name: 'Fix-it-first',
    blurb:
      'Complete the divestiture before the main deal closes. Removes the review risk almost entirely, at the cost of doing it before you know you need to.',
  },
];

/** Phase 6 — the HSR filing and antitrust strategy (GDD §6 Phase 6). */
export function regulatoryView(ctx: Ctx): HTMLElement {
  const { state } = ctx;
  const target = state.target!;
  const acquirer = state.acquirer;

  const definitionId = draftValue<'narrow' | 'standard' | 'broad'>(ctx, 'marketDef', 'standard');
  const remedy = draftValue<RemedyType>(ctx, 'remedy', 'none');
  const influence = draftValue<number>(ctx, 'influence', 0);

  const definition = MARKET_DEFINITIONS.find((d) => d.id === definitionId)!;
  const sameSector = acquirer.overlapSectors.includes(target.sector);
  const acquirerShare = sameSector ? acquirer.marketSharePct : acquirer.marketSharePct * 0.15;
  const hhi = computeHhi({
    acquirerSharePct: acquirerShare,
    targetSharePct: target.marketSharePct,
    shareMultiplier: definition.shareMultiplier,
  });
  const presumptive = isPresumptivelyAnticompetitive(hhi.post, hhi.delta);

  return h(
    'div',
    null,
    panel(
      'Hart-Scott-Rodino Filing',
      `Agency posture: ${state.regulatoryPosture}`,
      h(
        'p',
        { class: 'lede' },
        sameSector
          ? `You and ${target.name} compete in the same sector. That overlap is where your synergies come from, and it is also the entire antitrust case against you.`
          : `Your overlap with ${target.name} is limited. The structural screen should not be the problem here.`,
      ),
      h('h3', null, 'Market definition'),
      h(
        'p',
        null,
        'How you draw the market decides your share, and your share decides whether the presumption runs against you. Argue broadly and the staff may not accept it.',
      ),
      h(
        'div',
        { class: 'grid three' },
        MARKET_DEFINITIONS.map((option) =>
          h(
            'div',
            {
              class: `card ${definitionId === option.id ? 'selected' : ''}`,
              onclick: () => {
                setDraft(ctx, 'marketDef', option.id);
                ctx.rerender();
              },
            },
            h('div', { class: 'title' }, option.name),
            h('div', { class: 'desc' }, option.description),
          ),
        ),
      ),
      h(
        'div',
        { class: 'grid three', style: 'margin-top:16px' },
        stat('Combined share', pct((acquirerShare + target.marketSharePct) * definition.shareMultiplier)),
        stat('Post-merger HHI', String(hhi.post)),
        stat('Delta', String(hhi.delta)),
      ),
      presumptive
        ? callout(
            h(
              'span',
              null,
              h('strong', null, 'Presumptively anticompetitive. '),
              'HHI above 2500 with a delta above 200. The burden is now on you, and a Second Request is far more likely than not.',
            ),
            'bad',
          )
        : callout(
            h(
              'span',
              null,
              h('strong', null, 'Below the structural presumption. '),
              'This is the single most useful fact in your filing.',
            ),
            'good',
          ),
    ),

    panel(
      'Remedy Strategy',
      null,
      h(
        'p',
        null,
        'Offering a remedy up front costs you value and buys you certainty. Offering nothing is right far more often than deal teams admit — and catastrophic when it is wrong.',
      ),
      h(
        'div',
        { class: 'grid two' },
        REMEDIES.map((option) =>
          h(
            'div',
            {
              class: `card ${remedy === option.id ? 'selected' : ''}`,
              onclick: () => {
                setDraft(ctx, 'remedy', option.id);
                ctx.rerender();
              },
            },
            h('div', { class: 'title' }, option.name),
            h('div', { class: 'desc' }, option.blurb),
          ),
        ),
      ),
    ),

    panel(
      'Agency Engagement',
      `${state.players.buyer.influence} Influence available`,
      h(
        'p',
        null,
        'Influence Points buy economist reports, customer advocacy and time with the front office. They shift the review toward clearance with diminishing returns — they do not buy an outcome.',
      ),
      field(
        `Influence committed — ${influence}`,
        slider(
          influence,
          (v) => {
            setDraft(ctx, 'influence', v);
            ctx.rerender();
          },
          { min: 0, max: state.players.buyer.influence, step: 1 },
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
              type: 'regulatory-strategy',
              marketDefinitionId: definitionId,
              offeredRemedy: remedy,
              influenceSpent: influence,
            }),
        },
        'File and await the agency →',
      ),
    ),
    errorLine(ctx),
  );
}

function stat(label: string, value: string): HTMLElement {
  return h(
    'div',
    { class: 'card static' },
    h('div', { class: 'meta' }, label),
    h('div', { class: 'mono', style: 'font-size:19px' }, value),
  );
}
