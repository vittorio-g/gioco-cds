// Costruisce mazzi/lavori_v3.csv: il mazzo delle 60 carte lavoro/formazione
// con lavori ripetuti, alcuni più frequenti di altri.
//
// Uso:  node strumenti/genera_lavori_v3.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { leggiLavoratori, comuni, SIMBOLI } from './regole.mjs';

const radice = new URL('..', import.meta.url);
const lavoratori = leggiLavoratori(readFileSync(new URL('mazzi/lavoratori.csv', radice), 'utf8'));

// Ogni lavoro coincide con le attitudini di un lavoratore del mazzo, così
// per ogni lavoro esiste qualcuno che lo fa da 12 punti. I lavori frequenti
// usano solo i simboli comuni; RI e ST compaiono solo nei lavori da 1-2 copie.
const LAVORI = [
  [5, 'MA DI OR'], [5, 'CO OR CL'],
  [4, 'MA DI CL'], [4, 'DI CO OR'], [4, 'MA CO CL'],
  [3, 'DI OR AN'], [3, 'MA DI AN'], [3, 'MA CL CR'], [3, 'OR CL CR'], [3, 'CO CL CD'], [3, 'DI CO CD'],
  [2, 'CO CR RI'], [2, 'OR CD RI'], [2, 'MA DI RI'], [2, 'MA AN ST'], [2, 'OR AN ST'], [2, 'CL CR ST'], [2, 'MA CR CD'],
  [1, 'OR RI RI'], [1, 'DI CO ST'], [1, 'CL CD ST'], [1, 'CO CD CD'], [1, 'CL AN CR'], [1, 'DI OR CR'],
];

const carte = LAVORI.flatMap(([copie, t]) => Array.from({ length: copie }, () => t.split(' ')));
for (const [, t] of LAVORI) {
  if (!lavoratori.some((w) => comuni(w.att, t.split(' ')) === 3)) throw new Error(`nessun lavoratore ha le attitudini ${t}`);
}

const righe = ['n,l1,l2,l3', ...carte.map((t, i) => [String(i + 1).padStart(2, '0'), ...t].join(','))];
writeFileSync(new URL('mazzi/lavori_v3.csv', radice), righe.join('\n') + '\n');

const tot = Object.fromEntries(SIMBOLI.map((s) => [s, carte.flat().filter((x) => x === s).length]));
console.log(`mazzi/lavori_v3.csv scritto: ${LAVORI.length} lavori diversi su ${carte.length} carte`);
console.log('icone per simbolo:', tot);
