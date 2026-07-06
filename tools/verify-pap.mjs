#!/usr/bin/env node
/* Regressionstest fuer nettoklar.html.
   Prueft den Rechenkern gegen BEIDE amtlichen maschinellen Prueftabellen des
   BMF-Programmablaufplans 2026 (Anlage 1, endgueltig, 12.11.2025):
   - allgemeine Tabelle (ALV/KRV/PKV = 0, KVZ 2,90; PVZ = 1 ausser StKl II)
   - besondere Tabelle (ALV/KRV/PKV = 1; PKPV: III 500, VI 0, sonst 300 Euro/Monat)
   zusammen 516 Werte, plus Netto-Fixtures und gesetzliche Invarianten.
   Exit-Code 1 bei jeder Abweichung.
   Aufruf: node tools/verify-pap.mjs [pfad/zu/index.html]                     */

import { readFileSync } from "node:fs";

const file = process.argv[2] || "index.html";
const html = readFileSync(file, "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const cut = script.indexOf("   I18N");
const head = script.slice(0, script.lastIndexOf("/*", cut)) + ";globalThis.__ = { calc, C };";
(0, eval)(head);
const { calc, C } = globalThis.__;

const TA = [
[5000,0,0,0,0,372,558],[7500,0,0,0,0,647,838],[10000,0,0,0,0,922,1117],[12500,0,0,0,0,1197,1397],
[15000,0,0,0,0,1472,1676],[17500,51,0,0,51,1778,1956],[20000,380,0,0,380,2234,2766],[22500,782,32,0,782,3073,3604],
[25000,1251,359,0,1251,3911,4443],[27500,1742,759,0,1742,4749,5281],[30000,2248,1230,0,2248,5588,6120],
[32500,2767,1724,0,2767,6426,6952],[35000,3300,2233,294,3300,7216,7682],[37500,3847,2756,628,3847,7954,8436],
[40000,4407,3293,1000,4407,8720,9218],[42500,4982,3843,1406,4982,9512,10030],[45000,5570,4408,1850,5570,10334,10865],
[47500,6172,4987,2324,6172,11171,11703],[50000,6788,5580,2810,6788,12010,12542],[52500,7417,6186,3302,7417,12848,13380],
[55000,8060,6807,3802,8060,13687,14218],[57500,8718,7442,4308,8718,14525,15057],[60000,9389,8091,4822,9389,15364,15895],
[62500,10073,8754,5342,10073,16202,16734],[65000,10772,9430,5870,10772,17040,17572],[67500,11484,10121,6402,11484,17879,18410],
[70000,12220,10835,6952,12220,18729,19260],[72500,13062,11647,7574,13062,19681,20213],[75000,13922,12476,8206,13922,20633,21165],
[77500,14799,13323,8846,14799,21585,22117],[80000,15694,14188,9496,15694,22538,23070],[82500,16607,15071,10154,16607,23490,24022],
[85000,17538,15971,10822,17538,24443,24974],[87500,18486,16890,11498,18486,25395,25927],[90000,19438,17826,12182,19438,26347,26879],
[92500,20390,18777,12876,20390,27300,27831],[95000,21343,19729,13580,21343,28252,28784],[97500,22295,20682,14292,22295,29204,29736],
[100000,23248,21634,15012,23248,30157,30689],[102500,24243,22629,15774,24243,31152,31684],[105000,25293,23679,16590,25293,32202,32734],
[107500,26343,24729,17416,26343,33252,33784],[110000,27393,25779,18252,27393,34302,34834]];
const TB = [
[5000,0,0,0,0,18,700],[7500,0,0,0,0,368,1050],[10000,0,0,0,0,718,1400],[12500,0,0,0,0,1068,1750],
[15000,0,0,0,0,1418,2359],[17500,40,0,0,40,1768,3409],[20000,461,0,0,461,2415,4459],[22500,995,153,0,995,3465,5509],
[25000,1604,607,0,1604,4515,6559],[27500,2234,1173,0,2234,5565,7514],[30000,2886,1788,0,2886,6615,8460],
[32500,3559,2424,76,3559,7564,9446],[35000,4254,3083,466,4254,8510,10473],[37500,4971,3763,914,4971,9498,11523],
[40000,5710,4464,1420,5710,10529,12573],[42500,6470,5188,1982,6470,11579,13623],[45000,7252,5932,2584,7252,12629,14673],
[47500,8055,6699,3198,8055,13679,15723],[50000,8880,7487,3824,8880,14729,16773],[52500,9727,8297,4458,9727,15779,17823],
[55000,10595,9128,5106,10595,16829,18873],[57500,11485,9981,5762,11485,17879,19923],[60000,12396,10856,6430,12396,18929,20973],
[62500,13330,11752,7110,13330,19979,22023],[65000,14284,12670,7798,14284,21029,23073],[67500,15261,13610,8500,15261,22079,24123],
[70000,16259,14571,9210,16259,23129,25173],[72500,17279,15554,9932,17279,24179,26223],[75000,18320,16559,10666,18320,25229,27273],
[77500,19370,17585,11410,19370,26279,28323],[80000,20420,18631,12164,20420,27329,29373],[82500,21470,19681,12930,21470,28379,30423],
[85000,22520,20731,13706,22520,29429,31473],[87500,23570,21781,14492,23570,30479,32523],[90000,24620,22831,15290,24620,31529,33573],
[92500,25670,23881,16098,25670,32579,34623],[95000,26720,24931,16918,26720,33629,35673],[97500,27770,25981,17748,27770,34679,36723],
[100000,28820,27031,18590,28820,35729,37773],[102500,29870,28081,19442,29870,36779,38823],[105000,30920,29131,20304,30920,37829,39873],
[107500,31970,30181,21178,31970,38879,40923],[110000,33020,31231,22062,33020,39929,41973]];

let failures = 0;
const P = (over) => Object.assign({
  grossM: 2500, taxClass: 1, kids: 0, age23: true, landIdx: 9, church: false,
  insurance: "public", zusatzPct: 2.9, pkvKv: 0, pkvPv: 0, pkpv: null,
  workerType: "standard", minijobRvOptOut: false
}, over);

for (const row of TA) for (const [tc, col] of [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6]]) {
  const lstY = Math.round(calc(P({ grossY: row[0], taxClass: tc, kids: tc === 2 ? 1 : 0 })).lst * 12);
  if (lstY !== row[col]) { failures++; console.error(`FAIL allgemein ${row[0]} StKl ${tc}: ${lstY} != ${row[col]}`); }
}
for (const row of TB) for (const [tc, col] of [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6]]) {
  const pkpv = tc === 3 ? 500 : (tc === 6 ? 0 : 300);
  const lstY = Math.round(calc(P({ grossY: row[0], taxClass: tc, insurance: "private", pkpv, _krv: 1, _alv: 1 })).lst * 12);
  if (lstY !== row[col]) { failures++; console.error(`FAIL besonders ${row[0]} StKl ${tc}: ${lstY} != ${row[col]}`); }
}

/* Netto-Fixtures (StKl I, NRW, kinderlos 23+, KVZ 2,9; PKV: 650 KV + 60 PV). */
const FIXTURES = [
  [{ grossM: 4200, grossY: 50400 }, 2712.58],
  [{ grossM: 2200, grossY: 26400 }, 1594.50],
  [{ grossM: 7000, grossY: 84000, insurance: "private", pkvKv: 650, pkvPv: 60 }, 4357.83],
  [{ grossM: 1500, grossY: 18000, workerType: "werkstudent" }, 1371.32]
];
for (const [o, expected] of FIXTURES) {
  const net = calc(P(o)).net;
  if (Math.abs(net - expected) > 0.005) { failures++; console.error(`FAIL Fixture ${o.grossM}: ${net.toFixed(2)} != ${expected}`); }
}

/* Gesetzliche Invarianten. */
if (C.minijobGrenze !== Math.ceil(C.mindestlohn * 130 / 3)) {
  failures++; console.error("FAIL Invariante: Minijob-Grenze passt nicht zum Mindestlohn.");
}
if (Math.abs(C.pkvAgKvRate * C.bbgKVmonth - C.privEmployerCapKV) > 0.011) {
  failures++; console.error("FAIL Invariante: PKV-Zuschuss-Cap KV inkonsistent.");
}
if (Math.abs(0.018 * C.bbgKVmonth - C.privEmployerCapPV) > 0.011) {
  failures++; console.error("FAIL Invariante: PKV-Zuschuss-Cap PV inkonsistent.");
}
try {
  const rates = JSON.parse(readFileSync("rates.json", "utf8"));
  const c = rates.constants || {};
  if (c.mindestlohn && c.minijobGrenze && c.minijobGrenze !== Math.ceil(c.mindestlohn * 130 / 3)) {
    failures++; console.error("FAIL rates.json: Minijob-Grenze passt nicht zum Mindestlohn.");
  }
  for (const [name, lo, hi] of [["zusatzDefault",0,6],["jaegMonth",5000,12000],["privEmployerCapKV",300,900],["privEmployerCapPV",50,300]]) {
    const v = name === "zusatzDefault" ? rates[name] : c[name];
    if (v !== undefined && !(v >= lo && v <= hi)) { failures++; console.error(`FAIL rates.json: ${name}=${v} ausserhalb [${lo},${hi}].`); }
  }
  for (const k of rates.kassen || []) {
    if (!(k[1] >= 0 && k[1] <= 6) || /[<>&"'\u0060]/.test(String(k[0]))) { failures++; console.error(`FAIL rates.json Kasse: ${k[0]}`); }
  }
} catch { /* rates.json optional */ }

if (failures) { console.error(`${failures} Abweichung(en).`); process.exit(1); }
console.log(`OK: 516 maschinelle Prueftabellenwerte (allgemein + besonders) + ${FIXTURES.length} Fixtures + Invarianten exakt.`);
