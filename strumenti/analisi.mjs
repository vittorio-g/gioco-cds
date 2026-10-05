// Partite simulate tra bot con le regole di strumenti/regole.mjs.
// I numeri di BUCHI.md vengono da qui.
//
// Uso:  node strumenti/analisi.mjs                 tutto, qualche minuto
//       node strumenti/analisi.mjs base valore     solo alcune parti: carte, base, poteri, uno, valore, bilancia, varianti,
//                                                  e sugli stili di gioco: stili, risposta, selettivi, adattivi, regole
import { readFileSync } from 'node:fs';
import { PUNTI, nuovaPartita, gioca, ambito, puoPescare, lavoratoriPer, turniRimasti, classifica, poterePer } from './regole.mjs';

const radice = new URL('..', import.meta.url);
const righe = (nome) => readFileSync(new URL(`mazzi/${nome}.csv`, radice), 'utf8').trim().split(/\r?\n/).slice(1).map((r) => r.split(',').map((x) => x.trim()));
const M = {
  lav: righe('lavoratori').map(([n, ...att]) => ({ n, att })),
  form: righe('ambiti').map(([n, cat, ...lav]) => ({ n, cat, lav })),
};
const NOMI_POTERI = ['nessuno', 'pesca 2 ambiti', 'prenota un lavoratore', 'fino a 2 formazioni', 'piazza un lavoratore'];

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
const competenze = (pila) => pila.form.reduce((x, c) => piu(x, va(c)), zero());

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
// aprire), un lavoratore del mercato o prenotato, e un lavoro che ha in mano.
// Poi fa il primo passo. Se non vede niente che valga la pena, pesca.
// Lo stile di gioco:
//   costo          quanti punti deve rendere, per lui, ogni azione spesa su un set. Basso: parte col
//                  primo set che gli riesce. Alto: è esigente, e finché non ne vede uno che rende pesca.
//                  Non è la fretta: chi ha il costo alto pesca di più e chiude set migliori.
//   minPunti       non comincia un set che vale meno di così (5 = li prende tutti, 10, 16)
//   minIcone       lo stesso, detto in ambizioni che combaciano: 3 = solo set perfetti, con qualunque tabella dei punti
//   maxFormazioni  non mette più di tante formazioni in una pila
//   manoMinima     sotto questo numero di carte in mano prima pesca, poi costruisce
//   volata         { set, costo }: quando un avversario arriva a quel numero di set cambia passo e
//                  prende quello che c'è
//   atteso         quanto pensa di ricavare da un lavoratore inserito senza avere ancora il lavoro
const STIMA_POTERE = [0, 3, 1.2, 0.5, 0.7]; // quanti punti vale per lui ogni potere: dalle misure della parte "valore"

function bot(stile = {}) {
  const atteso = stile.atteso ?? 8;
  const maxFormazioni = stile.maxFormazioni ?? 99;
  const manoMinima = stile.manoMinima ?? 0;
  // In volata, o quando la fine è scattata, si prende quello che c'è.
  const inVolata = (s, p) => !!stile.volata && s.giocatori.some((g, i) => i !== p && g.set.length >= stile.volata.set);
  const manoMinimaOra = (s, p) => (inVolata(s, p) ? 0 : Math.min(manoMinima, s.o.limiteMano - 1)); // mai oltre quello che il limite permette
  const costoOra = (s, p) => (inVolata(s, p) ? stile.volata.costo : stile.costo ?? 2);
  const minPuntiOra = (s, p) => (s.fine || inVolata(s, p) ? 0 : stile.minIcone != null ? (s.o.punti ?? PUNTI)[stile.minIcone] : stile.minPunti ?? 0);

  function valore(s, g, w, j) {
    const a = ambito(M, j);
    let v = (s.o.punti ?? PUNTI)[inComune(VW[w], va(j))];
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

  // Il piano migliore. soloFormazioni: solo quelli che cominciano giocando una
  // formazione. conLavoratore: solo quelli con quel lavoratore, ancora da prendere.
  function piano(s, p, { soloFormazioni = false, conLavoratore = null } = {}) {
    const g = s.giocatori[p];
    const mano = g.mano;
    const lavoratori = conLavoratore != null ? [conLavoratore] : lavoratoriPer(s, p);
    const rimasti = turniRimasti(s);
    const costo = costoOra(s, p);
    const minPunti = minPuntiOra(s, p);
    let top = null;
    // puntiSet: quanto vale il set, senza gettoni né poteri (null = non si sa ancora: manca il lavoro)
    const prova = (v, turni, azione, usate, puntiSet, formazioni) => {
      if (turni > rimasti) return;
      if (soloFormazioni && azione.t !== 'apri' && azione.t !== 'migliora') return;
      if (formazioni > maxFormazioni) return;
      if (puntiSet == null ? minPunti > (s.o.punti ?? PUNTI)[0] : puntiSet < minPunti) return;
      const netto = v - costo * turni;
      if (!top || netto > top.netto) top = { netto, azione, usate };
    };
    const punti = (w, j) => (s.o.punti ?? PUNTI)[inComune(VW[w], va(j))];
    const senza = (j) => mano.filter((c) => c !== j);
    const colPotere = (w) => STIMA_POTERE[poterePer(s, p, w)]; // prendendolo con l'azione normale

    g.pile.forEach((pila, k) => {
      const ho = competenze(pila);
      if (pila.lav != null) {
        if (conLavoratore != null) return;
        // manca solo il lavoro
        for (const j of mano) {
          const serve = manca(va(j), ho);
          const carte = minimo(senza(j), serve);
          if (!carte) continue;
          // il lavoratore c'è già: sul punteggio non si fa più gli schizzinosi
          prova(valore(s, g, pila.lav, j), carte.length + 1,
            carte.length ? { t: 'migliora', c: migliore(carte, serve, serve), k } : { t: 'completa', c: j, k }, [j, ...carte],
            99, pila.form.length + carte.length);
        }
        return;
      }
      for (const w of lavoratori) {
        const perLui = manca(VW[w], ho);
        for (const j of mano) {
          const serve = manca(massimo(VW[w], va(j)), ho);
          const carte = minimo(senza(j), serve);
          if (!carte) continue;
          prova(valore(s, g, w, j) + colPotere(w), carte.length + 2,
            somma(perLui) ? { t: 'migliora', c: migliore(carte, perLui, serve), k } : { t: 'inserisci', w, k }, [j, ...carte],
            punti(w, j), pila.form.length + carte.length);
        }
        // intanto il lavoratore: il lavoro si cercherà dopo
        const carte = minimo(mano, perLui);
        if (carte) {
          prova(atteso + colPotere(w), carte.length + 4,
            carte.length ? { t: 'migliora', c: migliore(carte, perLui, perLui), k } : { t: 'inserisci', w, k }, carte,
            null, pila.form.length + carte.length);
        }
      }
    });

    // una pila nuova
    for (const w of lavoratori) {
      for (const j of mano) {
        const serve = massimo(VW[w], va(j));
        const carte = minimo(senza(j), serve);
        if (carte) prova(valore(s, g, w, j) + colPotere(w), carte.length + 2, { t: 'apri', c: migliore(carte, VW[w], serve) }, [j, ...carte], punti(w, j), carte.length);
      }
      const carte = minimo(mano, VW[w]);
      if (carte) prova(atteso + colPotere(w), carte.length + 4, { t: 'apri', c: migliore(carte, VW[w], VW[w]) }, carte, null, carte.length);
    }
    return top;
  }

  return {
    scegli(s, M_, p) {
      const g = s.giocatori[p];
      const top = piano(s, p);
      // Prima di prendere un lavoratore che ne fa piazzare subito un altro (potere 4),
      // conviene avere pronta una seconda formazione libera su cui metterlo.
      if (top?.azione.t === 'inserisci' && poterePer(s, p, top.azione.w) === 4 && turniRimasti(s) >= 3
        && !g.pile.some((x, k) => x.lav == null && k !== top.azione.k)) {
        const altri = lavoratoriPer(s, p).filter((w) => w !== top.azione.w);
        const adatta = g.mano.filter((c) => !top.usate.includes(c)).find((c) => altri.some((w) => somma(manca(VW[w], va(c))) <= 1));
        if (adatta != null) return { t: 'apri', c: adatta };
      }
      // chi vuole una mano ricca prima pesca, a meno che non possa chiudere un set
      if (g.mano.length < manoMinimaOra(s, p) && puoPescare(s) && top?.azione.t !== 'completa' && !s.fine) return { t: 'pesca' };
      if (top && top.netto >= 0) return top.azione;
      // con la mano quasi piena conviene usare le carte invece di scartarle
      if (top && g.mano.length >= s.o.limiteMano - 1) return top.azione;
      if (puoPescare(s)) return { t: 'pesca' };
      return top ? top.azione : { t: 'passa' };
    },
    // Potere 2: il lavoratore del mercato che gli serve di più.
    prenota(s, M_, p) {
      const g = s.giocatori[p];
      let top = null;
      for (const { w } of s.mercato) {
        const v = piano(s, p, { conLavoratore: w })?.netto ?? -50 + Math.max(0, ...g.mano.map((c) => inComune(va(c), VW[w])));
        if (!top || v > top.v) top = { v, w };
      }
      return top?.w ?? null;
    },
    // Potere 3: una formazione in più non costa un turno, ma costa una carta:
    // si gioca solo se serve a un piano.
    formazione(s, M_, p) {
      return piano(s, p, { soloFormazioni: true })?.azione ?? null;
    },
    // Potere 4: il lavoratore e la formazione libera che promettono di più.
    piazza(s, M_, p) {
      const g = s.giocatori[p];
      let top = null;
      g.pile.forEach((pila, k) => {
        if (pila.lav != null) return;
        const ho = competenze(pila);
        for (const w of lavoratoriPer(s, p)) {
          if (somma(manca(VW[w], ho)) > 1) continue;
          const costo = costoOra(s, p);
          let v = atteso - costo * 3;
          for (const j of g.mano) {
            const carte = minimo(g.mano.filter((c) => c !== j), manca(va(j), ho));
            if (carte) v = Math.max(v, valore(s, g, w, j) - costoOra(s, p) * (carte.length + 1));
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
  const azioniDi = stili.map(() => ({ apri: 0, migliora: 0, inserisci: 0, completa: 0, pesca: 0, passa: 0 }));
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
      const ho = competenze(x);
      return lavoratoriPer(s, p).some((w) => !somma(manca(VW[w], ho)));
    })) fermi++;
    const m = chi[p].scegli(s, M, p);
    azioni[m.t]++;
    azioniDi[p][m.t]++;
    aVuoto = m.t === 'pesca' || m.t === 'passa' ? aVuoto + 1 : 0;
    gioca(s, M, m, chi[p], rnd);
    verifica(s);
  }
  return { s, azioni, azioniDi, fermi, turni };
}

// Stili diversi allo stesso tavolo. A ogni partita i posti ruotano, così il posto non conta.
// Due giocatori con lo stesso nome fanno media insieme.
function confronto(titolo, stili, opzioni = {}, T = 3000, seme = 23) {
  const rnd = mulberry32(seme);
  const n = stili.length;
  const r = new Map();
  const giri = [];
  let perSet = 0;
  for (let k = 0; k < T; k++) {
    const seduti = stili.map((_, i) => stili[(i + k) % n]);
    const { s, azioniDi } = partita(n, opzioni, seduti, rnd);
    giri.push(s.giro);
    if (s.fine.motivo === 'set') perSet++;
    const cl = classifica(s);
    const primi = cl.filter((x) => x.punti === cl[0].punti).map((x) => x.i);
    s.giocatori.forEach((g, i) => {
      const nome = seduti[i].nome;
      const x = r.get(nome) ?? { partite: 0, vittorie: 0, punti: 0, set: 0, icone: [0, 0, 0, 0], formazioni: 0, gettoni: 0, turni: 0, pesca: 0, passa: 0, aMeta: 0, conLavoratore: 0, inMano: 0, chiude: 0 };
      x.partite++;
      if (primi.includes(i)) x.vittorie += 1 / primi.length;
      x.punti += g.punti;
      x.set += g.set.length;
      for (const q of g.set) { x.icone[q.icone]++; x.formazioni += q.form.length; }
      x.gettoni += (g.gettoni.uguali ?? 0) + (g.gettoni.diverse ?? 0);
      for (const a in azioniDi[i]) x.turni += azioniDi[i][a];
      x.pesca += azioniDi[i].pesca;
      x.passa += azioniDi[i].passa;
      x.aMeta += g.pile.length;
      x.conLavoratore += g.pile.filter((q) => q.lav != null).length;
      x.inMano += g.mano.length;
      if (s.fine.motivo === 'set' && s.fine.da === i) x.chiude++;
      r.set(nome, x);
    });
  }
  console.log(`\n${titolo}   [${f1(media(giri))} giri, finisce al quinto set ${pct(perSet, T)}]`);
  const esito = {};
  for (const [nome, x] of r) {
    const quanti = stili.filter((q) => q.nome === nome).length;
    esito[nome] = { vittorie: (x.vittorie / T) / quanti, punti: x.punti / x.partite, set: x.set / x.partite };
    console.log(`  ${nome.padEnd(22)} vince ${pct(x.vittorie / quanti, T).padStart(4)}  punti ${f1(x.punti / x.partite).padStart(5)}  set ${(x.set / x.partite).toFixed(2)}`,
      ` punti per set ${f1((x.punti - x.gettoni) / Math.max(1, x.set))}  da 16: ${pct(x.icone[3], x.set).padStart(4)}  da 10: ${pct(x.icone[2], x.set).padStart(4)}  da 5-7: ${pct(x.icone[0] + x.icone[1], x.set).padStart(4)}`,
      ` formazioni per set ${(x.formazioni / Math.max(1, x.set)).toFixed(2)}  gettoni ${f1(x.gettoni / x.partite)}`,
      ` turni a pescare ${pct(x.pesca, x.turni)}  chiude lui la partita ${pct(x.chiude, x.partite)}  resta con ${f1(x.aMeta / x.partite)} pile a metà (${f1(x.conLavoratore / x.partite)} col lavoratore) e ${f1(x.inMano / x.partite)} carte`);
  }
  return esito;
}

function esperimento(titolo, n, opzioni = {}, stili = null, T = 3000, seme = 11) {
  const rnd = mulberry32(seme);
  stili ??= Array.from({ length: n }, () => ({}));
  const soglia = opzioni.setPerFinire ?? 5;
  const t = {
    giri: [], turni: 0, fermi: 0, fine: { set: 0, ambiti: 0, lavoratori: 0, stallo: 0 }, azioni: { apri: 0, migliora: 0, inserisci: 0, completa: 0, pesca: 0, passa: 0 },
    set: [], setMax: [], punti: [], puntiVincitore: [], icone: [0, 0, 0, 0], formazioni: [], perCategoria: [0, 0, 0, 0, 0],
    gettoni: { uguali: [0, 0], diverse: [0, 0] }, inMano: [], aMeta: [], prenotati: [], scartate: 0, rimescolate: 0, sostituiti: 0, attesa: [[], [], [], [], []], vecchi: [],
    posto: Array(n).fill(0), arriva: 0, poteri: [0, 0, 0, 0, 0], aVuoto: [0, 0, 0, 0, 0], formazioniDalPotere: 0,
  };
  const perStile = new Map();
  const solo = { vittorie: 0, punti: 0, set: 0, puntiAltri: 0, setAltri: 0 }; // il giocatore per cui i poteri funzionano, quando è uno solo
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
    if (s.giocatori.some((g) => g.set.length >= soglia)) t.arriva++;
    s.giocatori.forEach((g, i) => {
      t.set.push(g.set.length);
      t.punti.push(g.punti);
      t.inMano.push(g.mano.length);
      t.aMeta.push(g.pile.length);
      t.prenotati.push(g.riserva.length);
      if (primi.includes(i)) t.posto[i] += 1 / primi.length;
      for (const x of g.set) {
        t.icone[x.icone]++;
        t.formazioni.push(x.form.length);
        t.perCategoria[Number(x.cat) - 1]++;
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
    if (ruota) {
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
    s.conta.attesa.forEach((x, i) => t.attesa[i].push(...x));
    t.vecchi.push(s.mercato.filter((x) => s.giro - x.dal >= 4).length);
    s.conta.poteri.forEach((x, i) => { t.poteri[i] += x; });
    s.conta.aVuoto.forEach((x, i) => { t.aVuoto[i] += x; });
    t.formazioniDalPotere += s.conta.formazioniDalPotere;
  }
  const nSet = somma(t.icone);
  console.log(`\n${titolo}`);
  console.log(`  giri ${f1(media(t.giri))}   finisce per: ${soglia}° set ${pct(t.fine.set, T)}, ambiti finiti ${pct(t.fine.ambiti, T)}, lavoratori finiti ${pct(t.fine.lavoratori, T)}, bloccata ${t.fine.stallo} su ${T}`,
    `  partite in cui qualcuno arriva a ${soglia} set: ${pct(t.arriva, T)}`);
  console.log(`  set a testa ${f1(media(t.set))} (il migliore ${f1(media(t.setMax))})   punti a testa ${f1(media(t.punti))}, del vincitore ${f1(media(t.puntiVincitore))}`,
    `  punti per set ${f1(media(t.punti) / Math.max(0.01, media(t.set)))}   formazioni per set ${(media(t.formazioni)).toFixed(2)}`);
  console.log(`  ambizioni che combaciano col lavoro: ${t.icone.map((x, k) => `${k}: ${pct(x, nSet)}`).join('  ')}`);
  console.log(`  azioni: ${Object.entries(t.azioni).map(([a, x]) => `${a} ${pct(x, t.turni)}`).join('  ')}`);
  console.log(`  gettoni presi: tre uguali ${pct(t.gettoni.uguali[0], T)} (il secondo ${pct(t.gettoni.uguali[1], T)}), quattro diverse ${pct(t.gettoni.diverse[0], T)} (il secondo ${pct(t.gettoni.diverse[1], T)})`);
  console.log(`  a fine partita: ${f1(media(t.inMano))} carte in mano, ${f1(media(t.aMeta))} pile non chiuse e ${f1(media(t.prenotati))} lavoratori prenotati a testa; scartate per il limite ${f1(t.scartate / T)} carte a partita; scarti rimescolati ${f1(t.rimescolate / T)} volte`);
  console.log(`  mercato: un lavoratore aspetta ${f1(media(t.attesa.flat()))} giri prima di essere preso; a fine partita ${f1(media(t.vecchi))} sono lì da 4 giri o più;`,
    `turni con una formazione libera e nessun lavoratore adatto ${pct(t.fermi, t.turni)}${t.sostituiti ? `; sostituiti ${f1(t.sostituiti / T)} a partita` : ''}`);
  console.log(`  per posto al tavolo: vittorie ${t.posto.map((x) => pct(x, T)).join(' ')}`);
  console.log(`  set chiusi per categoria: ${t.perCategoria.map((x, i) => `${i + 1}: ${pct(x, nSet)}`).join('  ')}`);
  if (t.poteri.slice(1).some((x) => x)) {
    console.log(`  poteri attivati a partita: ${t.poteri.slice(1).map((x, i) => `${i + 1}: ${f1(x / T)}`).join('  ')}`,
      `  a vuoto: prenota ${pct(t.aVuoto[2], t.poteri[2])}, formazioni ${pct(t.aVuoto[3], t.poteri[3])} (ne gioca ${t.poteri[3] ? (t.formazioniDalPotere / t.poteri[3]).toFixed(2) : '-'} a volta), piazza ${pct(t.aVuoto[4], t.poteri[4])}`);
    if (t.attesa.slice(1).filter((x) => x.length).length > 1) {
      console.log(`  attesa al mercato per potere: ${t.attesa.map((x, i) => (x.length ? `${NOMI_POTERI[i]} ${f1(media(x))}` : null)).filter(Boolean).join('  ')}`);
    }
  }
  if (opzioni.ruota) {
    console.log(`  IL GIOCATORE PER CUI I POTERI FUNZIONANO: vince ${pct(solo.vittorie, T)} (alla pari sarebbe ${pct(1, n)}), ${f1(solo.punti / T)} punti e ${f1(solo.set / T)} set;`,
      `gli altri ${f1(solo.puntiAltri / T)} punti e ${f1(solo.setAltri / T)} set`);
  }
  for (const [nome, r] of perStile) console.log(`  ${nome.padEnd(10)} punti ${f1(r.punti / r.partite)}  set ${f1(r.set / r.partite)}  vittorie ${pct(r.vittorie, r.partite)}`);
  return t;
}

// ---------------------------------------------------------------------------
// Chi ha quale potere non è ancora deciso: qui 15 lavoratori per potere, a rotazione sul numero della carta.
const A_ROTAZIONE = M.lav.map((_, i) => (i % 4) + 1);
const TUTTI = (k) => M.lav.map(() => k);
const META = M.lav.map((_, i) => (i % 2 ? 0 : ((i / 2) % 4) + 1)); // un lavoratore su due ha un potere
// I poteri dati in base a quanto è difficile accogliere il lavoratore: il più forte ai più difficili.
// La difficoltà è il numero di coppie di ambiti che coprono le sue ambizioni: meno sono, più è difficile.
const coppieCheLoAccolgono = (w) => {
  let n = 0;
  for (let a = 0; a < VA.length; a++) for (let b = a; b < VA.length; b++) if (!somma(manca(VW[w], piu(VA[a], VA[b])))) n++;
  return n;
};
const PER_DIFFICOLTA = (ordine) => {
  const dalPiuDifficile = M.lav.map((_, w) => w).sort((a, b) => coppieCheLoAccolgono(a) - coppieCheLoAccolgono(b));
  const poteri = [];
  dalPiuDifficile.forEach((w, i) => { poteri[w] = ordine[Math.floor(i / 15)]; });
  return poteri;
};
const RIMESSE = { formazioniNegliScarti: true };
// Tre stili lungo la stessa manopola: quanto deve rendere un set perché valga la pena cominciarlo.
const IMPULSIVO = { nome: 'impulsivo (1)', costo: 1 }; // parte col primo set che gli riesce
const NORMALE = { nome: 'normale (2)', costo: 2 };
const ESIGENTE = { nome: 'esigente (3,5)', costo: 3.5 }; // pesca finché non vede un set che rende

const PARTI = {
  carte() {
    console.log('=== Le carte ===');
    const uguali = (a, b) => !somma(manca(a, b)) && !somma(manca(b, a));
    const conUnAmbito = M.lav.filter((_, w) => VA.some((a) => uguali(a, VW[w]))).length;
    console.log(`Lavoratori che una sola formazione può accogliere (un ambito con le sue stesse icone): ${conUnAmbito} su ${M.lav.length}`);
    // con 3 ambiti in mano, pescati dal mazzo da 60, e il mercato scoperto: si può già accogliere qualcuno?
    const rnd = mulberry32(3);
    for (const n of [2, 3, 4]) {
      let ok1 = 0;
      let ok2 = 0;
      const T = 20000;
      for (let t = 0; t < T; t++) {
        const carte = [];
        while (carte.length < 3) { const x = Math.floor(rnd() * VA.length * 2); if (!carte.includes(x)) carte.push(x); }
        const amb = carte.map((x) => x % VA.length);
        const lav = [];
        while (lav.length < n) { const x = Math.floor(rnd() * VW.length); if (!lav.includes(x)) lav.push(x); }
        if (lav.some((w) => amb.some((a) => uguali(VA[a], VW[w])))) ok1++;
        if (lav.some((w) => amb.some((a, i) => amb.some((b, k) => k > i && !somma(manca(VW[w], piu(VA[a], VA[b]))))))) ok2++;
      }
      console.log(`In ${n}: con la mano iniziale si può accogliere un lavoratore del mercato con una formazione nel ${pct(ok1, T)} dei casi, con due nel ${pct(ok2, T)}`);
    }
  },
  base() {
    console.log('\n=== 60 lavoratori e 60 ambiti, senza poteri ===');
    for (const n of [2, 3, 4]) esperimento(`${n} giocatori`, n, {});
  },
  poteri() {
    console.log('\n=== Con i poteri sui lavoratori, 15 per tipo ===');
    for (const n of [2, 3, 4]) esperimento(`${n} giocatori`, n, { poteri: A_ROTAZIONE });
  },
  uno() {
    console.log('\n=== Un potere alla volta, su tutti i lavoratori (3 giocatori) ===');
    for (let k = 1; k <= 4; k++) esperimento(`Tutti i lavoratori: ${NOMI_POTERI[k]}`, 3, { poteri: TUTTI(k) });
  },
  valore() {
    console.log('\n=== Quanto vale un potere: funziona per un giocatore solo ===');
    for (let k = 1; k <= 4; k++) esperimento(`In 3, solo per lui: ${NOMI_POTERI[k]}`, 3, { poteri: TUTTI(k), ruota: true });
    esperimento('In 3, solo per lui: i quattro poteri, 15 per tipo', 3, { poteri: A_ROTAZIONE, ruota: true });
    for (let k = 1; k <= 4; k++) esperimento(`In 4, solo per lui: ${NOMI_POTERI[k]}`, 4, { poteri: TUTTI(k), ruota: true });
  },
  bilancia() {
    console.log('\n=== Il potere "pesca" è troppo forte: due correzioni (3 giocatori) ===');
    esperimento('Solo per lui: pesca 1 ambito invece di 2', 3, { poteri: TUTTI(1), pescaDelPotere: 1, ruota: true });
    esperimento('Poteri 15 per tipo, ma "pesca" fa pescare 1 carta', 3, { poteri: A_ROTAZIONE, pescaDelPotere: 1 });
    esperimento('Il potere più forte ai 15 lavoratori più difficili: pesca, prenota, piazza, formazioni', 3, { poteri: PER_DIFFICOLTA([1, 2, 4, 3]) });
    esperimento('Il contrario: pesca ai 15 più facili', 3, { poteri: PER_DIFFICOLTA([3, 4, 2, 1]) });
  },
  // ---- Gli stili di gioco. Dove non è detto: 3 giocatori, poteri 15 per tipo.
  stili() {
    const P = { poteri: A_ROTAZIONE };
    const altro = (nome) => ({ ...NORMALE, nome });
    console.log('\n=== I tre stili di partenza, allo stesso tavolo ===');
    confronto('Impulsivo, normale, esigente', [IMPULSIVO, NORMALE, ESIGENTE], P);

    console.log('\n=== Ognuno contro se stesso: cosa fa uno stile quando tutti giocano così ===');
    for (const c of [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5]) confronto(`Tutti con costo ${c}`, [1, 2, 3].map(() => ({ nome: `costo ${c}`, costo: c })), P, 2000);

    console.log('\n=== La curva: uno cambia stile, gli altri due restano normali (costo 2) ===');
    for (const c of [0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 7]) confronto(`Lui: costo ${c}`, [{ nome: `lui (${c})`, costo: c }, altro('gli altri (2)'), altro('gli altri (2)')], P);
  },
  risposta() {
    const P = { poteri: A_ROTAZIONE };
    console.log('\n=== La risposta migliore a ogni tavolo: vittorie di chi devia, contro due avversari uguali ===');
    const campo = [1, 2, 3, 4, 5, 6];
    const lui = [1, 2, 3, 4, 5, 6, 7];
    const tabella = [];
    for (const c of campo) {
      const riga = [];
      for (const d of lui) {
        const e = confronto(`Tavolo a costo ${c}, lui a costo ${d}`, [{ nome: 'lui', costo: d }, { nome: 'tavolo', costo: c }, { nome: 'tavolo', costo: c }], P, 2000);
        riga.push(e.lui.vittorie);
      }
      tabella.push(riga);
    }
    console.log(`\nVittorie di chi devia (alla pari 33%). Righe: lo stile del tavolo. Colonne: lo stile di chi devia: ${lui.join('  ')}`);
    tabella.forEach((riga, i) => console.log(`  tavolo ${String(campo[i]).padEnd(4)} ${riga.map((v) => `${(100 * v).toFixed(0)}%`.padStart(5)).join(' ')}   migliore: ${lui[riga.indexOf(Math.max(...riga))]}`));
  },
  selettivi() {
    const P = { poteri: A_ROTAZIONE };
    const altro = { ...NORMALE, nome: 'gli altri (normali)' };
    console.log('\n=== Selettivi sul punteggio: non comincia un set che vale meno di tanto (contro due normali) ===');
    for (const m of [5, 7, 10, 16]) confronto(`Lui: almeno ${m} punti`, [{ nome: `lui (min ${m})`, costo: 2, minPunti: m }, altro, altro], P);
    for (const m of [10, 16]) confronto(`Lui: almeno ${m} punti, ed esigente (costo 3,5)`, [{ nome: `lui (min ${m}, esigente)`, costo: 3.5, minPunti: m }, altro, altro], P);
    confronto('Tutti e tre: almeno 16 punti', [1, 2, 3].map(() => ({ nome: 'min 16', costo: 2, minPunti: 16 })), P);

    console.log('\n=== Quante formazioni è disposto a mettere in una pila (contro due normali) ===');
    for (const f of [1, 2, 3]) confronto(`Lui: al massimo ${f}`, [{ nome: `lui (max ${f})`, costo: 2, maxFormazioni: f }, altro, altro], P);

    console.log('\n=== Prima riempie la mano, poi costruisce (contro due normali) ===');
    for (const h of [3, 4, 5, 6]) confronto(`Lui: pesca finché non ha ${h} carte`, [{ nome: `lui (mano ${h})`, costo: 2, manoMinima: h }, altro, altro], P);
    confronto('Tutti e tre: pescano finché non hanno 5 carte', [1, 2, 3].map(() => ({ nome: 'mano 5', costo: 2, manoMinima: 5 })), P);
    confronto('Lui: mano 5 ed esigente (costo 4)', [{ nome: 'lui (mano 5, esigente)', costo: 4, manoMinima: 5 }, altro, altro], P);
  },
  adattivi() {
    const P = { poteri: A_ROTAZIONE };
    const altro = { ...NORMALE, nome: 'gli altri (normali)' };
    const esigenti = { nome: 'gli altri (esigenti)', costo: 4 };
    console.log('\n=== Cambiare passo a partita in corso: selettivo all\u2019inizio, poi prende quello che c\u2019\u00e8 (contro due normali) ===');
    for (const k of [2, 3, 4]) confronto(`Solo set da 16, finché un avversario non ha ${k} set`, [{ nome: `lui (16, poi tutto a ${k})`, costo: 2, minPunti: 16, volata: { set: k, costo: 1 } }, altro, altro], P);
    for (const k of [3, 4]) confronto(`Mano da 5 carte, finché un avversario non ha ${k} set`, [{ nome: `lui (mano 5, poi tutto a ${k})`, costo: 2, manoMinima: 5, volata: { set: k, costo: 1 } }, altro, altro], P);
    for (const k of [3, 4]) confronto(`Esigente (4), finché un avversario non ha ${k} set`, [{ nome: `lui (esigente, poi tutto a ${k})`, costo: 4, volata: { set: k, costo: 1 } }, altro, altro], P);
    console.log('\n=== Il contrario: impulsivo all\u2019inizio, esigente alla fine ===');
    for (const k of [2, 3]) confronto(`Impulsivo (1), esigente da quando un avversario ha ${k} set`, [{ nome: `lui (impulsivo, poi esigente a ${k})`, costo: 1, volata: { set: k, costo: 4 } }, altro, altro], P);
    console.log('\n=== Contro un tavolo di esigenti (costo 4) ===');
    for (const [nome, stile] of [['impulsivo', { costo: 1 }], ['normale', { costo: 2 }], ['esigente', { costo: 4 }], ['mano 5', { costo: 2, manoMinima: 5 }], ['solo 16', { costo: 2, minPunti: 16 }]]) {
      confronto(`Lui: ${nome}`, [{ nome: `lui (${nome})`, ...stile }, esigenti, esigenti], P);
    }
  },
  regole() {
    const A = { poteri: A_ROTAZIONE };
    const normali = (n) => Array.from({ length: n }, () => ({ ...NORMALE, nome: 'gli altri (normali)' }));
    const TIPI = [['impulsivo', { costo: 1 }], ['esigente', { costo: 4 }], ['mano piena', { costo: 2, manoMinima: 5 }], ['solo set perfetti', { costo: 2, minIcone: 3 }]];
    const prova = (titolo, opzioni, n = 3) => {
      console.log(`\n--- ${titolo}`);
      const riga = [];
      for (const [nome, stile] of TIPI) riga.push(`${nome} ${pct(confronto(`${titolo}: ${nome}`, [{ nome: `lui (${nome})`, ...stile }, ...normali(n - 1)], opzioni, 2000)[`lui (${nome})`].vittorie, 1)}`);
      console.log(`  IN BREVE (alla pari ${pct(1, n)}): ${riga.join('   ')}`);
    };
    console.log('\n=== Dipende dalle regole? Uno stile diverso contro avversari normali ===');
    prova('Regole di adesso, in 3', A);
    prova('Senza poteri', {});
    prova('In 2', A, 2);
    prova('In 4', A, 4);
    prova('Si chiude al terzo set', { ...A, setPerFinire: 3 });
    prova('Si chiude al settimo set, con le formazioni che tornano negli scarti', { ...A, setPerFinire: 7, ...RIMESSE });
    prova('Tre ambizioni che combaciano valgono 20 invece di 16', { ...A, punti: [5, 7, 10, 20] });
    prova('Tre ambizioni che combaciano valgono 25', { ...A, punti: [5, 7, 10, 25] });
    prova('Scala più piatta: 5, 7, 9, 12', { ...A, punti: [5, 7, 9, 12] });
    prova('Limite di mano 4', { ...A, limiteMano: 4 });
    prova('Si pesca 1 carta invece di 2', { ...A, pescata: 1 });
  },
  varianti() {
    console.log('\n=== Varianti (poteri 15 per tipo) ===');
    esperimento('Un lavoratore su due ha un potere, in 3', 3, { poteri: META });
    for (const n of [2, 3, 4]) esperimento(`Una copia sola di ogni ambito (30 carte): in ${n}`, n, { poteri: A_ROTAZIONE, copieAmbiti: 1 });
    esperimento('In 4: chiuso un set, le sue formazioni vanno negli scarti', 4, { poteri: A_ROTAZIONE, ...RIMESSE });
    esperimento('In 4: si chiude al quarto set', 4, { poteri: A_ROTAZIONE, setPerFinire: 4 });
    esperimento('In 3: un lavoratore fermo al mercato da 3 giri viene sostituito', 3, { poteri: A_ROTAZIONE, ricambioMercato: 3 });
    esperimento('In 3: mercato con 2 lavoratori in pi\u00f9', 3, { poteri: A_ROTAZIONE, mercato: 5 });
    esperimento('In 3: limite di mano 4 invece di 6', 3, { poteri: A_ROTAZIONE, limiteMano: 4 });
  },
};

const chieste = process.argv.slice(2);
for (const [nome, parte] of Object.entries(PARTI)) if (!chieste.length || chieste.includes(nome)) parte();
