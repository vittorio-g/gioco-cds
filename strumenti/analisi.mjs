// Conti sui mazzi e partite simulate tra bot, con lo stesso motore della webapp.
//
// Uso:  node strumenti/analisi.mjs
import { readFileSync } from 'node:fs';
import {
  leggiLavoratori, leggiLavori, comuni, mancanti, competenze, nuovaPartita, mosseLegali, applica, classifica,
} from './regole.mjs';

const radice = new URL('..', import.meta.url);
const testo = (nome) => readFileSync(new URL(`mazzi/${nome}.csv`, radice), 'utf8');
const lav = leggiLavoratori(testo('lavoratori'));
const MAZZI = { v2: { lav, form: leggiLavori(testo('lavori_v2')) }, v3: { lav, form: leggiLavori(testo('lavori_v3')) } };

function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pct = (x, tot) => `${((100 * x) / tot).toFixed(1)}%`;
const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// ---------------------------------------------------------------------------
// 1. Conti sui mazzi
// ---------------------------------------------------------------------------
function contiMazzo(nome, M) {
  const W = M.lav.length;
  const J = M.form.length;
  console.log(`\n=== Lavori ${nome} ===`);
  const copie = new Map();
  for (const c of M.form) copie.set(c.lav.join(' '), (copie.get(c.lav.join(' ')) ?? 0) + 1);
  const perCopie = {};
  for (const n of copie.values()) perCopie[n] = (perCopie[n] ?? 0) + 1;
  console.log(`Lavori diversi: ${copie.size}.  Lavori per numero di copie:`, perCopie);

  const dist = [0, 0, 0, 0];
  for (const w of M.lav) for (const j of M.form) dist[comuni(w.att, j.lav)]++;
  console.log('Coppie lavoratore-lavoro per icone che combaciano:', dist.map((x, k) => `${k}: ${pct(x, W * J)}`).join('  '),
    ` (da 12 punti: ${dist[3]})`);
  const migliore = M.lav.map((w) => Math.max(...M.form.map((j) => comuni(w.att, j.lav))));
  console.log(`Lavoratori che possono fare 12: ${migliore.filter((x) => x === 3).length}/${W};`,
    `al massimo 7: ${migliore.filter((x) => x === 2).length};  al massimo 3: ${migliore.filter((x) => x <= 1).length}`);

  let una = 0;
  for (let f = 0; f < J; f++) for (let j = 0; j < J; j++) if (f !== j && mancanti(M.form[f].lav, M.form[j].lav) === 0) una++;
  console.log(`Coppie formazione-lavoro in cui basta una formazione: ${una} su ${J * (J - 1)} (${pct(una, J * (J - 1))})`);

  // Mano iniziale: 2 lavoratori e 2 carte lavoro/formazione.
  const rnd = mulberry32(1);
  const T = 40000;
  const best = [0, 0, 0, 0];
  let doppia = 0;
  const due = (n) => {
    const a = Math.floor(rnd() * n);
    let b = Math.floor(rnd() * (n - 1));
    if (b >= a) b++;
    return [a, b];
  };
  for (let t = 0; t < T; t++) {
    const ws = due(W);
    const js = due(J);
    best[Math.max(...ws.flatMap((w) => js.map((j) => comuni(M.lav[w].att, M.form[j].lav))))]++;
    if (mancanti(M.form[js[0]].lav, M.form[js[1]].lav) === 0) doppia++;
  }
  console.log('Mano iniziale (2 + 2), miglior coppia lavoratore-lavoro:', best.map((x, k) => `${k}: ${pct(x, T)}`).join('  '));
  console.log(`Mano iniziale con due copie dello stesso lavoro: ${pct(doppia, T)}`);
}

// ---------------------------------------------------------------------------
// 2. Bot
// ---------------------------------------------------------------------------
// stile.ospite: manda i lavoratori sulle formazioni libere degli altri quando gli servono.
// stile.corsa: punta al lavoro più rapido da coprire invece che al più redditizio.
// stile.lavoratori: quanti lavoratori cerca di tenere in mano (pesca dall'altro mazzo se ne ha già abbastanza).
// Il bot segue al massimo due colonne e gioca sempre una carta, come da regola.
function scegli(s, M, p, stile, conta) {
  const g = s.giocatori[p];
  const mosse = mosseLegali(s, M, p);
  const pesche = mosse.filter((m) => m.t === 'pesca');
  if (pesche.length && (g.credito > 0 || s.attesa === 'pesca')) {
    const vuole = g.lavoratori.length < (stile.lavoratori ?? 1) ? 'lav' : 'for';
    return pesche.find((m) => m.m === vuole) ?? pesche[0];
  }
  const W = g.lavoratori;
  const J = g.carte;
  const att = (w) => M.lav[w].att;
  const lavoro = (j) => M.form[j].lav;
  const valore = (ic, cop) => (stile.corsa ? cop * 100 + ic * 10 : ic * 100 + cop * 10);

  const lavori = mosse.filter((m) => m.t === 'lavora');
  if (lavori.length) return lavori.reduce((a, b) => (b.punti > a.punti ? b : a));

  // Avanzare una colonna: la formazione che avvicina di più al lavoro migliore.
  let top = null;
  for (const col of g.colonne) {
    const comp = competenze(M, col, s.opzioni);
    for (const j of J) {
      const ic = comuni(att(col.lav), lavoro(j));
      const manc = mancanti(comp, lavoro(j));
      for (const f of J) {
        if (f === j) continue;
        const guad = manc - mancanti(comp.concat(lavoro(f)), lavoro(j));
        const v = stile.corsa ? ic - (manc - guad) * 100 : ic * 100 + guad * 10 - (manc - guad);
        if (guad > 0 && (!top || v > top.v)) top = { v, m: { t: 'forma', c: f, col: col.lav } };
      }
    }
  }
  if (top) return top.m;

  // Cominciare una colonna su una formazione libera.
  if (g.colonne.length < 2) {
    let ing = null;
    s.giocatori.forEach((h, di) => {
      if (di !== p && !stile.ospite) return;
      for (const f of h.libere) {
        for (const w of W) {
          const base = s.opzioni.attitudiniNelRequisito ? lavoro(f).concat(att(w)) : lavoro(f);
          let vw = di === p ? 0 : -1; // la formazione altrui serve solo se copre qualcosa
          for (const j of J) {
            if (di !== p && mancanti(lavoro(f), lavoro(j)) === 3) continue;
            vw = Math.max(vw, valore(comuni(att(w), lavoro(j)), 3 - mancanti(base, lavoro(j))) + (di !== p ? 1 : 0));
          }
          if (vw >= 0 && (!ing || vw > ing.v)) ing = { v: vw, m: { t: 'entra', c: w, di, f } };
        }
      }
    });
    if (ing) return ing.m;
  }

  // Aprire una formazione per la prossima colonna.
  if (g.colonne.length + g.libere.length < 2 && J.length) {
    let ap = null;
    for (const f of J) {
      let v = 0;
      for (const j of J) {
        if (j === f) continue;
        const cop = 3 - mancanti(lavoro(f), lavoro(j));
        v = Math.max(v, valore(Math.max(0, ...W.map((w) => comuni(att(w), lavoro(j)))), cop));
      }
      if (!ap || v > ap.v) ap = { v, m: { t: 'apri', c: f } };
    }
    return ap.m;
  }

  // Niente di utile: si scarica la carta meno promettente.
  conta.scarichi++;
  if (J.length) {
    const utile = (c) => Math.max(0, ...W.map((w) => comuni(att(w), lavoro(c))), ...g.colonne.map((col) => comuni(att(col.lav), lavoro(c))));
    const peggiore = J.reduce((a, b) => (utile(b) < utile(a) ? b : a));
    if (g.colonne.length) return { t: 'forma', c: peggiore, col: g.colonne[0].lav };
    return { t: 'apri', c: peggiore };
  }
  return mosse.find((m) => m.t === 'entra');
}

function partita(M, stili, opzioni, rnd) {
  const s = nuovaPartita(M, stili.map((_, i) => `G${i + 1}`), opzioni, rnd);
  const conta = { scarichi: 0, turni: 0, aperte: 0, visite: 0, pescate: 0, saltati: 0 };
  for (let passi = 0; s.fase === 'gioco' && passi < 5000; passi++) {
    // Chi ha ospitato pesca subito il suo premio.
    const creditore = s.giocatori.findIndex((g) => g.credito > 0);
    const p = creditore >= 0 ? creditore : s.turno;
    const m = scegli(s, M, p, stili[p], conta);
    if (m.t === 'apri') conta.aperte++;
    if (m.t === 'entra' && m.di !== p) {
      conta.visite++;
      conta.pescate += comuni(M.lav[m.c].att, M.form[m.f].lav) + s.opzioni.premioOspite;
    }
    if (m.t !== 'pesca') conta.turni++;
    else if (creditore < 0 && s.attesa === 'pesca' && s.log.at(-1)?.testo.startsWith('non può giocare')) conta.saltati++;
    applica(s, M, p, m, rnd);
    verifica(s, M);
  }
  return { s, conta };
}

// Nessuna carta deve sparire o raddoppiare.
function verifica(s, M) {
  const lavoratori = [...s.mazzoLav];
  const carte = [...s.mazzoFor, ...s.scarti];
  for (const g of s.giocatori) {
    lavoratori.push(...g.lavoratori);
    carte.push(...g.carte, ...g.libere);
    for (const c of g.colonne) { lavoratori.push(c.lav); carte.push(...c.form); }
    for (const o of g.occupati) { lavoratori.push(o.lav); carte.push(o.lavoro); }
  }
  if (new Set(lavoratori).size !== M.lav.length || lavoratori.length !== M.lav.length) throw new Error('lavoratori persi o doppi');
  if (new Set(carte).size !== M.form.length || carte.length !== M.form.length) throw new Error('carte perse o doppie');
}

function esperimento(titolo, M, stili, opzioni = {}, T = 4000, seme = 7) {
  const rnd = mulberry32(seme);
  const perStile = new Map();
  const tot = { giri: [], scarichi: 0, turni: 0, aperte: 0, visite: 0, pescate: 0, saltati: 0 };
  const icone = [0, 0, 0, 0];
  const occ = { n: 0, punti: 0, form: 0 };
  for (let t = 0; t < T; t++) {
    const { s, conta } = partita(M, stili, opzioni, rnd);
    if (s.fase !== 'finita') throw new Error('partita non conclusa');
    tot.giri.push(s.giro);
    for (const k of ['scarichi', 'turni', 'aperte', 'visite', 'pescate', 'saltati']) tot[k] += conta[k];
    const cl = classifica(s);
    const vincitori = cl.filter((x) => x.punti === cl[0].punti && x.perfetti === cl[0].perfetti).map((x) => x.i);
    s.giocatori.forEach((g, i) => {
      const nome = stili[i].nome;
      const r = perStile.get(nome) ?? { partite: 0, punti: 0, vittorie: 0, occupati: 0 };
      r.partite++;
      r.punti += g.punti;
      r.occupati += g.occupati.length;
      if (vincitori.includes(i)) r.vittorie += 1 / vincitori.length;
      perStile.set(nome, r);
      for (const o of g.occupati) { icone[o.icone]++; occ.n++; occ.punti += o.punti; occ.form += o.form; }
    });
  }
  console.log(`\n${titolo}`);
  console.log(`  giri per partita: ${media(tot.giri).toFixed(1)}   turni per occupato: ${(tot.turni / occ.n).toFixed(1)}`,
    `  formazioni per occupato: ${(occ.form / occ.n).toFixed(2)}   punti per occupato: ${(occ.punti / occ.n).toFixed(1)}`);
  console.log('  icone che combaciano:', icone.map((x, k) => `${k}: ${pct(x, occ.n)}`).join('  '),
    `  turni senza una mossa utile: ${pct(tot.scarichi, tot.turni)}`,
    `  turni in cui non si poteva giocare: ${pct(tot.saltati, tot.turni + tot.saltati)}`);
  console.log(`  formazioni aperte per partita: ${(tot.aperte / T).toFixed(1)}`,
    `  prese da un altro: ${pct(tot.visite, tot.aperte)}`,
    tot.visite ? `  carte pescate da chi ospita: ${(tot.pescate / tot.visite).toFixed(2)} a visita` : '');
  for (const [nome, r] of perStile) {
    console.log(`  ${nome.padEnd(10)} punti ${(r.punti / r.partite).toFixed(1)}   occupati ${(r.occupati / r.partite).toFixed(2)}`,
      `  vittorie ${pct(r.vittorie, r.partite)}`);
  }
}

// ---------------------------------------------------------------------------
contiMazzo('v2 (originali)', MAZZI.v2);
contiMazzo('v3 (ripetuti)', MAZZI.v3);

const SOLO = { nome: 'solitario', ospite: false };
const OSP = { nome: 'ospite', ospite: true };
const OSP2 = { nome: 'ospite', ospite: true, lavoratori: 2 };
const CORSA = { nome: 'corsa', ospite: true, corsa: true };

console.log('\n=== Partite a 3 tra bot: mano 2 + 2, una carta giocata e una pescata per turno ===');
esperimento('A. Lavori v2, tutti vanno dagli altri', MAZZI.v2, [OSP, OSP, OSP]);
esperimento('B. Lavori v3, nessuno va dagli altri', MAZZI.v3, [SOLO, SOLO, SOLO]);
esperimento('C. Lavori v3, tutti vanno dagli altri', MAZZI.v3, [OSP, OSP, OSP]);
esperimento('C2. Come C, tenendo in mano 2 lavoratori invece di 1', MAZZI.v3, [OSP2, OSP2, OSP2]);
esperimento('D. Lavori v3, uno solo va dagli altri', MAZZI.v3, [OSP, SOLO, SOLO]);
esperimento('E. Come D, chi ospita pesca 1 carta in più', MAZZI.v3, [OSP, SOLO, SOLO], { premioOspite: 1 });
esperimento('F. Come D, chi ospita pesca 2 carte in più', MAZZI.v3, [OSP, SOLO, SOLO], { premioOspite: 2 });
esperimento('G. Lavori v3, le attitudini valgono per il requisito, tutti ospiti', MAZZI.v3, [OSP, OSP, OSP], { attitudiniNelRequisito: true });
esperimento('I. Lavori v3, tutti ospiti, uno corre', MAZZI.v3, [CORSA, OSP, OSP]);
for (const n of [3, 4, 5]) {
  esperimento(`H${n}. Lavori v3, tutti ospiti, si chiude a ${n} occupati`, MAZZI.v3, [OSP, OSP, OSP], { occupatiPerFinire: n }, 2000);
}
