// Mercato del Lavoro, prototipo v0.1: un modello della partita.
//
// È un gioco di destrezza: le regole non dicono quanto è grande la pedana, che forma hanno i pezzi,
// quanto spesso cade qualcosa. Qui queste cose sono numeri in FISICA, scelti a occhio. Il modello serve
// a due cose: contare quello che dipende solo dalle regole (meeple, pezzi, punti), e vedere quali
// conclusioni reggono quando i numeri della fisica cambiano. I valori assoluti non sono previsioni.
//
// L'unità di tempo è il "gesto": prendere un componente dal centro e posarlo.

export const REGOLE = {
  meeple: 25,
  pezziPerTipo: 15,
  tipi: 5,
  carte: 30,
  mazzo: 'terne e coppie', // le 10 terne di simboli diversi + le 20 "due uguali e uno diverso"; 'tutte' aggiunge i 5 tris; 'a caso'
  puntiCarta: 1,
  bonus: [3, 2, 1],
  bonusASedeVuota: true, // alla lettera anche una Sede vuota è "la seconda più alta"
  penalita: 1,
  penalitaMassima: Infinity,
  penalitaChiamata: 0, // variante: punti persi per una chiamata errata
  meeplePersonali: 0, // variante: ognuno ha i suoi meeple invece del mucchio comune
  fineAlPrimo: false, // con i meeple personali: la partita finisce col round in cui qualcuno posa il suo ultimo meeple
  fineDopoCarte: 0, // variante: la partita finisce dopo tante carte assegnate
  unMeeplePerRound: false, // variante: non più di un meeple a testa per round
};

export const FISICA = {
  sigma: 0.3, // quanto variano i tempi da un gesto all'altro (log-normale)
  reazione: 0.6, // gesti per leggere la carta e decidere
  K: 3, // quanti meeple possono toccare lo stesso pezzo
  riusoMax: 2, // quanti pezzi già posati può toccare insieme un meeple nuovo
  costoRiuso: 0.35, // gesti in più per infilare il meeple contro un pezzo già posato
  ultimoDifficile: 1, // quanto è più lungo e rischioso posare il meeple per ultimo, tra i pezzi
  postiATerra: 12, // componenti che stanno sulla pedana senza salire
  restringe: 0.7, // ogni piano tiene il 70% di quello sotto
  lentoFolla: 0.5, // un piano pieno rallenta i gesti del 50%
  lentoLivello: 0.15, // ogni piano più su li rallenta del 15%
  p0: 0.02, // probabilità che un gesto normale, a terra, sulla pedana vuota, urti qualcosa
  pLivello: 0.6, // ogni piano più su: +60%
  pFolla: 1, // piano pieno: il doppio
  pStretto: 2, // posare sopra un solo componente: il triplo
  pIncastro: 1.5, // infilare il meeple tra pezzi già posati
  gamma: 2, // chi va il 20% più veloce urta il 44% più spesso
  fuori0: 0.35, // un componente urtato a terra esce dalla pedana il 35% delle volte
  fuoriLivello: 0.2, // +20% per ogni piano da cui cade
  errore: 0.03, // chiamate errate
  misuraFine: 0, // 0: due Sedi con gli stessi piani sono alte uguali e decide lo spareggio. 0.9: si misura al millimetro, e tra Sedi con gli stessi piani la più alta è una a caso
  quasi: 0.25, // gesti: sotto questa distanza due chiamate sono "insieme"
  tempoMassimo: 40, // gesti: oltre, il round è fermo
};

export const STILE = {
  velocita: 1, // abilità: divide i tempi
  mano: 1, // abilità: divide gli urti
  fretta: 1, // scelta: divide i tempi, moltiplica urti ed errori
  ordine: 'prima', // 'prima': meeple, poi i pezzi (come nell'esempio del regolamento). 'ultimo': prima i pezzi
  riusa: true,
  sale: 0, // probabilità di costruire un piano più su anche quando sotto c'è posto
  torre: 0, // > 0: non gioca le carte, impila pezzi in una torre larga tanto
  fermo: false, // non fa niente
  chiude: false, // quando è in testa brucia i meeple per far finire la partita
  rinuncia: 0, // > 0: non tenta la carta se il rischio per gesto supera questa soglia
};

export function casuale(seme) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const normale = (rnd) => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
const logn = (sigma, rnd) => Math.exp(sigma * normale(rnd));

export function mazzo(R, rnd) {
  const carte = [];
  const T = R.tipi;
  if (R.mazzo === 'a caso') {
    for (let i = 0; i < R.carte; i++) carte.push([0, 0, 0].map(() => Math.floor(rnd() * T)).sort());
  } else {
    for (let a = 0; a < T; a++) for (let b = a + 1; b < T; b++) for (let c = b + 1; c < T; c++) carte.push([a, b, c]);
    for (let a = 0; a < T; a++) for (let b = 0; b < T; b++) if (a !== b) carte.push([a, a, b]);
    if (R.mazzo === 'tutte') for (let a = 0; a < T; a++) carte.push([a, a, a]);
  }
  for (let i = carte.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [carte[i], carte[j]] = [carte[j], carte[i]];
  }
  return carte.slice(0, R.carte);
}

// ---- La Sede: ogni componente sta a un piano. Un piano tiene un certo numero di componenti,
// e ognuno poggia su uno del piano sotto.
const capienza = (F, L) => Math.max(1, Math.floor(F.postiATerra * F.restringe ** L));

function piani(sede) {
  const n = [];
  for (const c of sede.comp) {
    while (n.length <= c.liv) n.push(0);
    n[c.liv]++;
  }
  return n;
}

const haPosto = (F, n, L) => (n[L] || 0) < capienza(F, L) && (L === 0 || (n[L] || 0) + 1 <= (n[L - 1] || 0));

function primoLibero(F, n) {
  for (let L = 0; ; L++) if (haPosto(F, n, L)) return L;
}

function stacca(c) {
  if (c.k === 'p') {
    for (const v of c.vicini) v.vicini.delete(c);
    c.vicini.clear();
    c.tocca = 0;
  } else {
    for (const p of c.pezzi) p.tocca = Math.max(0, p.tocca - 1);
    c.pezzi = [];
  }
}

// Un urto al piano liv: un componente di quel piano o di quello sotto si sposta. Può uscire dalla pedana
// (-1 punto) o restarci, a terra. Quello che gli stava sopra e non ha più appoggio viene giù.
function cade(sede, liv, F, rnd) {
  const giu = [];
  const butta = (c) => {
    giu.push(c);
    stacca(c);
    const esce = rnd() < Math.min(0.95, F.fuori0 + F.fuoriLivello * c.liv);
    const aTerra = sede.comp.filter((x) => x.liv === 0).length;
    if (esce || (c.liv > 0 && aTerra >= capienza(F, 0))) {
      sede.comp.splice(sede.comp.indexOf(c), 1);
      sede.caduti++;
      c.fuori = true;
    } else c.liv = 0;
  };
  const vicino = sede.comp.filter((c) => c.liv === liv || c.liv === liv - 1);
  if (!vicino.length) return giu;
  butta(vicino[Math.floor(rnd() * vicino.length)]);
  for (;;) {
    const n = piani(sede);
    let L = 1;
    while (L < n.length && n[L] <= n[L - 1]) L++;
    if (L >= n.length) break;
    const sopra = sede.comp.filter((c) => c.liv === L);
    butta(sopra[Math.floor(rnd() * sopra.length)]);
  }
  return giu;
}

function rischio(g, liv, incastro, F) {
  const n = piani(g.sede);
  const pieno = (n[liv] || 0) / capienza(F, liv);
  const stretto = liv > 0 ? F.pStretto / Math.max(1, n[liv - 1] || 0) : 0;
  return Math.min(0.9, ((F.p0 * g.stile.fretta ** F.gamma) / g.stile.mano) * (1 + F.pLivello * liv) * (1 + F.pFolla * pieno) * (1 + stretto) * (incastro ? F.pIncastro : 1));
}

function durata(g, liv, extra, F, rnd) {
  const n = piani(g.sede);
  const pieno = (n[liv] || 0) / capienza(F, liv);
  return (logn(F.sigma, rnd) * (1 + F.lentoFolla * pieno) * (1 + F.lentoLivello * liv) * extra) / (g.stile.velocita * g.stile.fretta);
}

// Sceglie come coprire i tre simboli: più pezzi già posati riesce a riusare, meno gesti servono.
function pianifica(g, carta, ctx) {
  const { F, centro, rnd } = ctx;
  const n = piani(g.sede);
  const raggiungibile = (p) => p.k === 'p' && p.tocca < F.K && (haPosto(F, n, p.liv) || haPosto(F, n, p.liv + 1));
  const pezzi = g.sede.comp.filter(raggiungibile);
  const delTipo = (t) => pezzi.filter((p) => p.tipo === t);
  const scelte = [];
  if (g.stile.riusa) {
    if (F.riusoMax >= 3) {
      for (const p of delTipo(carta[0])) for (const q of p.vicini) for (const r of q.vicini) {
        if (q.tipo === carta[1] && r.tipo === carta[2] && r !== p && p.vicini.has(r) && raggiungibile(q) && raggiungibile(r)) scelte.push([p, q, r]);
      }
    }
    if (F.riusoMax >= 2 && !scelte.length) {
      for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
        for (const p of delTipo(carta[i])) for (const q of p.vicini) {
          if (q.tipo === carta[j] && raggiungibile(q)) {
            const s = [null, null, null];
            s[i] = p;
            s[j] = q;
            scelte.push(s);
          }
        }
      }
    }
    if (F.riusoMax >= 1) {
      for (const i of [0, 1, 2]) {
        const c = delTipo(carta[i]);
        if (c.length) {
          const s = [null, null, null];
          s[i] = c[Math.floor(rnd() * c.length)];
          scelte.push(s);
        }
      }
    }
  }
  scelte.push([null, null, null]);
  for (const s of scelte) {
    const servono = Array(centro.pezzi.length).fill(0);
    s.forEach((p, i) => { if (!p) servono[carta[i]]++; });
    if (servono.some((q, t) => q > centro.pezzi[t])) continue;
    const primo = s.find(Boolean);
    let base;
    if (primo) base = haPosto(F, n, primo.liv) ? primo.liv : primo.liv + 1;
    else base = n.length > 0 && rnd() < g.stile.sale ? n.length : primoLibero(F, n);
    return { base, meeple: null, posti: carta.map((tipo, i) => ({ tipo, comp: s[i], riuso: !!s[i] })) };
  }
  return null;
}

function round(carta, ctx) {
  const { S, sedi, centro, R, F, rnd, info } = ctx;
  const punti = sedi.map((s) => s.carte * R.puntiCarta - s.caduti * R.penalita);
  const G = S.map((stile, i) => ({
    i,
    stile,
    sede: sedi[i],
    t: (F.reazione * logn(F.sigma, rnd)) / stile.velocita,
    fase: stile.fermo ? 'fermo' : 'pensa',
    gara: !stile.fermo && !stile.torre,
    brucia: stile.chiude && punti.every((p, j) => j === i || p < punti[i]),
    conf: null,
    inMano: null,
    meeplePresi: 0,
  }));
  for (const g of G) if (g.brucia) g.gara = false;
  let vincitore = -1;
  let T = 0;

  const prendiMeeple = (g) => {
    if (R.unMeeplePerRound && g.meeplePresi >= 1) return false;
    if (R.meeplePersonali) {
      if (g.sede.personali <= 0) return false;
      g.sede.personali--;
    } else {
      if (centro.meeple <= 0) return false;
      centro.meeple--;
    }
    g.meeplePresi++;
    return true;
  };
  const rendi = (g) => {
    const c = g.inMano;
    if (!c) return;
    if (c.k === 'p') centro.pezzi[c.tipo]++;
    else if (R.meeplePersonali) g.sede.personali++;
    else centro.meeple++;
    g.inMano = null;
  };
  const ferma = (g, perche) => {
    g.fase = 'fermo';
    g.perche = perche;
    rendi(g);
  };

  const avvia = (g) => {
    const n = piani(g.sede);
    if (g.stile.torre) {
      const tipo = centro.pezzi.indexOf(Math.max(...centro.pezzi));
      if (centro.pezzi[tipo] <= 0) return ferma(g, 'pezzi finiti');
      const cima = Math.max(0, n.length - 1);
      const liv = (n[cima] || 0) < g.stile.torre && haPosto(F, n, cima) ? cima : cima + 1;
      centro.pezzi[tipo]--;
      g.inMano = { k: 'p', tipo, liv, incastro: false };
      g.t += durata(g, liv, 1, F, rnd);
      g.fase = 'posa';
      return;
    }
    if (g.brucia) {
      if (!prendiMeeple(g)) return ferma(g, 'meeple finiti');
      const liv = primoLibero(F, n);
      g.inMano = { k: 'm', liv, incastro: false };
      g.t += durata(g, liv, 1, F, rnd);
      g.fase = 'posa';
      return;
    }
    if (!g.conf) {
      const senzaMeeple = R.meeplePersonali ? g.sede.personali <= 0 : centro.meeple <= 0;
      if (senzaMeeple) return ferma(g, 'meeple finiti');
      g.conf = pianifica(g, carta, ctx);
      if (!g.conf) return ferma(g, 'pezzi finiti');
      if (g.stile.rinuncia && rischio(g, g.conf.base, false, F) > g.stile.rinuncia) {
        g.sede.rinunce++;
        g.gara = false;
        return ferma(g, 'rinuncia');
      }
      g.sede.tentativi++;
      (info.tentativi[info.round] ||= [0, 0])[0]++;
    }
    const { conf } = g;
    const mancanti = conf.posti.filter((p) => !p.comp);
    const meepleOra = !conf.meeple && (g.stile.ordine === 'prima' || !mancanti.length);
    let liv = Math.min(conf.base, n.length);
    while (!haPosto(F, n, liv)) liv++;
    if (meepleOra) {
      if (!prendiMeeple(g)) return ferma(g, 'meeple finiti');
      const riusati = conf.posti.filter((p) => p.riuso && p.comp).length;
      const tra = riusati > 0 || (g.stile.ordine === 'ultimo' && F.ultimoDifficile > 1);
      const extra = (1 + F.costoRiuso * riusati) * (g.stile.ordine === 'ultimo' ? F.ultimoDifficile : 1);
      g.inMano = { k: 'm', liv, incastro: tra };
      g.t += durata(g, liv, extra, F, rnd);
    } else {
      const posto = mancanti[0];
      if (centro.pezzi[posto.tipo] <= 0) return ferma(g, 'pezzi finiti');
      centro.pezzi[posto.tipo]--;
      g.inMano = { k: 'p', tipo: posto.tipo, liv, incastro: false, posto };
      g.t += durata(g, liv, 1, F, rnd);
    }
    g.fase = 'posa';
  };

  const rilascia = (g) => {
    const m = g.inMano;
    g.inMano = null;
    const c = m.k === 'p' ? { k: 'p', tipo: m.tipo, liv: m.liv, tocca: 0, vicini: new Set() } : { k: 'm', liv: m.liv, pezzi: [] };
    g.sede.comp.push(c);
    g.sede.posati++;
    const { conf } = g;
    if (conf) {
      if (m.k === 'm') conf.meeple = c;
      else m.posto.comp = c;
    }
    if (rnd() < rischio(g, m.liv, m.incastro, F)) {
      const giu = cade(g.sede, m.liv, F, rnd);
      const fuori = giu.filter((x) => x.fuori).length;
      g.sede.urti++;
      if (info.tentativi[info.round]) info.tentativi[info.round][1] += fuori;
      if (conf) {
        if (giu.includes(conf.meeple)) conf.meeple = null;
        for (const p of conf.posti) if (giu.includes(p.comp)) { p.comp = null; p.riuso = false; }
      }
    }
    g.fase = 'pensa';
    if (!conf || !conf.meeple || conf.posti.some((p) => !p.comp)) return;
    // configurazione completa: annuncia
    if (rnd() < Math.min(0.9, (F.errore * g.stile.fretta ** F.gamma) / g.stile.mano)) {
      g.sede.sbagliate++;
      g.gara = false;
      return ferma(g, 'chiamata errata');
    }
    const pezzi = conf.posti.map((p) => p.comp);
    for (const p of pezzi) {
      p.tocca++;
      for (const q of pezzi) if (q !== p) p.vicini.add(q);
    }
    conf.meeple.pezzi = pezzi;
    if (conf.posti.some((p) => p.riuso)) g.sede.conRiuso++;
    vincitore = g.i;
  };

  for (;;) {
    if (!G.some((x) => x.gara && x.fase !== 'fermo')) break;
    let g = null;
    for (const x of G) if (x.fase !== 'fermo' && (!g || x.t < g.t)) g = x;
    if (g.t > F.tempoMassimo) break;
    T = g.t;
    if (g.fase === 'posa') rilascia(g);
    if (vincitore >= 0) break;
    if (g.fase !== 'fermo') avvia(g);
  }
  let quasi = false;
  if (vincitore >= 0) {
    for (const x of G) {
      if (x.i === vincitore || x.fase !== 'posa' || !x.conf) continue;
      const mancano = (x.conf.meeple ? 0 : 1) + x.conf.posti.filter((p) => !p.comp).length;
      if (mancano === 1 && x.t - T <= F.quasi) quasi = true;
    }
  }
  for (const x of G) rendi(x);
  return { vincitore, T, quasi, inGara: G.filter((x) => x.conf).length, perche: G.map((x) => x.perche || '') };
}

// Il bonus altezza, con gli spareggi del regolamento: meno caduti, poi più carte, poi bonus condiviso
// e piazzamento successivo saltato.
export function bonusAltezza(sedi, R) {
  const ord = sedi.map((_, i) => i).sort((a, b) => sedi[b].alt - sedi[a].alt || sedi[a].caduti - sedi[b].caduti || sedi[b].carte - sedi[a].carte);
  const pari = (a, b) => sedi[a].alt === sedi[b].alt && sedi[a].caduti === sedi[b].caduti && sedi[a].carte === sedi[b].carte;
  const out = sedi.map(() => 0);
  let spareggi = 0;
  for (let pos = 0; pos < ord.length; ) {
    let fine = pos + 1;
    while (fine < ord.length && pari(ord[fine], ord[pos])) fine++;
    for (let k = pos; k < fine; k++) if (R.bonusASedeVuota || sedi[ord[k]].alt > 0) out[ord[k]] = R.bonus[pos] ?? 0;
    pos = fine;
  }
  for (let k = 1; k < ord.length; k++) if (sedi[ord[k]].alt === sedi[ord[k - 1]].alt) spareggi++;
  return { bonus: out, spareggi };
}

export function partita(stili, regole = {}, fisica = {}, rnd = Math.random) {
  const R = { ...REGOLE, ...regole };
  const F = { ...FISICA, ...fisica };
  const S = stili.map((s) => ({ ...STILE, ...s }));
  const centro = { meeple: R.meeplePersonali ? 0 : R.meeple, pezzi: Array(R.tipi).fill(R.pezziPerTipo) };
  const sedi = S.map(() => ({ comp: [], caduti: 0, carte: 0, sbagliate: 0, tentativi: 0, rinunce: 0, urti: 0, posati: 0, conRiuso: 0, personali: R.meeplePersonali }));
  const carte = mazzo(R, rnd);
  const info = { round: 0, tempo: 0, assegnate: 0, senzaVincitore: 0, quasi: 0, soli: 0, fine: '', tentativi: [], vincitori: [], ultimoDaSolo: false, perche: {} };
  const ctx = { S, sedi, centro, R, F, rnd, info };
  let fermi = 0;
  for (;;) {
    if (!carte.length) { info.fine = 'carte finite'; break; }
    info.meepleUltimoRound = R.meeplePersonali ? sedi.filter((s) => s.personali > 0).length : centro.meeple;
    const e = round(carte.pop(), ctx);
    info.round++;
    info.tempo += e.T;
    if (e.quasi) info.quasi++;
    if (e.inGara === 1) info.soli++;
    for (const p of e.perche) if (p) info.perche[p] = (info.perche[p] || 0) + 1;
    info.vincitori.push(e.vincitore);
    if (e.vincitore >= 0) {
      sedi[e.vincitore].carte++;
      info.assegnate++;
      fermi = 0;
    } else {
      info.senzaVincitore++;
      fermi++;
    }
    const finiti = R.meeplePersonali ? (R.fineAlPrimo ? sedi.some((s) => s.personali <= 0) : sedi.every((s) => s.personali <= 0)) : centro.meeple <= 0;
    if (finiti) { info.fine = 'meeple finiti'; info.ultimoDaSolo = e.inGara === 1; break; }
    if (R.fineDopoCarte && info.assegnate >= R.fineDopoCarte) { info.fine = 'carte assegnate'; break; }
    if (fermi >= 3) { info.fine = 'nessuno può più completare'; break; }
  }
  for (const s of sedi) {
    s.piani = s.comp.length ? 1 + Math.max(...s.comp.map((c) => c.liv)) : 0;
    s.alt = s.piani + (F.misuraFine && s.piani ? F.misuraFine * rnd() : 0);
  }
  const { bonus, spareggi } = bonusAltezza(sedi, R);
  info.spareggi = spareggi;
  info.meepleRimasti = centro.meeple;
  info.pezziRimasti = centro.pezzi.slice();
  const giocatori = sedi.map((s, i) => ({
    carte: s.carte,
    alt: s.piani,
    caduti: s.caduti,
    bonus: bonus[i],
    sbagliate: s.sbagliate,
    tentativi: s.tentativi,
    rinunce: s.rinunce,
    urti: s.urti,
    posati: s.posati,
    conRiuso: s.conRiuso,
    sullaSede: s.comp.length,
    punti: s.carte * R.puntiCarta + bonus[i] - Math.min(s.caduti * R.penalita, R.penalitaMassima) - s.sbagliate * R.penalitaChiamata,
  }));
  return { giocatori, info };
}
