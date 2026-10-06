import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Evaluate the calculator's pure helpers without loading React or browser APIs.
const source = readFileSync(new URL('../src/components/Calculator.jsx', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '').split('const postNyrr =')[0];
const api = vm.runInNewContext(`${source}\n({ RACES, CATEGORIES, getCorral, getResultCorral, getCorralPercent, getNextCorralTarget, getManualSliderLimits, getManualCorralRanges, manualValueToTime })`);

for (const category of Object.keys(api.CATEGORIES)) {
  test(`${category}: AA/A boundaries, progress and promotion`, () => {
    const cutoff = category === 'men' ? 304 : 379;
    assert.equal(api.getCorral(cutoff, category).label, 'AA');
    assert.equal(api.getCorral(cutoff + 0.49, category).label, 'AA');
    assert.equal(api.getCorral(cutoff + 0.5, category).label, 'A');
    const a = api.getCorral(cutoff + 1, category);
    assert.equal(a.min, cutoff + 1);
    assert.equal(a.max, 389);
    assert.equal(api.getCorral(389, category).label, 'A');
    assert.equal(api.getCorral(390, category).label, 'B');
    assert.equal(api.getCorralPercent(a.min, a), 100);
    assert.equal(api.getCorralPercent(a.max, a), 0);
    for (const pace of [379, 380, 389]) {
      const corral = api.getCorral(pace, category);
      const target = api.getNextCorralTarget({ corral }, category, '10K');
      if (corral.label === 'AA') assert.equal(target, null);
      else {
        assert.equal(target.corral.label, 'AA');
        assert.equal(target.bestPace, cutoff);
        for (const item of target.raceTimes) {
          assert.equal(api.getResultCorral({ time: item.time, raceInfo: api.RACES[item.raceKey], category }).corral.label, 'AA');
        }
      }
    }
    assert.equal(api.getNextCorralTarget({ corral: api.getCorral(cutoff, category) }, category, '10K'), null);
  });

  test(`${category}: all distances have continuous manual ranges matching imported results`, () => {
    for (const raceInfo of Object.values(api.RACES)) {
      for (const mode of ['pace', 'time']) {
        const limits = api.getManualSliderLimits(mode, raceInfo);
        const ranges = api.getManualCorralRanges({ ...limits, mode, raceInfo, category });
        let previous = limits.min - 1;
        for (const [label, range] of Object.entries(ranges)) {
          assert.ok(!label.includes('-'));
          assert.equal(range.min, previous + 1);
          previous = range.max;
        }
        assert.equal(previous, limits.max);
        for (let value = limits.min; value <= limits.max; value++) {
          const result = api.getResultCorral({ time: api.manualValueToTime(value, mode, raceInfo), raceInfo, category });
          assert.notEqual(result.corral.label, 'L');
          const range = ranges[result.corral.label];
          assert.ok(value >= range.min && value <= range.max);
        }
      }
    }
  });
}
