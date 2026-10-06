// Mercato del Lavoro v0.1: le prove. I numeri di BUCHI.md vengono da qui.
//   node mercato-del-lavoro/analisi.mjs [conti base pedana ordine velocita fretta altezza riuso chiude tentativo varianti tenuta]
// Senza argomenti le fa tutte.
import { partita, casuale, mazzo, REGOLE } from './modello.mjs';

const T = 20000;
const pct = (x, d = 0) => `${(100 * x).toFixed(d)}%`;
const num = (x, d = 1) => x.toFixed(d).replace('.', ',');
const uguali = (n, stile = {}) => Array.from({ length: n }, () => ({ ...stile }));

// Gioca T partite e fa le medie. Il giocatore 0 è "lui", quello che gioca diverso dagli altri.
function prova(stili, regole = {}, fisica = {}, partite = T, seme = 7) {
  const rnd = casuale(seme);
  const n = stili.length;
  const G = stili.map(() => ({ vittorie: 0, punti: 0, carte: 0, bonus: 0, caduti: 0, alt: 0, posati: 0, sbagliate: 0, sottoZero: 0, tentativi: 0, conRiuso: 0, rinunce: 0, sullaSede: 0 }));
  const m = { n, round: 0, tempo: 0, assegnate: 0, senzaVincitore: 0, quasi: 0, soli: 0, ultimoDaSolo: 0, ultimoCorto: 0, spareggi: 0, meepleRimasti: 0, pezziRimasti: 0, tipoFinito: 0, fine: {}, perche: {}, cambiaAltezza: 0, cambiaCadute: 0, nonPiuCarte: 0, distacco: 0, dopoVinta: [0, 0], perRound: [], zeroCarte: 0, maxCaduti: 0 };
  for (let k = 0; k < partite; k++) {
    const { giocatori, info } = partita(stili, regole, fisica, rnd);
    m.round += info.round;
    m.tempo += info.tempo;
    m.assegnate += info.assegnate;
    m.senzaVincitore += info.senzaVincitore;
    m.quasi += info.quasi;
    m.soli += info.soli;
    m.ultimoDaSolo += info.ultimoDaSolo ? 1 : 0;
    m.ultimoCorto += info.fine === 'meeple finiti' && info.meepleUltimoRound < n ? 1 : 0;
    m.spareggi += info.spareggi > 0 ? 1 : 0;
    m.meepleRimasti += info.meepleRimasti;
    m.pezziRimasti += info.pezziRimasti.reduce((a, b) => a + b, 0);
    m.tipoFinito += info.pezziRimasti.some((x) => x === 0) ? 1 : 0;
    m.fine[info.fine] = (m.fine[info.fine] || 0) + 1;
    for (const [c, q] of Object.entries(info.perche)) m.perche[c] = (m.perche[c] || 0) + q;
    info.tentativi.forEach((t, r) => {
      const a = (m.perRound[r] ||= [0, 0, 0]);
      a[0] += t[0];
      a[1] += t[1];
      a[2]++;
    });
    for (let r = 1; r < info.vincitori.length; r++) {
      if (info.vincitori[r - 1] < 0 || info.vincitori[r] < 0) continue;
      m.dopoVinta[1]++;
      if (info.vincitori[r] === info.vincitori[r - 1]) m.dopoVinta[0]++;
    }
    const primi = (f) => {
      const v = giocatori.map(f);
      const top = Math.max(...v);
      return v.map((x) => x === top);
    };
    const W = primi((g) => g.punti);
    const quanti = W.filter(Boolean).length;
    const senzaBonus = primi((g) => g.punti - g.bonus);
    const senzaCadute = primi((g) => g.carte + g.bonus);
    const piuCarte = primi((g) => g.carte);
    if (W.some((w, i) => w !== senzaBonus[i])) m.cambiaAltezza++;
    if (W.some((w, i) => w !== senzaCadute[i])) m.cambiaCadute++;
    if (!W.some((w, i) => w && piuCarte[i])) m.nonPiuCarte++;
    const ord = giocatori.map((g) => g.punti).sort((a, b) => b - a);
    m.distacco += ord[0] - ord[1];
    m.zeroCarte += giocatori.filter((g) => g.carte === 0).length / n;
    m.maxCaduti += Math.max(...giocatori.map((g) => g.caduti));
    giocatori.forEach((g, i) => {
      const a = G[i];
      if (W[i]) a.vittorie += 1 / quanti;
      for (const c of ['punti', 'carte', 'bonus', 'caduti', 'alt', 'posati', 'sbagliate', 'tentativi', 'conRiuso', 'rinunce', 'sullaSede']) a[c] += g[c];
      if (g.punti < 0) a.sottoZero++;
    });
  }
  const rounds = m.round;
  for (const c of ['round', 'tempo', 'assegnate', 'senzaVincitore', 'ultimoDaSolo', 'ultimoCorto', 'spareggi', 'meepleRimasti', 'pezziRimasti', 'tipoFinito', 'cambiaAltezza', 'cambiaCadute', 'nonPiuCarte', 'distacco', 'zeroCarte', 'maxCaduti']) m[c] /= partite;
  m.quasi /= rounds;
  m.soli /= rounds;
  for (const c of Object.keys(m.fine)) m.fine[c] /= partite;
  for (const a of G) for (const c of Object.keys(a)) a[c] /= partite;
  m.G = G;
  m.lui = G[0];
  m.altri = G[1] || G[0];
  m.media = (c) => G.reduce((s, a) => s + a[c], 0) / n;
  return m;
}

const riga = (titolo, m) =>
  console.log(
    `${titolo.padEnd(46)} round ${num(m.round)}  carte ${num(m.assegnate)}  gesti ${num(m.tempo, 0)}  | a testa: carte ${num(m.media('carte'))}  altezza ${num(m.media('bonus'))}  caduti ${num(m.media('caduti'), 2)}  punti ${num(m.media('punti'))}  sotto zero ${pct(m.media('sottoZero'))}  | decide: altezza ${pct(m.cambiaAltezza)}  cadute ${pct(m.cambiaCadute)}  spareggio altezza ${pct(m.spareggi)}`,
  );
const lui = (titolo, m) =>
  console.log(
    `${titolo.padEnd(46)} lui vince ${pct(m.lui.vittorie).padStart(4)} (pari ${pct(1 / m.n)})  carte ${num(m.lui.carte)} / ${num(m.altri.carte)}  bonus ${num(m.lui.bonus)} / ${num(m.altri.bonus)}  caduti ${num(m.lui.caduti, 2)} / ${num(m.altri.caduti, 2)}  punti ${num(m.lui.punti)} / ${num(m.altri.punti)}  | round ${num(m.round)}`,
  );

const FISICHE = [
  ['pezzi stabili (1 urto ogni 200 gesti)', { p0: 0.005 }],
  ['di mezzo (1 ogni 50)', { p0: 0.02 }],
  ['pezzi che traballano (1 ogni 15)', { p0: 0.065 }],
];

const PARTI = {
  conti() {
    console.log('\n=== I conti che non dipendono dalla fisica ===');
    const carte = mazzo({ ...REGOLE }, casuale(1));
    const perTipo = Array(REGOLE.tipi).fill(0);
    for (const c of carte) for (const t of c) perTipo[t]++;
    console.log(`Mazzo ipotizzato: ${carte.length} carte, ${carte.filter((c) => new Set(c).size === 3).length} con tre simboli diversi, ${carte.filter((c) => new Set(c).size === 2).length} con due uguali. Simboli per tipo: ${perTipo.join(', ')}. Pezzi per tipo: ${REGOLE.pezziPerTipo}.`);
    console.log(`Meeple ${REGOLE.meeple}, pezzi ${REGOLE.pezziPerTipo * REGOLE.tipi}: ${(REGOLE.pezziPerTipo * REGOLE.tipi) / REGOLE.meeple} pezzi per meeple.`);
    console.log('\nRound e carte se ogni giocatore posa un meeple a round (meeple per primo):');
    for (const n of [2, 3, 4]) {
      const pieni = Math.floor(REGOLE.meeple / n);
      const resto = REGOLE.meeple % n;
      console.log(`  in ${n}: ${pieni} round pieni + 1 round con ${resto} meeple per ${n} giocatori = ${pieni + (resto ? 1 : 0)} carte su 30. Punti: ${pieni + 1} dalle carte, ${REGOLE.bonus.slice(0, n).reduce((a, b) => a + b, 0)} dall'altezza. Carte a testa ${num((pieni + 1) / n)}.`);
    }
    console.log(`Se il meeple lo posa solo chi vince: fino a ${REGOLE.meeple} round.`);
  },

  base() {
    console.log('\n=== Tutti uguali, come nell’esempio del regolamento (meeple per primo) ===');
    for (const [nome, f] of FISICHE) {
      console.log(`\n--- ${nome}`);
      for (const n of [2, 3, 4]) {
        const m = prova(uguali(n), {}, f);
        riga(`in ${n}`, m);
        console.log(`      fine: ${Object.entries(m.fine).map(([c, v]) => `${c} ${pct(v)}`).join(', ')}; ultimo round con meno meeple che giocatori ${pct(m.ultimoCorto)}, con un solo giocatore in gara ${pct(m.ultimoDaSolo)}; round senza vincitore ${num(m.senzaVincitore, 2)}; chiamate quasi insieme ${pct(m.quasi)} dei round; chi vince non ha il massimo delle carte ${pct(m.nonPiuCarte)}; distacco ${num(m.distacco)}; giocatori a zero carte ${pct(m.zeroCarte)}; pezzi rimasti al centro ${num(m.pezziRimasti, 0)}; un tipo finito ${pct(m.tipoFinito)}; componenti posati a testa ${num(m.media('posati'))}; altezza in piani ${num(m.media('alt'))}; chiamate errate a testa ${num(m.media('sbagliate'), 2)}; carte vinte riusando ${pct(m.media('conRiuso') / m.media('carte'))}`);
      }
    }
    console.log('\n--- se l\u2019altezza si misura al millimetro (tra Sedi con gli stessi piani la più alta è una a caso), fisica di mezzo');
    for (const n of [2, 3, 4]) {
      const m = prova(uguali(n), {}, { misuraFine: 0.9 });
      console.log(`  in ${n}: il bonus altezza cambia il vincitore ${pct(m.cambiaAltezza)}, chi vince non ha il massimo delle carte ${pct(m.nonPiuCarte)}, distacco ${num(m.distacco)}`);
    }
    console.log('\n--- chiamate quasi insieme, secondo quanto variano i tempi (in 4, di mezzo)');
    for (const sigma of [0.15, 0.3, 0.5]) console.log(`  variabilità ${sigma}: ${pct(prova(uguali(4), {}, { sigma }).quasi)} dei round`);
  },

  pedana() {
    console.log('\n=== Quanto si riempie la Sede, secondo quanti componenti tiene la pedana (fisica di mezzo) ===');
    for (const n of [2, 3, 4]) {
      for (const posti of [8, 12, 24, 40]) {
        const m = prova(uguali(n), {}, { postiATerra: posti });
        console.log(`in ${n}, pedana da ${String(posti).padStart(2)}: componenti posati a testa ${num(m.media('posati'))}, piani ${num(m.media('alt'))}, caduti a testa ${num(m.media('caduti'), 2)}, il peggiore ${num(m.maxCaduti)}, sotto zero ${pct(m.media('sottoZero'))}, Sedi alte uguali ${pct(m.spareggi)}, decide: altezza ${pct(m.cambiaAltezza)} cadute ${pct(m.cambiaCadute)}`);
      }
    }
  },

  ordine() {
    console.log('\n=== Meeple per primo o per ultimo ===');
    for (const n of [2, 3, 4]) {
      console.log(`\n--- in ${n}`);
      for (const [nome, f] of FISICHE) {
        const m = prova(uguali(n, { ordine: 'ultimo' }), {}, f, 5000);
        riga(`tutti per ultimo, ${nome.split(' (')[0]}`, m);
        console.log(`      fine: ${Object.entries(m.fine).map(([c, v]) => `${c} ${pct(v)}`).join(', ')}; round senza vincitore ${num(m.senzaVincitore, 2)}; meeple rimasti ${num(m.meepleRimasti)}; pezzi rimasti ${num(m.pezziRimasti, 0)}; un tipo finito ${pct(m.tipoFinito)}; perché si fermano: ${Object.entries(m.perche).map(([c, v]) => `${c} ${num(v / 5000)}`).join(', ')}`);
      }
      lui('uno per ultimo, gli altri per primo', prova([{ ordine: 'ultimo' }, ...uguali(n - 1)]));
      lui('uno per primo, gli altri per ultimo', prova([{ ordine: 'prima' }, ...uguali(n - 1, { ordine: 'ultimo' })], {}, {}, 5000));
      lui('uno per ultimo, se è il 25% più difficile', prova([{ ordine: 'ultimo' }, ...uguali(n - 1)], {}, { ultimoDifficile: 1.25 }));
    }
  },

  velocita() {
    console.log('\n=== Uno è più veloce degli altri (stessa precisione) ===');
    for (const n of [2, 3, 4]) {
      console.log(`\n--- in ${n}`);
      for (const v of [1.1, 1.2, 1.3, 1.5]) lui(`lui ${pct(v - 1)} più veloce`, prova([{ velocita: v }, ...uguali(n - 1)]));
    }
    console.log('\n--- in 4, il 20% più veloce, secondo quanto variano i tempi');
    for (const sigma of [0.15, 0.3, 0.5]) lui(`variabilità ${sigma}`, prova([{ velocita: 1.2 }, ...uguali(3)], {}, { sigma }));
    console.log('\n--- lo stesso, se l\u2019altezza si misura al millimetro');
    for (const v of [1.1, 1.2]) lui(`in 4, lui ${pct(v - 1)} più veloce`, prova([{ velocita: v }, ...uguali(3)], {}, { misuraFine: 0.9 }));
    console.log('\n--- in 4, il più lento');
    for (const v of [0.9, 0.8]) lui(`lui ${pct(1 - v)} più lento`, prova([{ velocita: v }, ...uguali(3)]));
    console.log('\n--- in 4, mano più ferma (metà degli urti) ma stessa velocità');
    for (const [nome, f] of FISICHE) lui(nome.split(' (')[0], prova([{ mano: 2 }, ...uguali(3)], {}, f));
  },

  fretta() {
    console.log('\n=== Correre o andare piano: chi corre fa prima ma urta di più ===');
    for (const [nome, f] of FISICHE) {
      console.log(`\n--- in 4, ${nome}`);
      for (const x of [0.7, 0.85, 1, 1.15, 1.3, 1.5, 1.8]) lui(`lui a ${num(x, 2)}, gli altri a 1`, prova([{ fretta: x }, ...uguali(3)], {}, f, 10000));
    }
    console.log('\n--- in 2, di mezzo');
    for (const x of [0.7, 0.85, 1, 1.15, 1.3, 1.5, 1.8]) lui(`lui a ${num(x, 2)}, l’altro a 1`, prova([{ fretta: x }, {}], {}, {}, 10000));
    console.log('\n--- tutti alla stessa andatura (in 4, di mezzo)');
    for (const x of [0.7, 1, 1.3, 1.8]) riga(`tutti a ${num(x, 2)}`, prova(uguali(4, { fretta: x }), {}, {}, 10000));
  },

  altezza() {
    console.log('\n=== Salire apposta ===');
    for (const posti of [8, 12, 24]) {
      for (const [nome, f] of FISICHE) {
        console.log(`\n--- in 4, pedana da ${posti} componenti, ${nome.split(' (')[0]}`);
        const F = { ...f, postiATerra: posti };
        const b = prova(uguali(4), {}, F, 10000);
        console.log(`      tutti in piano: altezza ${num(b.media('alt'))} piani, spareggio per l’altezza ${pct(b.spareggi)}, caduti a testa ${num(b.media('caduti'), 2)}`);
        for (const s of [0.5, 1]) lui(`lui sale ${pct(s)} delle volte`, prova([{ sale: s }, ...uguali(3)], {}, F, 10000));
        for (const w of [1, 2, 4]) lui(`lui fa solo una torre larga ${w}`, prova([{ torre: w }, ...uguali(3)], {}, F, 10000));
        lui('lui non fa niente', prova([{ fermo: true }, ...uguali(3)], {}, F, 10000));
      }
    }
    // In 2 non provo "torre" e "fermo": l'altro resterebbe solo a posare 25 meeple su una Sede,
    // cioè una sessantina di componenti, e lì il modello non ha più niente di sensato da dire.
    console.log('\n--- in 2 e in 3, pedana da 12, di mezzo');
    for (const n of [2, 3]) lui(`in ${n}: lui sale sempre`, prova([{ sale: 1 }, ...uguali(n - 1)]));
    lui('in 3: lui fa solo una torre larga 4', prova([{ torre: 4 }, {}, {}]));
    lui('in 3: lui non fa niente', prova([{ fermo: true }, {}, {}]));
  },

  riuso() {
    console.log('\n=== Riusare i pezzi già posati ===');
    for (const n of [2, 4]) {
      console.log(`\n--- in ${n}`);
      for (const [nome, f] of [
        ['un pezzo, un solo meeple (niente riuso)', { K: 1, riusoMax: 1 }],
        ['base: 3 meeple per pezzo, 2 pezzi riusati insieme', {}],
        ['6 meeple per pezzo, 3 pezzi riusati insieme', { K: 6, riusoMax: 3 }],
        ['base, ma riusare costa il doppio', { costoRiuso: 0.7 }],
        ['base, ma riusare non costa niente', { costoRiuso: 0 }],
      ]) {
        const m = prova(uguali(n), {}, f);
        console.log(`${nome.padEnd(52)} gesti a round ${num(m.tempo / m.round, 2)}  carte vinte riusando ${pct(m.media('conRiuso') / m.media('carte'))}  pezzi rimasti ${num(m.pezziRimasti, 0)}  chi ha vinto vince anche il round dopo ${pct(m.dopoVinta[0] / m.dopoVinta[1])} (a caso ${pct(1 / n)})  caduti a testa ${num(m.media('caduti'), 2)}`);
      }
      lui('lui non riusa mai', prova([{ riusa: false }, ...uguali(n - 1)]));
      lui('lui non riusa mai, riuso largo (6 e 3)', prova([{ riusa: false }, ...uguali(n - 1)], {}, { K: 6, riusoMax: 3 }));
    }
  },

  chiude() {
    console.log('\n=== Chi è in testa brucia i meeple per chiudere (un meeple a gesto) ===');
    for (const n of [2, 3, 4]) {
      const m = prova([{ chiude: true }, ...uguali(n - 1)]);
      lui(`in ${n}`, m);
      console.log(`      carte assegnate ${num(m.assegnate)}, round ${num(m.round)}`);
      lui(`in ${n}, con un solo meeple a testa per round`, prova([{ chiude: true }, ...uguali(n - 1)], { unMeeplePerRound: true }));
    }
    console.log('\n--- tutti lo fanno');
    for (const n of [2, 3, 4]) riga(`in ${n}`, prova(uguali(n, { chiude: true })));
  },

  tentativo() {
    console.log('\n=== Quanto costa un tentativo: componenti caduti per tentativo, round per round ===');
    for (const n of [2, 4]) {
      for (const [nome, f] of FISICHE) {
        const m = prova(uguali(n), {}, f);
        console.log(`in ${n}, ${nome.split(' (')[0].padEnd(22)} (un tentativo vale ${num(1 / n, 2)} carte): ${m.perRound.filter((a) => a[2] > T / 2).map((a) => num(a[1] / a[0], 2)).join('  ')}`);
      }
    }
    console.log('\n--- chi rinuncia quando il rischio per gesto supera la soglia (in 4, pezzi che traballano)');
    for (const s of [0.06, 0.1, 0.15, 0.25]) {
      const m = prova([{ rinuncia: s }, ...uguali(3)], {}, FISICHE[2][1]);
      lui(`soglia ${pct(s)}`, m);
      console.log(`      rinunce ${num(m.lui.rinunce)} su ${num(m.round)} round`);
    }
  },

  varianti() {
    console.log('\n=== Varianti delle regole (tutti uguali, fisica di mezzo) ===');
    for (const n of [2, 3, 4]) {
      console.log(`\n--- in ${n}`);
      const V = [
        ['regole scritte', {}, {}],
        ['24 meeple', { meeple: 24 }, {}],
        [`ognuno i suoi meeple (${Math.floor(24 / n)} a testa)`, { meeplePersonali: Math.floor(24 / n) }, {}],
        ['si finisce dopo 12 carte (servono più meeple)', { fineDopoCarte: 12, meeple: 60 }, {}],
        ['meeple per ultimo, si finisce dopo 10 carte', { fineDopoCarte: 10 }, {}, { ordine: 'ultimo' }],
        ['meeple per ultimo, si finisce dopo 14 carte', { fineDopoCarte: 14 }, {}, { ordine: 'ultimo' }],
        ['bonus altezza 2, 1, 0', { bonus: [2, 1, 0] }, {}],
        ['al massimo 3 punti persi per le cadute', { penalitaMassima: 3 }, {}],
      ];
      for (const [nome, r, f, stile] of V) {
        const m = prova(uguali(n, stile), r, f);
        riga(nome, m);
        console.log(`      fine: ${Object.entries(m.fine).map(([c, v]) => `${c} ${pct(v)}`).join(', ')}; ultimo round con meno meeple che giocatori ${pct(m.ultimoCorto)}, da solo ${pct(m.ultimoDaSolo)}; componenti posati a testa ${num(m.media('posati'))}; meeple rimasti ${num(m.meepleRimasti)}; pezzi rimasti ${num(m.pezziRimasti, 0)}; un tipo finito ${pct(m.tipoFinito)}; round senza vincitore ${num(m.senzaVincitore, 2)}`);
      }
    }
    console.log('\n--- chiamata errata che costa un punto: chi corre (in 4)');
    for (const pen of [0, 1]) for (const x of [1, 1.3, 1.8]) lui(`penalità ${pen}, lui a ${num(x, 2)}`, prova([{ fretta: x }, ...uguali(3)], { penalitaChiamata: pen }, {}, 10000));
  },

  // Le conclusioni reggono se la fisica è diversa da come l'ho immaginata?
  tenuta() {
    console.log('\n=== Tenuta: le stesse domande con la fisica cambiata un numero alla volta (in 4) ===');
    const F = [
      ['base', {}],
      ['urti x 0,25', { p0: 0.005 }],
      ['urti x 3', { p0: 0.065 }],
      ['pedana 8', { postiATerra: 8 }],
      ['pedana 24', { postiATerra: 24 }],
      ['niente riuso', { K: 1, riusoMax: 1 }],
      ['riuso largo', { K: 6, riusoMax: 3 }],
      ['tempi regolari (0,15)', { sigma: 0.15 }],
      ['tempi irregolari (0,5)', { sigma: 0.5 }],
      ['la fretta costa poco (gamma 1)', { gamma: 1 }],
      ['la fretta costa molto (gamma 3)', { gamma: 3 }],
      ['quasi tutto resta sulla pedana', { fuori0: 0.15, fuoriLivello: 0.1 }],
      ['quasi tutto esce', { fuori0: 0.7, fuoriLivello: 0.2 }],
      ['in alto è molto più rischioso', { pLivello: 1.5, pStretto: 4 }],
      ['in alto è poco più rischioso', { pLivello: 0.2, pStretto: 0.5 }],
      ['altezza al millimetro', { misuraFine: 0.9 }],
      ['meeple per ultimo più difficile', { ultimoDifficile: 1.25 }],
    ];
    console.log('fisica'.padEnd(34) + 'round  carte  caduti  decide altezza  decide cadute | +20% veloce | fretta 1,3 | per ultimo | sale sempre | torre 2 | fermo');
    for (const [nome, f] of F) {
      const b = prova(uguali(4), {}, f, 8000);
      const v = (stile) => pct(prova([stile, ...uguali(3)], {}, f, 8000).lui.vittorie).padStart(5);
      console.log(`${nome.padEnd(34)}${num(b.round).padStart(5)}  ${num(b.assegnate).padStart(5)}  ${num(b.media('caduti'), 2).padStart(6)}  ${pct(b.cambiaAltezza).padStart(14)}  ${pct(b.cambiaCadute).padStart(13)} | ${v({ velocita: 1.2 }).padStart(11)} | ${v({ fretta: 1.3 }).padStart(10)} | ${v({ ordine: 'ultimo' }).padStart(10)} | ${v({ sale: 1 }).padStart(11)} | ${v({ torre: 2 }).padStart(7)} | ${v({ fermo: true }).padStart(5)}`);
    }
  },
};

const scelte = process.argv.slice(2);
for (const [nome, f] of Object.entries(PARTI)) if (!scelte.length || scelte.includes(nome)) f();
