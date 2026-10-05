// Partite simulate tra bot con le regole di strumenti/regole.mjs.
// I numeri di BUCHI.md vengono da qui.
//
// Uso:  node strumenti/analisi.mjs
import { readFileSync } from 'node:fs';
import { PUNTI, nuovaPartita, gioca, ambito, puoPescare, lavoratoriPer, turniRimasti, classifica, poterePer } from './regole.mjs';

const radice = new URL('..', import.meta.url);
const righe = (nome) => readFileSync(new URL(`mazzi/${nome}.csv`, radice), 'utf8').trim().split(/\r?\n/).slice(1).map((r) => r.split(',').map((x) => x.trim()));
const M = {
  lav: righe('lavoratori').map(([n, ...att]) => ({ n, att })),
  form: righe('ambiti').map(([n, cat, ...lav]) => ({ n, cat, lav })),
};
const CATEGORIE = ['Tecnica e produzione', 'Servizi e relazioni', 'Organizzazione e gestione', 'Creatività e comunicazione', 'Ricerca e innovazione'];

function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pct = (x, tot) => (tot ? `${((100 * x) / tot).toFixed(0)}%` : '-');
const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const f1 = (x) => x.toFixed(1);

// Le icone come conteggi per simbolo: i confronti tra multinsiemi diventano somme.
const SIMBOLI = [...new Set([...M.form.flatMap((a) => a.lav), ...M.lav.flatMap((l) => l.att)])];
const vettore = (icone) => SIMBOLI.map((s) => icone.filter((x) => x === s).length);
const VA = M.form.map((a) => vettore(a.lav));
const VW = M.lav.map((l) => vettore(l.att));
const va = (c) => VA[c % M.form.length];
const zero = () => SIMBOLI.map(() => 0);
const piu = (a, b) => a.map((x, i) => x + b[i]);
const massimo = (a, b) => a.map((x, i) => Math.max(x, b[i]));
const manca = (serve, ho) => serve.map((x, i) => Math.max(0, x - ho[i]));
const somma = (a) => a.reduce((x, y) => x + y, 0);
const inComune = (a, b) => a.reduce((x, y, i) => x + Math.min(y, b[i]), 0);

// Tutti i sottoinsiemi di n carte, dai più piccoli.
const bit = (x) => { let n = 0; for (; x; x >>= 1) n += x & 1; return n; };
const SOTTOINSIEMI = Array.from({ length: 9 }, (_, n) => Array.from({ length: (1 << n) - 1 }, (_, i) => i + 1).sort((a, b) => bit(a) - bit(b)));
// Il minor numero di carte, tra quelle date, le cui icone coprono `serve`.
function minimo(carte, serve) {
  if (!somma(serve)) return [];
  const c = carte.slice(0, 8);
  for (const m of SOTTOINSIEMI[c.length]) {
    let ho = zero();
    for (let i = 0; i < c.length; i++) if (m & (1 << i)) ho = piu(ho, va(c[i]));
    if (!somma(manca(serve, ho))) return c.filter((_, i) => m & (1 << i));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Il bot
// ---------------------------------------------------------------------------
// Cerca il set che rende di più per i turni che costa: una pila (anche ancora da
// aprire), un lavoratore del mercato o tenuto da parte, e un lavoro che ha in
// mano. Poi fa il primo passo. Se non vede niente che valga la pena, pesca.
//   stile.costo   quanti punti vale per lui un turno: alto = fa in fretta, basso = aspetta l'abbinamento buono
//   stile.atteso  quanto pensa di ricavare da un lavoratore inserito senza avere ancora il lavoro
const STIMA_POTERE = [0, 2.5, 3, 1.5, 1, 1]; // quanti punti vale per lui ogni potere: dalle misure qui sotto

function bot(stile = {}) {
  const costo = stile.costo ?? 2;
  const atteso = stile.atteso ?? 8;

  function valore(s, g, w, j) {
    const a = ambito(M, j);
    let v = PUNTI[inComune(VW[w], va(j))] + STIMA_POTERE[poterePer(s, s.giocatori.indexOf(g), a.cat)];
    const perCat = {};
    for (const x of g.set) perCat[x.cat] = (perCat[x.cat] ?? 0) + 1;
    if (!g.gettoni.uguali && s.gettoni.uguali.length) {
      const n = (perCat[a.cat] ?? 0) + 1;
      v += n >= 3 ? s.gettoni.uguali[0] : n === 2 ? 1 : 0;
    }
    if (!g.gettoni.diverse && s.gettoni.diverse.length && !perCat[a.cat]) {
      v += Object.keys(perCat).length + 1 >= 4 ? s.gettoni.diverse[0] : 0.5;
    }
    return v;
  }

  // La carta, tra quelle scelte, che copre di più `prima`; a parità, `poi`.
  const migliore = (carte, prima, poi) => carte.reduce((a, b) => {
    const pa = inComune(va(a), prima) * 10 + inComune(va(a), poi);
    const pb = inComune(va(b), prima) * 10 + inComune(va(b), poi);
    return pb > pa ? b : a;
  });

  function piano(s, p, soloFormazioni = false) {
    const g = s.giocatori[p];
    const mano = g.mano;
    const lavoratori = lavoratoriPer(s, p);
    const rimasti = turniRimasti(s);
    let top = null;
    const prova = (v, turni, azione) => {
      if (turni > rimasti) return;
      if (soloFormazioni && azione.t !== 'apri' && azione.t !== 'migliora') return;
      const netto = v - costo * turni;
      if (!top || netto > top.netto) top = { netto, azione };
    };
    const senza = (j) => mano.filter((c) => c !== j);

    g.pile.forEach((pila, k) => {
      const ho = pila.form.reduce((x, c) => piu(x, va(c)), zero());
      if (pila.lav != null) {
        // manca solo il lavoro
        for (const j of mano) {
          const serve = manca(va(j), ho);
          const carte = minimo(senza(j), serve);
          if (!carte) continue;
          prova(valore(s, g, pila.lav, j), carte.length + 1,
            carte.length ? { t: 'migliora', c: migliore(carte, serve, serve), k } : { t: 'completa', c: j, k });
        }
        return;
      }
      for (const w of lavoratori) {
        const perLui = manca(VW[w], ho);
        for (const j of mano) {
          const serve = manca(massimo(VW[w], va(j)), ho);
          const carte = minimo(senza(j), serve);
          if (!carte) continue;
          prova(valore(s, g, w, j), carte.length + 2,
            somma(perLui) ? { t: 'migliora', c: migliore(carte, perLui, serve), k } : { t: 'inserisci', w, k });
        }
        // intanto il lavoratore: il lavoro si cercherà dopo
        const carte = minimo(mano, perLui);
        if (carte) prova(atteso, carte.length + 4, carte.length ? { t: 'migliora', c: migliore(carte, perLui, perLui), k } : { t: 'inserisci', w, k });
      }
    });

    // una pila nuova
    for (const w of lavoratori) {
      for (const j of mano) {
        const serve = massimo(VW[w], va(j));
        const carte = minimo(senza(j), serve);
        if (carte) prova(valore(s, g, w, j), carte.length + 2, { t: 'apri', c: migliore(carte, VW[w], serve) });
      }
      const carte = minimo(mano, VW[w]);
      if (carte) prova(atteso, carte.length + 4, { t: 'apri', c: migliore(carte, VW[w], VW[w]) });
    }
    return top;
  }

  return {
    scegli(s, M_, p) {
      const g = s.giocatori[p];
      const top = piano(s, p);
      // Prima di chiudere con un lavoro che fa piazzare subito un lavoratore (potere 5),
      // conviene avere pronta una formazione libera su cui metterlo.
      if (top?.azione.t === 'completa' && poterePer(s, p, ambito(M, top.azione.c).cat) === 5 && turniRimasti(s) >= 2
        && !g.pile.some((x) => x.lav == null)) {
        const lavoratori = lavoratoriPer(s, p);
        const adatta = g.mano.filter((c) => c !== top.azione.c).find((c) => lavoratori.some((w) => somma(manca(VW[w], va(c))) <= 1));
        if (adatta != null) return { t: 'apri', c: adatta };
      }
      if (top && top.netto >= 0) return top.azione;
      // con la mano quasi piena conviene usare le carte invece di scartarle
      if (top && g.mano.length >= s.o.limiteMano - 1) return top.azione;
      if (puoPescare(s)) return { t: 'pesca' };
      return top ? top.azione : { t: 'passa' };
    },
    // Una formazione in più non costa un turno: si gioca sempre, se c'è una carta.
    potere3(s, M_, p) {
      const g = s.giocatori[p];
      const pensata = piano(s, p, true)?.azione;
      if (pensata || !g.mano.length) return pensata ?? null;
      const lavoratori = lavoratoriPer(s, p);
      const copre = (c) => Math.max(0, ...lavoratori.map((w) => inComune(va(c), VW[w])));
      return { t: 'apri', c: g.mano.reduce((a, b) => (copre(b) > copre(a) ? b : a)) };
    },
    potere5(s, M_, p) {
      const g = s.giocatori[p];
      let top = null;
      g.pile.forEach((pila, k) => {
        if (pila.lav != null) return;
        const ho = pila.form.reduce((x, c) => piu(x, va(c)), zero());
        for (const w of lavoratoriPer(s, p)) {
          if (somma(manca(VW[w], ho)) > 1) continue;
          let v = atteso - costo * 3;
          for (const j of g.mano) {
            const carte = minimo(g.mano.filter((c) => c !== j), manca(va(j), ho));
            if (carte) v = Math.max(v, valore(s, g, w, j) - costo * (carte.length + 1));
          }
          if (!top || v > top.v) top = { v, w, k };
        }
      });
      return top;
    },
    // Si scarta la carta che serve meno: a nessun lavoratore in vista e a nessuna pila.
    scarta(s, M_, p) {
      const g = s.giocatori[p];
      const lavoratori = lavoratoriPer(s, p);
      const utile = (c) => Math.max(0, ...lavoratori.map((w) => inComune(va(c), VW[w])),
        ...g.pile.filter((x) => x.lav != null).map((x) => inComune(va(c), VW[x.lav]) + 1));
      return g.mano.reduce((a, b) => (utile(b) < utile(a) ? b : a));
    },
  };
}

// ---------------------------------------------------------------------------
// Partite e conti
// ---------------------------------------------------------------------------
// Nessuna carta deve sparire o raddoppiare.
function verifica(s) {
  const amb = [...s.mazzoAmb, ...s.scartiAmb];
  const lav = [...s.mazzoLav, ...s.mercato.map((x) => x.w)];
  for (const g of s.giocatori) {
    amb.push(...g.mano);
    lav.push(...g.riserva);
    for (const x of g.pile) { amb.push(...x.form); if (x.lav != null) lav.push(x.lav); }
    for (const x of g.set) { amb.push(x.lavoro); lav.push(x.lav); if (!s.o.formazioniNegliScarti) amb.push(...x.form); }
  }
  const tutti = M.form.length * s.o.copieAmbiti;
  if (new Set(amb).size !== tutti || amb.length !== tutti) throw new Error('ambiti persi o doppi');
  if (new Set(lav).size !== M.lav.length || lav.length !== M.lav.length) throw new Error('lavoratori persi o doppi');
}

function partita(n, opzioni, stili, rnd) {
  const s = nuovaPartita(M, n, opzioni, rnd);
  const chi = stili.map(bot);
  const azioni = { apri: 0, migliora: 0, inserisci: 0, completa: 0, pesca: 0, passa: 0 };
  let fermi = 0; // turni con una formazione libera e nessun lavoratore che ci possa salire
  let turni = 0;
  let aVuoto = 0; // turni di fila in cui tutti pescano o passano
  while (!s.finita) {
    turni++;
    // Le regole non lo prevedono: se per 10 giri nessuno riesce a giocare una carta, la partita è bloccata.
    if (aVuoto >= 10 * n) {
      s.fine = { motivo: 'stallo', giro: s.giro };
      break;
    }
    const p = s.turno;
    const g = s.giocatori[p];
    const libere = g.pile.filter((x) => x.lav == null);
    if (libere.length && !libere.some((x) => {
      const ho = x.form.reduce((v, c) => piu(v, va(c)), zero());
      return lavoratoriPer(s, p).some((w) => !somma(manca(VW[w], ho)));
    })) fermi++;
    const m = chi[p].scegli(s, M, p);
    azioni[m.t]++;
    aVuoto = m.t === 'pesca' || m.t === 'passa' ? aVuoto + 1 : 0;
    gioca(s, M, m, chi[p], rnd);
    verifica(s);
  }
  return { s, azioni, fermi, turni };
}

function esperimento(titolo, n, opzioni = {}, stili = null, T = 3000, seme = 11) {
  const rnd = mulberry32(seme);
  stili ??= Array.from({ length: n }, () => ({}));
  const t = {
    giri: [], turni: 0, fermi: 0, fine: { set: 0, ambiti: 0, lavoratori: 0, stallo: 0 }, azioni: { apri: 0, migliora: 0, inserisci: 0, completa: 0, pesca: 0, passa: 0 },
    set: [], setMax: [], punti: [], puntiVincitore: [], icone: [0, 0, 0, 0], formazioni: [], perCategoria: [0, 0, 0, 0, 0], puntiCategoria: [0, 0, 0, 0, 0],
    gettoni: { uguali: [0, 0], diverse: [0, 0] }, inMano: [], aMeta: [], scartate: 0, rimescolate: 0, sostituiti: 0, attesa: [], vecchi: [],
    posto: Array(n).fill(0), puntiPosto: Array(n).fill(0), setPosto: Array(n).fill(0), cinque: 0, poteri: [0, 0, 0, 0, 0, 0], aVuoto: [0, 0, 0, 0, 0, 0],
  };
  const perStile = new Map();
  const solo = { vittorie: 0, punti: 0, set: 0, puntiAltri: 0, setAltri: 0 }; // chi ha il potere, quando lo ha uno solo
  for (let k = 0; k < T; k++) {
    const { ruota, ...regole } = opzioni;
    const { s, azioni, fermi, turni } = partita(n, ruota ? { ...regole, poteriDi: k % n } : regole, stili, rnd);
    t.giri.push(s.giro);
    t.turni += turni;
    t.fermi += fermi;
    t.fine[s.fine.motivo]++;
    for (const a in azioni) t.azioni[a] += azioni[a];
    const cl = classifica(s);
    const primi = cl.filter((x) => x.punti === cl[0].punti).map((x) => x.i);
    t.puntiVincitore.push(cl[0].punti);
    t.setMax.push(Math.max(...s.giocatori.map((g) => g.set.length)));
    if (s.giocatori.some((g) => g.set.length >= s.o.setPerFinire)) t.cinque++;
    s.giocatori.forEach((g, i) => {
      t.set.push(g.set.length);
      t.punti.push(g.punti);
      t.inMano.push(g.mano.length);
      t.aMeta.push(g.pile.length);
      t.puntiPosto[i] += g.punti;
      t.setPosto[i] += g.set.length;
      if (primi.includes(i)) t.posto[i] += 1 / primi.length;
      for (const x of g.set) {
        t.icone[x.icone]++;
        t.formazioni.push(x.form.length);
        t.perCategoria[Number(x.cat) - 1]++;
        t.puntiCategoria[Number(x.cat) - 1] += x.punti;
      }
      for (const q of ['uguali', 'diverse']) if (g.gettoni[q]) t.gettoni[q][g.gettoni[q] === 5 ? 0 : 1]++;
      const nome = stili[i].nome;
      if (nome) {
        const r = perStile.get(nome) ?? { partite: 0, punti: 0, set: 0, vittorie: 0 };
        r.partite++; r.punti += g.punti; r.set += g.set.length;
        if (primi.includes(i)) r.vittorie += 1 / primi.length;
        perStile.set(nome, r);
      }
    });
    if (opzioni.ruota) {
      const io = k % n;
      if (primi.includes(io)) solo.vittorie += 1 / primi.length;
      s.giocatori.forEach((g, i) => {
        if (i === io) {
          solo.punti += g.punti;
          solo.set += g.set.length;
        } else {
          solo.puntiAltri += g.punti / (n - 1);
          solo.setAltri += g.set.length / (n - 1);
        }
      });
    }
    t.scartate += s.conta.scartate;
    t.rimescolate += s.conta.rimescolate;
    t.sostituiti += s.conta.sostituiti;
    t.attesa.push(...s.conta.attesa);
    t.vecchi.push(s.mercato.filter((x) => s.giro - x.dal >= 4).length);
    s.conta.poteri.forEach((x, i) => { t.poteri[i] += x; });
    s.conta.poteriAVuoto.forEach((x, i) => { t.aVuoto[i] += x; });
  }
  const nSet = somma(t.icone);
  console.log(`\n${titolo}`);
  console.log(`  giri ${f1(media(t.giri))}   finisce per: quinto set ${pct(t.fine.set, T)}, ambiti finiti ${pct(t.fine.ambiti, T)}, lavoratori finiti ${pct(t.fine.lavoratori, T)}, bloccata ${t.fine.stallo} su ${T}`,
    `  partite in cui qualcuno arriva a ${opzioni.setPerFinire ?? 5} set: ${pct(t.cinque, T)}`);
  console.log(`  set a testa ${f1(media(t.set))} (il migliore ${f1(media(t.setMax))})   punti a testa ${f1(media(t.punti))}, del vincitore ${f1(media(t.puntiVincitore))}`,
    `  punti per set ${f1(media(t.punti) / Math.max(0.01, media(t.set)))}   formazioni per set ${(media(t.formazioni)).toFixed(2)}`);
  console.log(`  ambizioni che combaciano col lavoro: ${t.icone.map((x, k) => `${k}: ${pct(x, nSet)}`).join('  ')}`);
  console.log(`  azioni: ${Object.entries(t.azioni).map(([a, x]) => `${a} ${pct(x, t.turni)}`).join('  ')}`);
  console.log(`  gettoni presi: tre uguali ${pct(t.gettoni.uguali[0], T)} (il secondo ${pct(t.gettoni.uguali[1], T)}), quattro diverse ${pct(t.gettoni.diverse[0], T)} (il secondo ${pct(t.gettoni.diverse[1], T)})`);
  console.log(`  a fine partita: ${f1(media(t.inMano))} carte in mano e ${f1(media(t.aMeta))} pile non chiuse a testa; scartate per il limite ${f1(t.scartate / T)} carte a partita; scarti rimescolati ${f1(t.rimescolate / T)} volte`);
  console.log(`  mercato: un lavoratore aspetta ${f1(media(t.attesa))} giri prima di essere preso; a fine partita ${f1(media(t.vecchi))} sono lì da 4 giri o più;`,
    `turni con una formazione libera e nessun lavoratore adatto ${pct(t.fermi, t.turni)}${t.sostituiti ? `; sostituiti ${f1(t.sostituiti / T)} a partita` : ''}`);
  console.log(`  per posto al tavolo: vittorie ${t.posto.map((x) => pct(x, T)).join(' ')}   punti ${t.puntiPosto.map((x) => f1(x / T)).join(' ')}   set ${t.setPosto.map((x) => f1(x / T)).join(' ')}`);
  console.log(`  set chiusi per categoria: ${t.perCategoria.map((x, i) => `${i + 1}: ${pct(x, nSet)} (${f1(t.puntiCategoria[i] / Math.max(1, x))} p.)`).join('  ')}`);
  if (t.poteri.slice(1).some((x) => x)) {
    console.log(`  poteri usati a partita: ${t.poteri.slice(1).map((x, i) => `${i + 1}: ${f1(x / T)}`).join('  ')}`,
      `  a vuoto: potere 3 ${pct(t.aVuoto[3], t.poteri[3])}, potere 5 ${pct(t.aVuoto[5], t.poteri[5])}`);
  }
  if (opzioni.ruota) {
    console.log(`  CHI HA IL POTERE: vince ${pct(solo.vittorie, T)} (alla pari sarebbe ${pct(1, n)}), ${f1(solo.punti / T)} punti e ${f1(solo.set / T)} set;`,
      `gli altri ${f1(solo.puntiAltri / T)} punti e ${f1(solo.setAltri / T)} set`);
  }
  for (const [nome, r] of perStile) console.log(`  ${nome.padEnd(10)} punti ${f1(r.punti / r.partite)}  set ${f1(r.set / r.partite)}  vittorie ${pct(r.vittorie, r.partite)}`);
  return t;
}

// ---------------------------------------------------------------------------
// Conti sulle carte
// ---------------------------------------------------------------------------
{
  console.log('=== Le carte ===');
  const uguali = (a, b) => !somma(manca(a, b)) && !somma(manca(b, a));
  const conUnAmbito = M.lav.filter((_, w) => VA.some((a) => uguali(a, VW[w]))).length;
  console.log(`Lavoratori che una sola formazione può accogliere (un ambito con le sue stesse icone): ${conUnAmbito} su ${M.lav.length}`);
  let coppie = 0;
  let adatte = 0;
  for (let w = 0; w < VW.length; w++) for (let a = 0; a < VA.length; a++) for (let b = a + 1; b < VA.length; b++) {
    coppie++;
    if (!somma(manca(VW[w], piu(VA[a], VA[b])))) adatte++;
  }
  console.log(`Coppie di ambiti che, insieme, coprono le ambizioni di un lavoratore: ${pct(adatte, coppie)}`);
  // con 3 ambiti in mano e il mercato scoperto: si può già inserire qualcuno con due formazioni?
  const rnd = mulberry32(3);
  for (const n of [2, 3, 4]) {
    let ok1 = 0;
    let ok2 = 0;
    const T = 20000;
    for (let t = 0; t < T; t++) {
      const amb = [];
      while (amb.length < 3) { const x = Math.floor(rnd() * VA.length); if (!amb.includes(x)) amb.push(x); }
      const lav = [];
      while (lav.length < n) { const x = Math.floor(rnd() * VW.length); if (!lav.includes(x)) lav.push(x); }
      if (lav.some((w) => amb.some((a) => uguali(VA[a], VW[w])))) ok1++;
      if (lav.some((w) => amb.some((a, i) => amb.some((b, k) => k > i && !somma(manca(VW[w], piu(VA[a], VA[b]))))))) ok2++;
    }
    console.log(`In ${n}: con la mano iniziale si può accogliere un lavoratore del mercato con una formazione nel ${pct(ok1, T)} dei casi, con due nel ${pct(ok2, T)}`);
  }
}

// ---------------------------------------------------------------------------
const NESSUNO = [0, 0, 0, 0, 0];
const TUTTI = (k) => [k, k, k, k, k];

console.log('\n=== Regole come sono scritte, senza poteri ===');
for (const n of [2, 3, 4]) esperimento(`${n} giocatori`, n, { poteri: NESSUNO });

const RIMESSE = { formazioniNegliScarti: true };

console.log('\n=== Quanto vale un potere: lo ha un giocatore solo, su tutte le categorie (3 giocatori) ===');
for (let k = 1; k <= 5; k++) esperimento(`Potere ${k}, regole come sono scritte`, 3, { poteri: TUTTI(k), ruota: true });
for (let k = 1; k <= 5; k++) esperimento(`Potere ${k}, con le formazioni che tornano negli scarti`, 3, { poteri: TUTTI(k), ruota: true, ...RIMESSE });

console.log('\n=== Abbinamenti tra categorie e poteri (3 giocatori) ===');
esperimento('Poteri 1 2 3 4 5 nell\u2019ordine delle categorie', 3, { poteri: [1, 2, 3, 4, 5] });
esperimento('I poteri forti alle categorie che si chiudono meno: 5 3 4 1 2', 3, { poteri: [5, 3, 4, 1, 2] });
esperimento('I poteri forti alle categorie che si chiudono di più: 2 3 1 4 5', 3, { poteri: [2, 3, 1, 4, 5] });
esperimento('Poteri 1 2 3 4 5, con le formazioni che tornano negli scarti', 3, { poteri: [1, 2, 3, 4, 5], ...RIMESSE });
esperimento('Poteri 5 3 4 1 2, con le formazioni che tornano negli scarti', 3, { poteri: [5, 3, 4, 1, 2], ...RIMESSE });
esperimento('Poteri 2 3 1 4 5, con le formazioni che tornano negli scarti', 3, { poteri: [2, 3, 1, 4, 5], ...RIMESSE });

console.log('\n=== Chi fa in fretta e chi aspetta l\u2019abbinamento buono (3 giocatori, senza poteri) ===');
const RAPIDO = { nome: 'rapido', costo: 3.5 };
const NORMALE = { nome: 'normale', costo: 2 };
const PAZIENTE = { nome: 'paziente', costo: 1 };
esperimento('Uno rapido, uno normale, uno paziente', 3, { poteri: NESSUNO }, [RAPIDO, NORMALE, PAZIENTE]);
esperimento('Gli stessi, in ordine inverso', 3, { poteri: NESSUNO }, [PAZIENTE, NORMALE, RAPIDO]);
esperimento('Gli stessi, con le formazioni che tornano negli scarti', 3, { poteri: NESSUNO, ...RIMESSE }, [RAPIDO, NORMALE, PAZIENTE]);

console.log('\n=== Varianti (senza poteri) ===');
for (const n of [2, 3, 4]) esperimento(`Chiuso un set, le sue formazioni vanno negli scarti: in ${n}`, n, { poteri: NESSUNO, ...RIMESSE });
for (const n of [2, 3, 4]) esperimento(`Due copie di ogni ambito (60 carte): in ${n}`, n, { poteri: NESSUNO, copieAmbiti: 2 });
esperimento('Due copie e formazioni negli scarti: in 4', 4, { poteri: NESSUNO, copieAmbiti: 2, ...RIMESSE });
esperimento('Si chiude al quarto set, in 3', 3, { poteri: NESSUNO, setPerFinire: 4 });
esperimento('Si chiude al terzo set, in 3', 3, { poteri: NESSUNO, setPerFinire: 3 });
esperimento('Si chiude al terzo set, in 4', 4, { poteri: NESSUNO, setPerFinire: 3 });
esperimento('Mercato con 2 lavoratori in pi\u00f9, in 3', 3, { poteri: NESSUNO, mercato: 5 });
esperimento('Un lavoratore fermo al mercato da 3 giri viene sostituito, in 3', 3, { poteri: NESSUNO, ricambioMercato: 3 });
esperimento('Si pescano 3 carte invece di 2, in 3', 3, { poteri: NESSUNO, pescata: 3 });
