/**
 * Deterministic pseudo-random number generator.
 *
 * The whole engine is a pure function of (seed, action log), so a game can be
 * replayed move-for-move — which the design document calls for in the digital
 * platform's replay system. Nothing in the engine may call Math.random().
 */
export class Rng {
  private state: number;

  constructor(seed: number | string) {
    this.state = typeof seed === 'string' ? Rng.hashString(seed) : seed >>> 0;
    if (this.state === 0) this.state = 0x9e3779b9;
  }

  static hashString(input: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /** mulberry32 — small, fast, good enough for game dice. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Uniform float in [min, max). */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** A single die of `sides` faces. */
  die(sides = 6): number {
    return this.int(1, sides);
  }

  /** Roll `count` dice, return them sorted descending. */
  dice(count: number, sides = 6): number[] {
    const out: number[] = [];
    for (let i = 0; i < count; i++) out.push(this.die(sides));
    return out.sort((a, b) => b - a);
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick called with an empty array');
    return items[this.int(0, items.length - 1)];
  }

  /** Fisher-Yates on a copy; the input is never mutated. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Draw `count` distinct items. Returns fewer if the pool is short. */
  sample<T>(items: readonly T[], count: number): T[] {
    return this.shuffle(items).slice(0, Math.min(count, items.length));
  }

  /** Weighted choice. Weights need not sum to 1. */
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
    if (total <= 0) return entries[0][0];
    let roll = this.next() * total;
    for (const [value, weight] of entries) {
      roll -= Math.max(0, weight);
      if (roll <= 0) return value;
    }
    return entries[entries.length - 1][0];
  }

  /** Serialise so a game can be saved and resumed mid-phase. */
  snapshot(): number {
    return this.state;
  }

  restore(state: number): void {
    this.state = state >>> 0;
  }
}

/** Clamp helper used throughout the engine's scoring maths. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to `places` decimals — keeps money values from drifting into float noise. */
export function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
