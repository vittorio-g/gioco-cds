// Regole di Collocamento, per le simulazioni (strumenti/analisi.mjs).
// La webapp non le usa: il tavolo online è libero e non applica regole.
//
// Ci sono due mazzi: i lavoratori (3 attitudini) e le carte lavoro/formazione
// (una terna di icone). Un mazzo M è { lav: [{n, att}], form: [{n, lav}] } e
// le carte sono indici in quei due elenchi.

export const SIMBOLI = ['MA', 'DI', 'CO', 'OR', 'CL', 'AN', 'CR', 'CD', 'RI', 'ST'];
export const BASE = 5;
export const PREMIO = [0, 3, 7, 12];

// Una richiesta che le regole non permettono: il testo va mostrato al giocatore.
export class Rifiuto extends Error {
  constructor(testo, codice = null) {
    super(testo);
    this.codice = codice;
  }
}

export const OPZIONI = {
  mazzo: 'v3',
  attitudiniNelRequisito: false, // le attitudini contano anche per coprire il lavoro
  premioOspite: 0, // carte fisse in piu' per chi ospita, oltre a 1 per attitudine
  occupatiPerFinire: 0, // 0 = automatico in base al numero di giocatori
  manoLavoratori: 2,
  manoCarte: 2,
};

export function occupatiPerFinire(nGiocatori) {
  return { 2: 5, 3: 4, 4: 3 }[nGiocatori] ?? 3;
}

function righe(csv) {
  return csv.trim().split(/\r?\n/).slice(1).map((r) => r.split(',').map((x) => x.trim()));
}
export const leggiLavoratori = (csv) => righe(csv).map(([n, ...att]) => ({ n, att }));
export const leggiLavori = (csv) => righe(csv).map(([n, ...lav]) => ({ n, lav }));

// Icone che combaciano una per una (intersezione di multinsiemi).
export function comuni(a, b) {
  const resto = [...b];
  let n = 0;
  for (const s of a) {
    const i = resto.indexOf(s);
    if (i >= 0) {
      resto.splice(i, 1);
      n++;
    }
  }
  return n;
}

// Icone del lavoro che le competenze non coprono.
export function mancanti(competenze, lavoro) {
  return lavoro.length - comuni(lavoro, competenze);
}

export function competenze(M, colonna, opzioni) {
  const c = colonna.form.flatMap((f) => M.form[f].lav);
  return opzioni.attitudiniNelRequisito ? c.concat(M.lav[colonna.lav].att) : c;
}

function mescola(carte, rnd) {
  const a = [...carte];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function nuovaPartita(M, nomi, opzioni = {}, rnd = Math.random) {
  const o = { ...OPZIONI, ...opzioni };
  const s = {
    opzioni: o,
    soglia: o.occupatiPerFinire || occupatiPerFinire(nomi.length),
    giocatori: nomi.map((nome) => ({
      nome, lavoratori: [], carte: [], libere: [], colonne: [], occupati: [], punti: 0, credito: 0,
    })),
    mazzoLav: mescola(M.lav.map((_, i) => i), rnd),
    mazzoFor: mescola(M.form.map((_, i) => i), rnd),
    scarti: [],
    primo: Math.floor(rnd() * nomi.length),
    turno: 0,
    giro: 1,
    attesa: 'gioca', // il giocatore di turno deve 'gioca' una carta, poi 'pesca'
    fase: 'gioco',
    chiusura: null,
    log: [],
  };
  s.turno = s.primo;
  for (const g of s.giocatori) {
    for (let i = 0; i < o.manoLavoratori; i++) g.lavoratori.push(s.mazzoLav.pop());
    for (let i = 0; i < o.manoCarte; i++) g.carte.push(s.mazzoFor.pop());
  }
  nota(s, -1, `Comincia ${s.giocatori[s.primo].nome}.`);
  return s;
}

function nota(s, g, testo) {
  s.log.push({ g, testo });
  if (s.log.length > 60) s.log.shift();
}

const pescabile = (s, quale) => (quale === 'lav' ? s.mazzoLav.length > 0 : s.mazzoFor.length + s.scarti.length > 0);

function pesca(s, p, quale, rnd) {
  const g = s.giocatori[p];
  if (quale === 'lav') {
    if (!s.mazzoLav.length) return false;
    g.lavoratori.push(s.mazzoLav.pop());
    return true;
  }
  if (!s.mazzoFor.length && s.scarti.length) {
    s.mazzoFor = mescola(s.scarti, rnd);
    s.scarti = [];
    nota(s, -1, 'Il mazzo dei lavori è finito: si rimescolano gli scarti.');
  }
  if (!s.mazzoFor.length) return false;
  g.carte.push(s.mazzoFor.pop());
  return true;
}

const formazioniLibere = (s) => s.giocatori.some((g) => g.libere.length > 0);
const puoGiocare = (s, p) => s.giocatori[p].carte.length > 0 || (s.giocatori[p].lavoratori.length > 0 && formazioniLibere(s));

function passa(s) {
  s.turno = (s.turno + 1) % s.giocatori.length;
  s.attesa = 'gioca';
  if (s.turno === s.primo) {
    if (s.chiusura) s.fase = 'finita';
    else s.giro++;
  }
}

// Salta i passi che il giocatore di turno non può fare: chi non ha carte
// giocabili pesca soltanto, chi non può pescare passa.
function sistema(s) {
  for (let salti = 0; s.fase === 'gioco'; salti++) {
    if (salti > 2 * s.giocatori.length) {
      s.fase = 'finita'; // nessuno può più giocare né pescare
      return;
    }
    if (s.attesa === 'gioca') {
      if (puoGiocare(s, s.turno)) return;
      nota(s, s.turno, 'non può giocare nessuna carta: pesca soltanto.');
      s.attesa = 'pesca';
    }
    if (pescabile(s, 'lav') || pescabile(s, 'for')) return;
    passa(s);
  }
}

const terna = (t) => t.join(' ');
const carteN = (n) => `${n} ${n === 1 ? 'carta' : 'carte'}`;

export function mosseLegali(s, M, p) {
  const g = s.giocatori[p];
  if (s.fase !== 'gioco' || !g) return [];
  const mosse = [];
  const pescate = () => {
    for (const quale of ['lav', 'for']) if (pescabile(s, quale)) mosse.push({ t: 'pesca', m: quale });
  };
  if (g.credito > 0) pescate();
  if (s.turno !== p) return mosse;
  if (s.attesa === 'pesca') {
    if (!g.credito) pescate();
    return mosse;
  }
  for (const c of g.lavoratori) {
    s.giocatori.forEach((h, di) => {
      for (const f of h.libere) {
        const premio = di === p ? 0 : comuni(M.lav[c].att, M.form[f].lav) + s.opzioni.premioOspite;
        mosse.push({ t: 'entra', c, di, f, pesca: premio });
      }
    });
  }
  for (const c of g.carte) {
    mosse.push({ t: 'apri', c });
    for (const col of g.colonne) {
      mosse.push({ t: 'forma', c, col: col.lav });
      if (mancanti(competenze(M, col, s.opzioni), M.form[c].lav) === 0) {
        const icone = comuni(M.lav[col.lav].att, M.form[c].lav);
        mosse.push({ t: 'lavora', c, col: col.lav, icone, punti: BASE + PREMIO[icone] });
      }
    }
  }
  return mosse;
}

function togli(elenco, carta, messaggio) {
  const i = elenco.indexOf(carta);
  if (i < 0) throw new Rifiuto(messaggio);
  elenco.splice(i, 1);
}

// Esegue una mossa del giocatore p. Nel suo turno gioca una carta, poi pesca
// dal mazzo che sceglie. Chi ha ospitato un lavoratore pesca quando vuole.
export function applica(s, M, p, m, rnd = Math.random) {
  if (s.fase !== 'gioco') throw new Rifiuto('La partita non è in corso.');
  const g = s.giocatori[p];
  if (!g) throw new Rifiuto('Non sei al tavolo.');

  if (m.t === 'pesca') {
    const quale = m.m === 'lav' ? 'lav' : 'for';
    const premio = g.credito > 0;
    if (!premio && !(s.turno === p && s.attesa === 'pesca')) throw new Rifiuto('Ora non devi pescare.');
    if (!pesca(s, p, quale, rnd)) throw new Rifiuto('Quel mazzo è finito.');
    if (premio) {
      g.credito--;
      if (!pescabile(s, 'lav') && !pescabile(s, 'for')) g.credito = 0;
    } else {
      passa(s);
    }
    sistema(s);
    if (s.fase === 'finita') nota(s, -1, 'Partita finita.');
    return;
  }

  if (s.turno !== p) throw new Rifiuto('Non è il tuo turno.');
  if (s.attesa !== 'gioca') throw new Rifiuto('Hai già giocato: ora pesca una carta.');

  if (m.t === 'entra') {
    const padrone = s.giocatori[m.di];
    if (!padrone || !padrone.libere.includes(m.f)) throw new Rifiuto('Quella formazione non è più libera.');
    togli(g.lavoratori, m.c, 'Quel lavoratore non è nella tua mano.');
    togli(padrone.libere, m.f);
    // Il lavoratore va sulla formazione e resta lì: la colonna è di chi l'ha mandato.
    g.colonne.push({ lav: m.c, form: [m.f], presso: m.di });
    const lavoratore = M.lav[m.c];
    const chi = `il lavoratore ${lavoratore.n} (${terna(lavoratore.att)})`;
    if (m.di === p) {
      nota(s, p, `mette ${chi} sulla sua formazione ${terna(M.form[m.f].lav)}.`);
    } else {
      const icone = comuni(lavoratore.att, M.form[m.f].lav);
      const premio = icone + s.opzioni.premioOspite;
      padrone.credito += premio;
      nota(
        s,
        p,
        `manda ${chi} da ${padrone.nome}, sulla formazione ${terna(M.form[m.f].lav)}: ` +
          `${icone} ${icone === 1 ? 'attitudine combacia' : 'attitudini combaciano'}, ` +
          `${padrone.nome} pesca ${carteN(premio)}.`,
      );
    }
  } else if (m.t === 'apri') {
    togli(g.carte, m.c, 'Quella carta non è nella tua mano.');
    g.libere.push(m.c);
    nota(s, p, `apre la formazione ${terna(M.form[m.c].lav)}.`);
  } else if (m.t === 'forma' || m.t === 'lavora') {
    const col = g.colonne.find((x) => x.lav === m.col);
    if (!col) throw new Rifiuto('Quel lavoratore non è tuo.');
    if (!g.carte.includes(m.c)) throw new Rifiuto('Quella carta non è nella tua mano.');
    const lavoratore = M.lav[col.lav];
    const carta = M.form[m.c];
    if (m.t === 'forma') {
      togli(g.carte, m.c);
      col.form.push(m.c);
      nota(s, p, `aggiunge la formazione ${terna(carta.lav)} al lavoratore ${lavoratore.n}.`);
    } else {
      if (mancanti(competenze(M, col, s.opzioni), carta.lav) > 0) {
        throw new Rifiuto('Le competenze del lavoratore non coprono tutte le icone del lavoro.');
      }
      const icone = comuni(lavoratore.att, carta.lav);
      const punti = BASE + PREMIO[icone];
      togli(g.carte, m.c);
      g.colonne.splice(g.colonne.indexOf(col), 1);
      g.occupati.push({ lav: col.lav, lavoro: m.c, icone, punti, form: col.form.length });
      g.punti += punti;
      s.scarti.push(...col.form);
      nota(
        s,
        p,
        `manda a lavorare il lavoratore ${lavoratore.n} (${terna(lavoratore.att)}) ` +
          `come ${terna(carta.lav)}: ${punti} punti.`,
      );
      if (!s.chiusura && g.occupati.length >= s.soglia) {
        s.chiusura = { da: p };
        nota(s, -1, `${g.nome} ha ${s.soglia} occupati: si chiude il giro e la partita finisce.`);
      }
    }
  } else {
    throw new Rifiuto('Mossa sconosciuta.');
  }

  s.attesa = 'pesca';
  sistema(s);
  if (s.fase === 'finita') nota(s, -1, 'Partita finita.');
}

// Classifica finale: punti, poi numero di lavoratori da 17.
export function classifica(s) {
  return s.giocatori
    .map((g, i) => ({
      i,
      nome: g.nome,
      punti: g.punti,
      occupati: g.occupati.length,
      perfetti: g.occupati.filter((o) => o.icone === 3).length,
    }))
    .sort((a, b) => b.punti - a.punti || b.perfetti - a.perfetti);
}

// Quello che il giocatore p può vedere. Le carte in mano agli altri e i mazzi
// sono coperti: se ne conosce solo il numero. p = -1 per uno spettatore.
// Ogni colonna compare nella zona del giocatore che ha aperto la formazione.
export function vista(s, M, p) {
  const lavoratore = (id) => ({ id, n: M.lav[id].n, att: M.lav[id].att });
  const carta = (id) => ({ id, lav: M.form[id].lav });
  const tutte = s.giocatori.flatMap((g, di) => g.colonne.map((c) => ({ c, di })));
  return {
    fase: s.fase,
    turno: s.turno,
    attesa: s.attesa,
    giro: s.giro,
    chiusura: s.chiusura,
    soglia: s.soglia,
    opzioni: s.opzioni,
    io: p,
    mazzi: { lav: s.mazzoLav.length, for: s.mazzoFor.length, scarti: s.scarti.length },
    giocatori: s.giocatori.map((g, i) => ({
      nome: g.nome,
      punti: g.punti,
      credito: g.credito,
      mano: { lavoratori: g.lavoratori.length, carte: g.carte.length },
      lavoratori: i === p ? g.lavoratori.map(lavoratore) : null,
      carte: i === p ? g.carte.map(carta) : null,
      libere: g.libere.map(carta),
      colonne: tutte
        .filter(({ c }) => c.presso === i)
        .map(({ c, di }) => ({ di, lav: lavoratore(c.lav), form: c.form.map(carta), comp: competenze(M, c, s.opzioni) })),
      occupati: g.occupati.map((o) => ({
        lav: lavoratore(o.lav),
        lavoro: M.form[o.lavoro].lav,
        icone: o.icone,
        punti: o.punti,
      })),
    })),
    mosse: mosseLegali(s, M, p),
    classifica: s.fase === 'finita' ? classifica(s) : null,
    log: s.log,
  };
}
