// Conti sui mazzi e partite simulate tra bot, con le regole di strumenti/regole.mjs.
// I numeri di BUCHI.md vengono da qui.
//
// Uso:  node strumenti/analisi.mjs
import { readFileSync } from 'node:fs';
import {
  leggiLavoratori, leggiAmbiti, comuni, mancanti, competenze, nuovaPartita, mosseLegali, applica, classifica, iconePila,
} from './regole.mjs';

const radice = new URL('..', import.meta.url);
const testo = (nome) => readFileSync(new URL(`mazzi/${nome}.csv`, radice), 'utf8');
const mazzo = (cartella) => ({ lav: leggiLavoratori(testo(`${cartella}lavoratori`)), form: leggiAmbiti(testo(`${cartella}ambiti`)) });
const MAZZO = mazzo(''); // quello in uso
const DIECI = mazzo('dieci_simboli/'); // le terne a 10 simboli stampate sui PDF originali, per confronto

function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pct = (x, tot) => `${((100 * x) / tot).toFixed(0)}%`;
const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// ---------------------------------------------------------------------------
// 1. Conti sui mazzi
// ---------------------------------------------------------------------------
function contiMazzo(nome, M) {
  const W = M.lav.length;
  const J = M.form.length;
  console.log(`\n=== Mazzo ${nome} ===`);
  const conta = (carte, campo) => {
    const c = {};
    for (const x of carte) for (const s of x[campo]) c[s] = (c[s] ?? 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s} ${n}`).join('  ');
  };
  console.log(`Icone sui lavoratori: ${conta(M.lav, 'att')}`);
  console.log(`Icone sugli ambiti:   ${conta(M.form, 'lav')}`);
  const terne = (carte, campo) => {
    const t = new Map();
    for (const x of carte) {
      const k = [...x[campo]].sort().join(' ');
      t.set(k, (t.get(k) ?? 0) + 1);
    }
    return t;
  };
  const tl = terne(M.lav, 'att');
  const ta = terne(M.form, 'lav');
  console.log(`Terne diverse: ${tl.size} tra i ${W} lavoratori (la più ripetuta ${Math.max(...tl.values())} volte),`,
    `${ta.size} tra i ${J} ambiti (la più ripetuta ${Math.max(...ta.values())} volte)`);

  const dist = [0, 0, 0, 0];
  for (const w of M.lav) for (const j of M.form) dist[comuni(w.att, j.lav)]++;
  console.log('Coppie lavoratore-ambito per icone che combaciano:', dist.map((x, k) => `${k}: ${pct(x, W * J)}`).join('  '));
  const migliore = M.lav.map((w) => Math.max(...M.form.map((j) => comuni(w.att, j.lav))));
  console.log(`Lavoratori che possono fare 12: ${migliore.filter((x) => x === 3).length}/${W};`,
    `al massimo 7: ${migliore.filter((x) => x === 2).length};  al massimo 3: ${migliore.filter((x) => x <= 1).length}`);

  let una = 0;
  for (let f = 0; f < J; f++) for (let j = 0; j < J; j++) if (f !== j && mancanti(M.form[f].lav, M.form[j].lav) === 0) una++;
  console.log(`Coppie formazione-lavoro in cui basta una formazione: ${una} su ${J * (J - 1)} (${pct(una, J * (J - 1))})`);

  // Mano iniziale: 2 lavoratori e 2 ambiti.
  const rnd = mulberry32(1);
  const T = 40000;
  const best = [0, 0, 0, 0];
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
  }
  console.log('Mano iniziale (2 + 2), miglior coppia lavoratore-ambito:', best.map((x, k) => `${k}: ${pct(x, T)}`).join('  '));
}

// ---------------------------------------------------------------------------
// 2. Bot
// ---------------------------------------------------------------------------
// Sceglie la coppia lavoratore-lavoro che rende di più tra quelle che ha in
// mano e la porta a termine. Segue al massimo due colonne.
// stile.ospite: manda i lavoratori anche sulle formazioni aperte dagli altri.
// stile.riapre: con una carta di premio da giocare, apre anche una formazione nuova.
function scegli(s, M, p, stile, conta) {
  const g = s.giocatori[p];
  const o = s.opzioni;
  const mosse = mosseLegali(s, M, p);
  const pesche = mosse.filter((m) => m.t === 'pesca');
  const pescata = () => pesche.find((m) => m.m === (g.lavoratori.length < 1 ? 'lav' : 'for')) ?? pesche[0];
  const W = g.lavoratori;
  const J = g.carte;
  const att = (w) => M.lav[w].att;
  const lavoro = (j) => M.form[j].lav;
  const valore = (ic, cop) => ic * 100 + cop * 10;

  function giocata(conPremio) {
    const lavori = mosse.filter((m) => m.t === 'lavora');
    if (lavori.length) return lavori.reduce((a, b) => (b.punti > a.punti ? b : a));

    // Avanzare una colonna: la formazione che avvicina di più al lavoro migliore.
    let top = null;
    for (const col of g.colonne) {
      const comp = competenze(M, col, o);
      for (const j of J) {
        const ic = comuni(att(col.lav), lavoro(j));
        const manc = mancanti(comp, lavoro(j));
        for (const f of J) {
          if (f === j) continue;
          const guad = manc - mancanti(comp.concat(lavoro(f)), lavoro(j));
          const v = ic * 100 + guad * 10 - (manc - guad);
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
          const icone = iconePila(s, M, f);
          for (const w of W) {
            const base = o.attitudiniNelRequisito ? icone.concat(att(w)) : icone;
            let vw = di === p ? 0 : -1; // la formazione altrui serve solo se copre qualcosa
            for (const j of J) {
              if (di !== p && mancanti(icone, lavoro(j)) === 3) continue;
              vw = Math.max(vw, valore(comuni(att(w), lavoro(j)), 3 - mancanti(base, lavoro(j))) + (di !== p ? 1 : 0));
            }
            // se il premio va a chi entra, contano anche le attitudini che combaciano con la formazione
            if (vw >= 0 && o.premioA === 'entra') vw += 5 * comuni(att(w), icone);
            if (vw >= 0 && (!ing || vw > ing.v)) ing = { v: vw, m: { t: 'entra', c: w, di, f } };
          }
        }
      });
      if (ing) return ing.m;
    }
    if (conPremio && !stile.riapre) return null;

    // Preparare la prossima colonna: aprire una formazione o, col campo comune, impilarla su una libera.
    if (g.colonne.length + g.libere.length < 2 && J.length) {
      let ap = null;
      const prova = (m, icone, f) => {
        let v = 0;
        for (const j of J) {
          if (j === f) continue;
          v = Math.max(v, valore(Math.max(0, ...W.map((w) => comuni(att(w), lavoro(j)))), 3 - mancanti(icone, lavoro(j))));
        }
        if (!ap || v > ap.v) ap = { v, m };
      };
      for (const f of J) {
        prova({ t: 'apri', c: f }, lavoro(f), f);
        if (o.campoComune) {
          s.giocatori.forEach((h, di) => {
            for (const k of h.libere) prova({ t: 'impila', c: f, di, f: k }, iconePila(s, M, k).concat(lavoro(f)), f);
          });
        }
      }
      return ap.m;
    }
    if (conPremio) return null;

    // Niente di utile: si scarica la carta meno promettente.
    conta.scarichi++;
    if (J.length) {
      const utile = (c) => Math.max(0, ...W.map((w) => comuni(att(w), lavoro(c))), ...g.colonne.map((col) => comuni(att(col.lav), lavoro(c))));
      const peggiore = J.reduce((a, b) => (utile(b) < utile(a) ? b : a));
      if (g.colonne.length) return { t: 'forma', c: peggiore, col: g.colonne[0].lav };
      return { t: 'apri', c: peggiore };
    }
    return mosse.find((m) => m.t === 'entra') ?? null;
  }

  if (s.turno === p && s.attesa === 'gioca') return giocata(false);
  // una carta di premio da usare, oppure la pescata di fine turno
  if (g.credito > 0 && o.premioScelta) {
    const m = giocata(true);
    if (m) {
      conta.premiGiocati++;
      return m;
    }
  }
  return pesche.length ? pescata() : null;
}

// Nessuna carta deve sparire o raddoppiare.
function verifica(s, M) {
  const lavoratori = [...s.mazzoLav];
  const carte = [...s.mazzoFor, ...s.scarti, ...Object.values(s.impilate).flat()];
  for (const g of s.giocatori) {
    lavoratori.push(...g.lavoratori);
    carte.push(...g.carte, ...g.libere);
    for (const c of g.colonne) { lavoratori.push(c.lav); carte.push(...c.form); }
    for (const o of g.occupati) { lavoratori.push(o.lav); carte.push(o.lavoro); }
  }
  if (new Set(lavoratori).size !== M.lav.length || lavoratori.length !== M.lav.length) throw new Error('lavoratori persi o doppi');
  if (new Set(carte).size !== M.form.length || carte.length !== M.form.length) throw new Error('carte perse o doppie');
}

function partita(M, stili, opzioni, rnd) {
  const s = nuovaPartita(M, stili.map((_, i) => `G${i + 1}`), opzioni, rnd);
  const conta = { scarichi: 0, giocate: 0, aperte: 0, impilate: 0, visite: 0, premi: 0, premiGiocati: 0 };
  for (let passi = 0; s.fase === 'gioco' && passi < 6000; passi++) {
    // Chi ha un premio lo usa subito, anche fuori turno.
    const creditore = s.giocatori.findIndex((g) => g.credito > 0);
    const p = creditore >= 0 ? creditore : s.turno;
    const prima = s.giocatori.reduce((x, g) => x + g.credito, 0);
    const m = scegli(s, M, p, stili[p], conta);
    if (!m) {
      s.giocatori[p].credito = 0; // un premio che non si può usare
      continue;
    }
    if (m.t === 'apri') conta.aperte++;
    if (m.t === 'impila') conta.impilate++;
    if (m.t === 'entra' && m.di !== p) conta.visite++;
    if (m.t !== 'pesca') conta.giocate++;
    applica(s, M, p, m, rnd);
    conta.premi += Math.max(0, s.giocatori.reduce((x, g) => x + g.credito, 0) - prima);
    verifica(s, M);
  }
  return { s, conta };
}

function esperimento(titolo, M, stili, opzioni = {}, T = 4000, seme = 7) {
  const rnd = mulberry32(seme);
  const perStile = new Map();
  const tot = { giri: [], piu: [], lunghe: 0, primo: 0, rimescolate: 0, scarichi: 0, giocate: 0, aperte: 0, impilate: 0, visite: 0, premi: 0, premiGiocati: 0, mano: [] };
  const icone = [0, 0, 0, 0];
  const occ = { n: 0, punti: 0, form: 0 };
  for (let t = 0; t < T; t++) {
    const { s, conta } = partita(M, stili, opzioni, rnd);
    if (s.fase !== 'finita') throw new Error('partita non conclusa');
    tot.giri.push(s.giro);
    tot.piu.push(s.piuGiocate ?? 1);
    if ((s.piuGiocate ?? 1) >= 4) tot.lunghe++;
    tot.rimescolate += s.rimescolate ?? 0;
    for (const k of ['scarichi', 'giocate', 'aperte', 'impilate', 'visite', 'premi', 'premiGiocati']) tot[k] += conta[k];
    tot.mano.push(media(s.giocatori.map((g) => g.lavoratori.length + g.carte.length)));
    const cl = classifica(s);
    const vincitori = cl.filter((x) => x.punti === cl[0].punti && x.perfetti === cl[0].perfetti).map((x) => x.i);
    if (vincitori.includes(s.primo)) tot.primo += 1 / vincitori.length;
    s.giocatori.forEach((g, i) => {
      const nome = stili[i].nome;
      const r = perStile.get(nome) ?? { partite: 0, punti: 0, vittorie: 0 };
      r.partite++;
      r.punti += g.punti;
      if (vincitori.includes(i)) r.vittorie += 1 / vincitori.length;
      perStile.set(nome, r);
      for (const o of g.occupati) { icone[o.icone]++; occ.n++; occ.punti += o.punti; occ.form += o.form; }
    });
  }
  console.log(`\n${titolo}`);
  console.log(`  giri ${media(tot.giri).toFixed(1)}   punti per occupato ${(occ.punti / occ.n).toFixed(1)}   formazioni per occupato ${(occ.form / occ.n).toFixed(2)}`,
    `  icone che combaciano: ${icone.map((x, k) => `${k}: ${pct(x, occ.n)}`).join(' ')}`);
  console.log(`  formazioni aperte ${(tot.aperte / T).toFixed(1)} a partita, impilate senza lavoratore ${(tot.impilate / T).toFixed(1)}, usate da un altro ${pct(tot.visite, tot.aperte)}`,
    `  carte di premio ${(tot.premi / T).toFixed(1)} a partita${tot.premiGiocati ? `, giocate invece che pescate ${pct(tot.premiGiocati, tot.premi)}` : ''}`);
  console.log(`  carte giocate nel turno più lungo: ${media(tot.piu).toFixed(1)} in media, partite con un turno da 4 o più ${pct(tot.lunghe, T)}`,
    `  carte in mano alla fine ${media(tot.mano).toFixed(1)}   mazzo degli ambiti rimescolato ${(tot.rimescolate / T).toFixed(1)} volte a partita   chi comincia vince ${pct(tot.primo, T)}`);
  if (perStile.size > 1) for (const [nome, r] of perStile) console.log(`  ${nome.padEnd(10)} punti ${(r.punti / r.partite).toFixed(1)}  vittorie ${pct(r.vittorie, r.partite)}`);
}

// ---------------------------------------------------------------------------
contiMazzo('in uso (6 simboli)', MAZZO);
contiMazzo('a 10 simboli, per confronto', DIECI);

const OSP = { nome: 'ospite', ospite: true };
const SOLO = { nome: 'solitario', ospite: false };
const RIAPRE = { nome: 'ospite', ospite: true, riapre: true };
const TRE = [OSP, OSP, OSP];

console.log('\n=== Partite a 3 tra bot: mano 2 + 2, una carta giocata e una pescata per turno ===');
esperimento('A. Regole di adesso', MAZZO, TRE);
esperimento('A10. Le stesse regole col mazzo a 10 simboli', DIECI, TRE);
esperimento('B. Nessuno va sulle formazioni degli altri', MAZZO, [SOLO, SOLO, SOLO]);
esperimento('D. Uno solo va dagli altri', MAZZO, [OSP, SOLO, SOLO]);
esperimento('E. Come D, chi ospita pesca 1 carta in più', MAZZO, [OSP, SOLO, SOLO], { premioOspite: 1 });
esperimento('F. Come D, chi ospita pesca 2 carte in più', MAZZO, [OSP, SOLO, SOLO], { premioOspite: 2 });
esperimento('G. Le attitudini valgono anche per il requisito del lavoro', MAZZO, TRE, { attitudiniNelRequisito: true });
for (const n of [3, 5]) esperimento(`H${n}. Si chiude a ${n} occupati invece di 4`, MAZZO, TRE, { occupatiPerFinire: n }, 2000);

console.log('\n=== Le due proposte da valutare ===');
esperimento('P1. Campo comune: ambito su ambito anche senza lavoratore. Premio come adesso', MAZZO, TRE, { campoComune: true });
esperimento('P2a. Premio a chi aveva aperto, da pescare o da giocare; si gioca solo per far avanzare un lavoratore', MAZZO, TRE, { premioScelta: true });
esperimento('P2b. Come P2a, ma col premio si riapre anche una formazione', MAZZO, [RIAPRE, RIAPRE, RIAPRE], { premioScelta: true });
esperimento('P3. Campo comune, premio a chi mette il lavoratore, solo da pescare', MAZZO, TRE, { campoComune: true, premioA: 'entra' });
esperimento('P4. Campo comune, premio a chi mette il lavoratore, da pescare o da giocare', MAZZO, TRE, { campoComune: true, premioA: 'entra', premioScelta: true });
esperimento('P4b. Come P4, e col premio si riapre anche una formazione', MAZZO, [RIAPRE, RIAPRE, RIAPRE], { campoComune: true, premioA: 'entra', premioScelta: true });
