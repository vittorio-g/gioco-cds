// Tavolo virtuale di Collocamento. Qui non ci sono regole di gioco: le carte
// si pescano, si trascinano, si girano e si scartano liberamente, e il server
// si limita a tenere allineati i tavoli di tutti.

const SIMBOLI = ['MA', 'DI', 'CO', 'OR', 'CL', 'AN', 'CR', 'CD', 'RI', 'ST'];
const TAVOLO = { l: 1600, a: 900 };
const CARTA = { l: 126, a: 176 };
const LATO_PILE = 330; // a sinistra sul tavolo: mazzi e scarti
const POSTO_PILE = [{ x: 24, y: 40 }, { x: 178, y: 40 }, { x: 24, y: 330 }, { x: 178, y: 330 }];
const app = document.getElementById('app');

let ws = null;
let sessione = null; // { nome, codice, crea }
let st = null; // ultimo stato ricevuto
let avviso = '';
let collegato = false;
let ritenta = null;
let regoleAperte = false;

let scelta = null; // carta selezionata: { da: 'mano' | 'tavolo', id }
let trascino = null; // carta del tavolo che sto trascinando: { id }
let manoDaRifare = false;
let zoom = 1;
let zoomAutomatico = true;
let cronacaAperta = window.innerWidth >= 1500;
let T = null; // pezzi fissi della schermata del tavolo

const bozza = {
  nome: leggi('collocamento.nome') ?? '',
  codice: location.hash.replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase(),
};

function leggi(chiave) {
  try {
    return localStorage.getItem(chiave);
  } catch {
    return null;
  }
}
function ricorda(chiave, valore) {
  try {
    localStorage.setItem(chiave, valore);
  } catch {}
}

function h(tag, attributi, ...figli) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attributi ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'disabled' || k === 'value') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const f of figli.flat(Infinity)) {
    if (f == null || f === false) continue;
    e.append(f.nodeType ? f : document.createTextNode(String(f)));
  }
  return e;
}

// Sostituisce il contenuto di un elemento, ignorando null e false.
function riempi(el, ...figli) {
  el.replaceChildren(...figli.flat(Infinity).filter((f) => f != null && f !== false));
}

// --------------------------------------------------------------------------
// Connessione
// --------------------------------------------------------------------------
function codiceNuovo() {
  const lettere = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => lettere[Math.floor(Math.random() * lettere.length)]).join('');
}

function entra(codice, crea) {
  const nome = bozza.nome.trim();
  if (!nome) {
    avviso = 'Scrivi il tuo nome.';
    return disegna();
  }
  if (!crea && codice.length !== 4) {
    avviso = 'Il codice della stanza ha 4 lettere.';
    return disegna();
  }
  avviso = '';
  ricorda('collocamento.nome', nome);
  sessione = { nome, codice: crea ? codiceNuovo() : codice, crea };
  collega();
}

function collega() {
  clearTimeout(ritenta);
  if (!sessione) return;
  const mia = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/${sessione.codice}`);
  ws = mia;
  mia.onopen = () => {
    collegato = true;
    mia.send(JSON.stringify({ a: 'entra', nome: sessione.nome, crea: sessione.crea }));
  };
  mia.onmessage = (ev) => {
    if (ws === mia) ricevi(JSON.parse(ev.data));
  };
  mia.onclose = () => {
    if (ws !== mia) return;
    collegato = false;
    if (sessione) ritenta = setTimeout(collega, 1500);
    disegna();
  };
}

function ricevi(msg) {
  if (msg.t === 'stato') {
    st = msg;
    sessione.crea = false;
    sessione.nome = msg.tu;
    if (location.hash !== `#${sessione.codice}`) history.replaceState(null, '', `#${sessione.codice}`);
    ricordaScheda({ nome: sessione.nome, codice: sessione.codice });
    disegna();
  } else if (msg.t === 'trascina') {
    carteAltrui(msg);
  } else if (msg.t === 'errore') {
    if (msg.codice === 'in-uso' && sessione?.crea) {
      sessione.codice = codiceNuovo();
      chiudi();
      return collega();
    }
    if (!st) esci(msg.testo);
    else mostraAvviso(msg.testo);
  } else if (msg.t === 'sostituito') {
    esci('Sei entrato in questa stanza da un’altra finestra con lo stesso nome.');
  }
}

function chiudi() {
  const vecchia = ws;
  ws = null;
  collegato = false;
  clearTimeout(ritenta);
  if (vecchia) vecchia.close();
}

function esci(messaggio = '') {
  bozza.codice = sessione?.codice ?? bozza.codice;
  sessione = null;
  st = null;
  scelta = null;
  chiudi();
  ricordaScheda(null);
  avviso = messaggio;
  disegna();
}

// Questa scheda del browser ricorda in che stanza era: se la ricarichi
// torni al tavolo senza rifare l'ingresso.
function ricordaScheda(dati) {
  try {
    if (dati) sessionStorage.setItem('collocamento.scheda', JSON.stringify(dati));
    else sessionStorage.removeItem('collocamento.scheda');
  } catch {}
}
function riprendi() {
  try {
    const dati = JSON.parse(sessionStorage.getItem('collocamento.scheda'));
    if (!dati?.nome || !dati?.codice || (bozza.codice && bozza.codice !== dati.codice)) return;
    bozza.nome = dati.nome;
    sessione = { nome: dati.nome, codice: dati.codice, crea: false };
    collega();
  } catch {}
}

function invia(richiesta) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(richiesta));
  else mostraAvviso('Connessione assente: riprovo a collegarmi.');
}
const fai = (op) => invia({ a: 'op', op });

let scadenzaAvviso = null;
function mostraAvviso(testo) {
  avviso = testo;
  clearTimeout(scadenzaAvviso);
  scadenzaAvviso = setTimeout(() => {
    avviso = '';
    disegna();
  }, 5000);
  disegna();
}

// --------------------------------------------------------------------------
// Carte
// --------------------------------------------------------------------------
const carte = (n) => `${n} ${n === 1 ? 'carta' : 'carte'}`;
// decoding=sync: le immagini già scaricate compaiono subito, senza sfarfallio.
const icona = (s) => h('img', { class: 'sim', src: `/img/sim/${s}.png`, alt: s, title: s, decoding: 'sync', draggable: 'false' });
const terna = (simboli, sigle = true) => h('span', { class: 'terna' },
  simboli.map((s) => h('span', { class: 'ic' }, icona(s), sigle && h('small', {}, s))));

// Il contenuto di una carta: scoperta mostra la faccia, coperta il dorso del suo mazzo.
function faccia(c) {
  if (c.coperta || (!c.att && !c.lav)) {
    return [h('span', { class: 'retro' }, c.t === 'lav' ? 'Lavoratore' : 'Ambito')];
  }
  if (c.t === 'lav') {
    return [
      h('span', { class: 'titolo' }, 'Lavoratore', h('b', {}, c.n)),
      h('img', { class: 'fig', src: `/img/lav/${c.n}.png`, alt: '', decoding: 'sync', draggable: 'false' }),
      h('span', { class: 'fascia' }, h('span', { class: 'eti' }, 'Attitudini'), terna(c.att)),
    ];
  }
  return [
    h('span', { class: 'titolo' }, 'Ambito'),
    h('img', { class: 'fig', src: '/img/lavoro.png', alt: '', decoding: 'sync', draggable: 'false' }),
    h('span', { class: 'fascia' }, terna(c.lav)),
  ];
}
const classeCarta = (c) => `tc ${c.t}${c.coperta || (!c.att && !c.lav) ? ' coperta' : ''}`;
const chiaveCarta = (c) => (c.coperta || (!c.att && !c.lav) ? `d${c.t}` : c.t === 'lav' ? `l${c.n}` : `f${c.lav.join('')}`);
const dorsi = (k, n) => h('span', { class: `conta ${k}`, title: k === 'lav' ? 'lavoratori in mano' : 'ambiti in mano' },
  h('span', { class: `dorso ${k}` }), n);

// --------------------------------------------------------------------------
// Schermate
// --------------------------------------------------------------------------
function disegna() {
  if (st?.tavolo) {
    if (!T) montaTavolo();
    return aggiornaTavolo();
  }
  T = null;
  scelta = null;
  const fuoco = document.activeElement?.id;
  app.replaceChildren(!st ? ingresso() : sala());
  if (fuoco) document.getElementById(fuoco)?.focus();
}

function ingresso() {
  const inAttesa = !!sessione;
  return h('main', { class: 'ingresso' },
    h('h1', {}, 'Collocamento'),
    h('p', { class: 'sotto' }, 'Tavolo virtuale per provare il gioco: le carte si muovono liberamente, le regole le applicate voi.'),
    avviso && h('p', { class: 'avviso', role: 'alert' }, avviso),
    h('form', { class: 'scheda', onsubmit: (e) => { e.preventDefault(); entra(bozza.codice, bozza.codice.length !== 4); } },
      h('label', { for: 'nome' }, 'Il tuo nome'),
      h('input', { id: 'nome', maxlength: 16, autocomplete: 'nickname', value: bozza.nome, placeholder: 'Come ti chiamano al tavolo',
        oninput: (e) => { bozza.nome = e.target.value; } }),
      h('label', { for: 'codice' }, 'Codice della stanza'),
      h('input', { id: 'codice', class: 'codice', maxlength: 4, autocomplete: 'off', value: bozza.codice, placeholder: 'ABCD',
        oninput: (e) => {
          bozza.codice = e.target.value.replace(/[^a-z]/gi, '').toUpperCase();
          e.target.value = bozza.codice;
          const b = document.getElementById('entra');
          if (b) b.disabled = inAttesa || bozza.codice.length !== 4;
        } }),
      h('p', { class: 'nota' }, 'Se hai ricevuto un codice scrivilo qui. Altrimenti crea una stanza e passa il codice agli altri.'),
      h('div', { class: 'bottoni' },
        h('button', { id: 'entra', type: 'button', class: 'primario', disabled: inAttesa || bozza.codice.length !== 4, onclick: () => entra(bozza.codice, false) }, 'Entra nella stanza'),
        h('button', { type: 'button', disabled: inAttesa, onclick: () => entra('', true) }, 'Crea una stanza nuova')),
      inAttesa && h('p', { class: 'nota' }, 'Mi collego…')));
}

const QUANTE = [0, 1, 2, 3, 4, 5].map((n) => [n, String(n)]);
const SCELTE = [
  ['mazzo', 'Mazzo degli ambiti', [['v3', 'Con ambiti ripetuti'], ['v2', 'Tutti diversi']]],
  ['lavoratori', 'Lavoratori in mano all’inizio', QUANTE],
  ['carte', 'Ambiti in mano all’inizio', QUANTE],
];

function sala() {
  const sonoHost = st.host === st.tu;
  const seduto = st.giocatori.some((g) => g.nome === st.tu);
  const indirizzo = `${location.origin}/#${sessione.codice}`;
  return h('main', { class: 'sala' },
    h('header', { class: 'barra' },
      h('strong', { class: 'marchio' }, 'Collocamento'),
      h('span', {}, 'Stanza ', h('b', {}, sessione.codice)),
      avviso && h('div', { class: 'avviso volante', role: 'alert' }, avviso)),
    h('div', { class: 'scheda' },
      h('h2', {}, 'Sala d’attesa'),
      h('p', { class: 'invito' }, 'Codice della stanza ', h('strong', { class: 'codice' }, sessione.codice)),
      h('p', { class: 'nota' }, indirizzo, ' ',
        h('button', { type: 'button', class: 'piccolo', onclick: async (e) => {
          try {
            await navigator.clipboard.writeText(indirizzo);
            e.target.textContent = 'Copiato';
          } catch {
            mostraAvviso('Non riesco a copiare: seleziona il link a mano.');
          }
        } }, 'Copia il link')),
      h('h3', {}, `Giocatori (${st.giocatori.length})`),
      h('ul', { class: 'elenco' }, st.giocatori.map((g) => h('li', {},
        h('span', { class: `stato ${g.collegato ? 'su' : 'giu'}` }),
        h('span', { class: 'chi' }, g.nome, g.nome === st.tu && ' (tu)'),
        g.nome === st.host && h('span', { class: 'etichetta' }, 'apparecchia il tavolo'),
        !g.collegato && h('span', { class: 'etichetta spenta' }, 'non collegato'),
        sonoHost && g.nome !== st.tu && h('button', { type: 'button', class: 'piccolo', onclick: () => invia({ a: 'togli', nome: g.nome }) }, 'Togli')))),
      !seduto && h('p', {}, 'Non sei tra i giocatori. ',
        h('button', { type: 'button', class: 'piccolo', onclick: () => invia({ a: 'entra', nome: st.tu }) }, 'Siediti al tavolo')),
      h('h3', {}, 'Preparazione'),
      SCELTE.map(([chiave, titolo, valori]) => h('fieldset', { class: 'opzione' },
        h('legend', {}, titolo),
        valori.map(([v, testo]) => {
          const attiva = st.opzioni[chiave] === v;
          return h('button', {
            type: 'button', class: attiva ? 'attiva' : '', 'aria-pressed': String(attiva), disabled: !sonoHost && !attiva,
            onclick: () => sonoHost && invia({ a: 'opzioni', opzioni: { ...st.opzioni, [chiave]: v } }),
          }, testo);
        }))),
      h('p', { class: 'nota' }, 'Si può cominciare anche da soli, per provare. Chi arriva dopo si siede a tavolo già apparecchiato.'),
      h('div', { class: 'bottoni' },
        sonoHost
          ? h('button', { type: 'button', class: 'primario', onclick: () => invia({ a: 'inizia' }) }, 'Apparecchia il tavolo')
          : h('p', { class: 'nota' }, `Aspetta che ${st.host ?? 'qualcuno'} apparecchi il tavolo.`),
        h('button', { type: 'button', onclick: () => { if (seduto) invia({ a: 'esci' }); esci(); } }, 'Esci dalla stanza'))));
}

function regole() {
  const chiudiRegole = () => { regoleAperte = false; aggiornaTavolo(); };
  return h('div', { class: 'velo', onclick: (e) => { if (e.target.classList.contains('velo')) chiudiRegole(); } },
    h('div', { class: 'scheda foglio' },
      h('h2', {}, 'Come si usa il tavolo'),
      h('ul', {},
        h('li', {}, h('b', {}, 'Pescare. '), 'Tocca un mazzo per pescare in mano, oppure trascina la prima carta sul tavolo: resta coperta.'),
        h('li', {}, h('b', {}, 'Giocare. '), 'Trascina una carta dalla mano al tavolo. Oppure toccala e poi tocca il punto del tavolo dove metterla.'),
        h('li', {}, h('b', {}, 'Spostare. '), 'Le carte sul tavolo si trascinano dove vuoi: quella che muovi finisce sopra le altre.'),
        h('li', {}, h('b', {}, 'Scartare e riprendere. '), 'Trascina una carta sugli scarti, su un mazzo o sulla tua mano. Oppure toccala e usa i pulsanti in basso: gira, scarta, in mano, sotto le altre, nel mazzo.'),
        h('li', {}, h('b', {}, 'Punti e turno. '), 'Si segnano a mano con i pulsanti accanto ai nomi. Tocca il numero per scrivere il totale.')),
      h('p', { class: 'nota' }, 'Il tavolo non applica nessuna regola: tutti possono fare tutto, come con le carte vere. Ogni azione finisce nella cronaca.'),
      h('h2', {}, 'Le regole in breve'),
      h('ul', {},
        h('li', {}, 'Ci sono due mazzi: i lavoratori e gli ambiti. Un ambito si gioca come formazione oppure come lavoro.'),
        h('li', {}, 'Si parte con 2 lavoratori e 2 ambiti. Nel tuo turno giochi una carta e ne peschi una.'),
        h('li', {}, 'Prima si apre una formazione, poi ci si mette sopra un lavoratore, poi altre formazioni se servono, infine il lavoro.'),
        h('li', {}, 'Puoi mettere il tuo lavoratore sulla formazione di un altro: resta lì ma è tuo, e chi ha aperto la formazione pesca 1 carta per ogni attitudine che combacia.'),
        h('li', {}, 'Il lavoro si ottiene se le formazioni coprono, una per una, tutte e 3 le sue icone.'),
        h('li', {}, 'Ogni lavoratore occupato vale 5 punti, più 3, 7 o 12 se 1, 2 o 3 icone del lavoro combaciano con le sue attitudini.')),
      h('div', { class: 'bottoni' }, h('button', { type: 'button', class: 'primario', onclick: chiudiRegole }, 'Chiudi'))));
}

// --------------------------------------------------------------------------
// Il tavolo: la struttura si costruisce una volta, poi si aggiorna
// --------------------------------------------------------------------------
function montaTavolo() {
  const pila = (tipo, m) => {
    const el = h('div', { class: `pila ${tipo}` });
    const sotto = h('div', { class: 'sottopila' });
    return { tipo, m, el, sotto };
  };
  T = {
    barra: h('header', { class: 'barra' }),
    scena: h('div', { class: 'scena' }),
    piano: h('div', { class: 'piano' }),
    tappeto: h('div', { class: 'tappeto' }),
    corsie: h('div', { class: 'corsie' }),
    carte: h('div', { class: 'carte' }),
    cronaca: h('aside', { class: 'cronaca' }),
    manobar: h('footer', { class: 'manobar' }),
    azioni: h('div', { class: 'azioni' }),
    mano: h('div', { class: 'mano' }),
    anteprima: h('div', { class: 'anteprima' }),
    strati: h('div', { class: 'strati' }),
    pile: [pila('mazzo', 'lav'), pila('scarti', 'lav'), pila('mazzo', 'for'), pila('scarti', 'for')],
    els: new Map(),
  };
  T.pile.forEach((p, i) => {
    p.el.style.left = p.sotto.style.left = `${POSTO_PILE[i].x}px`;
    p.el.style.top = `${POSTO_PILE[i].y}px`;
    p.sotto.style.top = `${POSTO_PILE[i].y + 184}px`;
    if (p.tipo === 'mazzo') {
      trascinabile(p.el, {
        clic: () => fai({ o: 'pesca', m: p.m }),
        inizio: (e) => fantasma({ t: p.m, coperta: true }, e, (b) => {
          if (b?.dove === 'tavolo') fai({ o: 'dalMazzo', m: p.m, x: b.x - CARTA.l / 2, y: b.y - CARTA.a / 2 });
          else if (b?.dove === 'mano') fai({ o: 'pesca', m: p.m });
        }),
      });
    } else {
      trascinabile(p.el, {
        clic: () => {},
        inizio: (e) => {
          const cima = st.tavolo.scarti[p.m].cima;
          if (!cima) return null;
          return fantasma(cima, e, (b) => {
            if (b?.dove === 'tavolo') fai({ o: 'dagliScarti', m: p.m, x: b.x - CARTA.l / 2, y: b.y - CARTA.a / 2 });
            else if (b?.dove === 'mano') fai({ o: 'ripesca', m: p.m });
          });
        },
      });
    }
  });
  T.tappeto.style.width = `${TAVOLO.l}px`;
  T.tappeto.style.height = `${TAVOLO.a}px`;
  T.tappeto.append(T.corsie, ...T.pile.flatMap((p) => [p.el, p.sotto]), T.carte);
  T.piano.append(T.tappeto);
  T.scena.append(T.piano);
  T.manobar.append(T.azioni, T.mano);
  // Toccare il tavolo vuoto: mette lì la carta della mano selezionata, altrimenti deseleziona.
  T.scena.addEventListener('click', (e) => {
    if (e.target.closest('.tc, .pila, .sottopila')) return;
    if (scelta?.da === 'mano') {
      const p = logico(e.clientX, e.clientY);
      const id = scelta.id;
      scelta = null;
      return fai({ o: 'gioca', c: id, x: p.x - CARTA.l / 2, y: p.y - CARTA.a / 2 });
    }
    if (scelta) {
      scelta = null;
      aggiornaTavolo();
    }
  });
  T.radice = h('div', { class: 'tts' }, T.barra, T.scena, T.cronaca, T.manobar, T.anteprima, T.strati);
  app.replaceChildren(T.radice);
  T.radice.classList.toggle('con-cronaca', cronacaAperta);
  adattaZoom();
}

window.addEventListener('resize', () => {
  if (T && zoomAutomatico) {
    adattaZoom();
    aggiornaTavolo();
  }
});

function adattaZoom() {
  zoomAutomatico = true;
  const largo = T.scena.clientWidth || window.innerWidth;
  zoom = Math.min(1.1, Math.max(largo < 700 ? 0.5 : 0.4, largo / TAVOLO.l));
}
function cambiaZoom(fattore) {
  zoomAutomatico = false;
  zoom = Math.min(1.6, Math.max(0.3, zoom * fattore));
  aggiornaTavolo();
}

// Da un punto dello schermo alle coordinate del tavolo.
function logico(x, y) {
  const r = T.tappeto.getBoundingClientRect();
  return { x: (x - r.left) / zoom, y: (y - r.top) / zoom };
}

// Dove finirebbe una carta lasciata in quel punto dello schermo.
function bersaglio(x, y) {
  const dentro = (el) => {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  if (dentro(T.manobar)) return { dove: 'mano', el: T.manobar };
  for (const p of T.pile) if (dentro(p.el)) return { dove: p.tipo, m: p.m, el: p.el };
  if (dentro(T.scena)) return { dove: 'tavolo', ...logico(x, y) };
  return null;
}
let illuminato = null;
function illumina(b) {
  const el = b?.el ?? null;
  if (el === illuminato) return;
  illuminato?.classList.remove('bersaglio');
  el?.classList.add('bersaglio');
  illuminato = el;
}

// Rende un elemento trascinabile. `inizio` parte quando il dito o il mouse si
// sposta davvero e restituisce { muovi, fine, annulla }; senza spostamento è un clic.
function trascinabile(el, { inizio, clic }) {
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const x0 = e.clientX;
    const y0 = e.clientY;
    let sessioneDrag = null;
    let fallita = false;
    const muovi = (ev) => {
      if (!sessioneDrag && !fallita && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) {
        sessioneDrag = inizio(e, ev);
        if (!sessioneDrag) fallita = true;
      }
      if (sessioneDrag) {
        ev.preventDefault();
        sessioneDrag.muovi(ev);
      }
    };
    const stacca = () => {
      el.removeEventListener('pointermove', muovi);
      el.removeEventListener('pointerup', fine);
      el.removeEventListener('pointercancel', annulla);
      illumina(null);
    };
    const fine = (ev) => {
      stacca();
      if (sessioneDrag) sessioneDrag.fine(ev);
      else if (!fallita) clic?.(ev);
    };
    const annulla = () => {
      stacca();
      sessioneDrag?.annulla();
    };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    el.addEventListener('pointermove', muovi);
    el.addEventListener('pointerup', fine);
    el.addEventListener('pointercancel', annulla);
  });
  el.addEventListener('click', (e) => e.stopPropagation());
}

// Trascinamento di una carta che non sta sul tavolo (mano, mazzo, scarti):
// una copia segue il puntatore e `lascia` riceve il bersaglio finale.
function fantasma(c, e, lascia) {
  const el = h('div', { class: `${classeCarta(c)} fantasma` }, faccia(c));
  el.style.transform = `scale(${zoom})`;
  T.strati.append(el);
  const metti = (ev) => {
    el.style.left = `${ev.clientX - (CARTA.l * zoom) / 2}px`;
    el.style.top = `${ev.clientY - (CARTA.a * zoom) / 2}px`;
    illumina(bersaglio(ev.clientX, ev.clientY));
  };
  metti(e);
  return {
    muovi: metti,
    fine: (ev) => {
      el.remove();
      lascia(bersaglio(ev.clientX, ev.clientY));
      finitoTrascinamento();
    },
    annulla: () => {
      el.remove();
      finitoTrascinamento();
    },
  };
}
function finitoTrascinamento() {
  if (manoDaRifare) {
    manoDaRifare = false;
    aggiornaMano();
  }
}

// Una carta del tavolo: si sposta lei stessa, e gli altri la vedono muoversi.
function cartaSulTavolo(el, id) {
  let ultimoInvio = 0;
  trascinabile(el, {
    clic: () => {
      scelta = scelta?.da === 'tavolo' && scelta.id === id ? null : { da: 'tavolo', id };
      aggiornaTavolo();
    },
    inizio: (e) => {
      const c = st.tavolo.tavolo.find((x) => x.id === id);
      if (!c) return null;
      const presa = logico(e.clientX, e.clientY);
      const dx = presa.x - c.x;
      const dy = presa.y - c.y;
      trascino = { id };
      el.classList.add('trascinata');
      const posizione = (ev) => {
        const p = logico(ev.clientX, ev.clientY);
        return {
          x: Math.min(TAVOLO.l - CARTA.l, Math.max(0, p.x - dx)),
          y: Math.min(TAVOLO.a - CARTA.a, Math.max(0, p.y - dy)),
        };
      };
      const molla = () => {
        trascino = null;
        el.classList.remove('trascinata');
      };
      return {
        muovi: (ev) => {
          const p = posizione(ev);
          el.style.left = `${p.x}px`;
          el.style.top = `${p.y}px`;
          illumina(bersaglio(ev.clientX, ev.clientY));
          if (Date.now() - ultimoInvio > 70) {
            ultimoInvio = Date.now();
            fai({ o: 'trascina', c: id, x: p.x, y: p.y });
          }
        },
        fine: (ev) => {
          const b = bersaglio(ev.clientX, ev.clientY);
          molla();
          if (b?.dove === 'mano') fai({ o: 'prendi', c: id });
          else if (b?.dove === 'scarti') fai({ o: 'scarta', c: id });
          else if (b?.dove === 'mazzo') fai({ o: 'rimetti', c: id });
          else {
            const p = posizione(ev);
            c.x = p.x;
            c.y = p.y;
            fai({ o: 'sposta', c: id, x: p.x, y: p.y });
          }
        },
        annulla: () => {
          molla();
          aggiornaTavolo();
        },
      };
    },
  });
}

// Un altro giocatore sta trascinando una carta.
function carteAltrui({ id, x, y }) {
  if (!T || !st?.tavolo) return;
  const c = st.tavolo.tavolo.find((k) => k.id === id);
  const el = T.els.get(id);
  if (!c || !el || trascino?.id === id) return;
  c.x = x;
  c.y = y;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.zIndex = 500;
}

// Un posto libero nella corsia di chi gioca, per il pulsante "Sul tavolo".
function postoLibero() {
  const t = st.tavolo;
  const larga = (TAVOLO.l - LATO_PILE) / t.giocatori.length;
  const x0 = LATO_PILE + Math.max(0, t.io) * larga + 14;
  const occupato = (x, y) => t.tavolo.some((c) => Math.abs(c.x - x) < CARTA.l - 20 && Math.abs(c.y - y) < CARTA.a - 20);
  for (let y = 48; y + CARTA.a <= TAVOLO.a; y += CARTA.a + 16) {
    for (let x = x0; x + CARTA.l <= x0 + larga - 14; x += CARTA.l + 12) {
      if (!occupato(x, y)) return { x, y };
    }
  }
  return { x: x0 + Math.random() * 60, y: 48 + Math.random() * 60 };
}

function aggiornaTavolo() {
  const t = st.tavolo;
  const io = t.io;
  const sonoHost = st.host === st.tu;
  T.radice.classList.toggle('con-cronaca', cronacaAperta);
  if (zoomAutomatico) adattaZoom();
  T.tappeto.style.transform = `scale(${zoom})`;
  T.piano.style.width = `${TAVOLO.l * zoom}px`;
  T.piano.style.height = `${TAVOLO.a * zoom}px`;

  // --- barra: giocatori, punti, turno
  const giocatore = (g, i) => {
    const presente = st.giocatori.find((x) => x.nome === g.nome)?.collegato ?? true;
    return h('span', { class: `posto${i === t.turno ? ' turno' : ''}${i === io ? ' io' : ''}${presente ? '' : ' assente'}` },
      h('button', { type: 'button', class: 'nome', title: 'Dai il turno a questo giocatore', onclick: () => fai({ o: 'turno', g: i }) },
        g.nome, i === io && ' (tu)'),
      dorsi('lav', g.lav), dorsi('for', g.for),
      h('span', { class: 'punti' },
        h('button', { type: 'button', class: 'tondo', 'aria-label': `Togli un punto a ${g.nome}`, onclick: () => fai({ o: 'punti', g: i, d: -1 }) }, '−'),
        h('button', { type: 'button', class: 'numero', title: 'Scrivi il totale', onclick: () => {
          const r = prompt(`Punti di ${g.nome} (ora ${g.punti}). Scrivi il nuovo totale, oppure +5 o -3 per aggiungere o togliere.`, '');
          if (r == null || !r.trim()) return;
          const v = Number(r.replace(',', '.'));
          if (!Number.isFinite(v)) return mostraAvviso('Scrivi un numero.');
          fai(/^\s*[+-]/.test(r) ? { o: 'punti', g: i, d: v } : { o: 'punti', g: i, v });
        } }, g.punti),
        h('button', { type: 'button', class: 'tondo', 'aria-label': `Dai un punto a ${g.nome}`, onclick: () => fai({ o: 'punti', g: i, d: 1 }) }, '+')));
  };
  riempi(T.barra, 
    h('strong', { class: 'marchio' }, 'Collocamento'),
    h('span', { class: 'secondario' }, 'Stanza ', h('b', {}, sessione.codice)),
    h('span', { class: 'posti' }, t.giocatori.map(giocatore)),
    h('button', { type: 'button', class: 'piccolo', onclick: () => fai({ o: 'turno' }) }, 'Passa il turno'),
    h('span', { class: 'spazio' }),
    !collegato && h('span', { class: 'ultimo' }, 'Connessione persa, riprovo…'),
    h('span', { class: 'zoom' },
      h('button', { type: 'button', class: 'tondo', 'aria-label': 'Rimpicciolisci il tavolo', onclick: () => cambiaZoom(1 / 1.2) }, '−'),
      h('button', { type: 'button', class: 'piccolo', title: 'Adatta il tavolo alla finestra', onclick: () => { adattaZoom(); aggiornaTavolo(); } }, `${Math.round(zoom * 100)}%`),
      h('button', { type: 'button', class: 'tondo', 'aria-label': 'Ingrandisci il tavolo', onclick: () => cambiaZoom(1.2) }, '+')),
    h('button', { type: 'button', class: 'piccolo', onclick: () => { cronacaAperta = !cronacaAperta; aggiornaTavolo(); } }, cronacaAperta ? 'Chiudi cronaca' : 'Cronaca'),
    h('button', { type: 'button', class: 'piccolo', onclick: () => {
      if (confirm('Rimettere tutte le carte nei mazzi, mescolare e ridistribuire? Punti e tavolo si azzerano.')) fai({ o: 'nuova' });
    } }, 'Ricomincia'),
    h('button', { type: 'button', class: 'piccolo', onclick: () => { regoleAperte = true; aggiornaTavolo(); } }, 'Aiuto'),
    sonoHost && h('button', { type: 'button', class: 'piccolo', onclick: () => {
      if (confirm('Sparecchiare il tavolo e tornare alla sala d’attesa?')) invia({ a: 'sala' });
    } }, 'Sala d’attesa'),
    avviso && h('div', { class: 'avviso volante', role: 'alert' }, avviso),
    regoleAperte && regole());

  // --- corsie dei giocatori: solo una guida visiva, non un confine
  const larga = (TAVOLO.l - LATO_PILE) / t.giocatori.length;
  riempi(T.corsie,
    h('div', { class: 'centro-tavolo', style: `width:${LATO_PILE}px` }),
    t.giocatori.map((g, i) => h('div', {
      class: `corsia${i === io ? ' mia' : ''}${i === t.turno ? ' turno' : ''}`,
      style: `left:${LATO_PILE + i * larga}px; width:${larga}px`,
    }, h('span', { class: 'cartello' }, g.nome, i === io && ' (tu)', i === t.turno && ' · di turno'))));

  // --- mazzi e scarti
  for (const p of T.pile) {
    const nome = p.m === 'lav' ? 'Lavoratori' : 'Ambiti';
    if (p.tipo === 'mazzo') {
      const n = t.mazzi[p.m];
      p.el.className = `pila mazzo ${p.m}${n ? '' : ' vuota'}`;
      riempi(p.el, n ? h('div', { class: `tc ${p.m} coperta` }, faccia({ t: p.m, coperta: true })) : h('span', { class: 'vuoto' }, 'Mazzo finito'));
      p.el.title = 'Tocca per pescare, trascina per mettere la carta sul tavolo';
      riempi(p.sotto, h('b', {}, nome), h('span', {}, carte(n)),
        h('button', { type: 'button', class: 'piccolo', onclick: () => fai({ o: 'mescola', m: p.m }) }, 'Mescola'));
    } else {
      const s = t.scarti[p.m];
      p.el.className = `pila scarti ${p.m}${s.n ? '' : ' vuota'}`;
      riempi(p.el, s.cima ? h('div', { class: classeCarta(s.cima) }, faccia(s.cima)) : h('span', { class: 'vuoto' }, 'Scarti'));
      p.el.title = 'Trascina qui una carta per scartarla';
      riempi(p.sotto, h('b', {}, 'Scarti'), h('span', {}, carte(s.n)),
        s.n > 0 && h('button', { type: 'button', class: 'piccolo', onclick: () => fai({ o: 'rimescola', m: p.m }) }, 'Nel mazzo'));
    }
  }

  // --- carte sul tavolo: si aggiornano quelle che ci sono già, senza ricrearle
  const viste = new Set();
  t.tavolo.forEach((c, i) => {
    viste.add(c.id);
    let el = T.els.get(c.id);
    if (!el) {
      el = h('div', {});
      T.els.set(c.id, el);
      T.carte.append(el);
      cartaSulTavolo(el, c.id);
      anteprimaSu(el, () => st.tavolo.tavolo.find((x) => x.id === c.id));
    }
    const chiave = chiaveCarta(c);
    if (el.dataset.chiave !== chiave) {
      el.dataset.chiave = chiave;
      riempi(el, ...faccia(c));
    }
    const trascinata = trascino?.id === c.id;
    el.className = `${classeCarta(c)}${scelta?.da === 'tavolo' && scelta.id === c.id ? ' scelta' : ''}${trascinata ? ' trascinata' : ''}`;
    el.style.zIndex = i + 1;
    if (!trascinata) {
      el.style.left = `${c.x}px`;
      el.style.top = `${c.y}px`;
    }
  });
  for (const [id, el] of T.els) {
    if (viste.has(id)) continue;
    el.remove();
    T.els.delete(id);
    if (trascino?.id === id) trascino = null;
    if (scelta?.da === 'tavolo' && scelta.id === id) scelta = null;
  }
  if (scelta?.da === 'mano' && !t.mano.some((c) => c.id === scelta.id)) scelta = null;

  // --- cronaca
  const righe = t.log.slice(-60).map((r) => h('li', { class: r.g < 0 ? 'sistema' : '' },
    r.g >= 0 && h('b', {}, t.giocatori[r.g]?.nome ?? '?', ' '), r.testo));
  const elenco = h('ol', { class: 'registro' }, righe);
  riempi(T.cronaca, h('span', { class: 'eti' }, 'Cronaca'), elenco);
  elenco.scrollTop = elenco.scrollHeight;

  aggiornaAzioni();
  if (T.strati.querySelector('.fantasma')) manoDaRifare = true;
  else aggiornaMano();
}

function aggiornaAzioni() {
  const t = st.tavolo;
  const bottone = (testo, op, extra = {}) => h('button', { type: 'button', class: `azione${extra.forte ? ' forte' : ''}`, onclick: () => {
    scelta = null;
    fai(op);
  } }, testo);
  let contenuto;
  if (t.io < 0) {
    contenuto = [h('span', { class: 'nota' }, 'Stai guardando il tavolo. Per giocare entra con un nome dalla sala d’attesa.')];
  } else if (scelta?.da === 'mano') {
    const id = scelta.id;
    contenuto = [
      h('span', { class: 'eti' }, 'Carta della mano:'),
      bottone('Sul tavolo', { o: 'gioca', c: id, ...postoLibero() }, { forte: true }),
      bottone('Sul tavolo coperta', { o: 'gioca', c: id, ...postoLibero(), coperta: true }),
      bottone('Scarta', { o: 'scarta', c: id }),
      bottone('In cima al mazzo', { o: 'rimetti', c: id }),
      bottone('In fondo al mazzo', { o: 'rimetti', c: id, fondo: true }),
      h('span', { class: 'nota' }, 'oppure tocca il tavolo dove vuoi metterla'),
    ];
  } else if (scelta?.da === 'tavolo') {
    const id = scelta.id;
    const c = t.tavolo.find((x) => x.id === id);
    contenuto = [
      h('span', { class: 'eti' }, 'Carta sul tavolo:'),
      bottone(c?.coperta ? 'Scopri' : 'Copri', { o: 'gira', c: id }, { forte: true }),
      bottone('In mano', { o: 'prendi', c: id }),
      bottone('Scarta', { o: 'scarta', c: id }),
      bottone('Sotto le altre', { o: 'sotto', c: id }),
      bottone('In cima al mazzo', { o: 'rimetti', c: id }),
      bottone('In fondo al mazzo', { o: 'rimetti', c: id, fondo: true }),
    ];
  } else {
    contenuto = [
      h('span', { class: 'eti' }, `La tua mano (${t.mano.length})`),
      h('span', { class: 'nota' }, 'Trascina le carte o toccane una. Tocca un mazzo per pescare.'),
    ];
  }
  riempi(T.azioni, ...contenuto);
}

function aggiornaMano() {
  const t = st.tavolo;
  const una = (c) => {
    const sel = scelta?.da === 'mano' && scelta.id === c.id;
    const el = h('div', { class: `${classeCarta(c)}${sel ? ' scelta' : ''}` }, faccia(c));
    trascinabile(el, {
      clic: () => {
        scelta = sel ? null : { da: 'mano', id: c.id };
        aggiornaTavolo();
      },
      inizio: (e) => fantasma(c, e, (b) => {
        if (b?.dove === 'tavolo') fai({ o: 'gioca', c: c.id, x: b.x - CARTA.l / 2, y: b.y - CARTA.a / 2 });
        else if (b?.dove === 'scarti') fai({ o: 'scarta', c: c.id });
        else if (b?.dove === 'mazzo') fai({ o: 'rimetti', c: c.id });
      }),
    });
    anteprimaSu(el, () => c);
    return el;
  };
  const gruppo = (k, titolo) => {
    const mie = t.mano.filter((c) => c.t === k);
    return h('div', { class: 'gruppo' }, h('span', { class: 'eti' }, `${titolo} (${mie.length})`), h('div', { class: 'fila' }, mie.map(una)));
  };
  riempi(T.mano, gruppo('lav', 'Lavoratori'), gruppo('for', 'Ambiti'));
}

// Anteprima grande della carta su cui passa il mouse (solo se scoperta).
function anteprimaSu(el, quale) {
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || trascino) return;
    const c = quale();
    if (!c || c.coperta || (!c.att && !c.lav)) return;
    riempi(T.anteprima, h('div', { class: classeCarta(c) }, faccia(c)));
    T.anteprima.classList.add('visibile');
  });
  el.addEventListener('pointerleave', () => T?.anteprima.classList.remove('visibile'));
  el.addEventListener('pointerdown', () => T?.anteprima.classList.remove('visibile'));
}

for (const s of SIMBOLI) new Image().src = `/img/sim/${s}.png`;
riprendi();
disegna();
