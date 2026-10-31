import { createReadStream, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
const execution = JSON.parse(readFileSync('docs/fase2/carga/ejecucion.json', 'utf8'));
const output = [];
for (const profile of ['rnf20', 'load50']) {
  const points = [];
  const input = createInterface({ input: createReadStream(`artifacts/load-${profile}-timeseries.json`), crlfDelay: Infinity });
  let samples = 0;
  for await (const line of input) {
    if (!line.trim()) continue;
    const item = JSON.parse(line);
    samples++;
    if (item.type === 'Point' && item.metric === 'vus') points.push({ time: item.data.time, epoch: Date.parse(item.data.time), value: item.data.value });
  }
  points.sort((a, b) => a.epoch - b.epoch);
  const target = profile === 'load50' ? 50 : 20;
  const plateau = points.filter(point => point.value === target);
  const intervals = points.slice(1).map((p, i) => p.epoch - points[i].epoch).filter(ms => ms > 0).sort((a,b)=>a-b);
  const samplingIntervalMs = intervals[Math.floor(intervals.length / 2)];
  const start = plateau[0];
  const end = plateau.at(-1);
  const after = points.find(point => point.epoch > end?.epoch && point.value < target);
  const evidence = {
    profile, samples, targetVUs: target, maximumObservedVUs: Math.max(...points.map(p=>p.value)),
    firstTargetSample: start?.time, lastTargetSample: end?.time, firstLowerSampleAfterTarget: after?.time,
    continuousTargetSamples: plateau.length,
    targetSampleSpanSeconds: start && end ? (end.epoch - start.epoch) / 1000 : 0,
    firstTargetToFirstLowerSeconds: start && after ? (after.epoch - start.epoch) / 1000 : null,
    samplingIntervalSeconds: samplingIntervalMs / 1000,
    allSamplesBetweenAtTarget: points.filter(p=>p.epoch >= start?.epoch && p.epoch <= end?.epoch).every(p=>p.value === target),
    configuredHoldSeconds: profile === 'load50' ? 300 : 60,
    execution: execution.profiles.find(p=>p.profile === profile),
  };
  output.push(evidence);
  copyFileSync(`artifacts/load-${profile}-report.json`, `docs/fase2/carga/${profile}-report.json`);
  copyFileSync(`artifacts/load-${profile}-summary.json`, `docs/fase2/carga/${profile}-summary.json`);
}
writeFileSync('docs/fase2/carga/verificacion-temporal.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output.map(({execution,...rest})=>rest),null,2));
