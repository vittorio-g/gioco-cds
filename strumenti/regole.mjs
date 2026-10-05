// Regole di Collocamento (REGOLAMENTO.md), per le simulazioni di strumenti/analisi.mjs.
// I tavoli online non le usano: sono liberi e non applicano regole.
//
// Un mazzo M è { lav: [{n, att}], form: [{n, cat, lav}] }: i lavoratori con le
// loro 3 ambizioni e i 30 ambiti con categoria e 3 competenze. Il mazzo degli
// ambiti ha due copie di ognuno, 60 carte: la carta c è l'ambito c % 30.
//
// I poteri stanno sui lavoratori e si attivano quando ne prendi uno con
// l'azione "Inserire un lavoratore" (dal mercato o tra quelli prenotati):
//   1  pesca 2 carte ambito
//   2  prenota un lavoratore del mercato
//   3  gioca subito fino a 2 formazioni
//   4  piazza subito un lavoratore su una tua formazione libera, ignorando una
//      delle sue ambizioni; il potere di quel lavoratore non si attiva
//
// Chi gioca è un oggetto con le scelte che le regole lasciano al giocatore:
//   scarta(s, M, p)         -> la carta da scartare quando si supera il limite di mano
//   prenota(s, M, p)        -> il lavoratore del mercato da prenotare, oppure null
//   formazione(s, M, p, n)  -> { t: 'apri' | 'migliora', c, k } oppure null; n = quante ne ha già giocate col potere
//   piazza(s, M, p)         -> { w, k } oppure null

export const PUNTI = [5, 7, 10, 16]; // per 0, 1, 2, 3 ambizioni che combaciano col lavoro

export const OPZIONI = {
  manoIniziale: 3,
  limiteMano: 6,
  pescata: 2,
  setPerFinire: 5,
  mercato: 0, // lavoratori scoperti; 0 = quanti i giocatori
  copieAmbiti: 2, // quante copie di ogni ambito ci sono nel mazzo: 2 = 60 carte
  poteri: null, // il potere di ogni lavoratore, nell'ordine del mazzo (0 = nessuno); null = nessuno ne ha
  poteriDi: null, // per misurare quanto vale un potere: funziona solo per questo giocatore (null = per tutti)
  // Varianti, non nel regolamento:
  pescaDelPotere: 2, // quante carte fa pescare il potere 1
  punti: null, // un'altra tabella dei punti al posto di 5, 7, 10, 16
  giroInPiu: true, // false: scattata la fine si chiude il giro in corso e basta
  formazioniNegliScarti: false, // chiuso un set, le sue formazioni vanno negli scarti invece di restare sul tavolo
  ricambioMercato: 0, // dopo quanti giri un lavoratore che nessuno prende viene sostituito; 0 = mai
};

// Una mossa che le regole non permettono.
export class Rifiuto extends Error {}

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
// Quante delle icone richieste non sono coperte dalle competenze.
export const mancanti = (competenze, richieste) => richieste.length - comuni(richieste, competenze);

export const ambito = (M, c) => M.form[c % M.form.length];
export const iconePila = (M, pila) => pila.form.flatMap((c) => ambito(M, c).lav);
// Il potere che il giocatore p attiva prendendo il lavoratore w.
export const poterePer = (s, p, w) => (s.o.poteri && (s.o.poteriDi == null || s.o.poteriDi === p) ? s.o.poteri[w] ?? 0 : 0);

function mescola(carte, rnd) {
  const a = [...carte];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// La fine della partita scatta una volta sola: si chiude il giro in corso e se ne gioca un altro.
function scatta(s, motivo) {
  if (!s.fine) s.fine = { motivo, giro: s.giro, da: s.turno };
}

function pescaAmbito(s, rnd) {
  if (!s.mazzoAmb.length && s.scartiAmb.length) {
    s.mazzoAmb = mescola(s.scartiAmb, rnd);
    s.scartiAmb = [];
    s.conta.rimescolate++;
  }
  if (!s.mazzoAmb.length) return null;
  const c = s.mazzoAmb.pop();
  if (!s.mazzoAmb.length) {
    if (s.scartiAmb.length) {
      s.mazzoAmb = mescola(s.scartiAmb, rnd);
      s.scartiAmb = [];
      s.conta.rimescolate++;
    } else {
      scatta(s, 'ambiti');
    }
  }
  return c;
}

function pescaLavoratore(s) {
  if (!s.mazzoLav.length) return null;
  const w = s.mazzoLav.pop();
  if (!s.mazzoLav.length) scatta(s, 'lavoratori'); // i lavoratori non hanno scarti
  return w;
}

function rifornisci(s) {
  const w = pescaLavoratore(s);
  if (w != null) s.mercato.push({ w, dal: s.giro });
}

export function nuovaPartita(M, n, opzioni = {}, rnd = Math.random) {
  const o = { ...OPZIONI, ...opzioni };
  const s = {
    o,
    n,
    giocatori: Array.from({ length: n }, () => ({ mano: [], pile: [], set: [], riserva: [], punti: 0, gettoni: {} })),
    mazzoAmb: mescola(Array.from({ length: M.form.length * o.copieAmbiti }, (_, i) => i), rnd),
    scartiAmb: [],
    mazzoLav: mescola(M.lav.map((_, i) => i), rnd),
    mercato: [], // { w, dal }: il lavoratore e il giro in cui è stato scoperto
    gettoni: { uguali: [5, 3], diverse: [5, 3] },
    turno: 0, // comincia sempre il giocatore 0
    giro: 1,
    fine: null,
    finita: false,
    conta: {
      rimescolate: 0, scartate: 0, sostituiti: 0, attesa: [[], [], [], [], []], // l'attesa al mercato, per potere del lavoratore
      poteri: [0, 0, 0, 0, 0], aVuoto: [0, 0, 0, 0, 0], formazioniDalPotere: 0,
    },
  };
  for (const g of s.giocatori) for (let i = 0; i < o.manoIniziale; i++) g.mano.push(pescaAmbito(s, rnd));
  for (let i = 0; i < (o.mercato || n); i++) rifornisci(s);
  return s;
}

export const puoPescare = (s) => s.mazzoAmb.length + s.scartiAmb.length > 0;
export const lavoratoriPer = (s, p) => [...s.mercato.map((x) => x.w), ...s.giocatori[p].riserva];

// Le azioni che il giocatore p può fare nel suo turno.
export function azioni(s, M, p) {
  const g = s.giocatori[p];
  const A = [];
  for (const c of g.mano) {
    A.push({ t: 'apri', c });
    g.pile.forEach((pila, k) => {
      A.push({ t: 'migliora', c, k });
      if (pila.lav != null && mancanti(iconePila(M, pila), ambito(M, c).lav) === 0) A.push({ t: 'completa', c, k });
    });
  }
  g.pile.forEach((pila, k) => {
    if (pila.lav != null) return;
    const icone = iconePila(M, pila);
    for (const w of lavoratoriPer(s, p)) if (mancanti(icone, M.lav[w].att) === 0) A.push({ t: 'inserisci', w, k });
  });
  if (puoPescare(s)) A.push({ t: 'pesca' });
  if (!A.length) A.push({ t: 'passa' });
  return A;
}

function togli(elenco, x, messaggio) {
  const i = elenco.indexOf(x);
  if (i < 0) throw new Rifiuto(messaggio);
  elenco.splice(i, 1);
}

// Toglie un lavoratore dal mercato, che si ripristina subito.
function dalMercato(s, w) {
  const i = s.mercato.findIndex((x) => x.w === w);
  if (i < 0) return false;
  s.conta.attesa[s.o.poteri?.[w] ?? 0].push(s.giro - s.mercato[i].dal);
  s.mercato.splice(i, 1);
  rifornisci(s);
  return true;
}

// Prende un lavoratore tra quelli prenotati dal giocatore o dal mercato.
function prendiLavoratore(s, g, w) {
  const r = g.riserva.indexOf(w);
  if (r >= 0) g.riserva.splice(r, 1);
  else if (!dalMercato(s, w)) throw new Rifiuto('Quel lavoratore non è disponibile.');
}

function giocaFormazione(s, M, g, m) {
  togli(g.mano, m.c, 'Quella carta non è nella tua mano.');
  if (m.t === 'apri') g.pile.push({ form: [m.c], lav: null });
  else if (g.pile[m.k]) g.pile[m.k].form.push(m.c);
  else throw new Rifiuto('Quella pila non c’è.');
}

// Il potere del lavoratore appena preso con l'azione "Inserire un lavoratore".
function attiva(s, M, p, w, chi, rnd) {
  const g = s.giocatori[p];
  const potere = poterePer(s, p, w);
  s.conta.poteri[potere]++;
  if (potere === 1) {
    for (let i = 0; i < s.o.pescaDelPotere; i++) {
      const c = pescaAmbito(s, rnd);
      if (c != null) g.mano.push(c);
    }
  } else if (potere === 2) {
    const x = chi.prenota(s, M, p);
    if (x != null && dalMercato(s, x)) g.riserva.push(x);
    else s.conta.aVuoto[2]++;
  } else if (potere === 3) {
    let giocate = 0;
    for (; giocate < 2; giocate++) {
      const f = chi.formazione(s, M, p, giocate);
      if (!f) break;
      giocaFormazione(s, M, g, f);
    }
    s.conta.formazioniDalPotere += giocate;
    if (!giocate) s.conta.aVuoto[3]++;
  } else if (potere === 4) {
    const f = chi.piazza(s, M, p);
    const pila = f && g.pile[f.k];
    if (pila && pila.lav == null && mancanti(iconePila(M, pila), M.lav[f.w].att) <= 1) {
      prendiLavoratore(s, g, f.w);
      pila.lav = f.w; // piazzato dal potere: il suo potere non si attiva
    } else {
      s.conta.aVuoto[4]++;
    }
  }
}

function controllaGettoni(s, g) {
  const perCategoria = {};
  for (const x of g.set) perCategoria[x.cat] = (perCategoria[x.cat] ?? 0) + 1;
  const prendi = (quale, raggiunto) => {
    if (g.gettoni[quale] || !raggiunto || !s.gettoni[quale].length) return;
    g.gettoni[quale] = s.gettoni[quale].shift();
    g.punti += g.gettoni[quale];
  };
  prendi('uguali', Object.values(perCategoria).some((n) => n >= 3));
  prendi('diverse', Object.keys(perCategoria).length >= 4);
}

// Esegue l'azione del giocatore di turno, con i poteri e il limite di mano, e passa il turno.
export function gioca(s, M, m, chi, rnd = Math.random) {
  if (s.finita) throw new Rifiuto('La partita è finita.');
  const p = s.turno;
  const g = s.giocatori[p];
  const o = s.o;

  if (m.t === 'apri' || m.t === 'migliora') {
    giocaFormazione(s, M, g, m);
  } else if (m.t === 'inserisci') {
    const pila = g.pile[m.k];
    if (!pila || pila.lav != null) throw new Rifiuto('Quella formazione non è libera.');
    if (mancanti(iconePila(M, pila), M.lav[m.w].att) > 0) throw new Rifiuto('La formazione non copre le ambizioni del lavoratore.');
    prendiLavoratore(s, g, m.w);
    pila.lav = m.w;
    attiva(s, M, p, m.w, chi, rnd);
  } else if (m.t === 'completa') {
    const pila = g.pile[m.k];
    if (!pila || pila.lav == null) throw new Rifiuto('Su quella pila non c’è un lavoratore.');
    const lavoro = ambito(M, m.c);
    if (mancanti(iconePila(M, pila), lavoro.lav) > 0) throw new Rifiuto('La formazione non copre le icone del lavoro.');
    togli(g.mano, m.c, 'Quella carta non è nella tua mano.');
    g.pile.splice(m.k, 1);
    const icone = comuni(M.lav[pila.lav].att, lavoro.lav);
    const punti = (o.punti ?? PUNTI)[icone];
    g.set.push({ form: pila.form, lav: pila.lav, lavoro: m.c, icone, punti, cat: lavoro.cat });
    g.punti += punti;
    if (o.formazioniNegliScarti) s.scartiAmb.push(...pila.form);
    controllaGettoni(s, g);
    if (g.set.length >= o.setPerFinire) scatta(s, 'set');
  } else if (m.t === 'pesca') {
    if (!puoPescare(s)) throw new Rifiuto('Non ci sono carte da pescare.');
    for (let i = 0; i < o.pescata; i++) {
      const c = pescaAmbito(s, rnd);
      if (c != null) g.mano.push(c);
    }
  } else if (m.t !== 'passa') {
    throw new Rifiuto('Azione sconosciuta.');
  }

  // Il limite di mano è l'ultima cosa del turno.
  while (g.mano.length > o.limiteMano) {
    const c = chi.scarta(s, M, p);
    togli(g.mano, c, 'Quella carta non è nella tua mano.');
    s.scartiAmb.push(c);
    s.conta.scartate++;
  }

  s.turno = (s.turno + 1) % s.n;
  if (s.turno === 0) {
    if (s.fine && s.giro >= s.fine.giro + (o.giroInPiu ? 1 : 0)) {
      s.finita = true;
      return;
    }
    s.giro++;
    // Variante: i lavoratori rimasti troppo a lungo al mercato si cambiano.
    if (o.ricambioMercato) {
      for (const x of s.mercato) {
        if (s.giro - x.dal < o.ricambioMercato || !s.mazzoLav.length) continue;
        s.mazzoLav.unshift(x.w);
        x.w = s.mazzoLav.pop();
        x.dal = s.giro;
        s.conta.sostituiti++;
      }
    }
  }
}

// Quanti turni ha ancora il giocatore di turno, compreso quello in corso, da quando la fine è scattata.
export function turniRimasti(s) {
  return s.fine ? s.fine.giro + (s.o.giroInPiu ? 1 : 0) - s.giro + 1 : Infinity;
}

export function classifica(s) {
  return s.giocatori.map((g, i) => ({ i, punti: g.punti, set: g.set.length })).sort((a, b) => b.punti - a.punti);
}
