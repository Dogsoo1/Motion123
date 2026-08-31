import { CLEAN_CARDS_BY_CATEGORY, DATA_ROOM_BY_ID } from './content/dataroom.js';
import { Rng, clamp, round } from './rng.js';
import {
  DILIGENCE_CATEGORIES,
  type DataRoomCard,
  type DataRoomSlot,
  type DiligenceCategory,
  type DiligenceDepth,
  type DiligenceFinding,
  type DiligenceResult,
  type DisclosureStrategy,
  type TargetCompany,
} from './types.js';

/** The data room, laid out by category (GDD §3.1). */
export type DataRoom = Record<DiligenceCategory, DataRoomSlot[]>;

const SLOTS_PER_CATEGORY = 4;

/**
 * Build the data room for a target.
 *
 * The seller's disclosure strategy decides how deep the bad news is filed —
 * "bury the bodies" is a real strategy with a real reputational price if the
 * buyer digs it out anyway (GDD §3.3).
 */
export function buildDataRoom(
  target: TargetCompany,
  strategy: DisclosureStrategy,
  rng: Rng,
): DataRoom {
  const room = {} as DataRoom;
  for (const category of DILIGENCE_CATEGORIES) {
    room[category] = [];
  }

  // Place the target's seeded findings first.
  for (const id of target.hiddenFindingIds) {
    const card = DATA_ROOM_BY_ID[id];
    if (!card) continue;
    room[card.category].push({ card, depth: 0, revealed: false });
  }

  // Pad each category with clean cards up to the slot count.
  for (const category of DILIGENCE_CATEGORIES) {
    const clean = CLEAN_CARDS_BY_CATEGORY[category];
    let i = 0;
    while (room[category].length < SLOTS_PER_CATEGORY && clean.length > 0) {
      const card = clean[i % clean.length];
      room[category].push({ card, depth: 0, revealed: false });
      i++;
    }
  }

  // Order the slots. Burial pushes severe findings to the back of the folder.
  for (const category of DILIGENCE_CATEGORIES) {
    const slots = room[category];
    const severityRank: Record<string, number> = { green: 0, yellow: 1, red: 2, black: 3 };
    let ordered: DataRoomSlot[];

    switch (strategy) {
      case 'full':
        // Everything face up, worst first — this is what good faith looks like.
        ordered = slots
          .slice()
          .sort((a, b) => severityRank[b.card.severity] - severityRank[a.card.severity]);
        for (const slot of ordered) {
          slot.revealed = true;
          slot.revealedBy = 'disclosure';
        }
        break;
      case 'bury':
        // Worst material filed deepest. Page 847 of Exhibit Q.
        ordered = slots
          .slice()
          .sort((a, b) => severityRank[a.card.severity] - severityRank[b.card.severity]);
        break;
      case 'drip':
        ordered = rng.shuffle(slots);
        break;
      case 'selective':
      default:
        // Clean material up front, problems mixed into the middle.
        ordered = rng.shuffle(slots).sort((a, b) => {
          const aClean = a.card.severity === 'green' ? 0 : 1;
          const bClean = b.card.severity === 'green' ? 0 : 1;
          return aClean - bClean;
        });
        break;
    }

    ordered.forEach((slot, index) => {
      slot.depth = index;
    });
    room[category] = ordered;
  }

  return room;
}

/** Diligence Point cost of a given depth (GDD §3.2). */
export function depthCost(depth: DiligenceDepth): number {
  return depth;
}

/** How many slots a depth actually opens. */
export function slotsRevealed(depth: DiligenceDepth): number {
  switch (depth) {
    case 0:
      return 0;
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
    case 4:
      return SLOTS_PER_CATEGORY;
  }
}

export function totalAllocationCost(
  allocation: Record<DiligenceCategory, DiligenceDepth>,
): number {
  return DILIGENCE_CATEGORIES.reduce((sum, c) => sum + depthCost(allocation[c] ?? 0), 0);
}

export function emptyAllocation(): Record<DiligenceCategory, DiligenceDepth> {
  return DILIGENCE_CATEGORIES.reduce(
    (acc, c) => {
      acc[c] = 0;
      return acc;
    },
    {} as Record<DiligenceCategory, DiligenceDepth>,
  );
}

/**
 * Resolve a diligence allocation against the data room.
 *
 * Expert Analysis (4 DP) buys the full reveal plus a "risk assessment"
 * modifier, which lands as extra negotiating leverage on the findings in that
 * category (GDD §3.2).
 */
export function runDiligence(
  room: DataRoom,
  allocation: Record<DiligenceCategory, DiligenceDepth>,
  rng: Rng,
): DiligenceResult {
  const revealed: DataRoomCard[] = [];
  const missed: DataRoomCard[] = [];
  const findings: DiligenceFinding[] = [];
  const expertCategories: DiligenceCategory[] = [];

  for (const category of DILIGENCE_CATEGORIES) {
    const depth = (allocation[category] ?? 0) as DiligenceDepth;
    if (depth === 4) expertCategories.push(category);
    const reach = slotsRevealed(depth);

    for (const slot of room[category]) {
      const alreadyOpen = slot.revealed;
      const nowOpen = alreadyOpen || slot.depth < reach;
      if (nowOpen) {
        if (!alreadyOpen) {
          slot.revealed = true;
          slot.revealedBy = depth === 4 ? 'expert' : 'diligence';
        }
        if (slot.card.severity !== 'green') revealed.push(slot.card);
      } else if (slot.card.severity !== 'green') {
        missed.push(slot.card);
      }
    }
  }

  let priceAdjustmentPct = 0;
  for (const card of revealed) {
    const [lo, hi] = card.priceImpactPct;
    // An expert review lets the buyer argue the top of the range; otherwise it lands mid.
    const expert = expertCategories.includes(card.category);
    const impact = expert ? rng.float((lo + hi) / 2, hi) : rng.float(lo, hi);
    priceAdjustmentPct += impact;
    findings.push({
      card,
      priceImpactPct: round(impact, 2),
      demandsSpecialIndemnity: card.severity === 'red' || card.severity === 'black',
    });
  }

  return {
    spent: totalAllocationCost(allocation),
    allocation,
    revealed,
    missed,
    priceAdjustmentPct: round(clamp(priceAdjustmentPct, 0, 60), 2),
    expertCategories,
    findings,
  };
}

/** Whistleblower / leak events flip one unrevealed card at random (GDD §3.5). */
export function revealRandomHidden(room: DataRoom, rng: Rng): DataRoomCard | undefined {
  const hidden: DataRoomSlot[] = [];
  for (const category of DILIGENCE_CATEGORIES) {
    for (const slot of room[category]) {
      if (!slot.revealed && slot.card.severity !== 'green') hidden.push(slot);
    }
  }
  if (hidden.length === 0) return undefined;
  const slot = rng.pick(hidden);
  slot.revealed = true;
  slot.revealedBy = 'event';
  return slot.card;
}

/** Everything still hidden when diligence closes — the latent risk the buyer owns. */
export function latentFindings(room: DataRoom): DataRoomCard[] {
  const out: DataRoomCard[] = [];
  for (const category of DILIGENCE_CATEGORIES) {
    for (const slot of room[category]) {
      if (!slot.revealed && slot.card.severity !== 'green') out.push(slot.card);
    }
  }
  return out;
}

/** Reputation consequence of being caught burying material findings (GDD §3.3). */
export function burialPenalty(
  strategy: DisclosureStrategy,
  result: DiligenceResult,
): number {
  if (strategy !== 'bury') return 0;
  const seriousFound = result.revealed.filter(
    (c) => c.severity === 'red' || c.severity === 'black',
  ).length;
  return -2 * seriousFound;
}
