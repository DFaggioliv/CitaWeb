import { readFileSync, writeFileSync, statSync, createReadStream, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
const run = JSON.parse(readFileSync('docs/fase2/carga/ejecucion.json', 'utf8'));
const temporal = JSON.parse(readFileSync('docs/fase2/carga/verificacion-temporal.json', 'utf8'));
const time = value => new Intl.DateTimeFormat('es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value));
const rows = run.profiles.flatMap(p => Object.entries(p.report.endpoints).map(([endpoint,m]) => `| ${p.profile === 'rnf20' ? 20 : 50} | ${endpoint === 'slots' ? 'Horarios disponibles' : 'Citas propias'} | ${m.requests} | ${m.average_ms.toFixed(2)} | ${m.p95_ms.toFixed(2)} | ${m.throughput_requests_per_second.toFixed(2)} | ${(100*m.error_rate).toFixed(2)} % |`));
const fifty = temporal.find(p => p.profile === 'load50');
const passed = run.profiles.every(p=>p.exitCode === 0 && Object.values(p.report.endpoints).every(e=>e.error_rate === 0));
const text = `# Resultados de carga — CitaWeb QA\n\nFecha: 30 de octubre de 2026, hora de Guatemala. Ejecución desde ${time(run.profiles[0].startedAt)} hasta ${time(run.profiles.at(-1).endedAt)}. Revisión desplegada: ${run.commit}. Herramienta: k6 v2.3.0.\n\n## Resultados por endpoint\n\n| VUs objetivo | Endpoint | Solicitudes | Promedio (ms) | P95 (ms) | Solicitudes/s | Error |\n|---|---|---:|---:|---:|---:|---:|\n${rows.join('\n')}\n\nLos valores agrupan cada ejecución completa (rampa, meseta y bajada); no representan exclusivamente la meseta. El conteo corresponde a los endpoints medidos, sin sumar salud y perfil de prevalidación.\n\n## Contraste con requisitos\n\nRNF-01: ${run.profiles[0].report.rnf01.latencyMet ? 'cumplido en este ensayo' : 'no cumplido'}: ambos P95 del perfil de hasta 20 VUs son menores de 2000 ms. Se aprobaron las comprobaciones HTTP y de contenido con cero errores.\n\nE14: escenario adicional 0 → 50 VUs ejecutado normalmente, con etapa configurada de 300 s a 50. El registro tiene ${fifty.continuousTargetSamples} muestras consecutivas a 50 VUs, desde ${time(fifty.firstTargetSample)} hasta ${time(fifty.lastTargetSample)}; la primera muestra inferior aparece ${fifty.firstTargetToFirstLowerSeconds.toFixed(3)} s después de la primera a 50. La resolución de muestreo es de ${fifty.samplingIntervalSeconds} s. Este registro, la configuración y la finalización normal corroboran la etapa de cinco minutos.\n\nEstado de ambas ejecuciones: ${passed ? 'aprobadas, código de salida k6 0' : 'revisar incumplimientos; ver códigos de salida'}. No se convierte el límite RNF-01 de 20 usuarios en una obligación para 50.\n\n## Alcance y límites\n\nQA utiliza recursos gratuitos de Render y Neon. Las solicitudes salen de un único equipo Windows por Internet. Los VUs comparten una cuenta nueva de QA y su historial está vacío; no se mide una población de cuentas diferentes, escrituras concurrentes ni grandes volúmenes de citas. El servicio se comprueba antes de medir y no se evalúa el arranque en frío. Los resultados no certifican disponibilidad de 99 % durante todo el período de evaluación ni tiempos completos del navegador.\n\n## Evidencias\n\n- Metodologia.md: diseño, umbrales y limitaciones.\n- ejecucion.json: revisión, horarios y códigos de salida, sin credenciales.\n- rnf20-report.json y load50-report.json: métricas resumidas por endpoint.\n- rnf20-summary.json y load50-summary.json: resúmenes originales de k6.\n- verificacion-temporal.json y usuarios-*.csv: contraste de usuarios activos.\n- manifiesto.json: hashes SHA-256 y tamaños de registros originales conservados en el ZIP de evidencia.\n\nEl guion de video puede mostrar la revisión de QA, el comando reproducible, estos resultados y el registro temporal. No presentar resultados como si correspondieran a producción.\n`;
writeFileSync('docs/fase2/carga/Resultados.md', text);
const manifest = [];
for (const profile of ['rnf20','load50']) {
  const raw = `artifacts/load-${profile}-timeseries.json`;
  const hash = createHash('sha256');
  for await (const data of createReadStream(raw)) hash.update(data);
  manifest.push({ path: raw, bytes: statSync(raw).size, sha256: hash.digest('hex') });
  const input = createInterface({ input: createReadStream(raw), crlfDelay: Infinity });
  const csv = ['fecha_hora_UTC_offset,usuarios_activos'];
  for await (const line of input) { const item = JSON.parse(line); if(item.type === 'Point' && item.metric === 'vus') csv.push(`${item.data.time},${item.data.value}`); }
  writeFileSync(`docs/fase2/carga/usuarios-${profile}.csv`, csv.join('\n')+'\n');
  copyFileSync(`artifacts/load-${profile}.log`, `docs/fase2/carga/${profile}.log`);
}
writeFileSync('docs/fase2/carga/manifiesto.json', JSON.stringify({ commit: run.commit, k6: JSON.parse(readFileSync('../tools/k6/provenance.json','utf8')), files: manifest },null,2));
console.log(text);
