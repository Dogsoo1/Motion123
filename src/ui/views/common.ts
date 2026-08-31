import type { GameAction, GameState } from '../../engine/game.js';
import { h, panel, type Child } from '../dom.js';
import { money, pct } from '../format.js';
import { dataRoomIndex } from '../../engine/content/dataroom.js';
import type { DataRoomCard, TargetCompany } from '../../engine/types.js';
import { latest } from '../../engine/valuation.js';

export interface Ctx {
  state: GameState;
  /** Apply an action, surface any error, and re-render. */
  dispatch(action: GameAction): void;
  rerender(): void;
  error: string;
  /** Scratch space for in-progress form state, cleared when the step changes. */
  draft: Record<string, unknown>;
}

export function draftValue<T>(ctx: Ctx, key: string, initial: T): T {
  if (!(key in ctx.draft)) ctx.draft[key] = initial;
  return ctx.draft[key] as T;
}

export function setDraft(ctx: Ctx, key: string, value: unknown): void {
  ctx.draft[key] = value;
}

export function errorLine(ctx: Ctx): HTMLElement {
  return h('div', { class: 'error' }, ctx.error);
}

/** The target company card, front side (GDD §4.3). */
export function targetCardFront(target: TargetCompany, extra?: Child): HTMLElement {
  const { revenue, ebitda, netDebt } = latest(target);
  const margin = (ebitda / revenue) * 100;
  return h(
    'div',
    null,
    h('div', { class: 'meta' }, `${target.sector} · ${target.subSector}`),
    h('p', { class: 'lede' }, target.description),
    h(
      'dl',
      { class: 'kv' },
      h('dt', null, 'Revenue (LTM)'),
      h('dd', null, money(revenue)),
      h('dt', null, 'EBITDA (LTM)'),
      h('dd', null, `${money(ebitda)} (${pct(margin)})`),
      h('dt', null, 'Net debt'),
      h('dd', null, money(netDebt)),
      h('dt', null, 'Employees'),
      h('dd', null, target.employees.toLocaleString()),
      h('dt', null, 'Market share'),
      h('dd', null, pct(target.marketSharePct)),
      target.sharePrice ? h('dt', null, 'Share price') : null,
      target.sharePrice ? h('dd', null, `£${target.sharePrice.toFixed(2)}`) : null,
    ),
    h('h3', null, 'Disclosed risks'),
    h(
      'ul',
      { class: 'muted', style: 'margin:0;padding-left:18px;font-size:12.5px' },
      target.knownRisks.map((risk) => h('li', null, risk)),
    ),
    extra,
  );
}

/** A revealed data room card. */
export function findingRow(card: DataRoomCard, impactPct?: number): HTMLElement {
  return h(
    'div',
    { class: `finding ${card.severity}` },
    h(
      'div',
      { class: 'head' },
      h('span', { class: `sev ${card.severity}` }, card.severity),
      h('span', { class: 'mono muted', style: 'font-size:11px' }, dataRoomIndex(card)),
      h('span', { class: 'name' }, card.title),
      impactPct !== undefined
        ? h('span', { class: 'mono muted', style: 'margin-left:auto' }, `−${impactPct.toFixed(1)}%`)
        : null,
    ),
    h('div', { class: 'text' }, card.body),
    card.remedy ? h('div', { class: 'remedy' }, `Remedy — ${card.remedy}`) : null,
    card.flavor ? h('div', { class: 'text muted', style: 'margin-top:6px;font-style:italic' }, card.flavor) : null,
  );
}

export function callout(text: Child, tone: 'good' | 'bad' | '' = ''): HTMLElement {
  return h('div', { class: `callout ${tone}`.trim() }, text);
}

export { panel };
