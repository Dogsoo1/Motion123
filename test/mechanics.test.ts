import assert from 'node:assert/strict';
import test from 'node:test';

import { assessMac, carveOutsFromValue, negotiateAgreement } from '../src/engine/agreement.js';
import { requiredScopeFor, resolveClaim } from '../src/engine/closing.js';
import { computeHhi, isPresumptivelyAnticompetitive } from '../src/engine/regulatory.js';
import { Rng } from '../src/engine/rng.js';
import {
  buildDataRoom,
  emptyAllocation,
  latentFindings,
  runDiligence,
  totalAllocationCost,
} from '../src/engine/diligence.js';
import {
  COMPROMISED_REPORT_CODENAME,
  COMPROMISED_REPORT_MISS_RATE,
  DEAL_CODENAMES,
  DIFFICULTY_PROFILES,
  DILIGENCE_PROVIDERS,
  RIVALS,
} from '../src/engine/content/advisers.js';
import { competingBidderResponse } from '../src/engine/ai.js';
import { createGame } from '../src/engine/state.js';
import { TARGET_BY_ID, TARGET_COMPANIES } from '../src/engine/content/targets.js';
import { MARKET_ENVIRONMENTS } from '../src/engine/content/markets.js';
import { DATA_ROOM_BY_ID } from '../src/engine/content/dataroom.js';
import { intrinsicEquityValue, runDcfAnalysis, defaultDcfAssumptions } from '../src/engine/valuation.js';
import { DILIGENCE_CATEGORIES } from '../src/engine/types.js';
import type { DefinitiveAgreement, RepCategory } from '../src/engine/types.js';

function agreementWith(overrides: Partial<DefinitiveAgreement> = {}): DefinitiveAgreement {
  const reps = {
    financialStatements: 'broad',
    materialContracts: 'broad',
    litigation: 'broad',
    ip: 'broad',
    compliance: 'broad',
    environmental: 'broad',
    tax: 'broad',
    employees: 'broad',
  } as Record<RepCategory, 'narrow' | 'standard' | 'broad'>;
  return {
    reps,
    macCarveOuts: [],
    macThresholdPct: 20,
    indemnity: {
      capPct: 50,
      basketPct: 0.5,
      basketType: 'tipping',
      survivalMonths: 36,
      fundamentalRepsIndefinite: true,
      escrowPct: 15,
      proSandbagging: true,
      soleRemedy: false,
      specialIndemnities: [],
      rwInsurance: false,
    },
    conditions: {
      regulatoryApproval: true,
      financingCondition: false,
      minimumTenderPct: 50.1,
      thirdPartyConsentsRequired: 2,
      bringDownStandard: 'material-respects',
      noMac: true,
    },
    protections: {
      matchingRights: 2,
      terminationFeePct: 3,
      reverseTerminationFeePct: 4,
      forceTheVote: false,
      fiduciaryOut: true,
      specificPerformance: 'mutual',
    },
    price: 1000,
    ...overrides,
  };
}

test('a narrow representation bars a claim that a broad one would cover', () => {
  const base = agreementWith();
  const narrow = agreementWith({
    reps: { ...base.reps, environmental: 'narrow' },
  });

  const claim = (agreement: DefinitiveAgreement) =>
    resolveClaim({
      source: 'Legacy contamination',
      repCategory: 'environmental',
      grossLoss: 80,
      knownAtSigning: false,
      discoveredMonth: 18,
      requiresScope: 'broad',
      agreement,
      dealValue: 1000,
      alreadyRecovered: 0,
    });

  assert.ok(claim(base).recovered > 0, 'a broad rep reaches the claim');
  assert.equal(claim(narrow).recovered, 0, 'a narrow rep does not');
  assert.match(claim(narrow).barReason!, /narrow/);
});

test('the survival period actually expires', () => {
  const agreement = agreementWith();
  const inTime = resolveClaim({
    source: 'Tax assessment',
    repCategory: 'tax',
    grossLoss: 60,
    knownAtSigning: false,
    discoveredMonth: 30,
    requiresScope: 'standard',
    agreement,
    dealValue: 1000,
    alreadyRecovered: 0,
  });
  const tooLate = resolveClaim({
    source: 'Tax assessment',
    repCategory: 'tax',
    grossLoss: 60,
    knownAtSigning: false,
    discoveredMonth: 90,
    requiresScope: 'standard',
    agreement,
    dealValue: 1000,
    alreadyRecovered: 0,
  });
  assert.ok(inTime.recovered > 0);
  assert.equal(tooLate.recovered, 0);
  assert.match(tooLate.barReason!, /survival period/);
});

test('anti-sandbagging bars a claim on something the buyer knew at signing', () => {
  const pro = agreementWith();
  const anti = agreementWith({
    indemnity: { ...pro.indemnity, proSandbagging: false },
  });
  const claimOn = (agreement: DefinitiveAgreement) =>
    resolveClaim({
      source: 'Known customer concentration',
      repCategory: 'materialContracts',
      grossLoss: 70,
      knownAtSigning: true,
      discoveredMonth: 12,
      requiresScope: 'standard',
      agreement,
      dealValue: 1000,
      alreadyRecovered: 0,
    });
  assert.ok(claimOn(pro).recovered > 0, 'pro-sandbagging preserves the claim');
  assert.equal(claimOn(anti).recovered, 0, 'anti-sandbagging kills it');
});

test('the basket and the cap both bind', () => {
  const agreement = agreementWith({
    indemnity: {
      ...agreementWith().indemnity,
      basketPct: 2,
      basketType: 'deductible',
      capPct: 5,
    },
  });
  const belowBasket = resolveClaim({
    source: 'Small matter',
    repCategory: 'litigation',
    grossLoss: 15,
    knownAtSigning: false,
    discoveredMonth: 6,
    requiresScope: 'standard',
    agreement,
    dealValue: 1000,
    alreadyRecovered: 0,
  });
  assert.equal(belowBasket.recovered, 0, '$15M is under a $20M basket');

  const large = resolveClaim({
    source: 'Large matter',
    repCategory: 'litigation',
    grossLoss: 300,
    knownAtSigning: false,
    discoveredMonth: 6,
    requiresScope: 'standard',
    agreement,
    dealValue: 1000,
    alreadyRecovered: 0,
  });
  assert.ok(large.recovered <= 50.001, 'recovery cannot exceed the 5% cap');
  assert.ok(large.recovered > 0);
});

test('a specific indemnity survives longer and sits outside the basket', () => {
  const agreement = agreementWith({
    reps: { ...agreementWith().reps, environmental: 'narrow' },
    indemnity: {
      ...agreementWith().indemnity,
      basketPct: 3,
      survivalMonths: 12,
      specialIndemnities: ['environmental'],
    },
  });
  const claim = resolveClaim({
    source: 'Legacy contamination',
    repCategory: 'environmental',
    grossLoss: 20,
    knownAtSigning: true,
    discoveredMonth: 40,
    requiresScope: 'broad',
    agreement,
    dealValue: 1000,
    alreadyRecovered: 0,
  });
  assert.ok(
    claim.recovered > 0,
    'the bespoke indemnity reaches past the narrow rep, the basket and the short survival',
  );
});

test('MAC carve-outs decide whether a sector-wide shock lets the buyer walk', () => {
  const event = {
    id: 'ev-test',
    name: 'Sector downturn',
    description: '',
    ebitdaHitPct: 30,
    carveOutIds: ['industry-wide' as const],
  };

  const withCarveOut = assessMac({
    agreement: agreementWith({ macCarveOuts: ['industry-wide'] }),
    event,
    disproportionateRatio: 1.0,
  });
  const withoutCarveOut = assessMac({
    agreement: agreementWith({ macCarveOuts: [] }),
    event,
    disproportionateRatio: 1.0,
  });

  assert.ok(
    withoutCarveOut.strength > withCarveOut.strength,
    'stripping the carve-out strengthens the buyer materially',
  );
  assert.ok(withCarveOut.caughtByCarveOut);
  assert.ok(!withoutCarveOut.caughtByCarveOut);
});

test('the disproportionate impact exception pulls a carved-out event back in', () => {
  const event = {
    id: 'ev-test',
    name: 'Sector downturn',
    description: '',
    ebitdaHitPct: 32,
    carveOutIds: ['industry-wide' as const],
  };
  const agreement = agreementWith({
    macCarveOuts: ['industry-wide', 'disproportionate-exception'],
  });

  const inLine = assessMac({ agreement, event, disproportionateRatio: 1.0 });
  const muchWorse = assessMac({ agreement, event, disproportionateRatio: 2.4 });

  assert.ok(!inLine.disproportionateApplies);
  assert.ok(muchWorse.disproportionateApplies);
  assert.ok(muchWorse.strength > inLine.strength);
});

test('a higher MAC threshold makes the clause harder to trigger', () => {
  const event = {
    id: 'ev',
    name: 'Missed quarter',
    description: '',
    ebitdaHitPct: 22,
    carveOutIds: [],
  };
  const low = assessMac({
    agreement: agreementWith({ macThresholdPct: 15 }),
    event,
    disproportionateRatio: 2,
  });
  const high = assessMac({
    agreement: agreementWith({ macThresholdPct: 35 }),
    event,
    disproportionateRatio: 2,
  });
  assert.ok(low.clearsThreshold);
  assert.ok(!high.clearsThreshold);
  assert.ok(low.strength > high.strength);
});

test('winning the MAC negotiation strips carve-outs', () => {
  const sellerWin = carveOutsFromValue(0.05);
  const buyerWin = carveOutsFromValue(0.95);
  assert.ok(sellerWin.length > buyerWin.length);
  assert.ok(buyerWin.includes('disproportionate-exception'));
  assert.ok(!sellerWin.includes('disproportionate-exception'));
});

test('committing more negotiation points produces a more protective agreement', () => {
  const run = (push: number) => {
    const rng = new Rng('agreement-compare');
    return negotiateAgreement({
      pushes: { reps: push, mac: push, indemnity: push, conditions: push },
      sellerResistance: { reps: 4, mac: 4, indemnity: 4, conditions: 4 },
      leverage: 0,
      specialIndemnityRequests: [],
      rwInsurance: false,
      price: 1000,
      rng,
    });
  };
  const weak = run(0);
  const strong = run(9);
  assert.ok(
    strong.agreement.indemnity.capPct > weak.agreement.indemnity.capPct,
    'a harder push wins a bigger cap',
  );
  assert.ok(
    strong.agreement.indemnity.survivalMonths >= weak.agreement.indemnity.survivalMonths,
  );
  assert.ok(strong.agreement.macCarveOuts.length <= weak.agreement.macCarveOuts.length);
});

test('HHI screen matches the 2500/200 thresholds', () => {
  const concentrated = computeHhi({ acquirerSharePct: 30, targetSharePct: 25, shareMultiplier: 1 });
  assert.ok(concentrated.post > 2500);
  assert.ok(concentrated.delta > 200);
  assert.ok(isPresumptivelyAnticompetitive(concentrated.post, concentrated.delta));

  const fragmented = computeHhi({ acquirerSharePct: 4, targetSharePct: 3, shareMultiplier: 1 });
  assert.ok(!isPresumptivelyAnticompetitive(fragmented.post, fragmented.delta));
});

test('a narrower market definition raises concentration', () => {
  const broad = computeHhi({ acquirerSharePct: 18, targetSharePct: 14, shareMultiplier: 0.68 });
  const narrow = computeHhi({ acquirerSharePct: 18, targetSharePct: 14, shareMultiplier: 1.45 });
  assert.ok(narrow.post > broad.post);
  assert.ok(narrow.delta > broad.delta);
});

test('deeper diligence reveals more and leaves less latent risk', () => {
  const target = TARGET_BY_ID['sedia'];
  const build = () => buildDataRoom(target, 'selective', new Rng('dr-seed'));

  const shallow = emptyAllocation();
  shallow.ip = 1;
  const deep = emptyAllocation();
  deep.ip = 3;

  const shallowResult = runDiligence(build(), shallow, new Rng('run-1'));
  const deepResult = runDiligence(build(), deep, new Rng('run-1'));

  assert.ok(deepResult.revealed.length >= shallowResult.revealed.length);
  assert.ok(deepResult.missed.length <= shallowResult.missed.length);
  assert.equal(totalAllocationCost(shallow), 1);
  assert.equal(totalAllocationCost(deep), 3);
});

test('burying findings pushes them deeper into the folder', () => {
  const target = TARGET_BY_ID['avonmouth'];
  const buried = buildDataRoom(target, 'bury', new Rng('bury'));
  const disclosed = buildDataRoom(target, 'full', new Rng('full'));

  const surface = emptyAllocation();
  surface.environmental = 1;

  const fromBuried = runDiligence(buried, surface, new Rng('x'));
  const fromDisclosed = runDiligence(disclosed, surface, new Rng('x'));

  assert.ok(
    fromDisclosed.revealed.length >= fromBuried.revealed.length,
    'full disclosure puts everything on the table regardless of spend',
  );
});

test('hidden findings reduce intrinsic value', () => {
  const clean = { ...TARGET_BY_ID['belgrave'], hiddenFindingIds: [] };
  const dirty = TARGET_BY_ID['belgrave'];
  const market = MARKET_ENVIRONMENTS.bull;
  assert.ok(
    intrinsicEquityValue(clean, market) > intrinsicEquityValue(dirty, market),
    'skeletons in the data room are real value destruction',
  );
});

test('required scope scales with severity', () => {
  assert.equal(requiredScopeFor(DATA_ROOM_BY_ID['dr-fin-fraud']), 'broad');
  assert.equal(requiredScopeFor(DATA_ROOM_BY_ID['dr-legal-employment']), 'standard');
});

test('the DCF rejects a WACC below terminal growth', () => {
  const target = TARGET_BY_ID['march-holdings'];
  const assumptions = defaultDcfAssumptions(target);
  assert.throws(() =>
    runDcfAnalysis(target, MARKET_ENVIRONMENTS.bull, {
      ...assumptions,
      waccPct: 2,
      terminalGrowthPct: 5,
    }),
  );
});

test('a higher discount rate produces a lower valuation', () => {
  const target = TARGET_BY_ID['march-holdings'];
  const base = defaultDcfAssumptions(target);
  const cheap = runDcfAnalysis(target, MARKET_ENVIRONMENTS.bull, { ...base, waccPct: 8 });
  const dear = runDcfAnalysis(target, MARKET_ENVIRONMENTS.bull, { ...base, waccPct: 14 });
  assert.ok(cheap.mid > dear.mid);
});

test('Santa Barbara misses findings that Monk Forensic reaches', () => {
  const target = TARGET_BY_ID['belgrave'];
  const allocation = emptyAllocation();
  for (const category of DILIGENCE_CATEGORIES) allocation[category] = 3;

  let monkFound = 0;
  let santaBarbaraFound = 0;
  const runs = 40;
  for (let i = 0; i < runs; i++) {
    const monkRoom = buildDataRoom(target, 'selective', new Rng(`room-${i}`));
    const sbRoom = buildDataRoom(target, 'selective', new Rng(`room-${i}`));
    monkFound += runDiligence(monkRoom, allocation, new Rng(`run-${i}`), {
      missRate: DILIGENCE_PROVIDERS.monk.missRate,
      reachesDeeper: DILIGENCE_PROVIDERS.monk.reachesDeeper,
    }).revealed.length;
    santaBarbaraFound += runDiligence(sbRoom, allocation, new Rng(`run-${i}`), {
      missRate: DILIGENCE_PROVIDERS['santa-barbara'].missRate,
      reachesDeeper: DILIGENCE_PROVIDERS['santa-barbara'].reachesDeeper,
    }).revealed.length;
  }

  assert.ok(
    monkFound > santaBarbaraFound,
    `Monk should surface more (${monkFound} vs ${santaBarbaraFound})`,
  );
});

test('a missed finding becomes latent rather than disappearing', () => {
  const target = TARGET_BY_ID['singleton'];
  const allocation = emptyAllocation();
  for (const category of DILIGENCE_CATEGORIES) allocation[category] = 3;

  const room = buildDataRoom(target, 'selective', new Rng('latent-room'));
  const result = runDiligence(room, allocation, new Rng('latent-run'), {
    missRate: 0.9,
    reachesDeeper: false,
  });

  // Everything the fieldwork reached but did not report is still in the room,
  // and will surface after closing.
  assert.ok(result.missed.length > 0, 'misses are recorded as latent risk');
  assert.equal(
    latentFindings(room).length,
    result.missed.length,
    'latent findings match what the report failed to surface',
  );
});

test('Shutter Island keeps ground truth out of reach whoever you retain', () => {
  const tier = DIFFICULTY_PROFILES['shutter-island'];
  assert.ok(tier.reportsCompromised);
  assert.ok(
    Math.max(DILIGENCE_PROVIDERS.monk.missRate, COMPROMISED_REPORT_MISS_RATE) > 0.3,
    'even the forensic provider misses material on this tier',
  );
  assert.ok(tier.diligenceBudget < DIFFICULTY_PROFILES['clean-team'].diligenceBudget);
  assert.equal(tier.disclosure, 'bury');
});

test('Masego walks on price and Tanerelle does not always', () => {
  let masegoStretched = 0;
  let tanerelleStretched = 0;
  for (let i = 0; i < 200; i++) {
    const above = 1000;
    const masego = competingBidderResponse(
      { id: 'masego', name: 'Masego Capital', ceiling: 900, active: true, bid: 850 },
      above,
      new Rng(`m-${i}`),
    );
    const tanerelle = competingBidderResponse(
      { id: 'tanerelle', name: 'Tanerélle Office', ceiling: 900, active: true, bid: 850 },
      above,
      new Rng(`t-${i}`),
    );
    if (!masego.withdrew) masegoStretched++;
    if (!tanerelle.withdrew) tanerelleStretched++;
  }
  assert.equal(masegoStretched, 0, 'Masego never bids past its own ceiling');
  assert.ok(tanerelleStretched > 0, 'Tanerelle sometimes does');
});

test('every canonical target and adviser name is present', () => {
  const targetNames = TARGET_COMPANIES.map((t) => t.name);
  for (const expected of [
    'Avonmouth Port Holdings',
    'Addlestone Leisure Group',
    'March Holdings',
    'Sedia Group',
    'Singleton Foods',
    'Belgrave Textiles',
  ]) {
    assert.ok(targetNames.includes(expected), `${expected} is in the target set`);
  }
  assert.equal(TARGET_COMPANIES.length, 6);
  assert.equal(DILIGENCE_PROVIDERS.monk.name, 'Monk Forensic');
  assert.equal(DILIGENCE_PROVIDERS['santa-barbara'].name, 'Santa Barbara Advisory');
  assert.equal(RIVALS.masego.name, 'Masego Capital');
  assert.equal(RIVALS.tanerelle.name, 'Tanerélle Office');
});

test('Project Shutter is reserved for compromised-report games', () => {
  const compromised = createGame({ seed: 'codename-a', difficulty: 'shutter-island' });
  assert.equal(compromised.codename, COMPROMISED_REPORT_CODENAME);
  for (let i = 0; i < 30; i++) {
    const ordinary = createGame({ seed: `codename-${i}`, difficulty: 'red-flag' });
    assert.notEqual(ordinary.codename, COMPROMISED_REPORT_CODENAME);
    assert.ok(DEAL_CODENAMES.includes(ordinary.codename as never));
  }
});
