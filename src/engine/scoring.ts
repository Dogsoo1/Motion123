import { clamp, round } from './rng.js';
import { currentPrice, targetIntrinsic, targetUnaffected, type GameState } from './state.js';
import { premiumPct } from './valuation.js';
import { REP_CATEGORIES, type RoleId, type RoleScore, type ScoreLine } from './types.js';

/** Scoring and victory conditions (GDD §11). */

function line(label: string, points: number, max: number, detail: string): ScoreLine {
  return { label, points: round(clamp(points, -max, max), 1), max, detail };
}

function repBreadthScore(state: GameState): number {
  if (!state.agreement) return 0;
  const rank = { narrow: 0, standard: 1, broad: 2 } as const;
  const total = REP_CATEGORIES.reduce(
    (sum, c) => sum + rank[state.agreement!.reps[c]],
    0,
  );
  return total / (REP_CATEGORIES.length * 2);
}

export function scoreBuyer(state: GameState): RoleScore {
  const lines: ScoreLine[] = [];
  const closed = state.closing?.closed ?? false;
  const price = currentPrice(state);
  const intrinsic = targetIntrinsic(state);

  // --- Deal value created (0-40) ------------------------------------------
  if (closed && state.closing) {
    const created = state.closing.realisedValue - state.closing.totalCost;
    const scale = Math.max(1, intrinsic * 0.25);
    lines.push(
      line(
        'Deal Value Created',
        20 + (created / scale) * 20,
        40,
        `Realised £${round(state.closing.realisedValue, 0)}M against total cost of £${round(state.closing.totalCost, 0)}M.`,
      ),
    );
  } else if (state.status === 'terminated' && intrinsic > 0 && price > intrinsic * 1.05) {
    lines.push(
      line(
        'Deal Value Created',
        14,
        40,
        'No deal — but the price on the table was above intrinsic value. Walking away preserved capital.',
      ),
    );
  } else {
    lines.push(
      line('Deal Value Created', 0, 40, 'No transaction completed, and no value created.'),
    );
  }

  // --- Deal protection (0-15) ---------------------------------------------
  if (state.agreement) {
    const a = state.agreement;
    const breadth = repBreadthScore(state);
    const capScore = clamp(a.indemnity.capPct / 60, 0, 1);
    const survivalScore = clamp(a.indemnity.survivalMonths / 48, 0, 1);
    const escrowScore = clamp(a.indemnity.escrowPct / 15, 0, 1);
    const sandbag = a.indemnity.proSandbagging ? 0.15 : 0;
    const protection = (breadth * 0.4 + capScore * 0.2 + survivalScore * 0.15 + escrowScore * 0.1) + sandbag;
    lines.push(
      line(
        'Deal Protection',
        protection * 15,
        15,
        `${a.indemnity.capPct}% cap, ${a.indemnity.survivalMonths}-month survival, ${a.indemnity.escrowPct}% escrow, ${
          a.indemnity.proSandbagging ? 'pro-sandbagging' : 'anti-sandbagging'
        }.`,
      ),
    );
  } else {
    lines.push(line('Deal Protection', 0, 15, 'No definitive agreement was reached.'));
  }

  // --- Financing efficiency (0-10) ----------------------------------------
  if (state.financingAnalysis) {
    const fa = state.financingAnalysis;
    // Cheap is good; fragile is not.
    const costScore = clamp(1 - (fa.blendedRateBps - 400) / 800, 0, 1);
    const fragilityScore = 1 - fa.fragility;
    lines.push(
      line(
        'Financing Efficiency',
        (costScore * 0.6 + fragilityScore * 0.4) * 10,
        10,
        `Blended cost ${fa.blendedRateBps}bps at ${fa.leverageTurns}x leverage; fragility ${round(fa.fragility * 100, 0)}%.`,
      ),
    );
  } else {
    lines.push(line('Financing Efficiency', 0, 10, 'No financing structure was put in place.'));
  }

  // --- Speed (0-10) --------------------------------------------------------
  const pace = clamp(2 - state.clock / state.parClock, 0, 1.4);
  lines.push(
    line(
      'Speed',
      Math.min(10, pace * 7),
      10,
      `${state.clock} action rounds against a par of ${state.parClock}.`,
    ),
  );

  // --- Reputation (-10 to +10) --------------------------------------------
  lines.push(
    line(
      'Reputation',
      state.players.buyer.reputation,
      10,
      'How you behaved when it was cheaper not to.',
    ),
  );

  // --- Private objective (0-15) -------------------------------------------
  lines.push(scoreObjective(state, 'buyer'));

  return finalise('buyer', lines);
}

export function scoreSeller(state: GameState): RoleScore {
  const lines: ScoreLine[] = [];
  const price = currentPrice(state);
  const closed = state.closing?.closed ?? false;
  const unaffected = targetUnaffected(state);
  const intrinsic = targetIntrinsic(state);

  if (closed && state.target) {
    const premium = premiumPct(price, state.target);
    lines.push(
      line(
        'Price Achieved',
        18 + ((price - intrinsic) / Math.max(1, intrinsic * 0.3)) * 22,
        40,
        `Cleared at £${round(price, 0)}M — a ${premium}% premium to the unaffected price of £${round(unaffected, 0)}M.`,
      ),
    );
  } else {
    lines.push(
      line('Price Achieved', 0, 40, 'No transaction; shareholders received nothing.'),
    );
  }

  if (state.agreement) {
    const c = state.agreement.conditions;
    let certainty = 1;
    if (c.financingCondition) certainty -= 0.35;
    certainty -= clamp(c.thirdPartyConsentsRequired / 14, 0, 0.25);
    if (c.bringDownStandard === 'all-respects') certainty -= 0.2;
    if (state.agreement.protections.specificPerformance === 'none') certainty -= 0.15;
    lines.push(
      line(
        'Deal Certainty',
        certainty * 15,
        15,
        `${c.financingCondition ? 'Financing condition conceded. ' : 'No financing condition. '}${c.thirdPartyConsentsRequired} consents required; bring-down at "${c.bringDownStandard}".`,
      ),
    );
  } else {
    lines.push(line('Deal Certainty', 0, 15, 'No agreement to be certain about.'));
  }

  // Fiduciary duty: did the board actually run a market check? (GDD §9.1)
  const processScore =
    state.processType === 'auction'
      ? 1
      : state.processType === 'targeted'
        ? 0.7
        : state.processType === 'exclusive'
          ? 0.35
          : 0.2;
  lines.push(
    line(
      'Shareholder Protection',
      processScore * 10,
      10,
      `Ran a ${state.processType ?? 'no'} process. Revlon asks whether the board sought the best price reasonably available.`,
    ),
  );

  lines.push(
    line(
      'Speed',
      Math.min(10, clamp(2 - state.clock / state.parClock, 0, 1.4) * 7),
      10,
      `${state.clock} action rounds elapsed.`,
    ),
  );
  lines.push(line('Reputation', state.players.seller.reputation, 10, 'Conduct through the process.'));
  lines.push(scoreObjective(state, 'seller'));

  return finalise('seller', lines);
}

export function scoreBanker(state: GameState): RoleScore {
  const lines: ScoreLine[] = [];
  const closed = state.closing?.closed ?? false;
  const price = currentPrice(state);

  lines.push(
    line(
      'Fees Earned',
      closed ? clamp((state.bankerFees / Math.max(1, price * 0.012)) * 24, 0, 30) : 0,
      30,
      closed
        ? `£${round(state.bankerFees, 1)}M in advisory fees on a £${round(price, 0)}M transaction.`
        : 'No closing, no fee. That is the whole incentive structure in one line.',
    ),
  );

  const buyerScore = scoreBuyerQuick(state);
  lines.push(
    line(
      'Client Satisfaction',
      buyerScore * 20,
      20,
      `Client achieved ${round(buyerScore * 100, 0)}% of the maximum available score.`,
    ),
  );

  if (state.valuation) {
    const error = Math.abs(state.valuation.estimateErrorPct);
    lines.push(
      line(
        'Fairness Opinion Accuracy',
        clamp(1 - error / 35, 0, 1) * 15,
        15,
        `Valuation midpoint was ${state.valuation.estimateErrorPct > 0 ? '+' : ''}${state.valuation.estimateErrorPct}% against intrinsic value.`,
      ),
    );
  } else {
    lines.push(line('Fairness Opinion Accuracy', 0, 15, 'No valuation work was performed.'));
  }

  lines.push(line('Reputation', state.players.banker.reputation, 10, 'Reliability of advice.'));
  lines.push(scoreObjective(state, 'banker'));
  lines.push(
    line(
      'Deal Tombstone',
      closed ? clamp(price / 4000, 0, 1) * 10 : 0,
      10,
      closed ? 'A notable transaction for the resume.' : 'No tombstone.',
    ),
  );

  return finalise('banker', lines);
}

export function scoreRegulator(state: GameState): RoleScore {
  const lines: ScoreLine[] = [];
  const reg = state.regulatory;

  if (!reg) {
    lines.push(line('Consumer Protection', 15, 30, 'No transaction reached review.'));
    lines.push(line('Enforcement Efficiency', 20, 20, 'No investigation budget was spent.'));
    lines.push(line('Precedent Value', 0, 15, 'No precedent created.'));
    lines.push(line('Market Functioning', 10, 10, 'No beneficial activity was chilled.'));
  } else {
    // Protecting consumers means catching the genuinely anticompetitive deals.
    let protection: number;
    if (reg.presumptivelyAnticompetitive) {
      protection = !reg.cleared ? 30 : reg.remedy === 'structural' || reg.remedy === 'fix-it-first' ? 24 : reg.remedy === 'behavioral' ? 14 : 6;
    } else {
      protection = reg.cleared ? 22 : 8;
    }
    lines.push(
      line(
        'Consumer Protection',
        protection,
        30,
        reg.presumptivelyAnticompetitive
          ? `Presumptively anticompetitive deal ${reg.cleared ? `cleared with a ${reg.remedy} remedy` : 'blocked'}.`
          : `Deal below the structural presumption was ${reg.cleared ? 'cleared' : 'blocked'}.`,
      ),
    );

    const budgetUsed = reg.roundsAdded / 6;
    const justified = reg.presumptivelyAnticompetitive ? 1 : 0.35;
    lines.push(
      line(
        'Enforcement Efficiency',
        clamp(1 - Math.abs(budgetUsed - justified), 0, 1) * 20,
        20,
        `${reg.roundsAdded} extra review rounds consumed on a ${reg.presumptivelyAnticompetitive ? 'presumptive' : 'sub-threshold'} matter.`,
      ),
    );

    lines.push(
      line(
        'Precedent Value',
        reg.litigated ? (reg.litigationWon === false ? 15 : 6) : reg.remedy === 'structural' ? 9 : 3,
        15,
        reg.litigated
          ? 'Took a contested case to judgment, which is how law gets made.'
          : 'Resolved without litigation.',
      ),
    );

    lines.push(
      line(
        'Market Functioning',
        reg.presumptivelyAnticompetitive || reg.cleared ? 10 : 3,
        10,
        reg.cleared || reg.presumptivelyAnticompetitive
          ? 'Enforcement was proportionate to the competitive concern.'
          : 'A sub-threshold deal was blocked — that chills beneficial activity.',
      ),
    );
  }

  lines.push(
    line('Reputation', state.players.regulator.reputation, 10, 'Consistency and reasoning.'),
  );
  lines.push(scoreObjective(state, 'regulator'));

  return finalise('regulator', lines);
}

/** Quick normalised buyer score, used for the banker's client-satisfaction line. */
function scoreBuyerQuick(state: GameState): number {
  const closed = state.closing?.closed ?? false;
  if (!closed || !state.closing) return 0.1;
  const created = state.closing.realisedValue - state.closing.totalCost;
  const scale = Math.max(1, targetIntrinsic(state) * 0.3);
  return clamp(0.5 + created / scale / 2, 0, 1);
}

/** Private objective bonus (GDD §7.1, §11.1). */
export function scoreObjective(state: GameState, role: RoleId): ScoreLine {
  const objective = state.players[role].objective;
  const closed = state.closing?.closed ?? false;
  const price = currentPrice(state);
  const intrinsic = targetIntrinsic(state);
  const max = 15;

  const award = (achieved: boolean, detail: string, partial = 0): ScoreLine =>
    line(`Objective: ${objective.name}`, achieved ? max : partial, max, detail);

  switch (objective.id) {
    case 'obj-speed':
      return award(
        closed && state.clock <= state.parClock,
        `Closed in ${state.clock} rounds against a par of ${state.parClock}.`,
        closed ? 6 : 0,
      );
    case 'obj-empire':
      return award(
        closed && price > 4000,
        `Deal value of £${round(price, 0)}M.`,
        closed ? clamp(price / 4000, 0, 1) * 9 : 0,
      );
    case 'obj-discipline':
      return award(
        (closed && price < intrinsic) || (!closed && price > intrinsic),
        closed
          ? `Paid £${round(price, 0)}M against intrinsic value of £${round(intrinsic, 0)}M.`
          : 'Declined to overpay.',
      );
    case 'obj-protection': {
      const a = state.agreement;
      const achieved =
        !!a && repBreadthScore(state) > 0.6 && a.indemnity.capPct >= 40 && a.indemnity.survivalMonths >= 30;
      return award(
        achieved,
        a
          ? `Rep breadth ${round(repBreadthScore(state) * 100, 0)}%, ${a.indemnity.capPct}% cap, ${a.indemnity.survivalMonths}-month survival.`
          : 'No agreement reached.',
        a ? 5 : 0,
      );
    }
    case 'obj-premium': {
      const premium = state.target ? premiumPct(price, state.target) : 0;
      return award(closed && premium >= 30, `Premium delivered: ${premium}%.`, closed ? 5 : 0);
    }
    case 'obj-certainty':
      return award(
        closed && !!state.agreement && !state.agreement.conditions.financingCondition,
        closed ? 'Deal closed without a financing condition.' : 'Deal did not close.',
        closed ? 7 : 0,
      );
    case 'obj-process':
      return award(
        state.processType === 'auction' || state.processType === 'targeted',
        `Process run: ${state.processType ?? 'none'}.`,
        state.processType === 'exclusive' ? 4 : 0,
      );
    case 'obj-fees':
      return award(
        closed && state.bankerFees > price * 0.011,
        `£${round(state.bankerFees, 1)}M earned.`,
        closed ? 7 : 0,
      );
    case 'obj-accuracy': {
      const err = state.valuation ? Math.abs(state.valuation.estimateErrorPct) : 100;
      return award(err <= 8, `Valuation error of ${round(err, 1)}%.`, err <= 18 ? 7 : 0);
    }
    case 'obj-hawk': {
      const reg = state.regulatory;
      return award(
        !!reg && (!reg.cleared || reg.remedy === 'structural' || reg.remedy === 'fix-it-first'),
        reg ? `Outcome: ${reg.cleared ? `cleared with ${reg.remedy} remedy` : 'blocked'}.` : 'No review.',
        reg?.remedy === 'behavioral' ? 6 : 0,
      );
    }
    case 'obj-efficiency': {
      const reg = state.regulatory;
      return award(
        !!reg && reg.roundsAdded <= 2 && reg.cleared,
        reg ? `${reg.roundsAdded} extra rounds consumed.` : 'No review.',
        reg && reg.roundsAdded <= 4 ? 6 : 0,
      );
    }
    case 'obj-reputation': {
      const mine = state.players[role].reputation;
      const highest = Math.max(...Object.values(state.players).map((p) => p.reputation));
      return award(mine >= highest && mine > 0, `Finished on ${round(mine, 1)} reputation.`, mine > 0 ? 6 : 0);
    }
    default:
      return award(false, 'Objective not evaluated.');
  }
}

/** Universal scoring modifiers (GDD §11.2). */
export function universalModifiers(state: GameState): ScoreLine[] {
  const out: ScoreLine[] = [];
  const closed = state.closing?.closed ?? false;
  const price = currentPrice(state);
  const intrinsic = targetIntrinsic(state);

  if (state.status === 'terminated' && intrinsic > 0 && price > intrinsic * 1.1) {
    out.push(line('Walkaway Bonus', 5, 5, 'Walked away from a deal that was objectively bad.'));
  }
  if (closed && state.diligence && state.diligence.missed.length === 0) {
    out.push(
      line('Innovation Bonus', 5, 5, 'Diligence found everything there was to find.'),
    );
  }
  if (
    closed &&
    state.regulatory?.presumptivelyAnticompetitive &&
    state.regulatory.cleared
  ) {
    out.push(
      line('Dealmaker Bonus', 10, 10, 'Cleared a presumptively anticompetitive transaction.'),
    );
  }
  if (state.clock > state.parClock) {
    out.push(
      line(
        'Time Penalty',
        -2 * (state.clock - state.parClock),
        20,
        `${state.clock - state.parClock} rounds over par.`,
      ),
    );
  }
  if (closed && state.closing && state.closing.realisedValue > state.closing.totalCost * 1.2) {
    out.push(
      line('Integration Success', 10, 10, 'Post-closing performance exceeded the underwriting case.'),
    );
  }
  return out;
}

function finalise(role: RoleId, lines: ScoreLine[]): RoleScore {
  const total = round(
    lines.reduce((s, l) => s + l.points, 0),
    1,
  );
  const max = lines.reduce((s, l) => s + l.max, 0);
  return { role, lines, total, max };
}

export function scoreAll(state: GameState): RoleScore[] {
  const modifiers = universalModifiers(state);
  const buyerScore = scoreBuyer(state);
  buyerScore.lines.push(...modifiers);
  buyerScore.total = round(
    buyerScore.lines.reduce((s, l) => s + l.points, 0),
    1,
  );
  buyerScore.max = buyerScore.lines.reduce((s, l) => s + l.max, 0);

  return [buyerScore, scoreSeller(state), scoreBanker(state), scoreRegulator(state)];
}
