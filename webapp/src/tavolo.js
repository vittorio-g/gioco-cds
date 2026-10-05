// Il tavolo libero: carte, mazzi, mani e scarti, senza nessuna regola di gioco.
// I mazzi sono due: i lavoratori ('lav') e gli ambiti ('for'), cioè le carte che
// si giocano come formazione o come lavoro.
// Chiunque può pescare, giocare, spostare, girare e scartare quando vuole,
// come attorno a un tavolo vero. Nessun I/O: lo usano il Worker e le prove.
//
// Un mazzo M è { lav: [{n, att, nome}], form: [{n, lav, nome}] }; il nome può mancare.

export const TAVOLO = { l: 1600, a: 900 };
export const CARTA = { l: 126, a: 176 };
const TIPI = ['lav', 'for'];
const NOME_MAZZO = { lav: 'dei lavoratori', for: 'degli ambiti' };

// Una richiesta che non si può eseguire: il testo va mostrato al giocatore.
export class Rifiuto extends Error {
  constructor(testo, codice = null) {
    super(testo);
    this.codice = codice;
  }
}

function mescola(carte, rnd) {
  const a = [...carte];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nota(st, g, testo) {
  st.log.push({ g, testo });
  if (st.log.length > 80) st.log.shift();
}

// Mescola tutto e distribuisce le carte iniziali. Il numero pubblico di una
// carta è la sua posizione in un elenco mescolato a ogni partita, così non
// dice niente su quale carta sia.
function prepara(st, M, rnd) {
  st.carte = mescola([
    ...M.lav.map((_, i) => ({ t: 'lav', i })),
    ...M.form.map((_, i) => ({ t: 'for', i })),
  ], rnd);
  st.mazzi = { lav: [], for: [] };
  st.carte.forEach((c, id) => st.mazzi[c.t].push(id));
  st.scarti = { lav: [], for: [] };
  st.tavolo = [];
  for (const g of st.giocatori) {
    g.punti = 0;
    g.mano = [];
    for (const t of TIPI) for (let k = 0; k < st.iniziali[t]; k++) g.mano.push(st.mazzi[t].pop());
  }
}

export function nuovoTavolo(M, nomi, iniziali = { lav: 2, for: 2 }, rnd = Math.random) {
  const st = { iniziali, giocatori: nomi.map((nome) => ({ nome, punti: 0, mano: [] })), log: [] };
  prepara(st, M, rnd);
  nota(st, -1, `Carte distribuite: ${iniziali.lav} lavoratori e ${iniziali.for} ambiti a testa.`);
  return st;
}

export function aggiungiGiocatore(st, nome) {
  st.giocatori.push({ nome, punti: 0, mano: [] });
  nota(st, -1, `${nome} si siede al tavolo.`);
}

const terna = (t) => t.join(' ');

function descrivi(st, M, id) {
  const c = st.carte[id];
  if (c.t === 'lav') {
    const l = M.lav[c.i];
    return `${l.nome ?? `il lavoratore ${l.n}`} (${terna(l.att)})`;
  }
  const a = M.form[c.i];
  return a.nome ? `l’ambito ${a.nome} (${terna(a.lav)})` : `l’ambito ${terna(a.lav)}`;
}

function posto(x, y) {
  const dentro = (v, max) => Math.round(Math.min(max, Math.max(0, Number(v) || 0)));
  return { x: dentro(x, TAVOLO.l - CARTA.l), y: dentro(y, TAVOLO.a - CARTA.a) };
}

// Toglie una carta dalla mano del giocatore o dal tavolo.
function stacca(st, p, id) {
  const mano = st.giocatori[p].mano;
  let i = mano.indexOf(id);
  if (i >= 0) {
    mano.splice(i, 1);
    return { da: 'mano', coperta: true };
  }
  i = st.tavolo.findIndex((c) => c.id === id);
  if (i < 0) throw new Rifiuto('Quella carta non è più lì.');
  const [c] = st.tavolo.splice(i, 1);
  return { da: 'tavolo', coperta: c.coperta };
}

const sulTavolo = (st, id) => {
  const c = st.tavolo.find((x) => x.id === id);
  if (!c) throw new Rifiuto('Quella carta non è più sul tavolo.');
  return c;
};

function cima(st, pila, messaggio) {
  if (!pila.length) throw new Rifiuto(messaggio);
  return pila.pop();
}

// Esegue un'azione del giocatore p. Restituisce true se è solo un
// trascinamento in corso (da non salvare né scrivere in cronaca).
export function esegui(st, M, p, op, rnd = Math.random) {
  const g = st.giocatori[p];
  if (!g) throw new Rifiuto('Non sei seduto al tavolo.');
  const m = op.m === 'lav' ? 'lav' : 'for';

  switch (op.o) {
    case 'pesca':
      g.mano.push(cima(st, st.mazzi[m], 'Quel mazzo è finito.'));
      nota(st, p, m === 'lav' ? 'pesca un lavoratore.' : 'pesca un ambito.');
      return false;
    case 'dalMazzo':
      st.tavolo.push({ id: cima(st, st.mazzi[m], 'Quel mazzo è finito.'), ...posto(op.x, op.y), coperta: true });
      nota(st, p, `mette sul tavolo, coperta, la prima carta del mazzo ${NOME_MAZZO[m]}.`);
      return false;
    case 'mescola':
      st.mazzi[m] = mescola(st.mazzi[m], rnd);
      nota(st, p, `mescola il mazzo ${NOME_MAZZO[m]}.`);
      return false;
    case 'rimescola':
      if (!st.scarti[m].length) throw new Rifiuto('Non ci sono scarti da rimescolare.');
      st.mazzi[m] = mescola([...st.mazzi[m], ...st.scarti[m]], rnd);
      st.scarti[m] = [];
      nota(st, p, `rimescola gli scarti nel mazzo ${NOME_MAZZO[m]}.`);
      return false;
    case 'ripesca': {
      const id = cima(st, st.scarti[m], 'Non ci sono scarti.');
      g.mano.push(id);
      nota(st, p, `riprende dagli scarti ${descrivi(st, M, id)}.`);
      return false;
    }
    case 'dagliScarti': {
      const id = cima(st, st.scarti[m], 'Non ci sono scarti.');
      st.tavolo.push({ id, ...posto(op.x, op.y), coperta: false });
      nota(st, p, `rimette sul tavolo dagli scarti ${descrivi(st, M, id)}.`);
      return false;
    }
    case 'gioca': {
      const i = g.mano.indexOf(op.c);
      if (i < 0) throw new Rifiuto('Quella carta non è nella tua mano.');
      g.mano.splice(i, 1);
      st.tavolo.push({ id: op.c, ...posto(op.x, op.y), coperta: !!op.coperta });
      nota(st, p, op.coperta ? 'mette sul tavolo una carta coperta.' : `mette sul tavolo ${descrivi(st, M, op.c)}.`);
      return false;
    }
    case 'sposta':
    case 'trascina': {
      const c = sulTavolo(st, op.c);
      Object.assign(c, posto(op.x, op.y));
      st.tavolo.splice(st.tavolo.indexOf(c), 1);
      st.tavolo.push(c); // la carta mossa finisce sopra le altre
      return op.o === 'trascina';
    }
    case 'sotto': {
      const c = sulTavolo(st, op.c);
      st.tavolo.splice(st.tavolo.indexOf(c), 1);
      st.tavolo.unshift(c);
      return false;
    }
    case 'gira': {
      // senza altro la carta si gira; con op.coperta si dice da che parte deve finire
      const c = sulTavolo(st, op.c);
      const prima = c.coperta;
      c.coperta = typeof op.coperta === 'boolean' ? op.coperta : !c.coperta;
      if (c.coperta !== prima) nota(st, p, c.coperta ? 'copre una carta sul tavolo.' : `scopre ${descrivi(st, M, op.c)}.`);
      return false;
    }
    case 'prendi': {
      const c = sulTavolo(st, op.c);
      st.tavolo.splice(st.tavolo.indexOf(c), 1);
      g.mano.push(op.c);
      nota(st, p, c.coperta ? 'prende in mano una carta coperta dal tavolo.' : `prende in mano ${descrivi(st, M, op.c)}.`);
      return false;
    }
    case 'scarta': {
      const { da } = stacca(st, p, op.c);
      st.scarti[st.carte[op.c].t].push(op.c);
      nota(st, p, `scarta ${da === 'mano' ? 'dalla mano' : 'dal tavolo'} ${descrivi(st, M, op.c)}.`);
      return false;
    }
    case 'rimetti': {
      const { da } = stacca(st, p, op.c);
      const t = st.carte[op.c].t;
      if (op.fondo) st.mazzi[t].unshift(op.c);
      else st.mazzi[t].push(op.c);
      nota(st, p, `rimette una carta ${da === 'mano' ? 'dalla mano' : 'dal tavolo'} ${op.fondo ? 'in fondo al' : 'in cima al'} mazzo ${NOME_MAZZO[t]}.`);
      return false;
    }
    case 'punti': {
      const chi = Number.isInteger(op.g) ? st.giocatori[op.g] : null;
      if (!chi) throw new Rifiuto('Quel giocatore non c’è.');
      const prima = chi.punti;
      chi.punti = Math.max(0, Math.min(999, Number.isFinite(op.v) ? Math.round(op.v) : prima + (Math.round(op.d) || 0)));
      // più ritocchi di fila agli stessi punti stanno in una riga sola
      const ultima = st.log.at(-1);
      const testo = `porta ${op.g === p ? 'i suoi punti' : `i punti di ${chi.nome}`} a ${chi.punti}.`;
      if (ultima && ultima.g === p && ultima.punti === op.g) ultima.testo = testo;
      else {
        nota(st, p, testo);
        st.log.at(-1).punti = op.g;
      }
      return false;
    }
    case 'molte': {
      // più azioni in un colpo solo, per un gruppo di carte scelte insieme
      const ops = Array.isArray(op.ops) ? op.ops : [];
      if (!ops.length || ops.length > 120 || ops.some((x) => !x || x.o === 'molte' || x.o === 'nuova')) throw new Rifiuto('Azione sconosciuta.');
      let soloTrascinate = true;
      for (const una of ops) soloTrascinate = esegui(st, M, p, una, rnd) && soloTrascinate;
      return soloTrascinate;
    }
    case 'nuova':
      prepara(st, M, rnd);
      st.log = [];
      nota(st, p, 'rimette tutto nei mazzi, mescola e ridistribuisce le carte.');
      return false;
    default:
      throw new Rifiuto('Azione sconosciuta.');
  }
}

// Quello che il giocatore p può vedere: la sua mano, le carte scoperte, e
// delle altre solo il dorso. p = -1 per chi guarda senza essere seduto.
export function vista(st, M, p) {
  const faccia = (id) => {
    const c = st.carte[id];
    return c.t === 'lav' ? { id, t: 'lav', n: M.lav[c.i].n, att: M.lav[c.i].att } : { id, t: 'for', n: M.form[c.i].n, lav: M.form[c.i].lav };
  };
  const pila = (ids) => ({ n: ids.length, cima: ids.length ? faccia(ids.at(-1)) : null });
  return {
    io: p,
    giocatori: st.giocatori.map((g) => ({
      nome: g.nome,
      punti: g.punti,
      lav: g.mano.filter((id) => st.carte[id].t === 'lav').length,
      for: g.mano.filter((id) => st.carte[id].t === 'for').length,
    })),
    mano: st.giocatori[p] ? st.giocatori[p].mano.map(faccia) : [],
    mazzi: { lav: st.mazzi.lav.length, for: st.mazzi.for.length },
    scarti: { lav: pila(st.scarti.lav), for: pila(st.scarti.for) },
    tavolo: st.tavolo.map((c) => ({ ...(c.coperta ? { id: c.id, t: st.carte[c.id].t } : faccia(c.id)), x: c.x, y: c.y, coperta: c.coperta })),
    log: st.log.map(({ g, testo }) => ({ g, testo })),
  };
}
