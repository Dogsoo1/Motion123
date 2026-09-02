import { premiumPct } from '../../engine/valuation.js';
import { field, h, numberInput, panel, scrollTable, segmented, slider } from '../dom.js';
import { money, pct } from '../format.js';
import { callout, errorLine, type Ctx, draftValue, setDraft } from './common.js';
import type { ConsiderationType, IndicationOfInterest, LoiTerms } from '../../engine/types.js';

/** Phase 2 — the indication of interest (GDD §2.1 Phase 2). */
export function ioiView(ctx: Ctx): HTMLElement {
  const { state } = ctx;
  const target = state.target!;
  const valuation = state.valuation!;

  const ioi = draftValue<IndicationOfInterest>(ctx, 'ioi', {
    priceLow: Math.round(valuation.recommendedLow),
    priceHigh: Math.round(valuation.recommendedHigh),
    consideration: 'cash',
    exclusivityDays: 45,
    breakFeePct: 3,
    noShop: 'strict',
    depositPct: 0,
  });

  const midpoint = (ioi.priceLow + ioi.priceHigh) / 2;
  const bidders = state.competingBidders.filter((b) => b.active);

  const update = (patch: Partial<IndicationOfInterest>) => {
    setDraft(ctx, 'ioi', { ...ioi, ...patch });
    ctx.rerender();
  };

  return h(
    'div',
    null,
    panel(
      'Process Status',
      state.processType?.replace('-', ' ') ?? null,
      h(
        'p',
        { class: 'lede' },
        state.processType === 'auction'
          ? 'The board is running a broad auction. Expect competition, and expect the seller to use it.'
          : state.processType === 'exclusive'
            ? 'The board will negotiate with one party. That is leverage — and a Revlon problem waiting to happen for them.'
            : 'The board has approached a short list of parties. A balanced process.',
      ),
      bidders.length > 0
        ? callout(
            h(
              'span',
              null,
              h('strong', null, `${bidders.length} competing bidder${bidders.length > 1 ? 's' : ''}`),
              ' in the process. Every pound of leverage you would otherwise have is now theirs.',
            ),
            'bad',
          )
        : callout('No competing bidders have surfaced. You are negotiating against the seller’s alternative to a deal, not against another buyer.', 'good'),
    ),

    panel(
      'Indication of Interest',
      `Banker range ${money(valuation.recommendedLow)} – ${money(valuation.recommendedHigh)}`,
      h(
        'p',
        null,
        'Your opening package. Price is what the board reads first; everything else is what your lawyers will spend the next month on.',
      ),
      h(
        'div',
        { class: 'grid two' },
        field(
          'Price — low',
          numberInput(ioi.priceLow, (v) => update({ priceLow: v }), { step: 25, min: 1 }),
          'In $M of equity value',
        ),
        field(
          'Price — high',
          numberInput(ioi.priceHigh, (v) => update({ priceHigh: v }), { step: 25, min: 1 }),
          `Midpoint ${money(midpoint)} — a ${pct(premiumPct(midpoint, target))} premium`,
        ),
      ),
      h(
        'div',
        { class: 'grid two' },
        field(
          'Consideration',
          segmented<ConsiderationType>(
            [
              { value: 'cash', label: 'Cash' },
              { value: 'mixed', label: 'Mixed' },
              { value: 'stock', label: 'Stock' },
            ],
            ioi.consideration,
            (v) => update({ consideration: v }),
          ),
          'Cash is certainty for them; stock defers their tax and preserves your balance sheet.',
        ),
        field(
          'No-shop',
          segmented(
            [
              { value: 'strict' as const, label: 'Strict' },
              { value: 'modified' as const, label: 'Modified' },
              { value: 'go-shop' as const, label: 'Go-shop' },
            ],
            ioi.noShop,
            (v) => update({ noShop: v }),
          ),
          'A strict no-shop protects you and gives their board a fiduciary problem.',
        ),
      ),
      h(
        'div',
        { class: 'grid three' },
        field(
          `Exclusivity — ${ioi.exclusivityDays} days`,
          slider(ioi.exclusivityDays, (v) => update({ exclusivityDays: v }), { min: 0, max: 90, step: 5 }),
          'Time to do diligence without a gun to your head.',
        ),
        field(
          `Break-up fee — ${pct(ioi.breakFeePct)}`,
          slider(ioi.breakFeePct, (v) => update({ breakFeePct: v }), { min: 0, max: 5, step: 0.25 }),
          'Deters an interloper. Also deters the board from signing.',
        ),
        field(
          `Deposit — ${pct(ioi.depositPct)}`,
          slider(ioi.depositPct, (v) => update({ depositPct: v }), { min: 0, max: 10, step: 0.5 }),
          'Signals commitment; ties up your capital.',
        ),
      ),
      h(
        'div',
        { class: 'actions' },
        h(
          'button',
          {
            class: 'primary',
            onclick: () => ctx.dispatch({ type: 'submit-ioi', ioi: { ...ioi } }),
          },
          'Submit indication of interest',
        ),
      ),
      errorLine(ctx),
    ),
  );
}

/** Phase 2 — LOI negotiation (GDD §2.2 Phase 2). */
export function loiView(ctx: Ctx): HTMLElement {
  const { state } = ctx;
  const target = state.target!;
  const last = state.loiExchanges[state.loiExchanges.length - 1];
  const sellerOffer = last?.from === 'seller' ? last.terms : undefined;

  const counter = draftValue<LoiTerms>(ctx, 'counter', {
    ...(sellerOffer ?? state.loiExchanges[0].terms),
  });
  const update = (patch: Partial<LoiTerms>) => {
    setDraft(ctx, 'counter', { ...counter, ...patch });
    ctx.rerender();
  };

  return h(
    'div',
    null,
    panel(
      'Negotiation Record',
      `${state.loiRoundsRemaining} round${state.loiRoundsRemaining === 1 ? '' : 's'} remaining`,
      scrollTable(
        h(
          'thead',
          null,
          h(
            'tr',
            null,
            h('th', null, 'From'),
            h('th', { class: 'num' }, 'Price'),
            h('th', null, 'Consideration'),
            h('th', { class: 'num' }, 'Excl.'),
            h('th', { class: 'num' }, 'Break fee'),
            h('th', null, 'No-shop'),
          ),
        ),
        h(
          'tbody',
          null,
          state.loiExchanges.map((exchange) =>
            h(
              'tr',
              null,
              h('td', null, exchange.from === 'buyer' ? 'You' : 'Seller'),
              h('td', { class: 'num' }, money(exchange.terms.price)),
              h('td', null, exchange.terms.consideration),
              h('td', { class: 'num' }, `${exchange.terms.exclusivityDays}d`),
              h('td', { class: 'num' }, pct(exchange.terms.breakFeePct)),
              h('td', null, exchange.terms.noShop),
            ),
          ),
        ),
      ),
      last ? callout(h('span', null, h('strong', null, last.from === 'buyer' ? 'You: ' : 'Seller: '), last.commentary)) : null,
      h(
        'div',
        { class: 'muted', style: 'font-size:12px;margin-top:10px' },
        'If nobody moves far enough before the rounds run out, the open terms default to market standard — which is worse for both of you than a negotiated outcome.',
      ),
    ),

    sellerOffer
      ? panel(
          'Your Response',
          `Premium at their number: ${pct(premiumPct(sellerOffer.price, target))}`,
          h(
            'div',
            { class: 'grid two' },
            field('Price', numberInput(counter.price, (v) => update({ price: v }), { step: 25 }), `Their ask: ${money(sellerOffer.price)}`),
            field(
              'No-shop',
              segmented(
                [
                  { value: 'strict' as const, label: 'Strict' },
                  { value: 'modified' as const, label: 'Modified' },
                  { value: 'go-shop' as const, label: 'Go-shop' },
                ],
                counter.noShop,
                (v) => update({ noShop: v }),
              ),
            ),
          ),
          h(
            'div',
            { class: 'grid three' },
            field(
              `Exclusivity — ${counter.exclusivityDays}d`,
              slider(counter.exclusivityDays, (v) => update({ exclusivityDays: v }), { min: 0, max: 90, step: 5 }),
            ),
            field(
              `Break-up fee — ${pct(counter.breakFeePct)}`,
              slider(counter.breakFeePct, (v) => update({ breakFeePct: v }), { min: 0, max: 5, step: 0.25 }),
            ),
            field(
              `Deposit — ${pct(counter.depositPct)}`,
              slider(counter.depositPct, (v) => update({ depositPct: v }), { min: 0, max: 10, step: 0.5 }),
            ),
          ),
          h(
            'div',
            { class: 'actions' },
            h(
              'button',
              {
                class: 'primary',
                onclick: () => ctx.dispatch({ type: 'loi-respond', response: 'accept' }),
              },
              `Accept at ${money(sellerOffer.price)}`,
            ),
            h(
              'button',
              {
                onclick: () =>
                  ctx.dispatch({ type: 'loi-respond', response: 'counter', terms: { ...counter } }),
              },
              `Counter at ${money(counter.price)}`,
            ),
            h('span', { class: 'spacer' }),
            h(
              'button',
              {
                class: 'danger',
                onclick: () => ctx.dispatch({ type: 'loi-respond', response: 'walk' }),
              },
              'Walk away',
            ),
          ),
          errorLine(ctx),
        )
      : null,
  );
}
