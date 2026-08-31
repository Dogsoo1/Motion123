/** A minimal hyperscript helper — the app has no framework dependency. */

export type Child = Node | string | number | false | null | undefined | Child[];

export interface Props {
  class?: string;
  id?: string;
  type?: string;
  value?: string | number;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  placeholder?: string;
  disabled?: boolean;
  checked?: boolean;
  title?: string;
  style?: string;
  html?: string;
  onclick?: (event: MouseEvent) => void;
  oninput?: (event: Event) => void;
  onchange?: (event: Event) => void;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') el.className = String(value);
      else if (key === 'html') el.innerHTML = String(value);
      else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2), value as EventListener);
      } else if (key === 'disabled' || key === 'checked') {
        (el as unknown as Record<string, unknown>)[key] = value;
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }
  append(el, children);
  return el;
}

function append(parent: HTMLElement, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(parent, child);
    else if (child instanceof Node) parent.appendChild(child);
    else parent.appendChild(document.createTextNode(String(child)));
  }
}

export function clear(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/** A titled panel — the app's only structural container. */
export function panel(title: string, tag: string | null, ...body: Child[]): HTMLElement {
  return h(
    'section',
    { class: 'panel' },
    h('header', null, title, tag ? h('span', { class: 'tag' }, tag) : null),
    h('div', { class: 'body' }, ...body),
  );
}

/** A segmented control. */
export function segmented<T extends string>(
  options: { value: T; label: string }[],
  current: T,
  onSelect: (value: T) => void,
): HTMLElement {
  return h(
    'div',
    { class: 'seg' },
    options.map((option) =>
      h(
        'button',
        {
          class: option.value === current ? 'on' : '',
          onclick: () => onSelect(option.value),
        },
        option.label,
      ),
    ),
  );
}

export function field(label: string, control: Child, hint?: string): HTMLElement {
  return h(
    'div',
    { class: 'field' },
    h('label', null, label),
    control,
    hint ? h('div', { class: 'hint' }, hint) : null,
  );
}

export function numberInput(
  value: number,
  onChange: (value: number) => void,
  opts: { min?: number; max?: number; step?: number } = {},
): HTMLInputElement {
  return h('input', {
    type: 'number',
    value: String(value),
    min: opts.min,
    max: opts.max,
    step: opts.step ?? 1,
    oninput: (event) => {
      const raw = Number((event.target as HTMLInputElement).value);
      if (Number.isFinite(raw)) onChange(raw);
    },
  });
}

export function slider(
  value: number,
  onChange: (value: number) => void,
  opts: { min: number; max: number; step?: number },
): HTMLInputElement {
  return h('input', {
    type: 'range',
    value: String(value),
    min: opts.min,
    max: opts.max,
    step: opts.step ?? 1,
    oninput: (event) => onChange(Number((event.target as HTMLInputElement).value)),
  });
}
