#!/usr/bin/env node
/* Regressionstest für nettoklar.html.
   Prüft den Rechenkern gegen die amtliche Prüftabelle des
   BMF-Programmablaufplans 2026 (endgültige, korrigierte Fassung, 12.11.2025)
   sowie interne Fixtures. Exit-Code 1 bei jeder Abweichung.
   Aufruf: node tools/verify-pap.mjs [pfad/zu/index.html]              */

import { readFileSync } from "node:fs";

const file = process.argv[2] || "index.html";
const html = readFileSync(file, "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const cut = script.indexOf("   I18N");
const head = script.slice(0, script.lastIndexOf("/*", cut)) + ";globalThis.__ = { calc, C };";
(0, eval)(head);
const { calc } = globalThis.__;

/* Amtliche Jahreslohnsteuertabelle 2026 (allgemein, KVZ 2,90, ZKF 0, ohne PV-Zuschlag).
   Spalten: Stufenobergrenze, StKl I, II, III, IV, V, VI. */
const PRUEFTABELLE = [
  [17531.99,55,0,0,55,1782,1982],[20015.99,404,0,0,404,2289,2821],[22535.99,818,36,0,818,3141,3673],
  [25019.99,1291,361,0,1291,3980,4512],[30023.99,2299,1234,0,2299,5671,6203],[35027.99,3363,2239,332,3363,7300,7766],
  [40031.99,4483,3299,1052,4483,8824,9326],[45035.99,5659,4416,1918,5659,10458,10990],[50003.99,6882,5580,2884,6882,12137,12668],
  [55007.99,8170,6809,3886,8170,13827,14359],[60011.99,9514,8093,4918,9514,15518,16050],[65015.99,10914,9434,5976,10914,17209,17741],
  [70019.99,12381,10841,7070,12381,18911,19443],[75023.99,14090,12484,8330,14090,20818,21349],[80027.99,15871,14198,9624,15871,22724,23256],
  [85031.99,17723,15983,10954,17723,24630,25162],[90035.99,19627,17839,12320,19627,26536,27068],[95003.99,21520,19731,13712,21520,28429,28961],
  [100007.99,23426,21636,15148,23426,30335,30867],[105011.99,25473,23684,16730,25473,32382,32914],[110015.99,27575,25786,18398,27575,34484,35016]
];
const CLASSES = [[1,0,1],[2,1,2],[3,0,3],[4,0,4],[5,0,5],[6,0,6]];

let failures = 0;
const P = (over) => Object.assign({
  grossM: 0, taxClass: 1, kids: 0, age23: false, landIdx: 9, church: false,
  insurance: "public", zusatzPct: 2.9, privPrem: 750,
  workerType: "standard", minijobRvOptOut: false
}, over);

for (const row of PRUEFTABELLE) for (const [tc, kids, col] of CLASSES) {
  const lstY = Math.round(calc(P({ grossM: row[0]/12, taxClass: tc, kids })).lst * 12);
  if (lstY !== row[col]) { failures++; console.error(`FAIL PAP ${row[0]} StKl ${tc}: ${lstY} != ${row[col]}`); }
}

/* Beispiel 1 aus dem PAP-Dokument (StKl III, 75.000 €, allgemeine Tabelle): LSt 8.330. */
{
  const lstY = Math.round(calc(P({ grossM: 75023.99/12, taxClass: 3 })).lst * 12);
  if (lstY !== 8330) { failures++; console.error(`FAIL Beispiel 1: ${lstY} != 8330`); }
}

/* Interne Fixtures (Netto, Standardannahmen: StKl I, NRW, 2,9 %, kinderlos 23+). */
const FIXTURES = [
  [4200, 2712.58],
  [2200, 1594.50]
];
for (const [g, expected] of FIXTURES) {
  const net = calc(P({ grossM: g, age23: true })).net;
  if (Math.abs(net - expected) > 0.005) { failures++; console.error(`FAIL Fixture ${g}: ${net.toFixed(2)} != ${expected}`); }
}

/* Gesetzliche Invarianten: Minijob-Grenze folgt aus dem Mindestlohn
   (§8 Abs. 1a SGB IV: Mindestlohn x 130 / 3, auf volle Euro aufgerundet). */
const C = globalThis.__.C;
if (C.minijobGrenze !== Math.ceil(C.mindestlohn * 130 / 3)) {
  failures++; console.error(`FAIL Invariante: minijobGrenze ${C.minijobGrenze} != ceil(${C.mindestlohn} x 130/3) = ${Math.ceil(C.mindestlohn*130/3)}`);
}
/* rates.json muss, falls vorhanden, dieselben Invarianten erfuellen. */
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
    if (!(k[1] >= 0 && k[1] <= 6) || /[<>&"'`]/.test(String(k[0]))) { failures++; console.error(`FAIL rates.json Kasse: ${k[0]}`); }
  }
} catch { /* rates.json optional */ }

if (failures) { console.error(`${failures} Abweichung(en).`); process.exit(1); }
console.log(`OK: ${PRUEFTABELLE.length * CLASSES.length} Prüftabellenwerte + Beispiel 1 + ${FIXTURES.length} Fixtures exakt.`);
