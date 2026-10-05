// Monta le carte: illustrazione, nome, battuta e icone su un modello in stile
// fanzine a due colori, e le fotografa con Edge senza finestra.
//
// Scrive in grafica/carte/:
//   lavoratori/NN.png   ambiti/<id>.png   dorso_lavoratori.png
//   dorso_ambiti.png    legenda.png
//
// Uso:  node grafica/carte.mjs            tutte le carte
//       node grafica/carte.mjs 20 archivio dorso_ambiti    solo quelle indicate
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CARTA, FILTRO, PETROLIO, ROSA, SIMBOLI } from './icone.mjs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const L = 630; // la carta è 63 x 88 mm: 10 punti per millimetro
const H = 880;
const SCALA = 1.2; // 756 x 1056 pixel, circa 300 punti per pollice

const qui = fileURLToPath(new URL('.', import.meta.url));
const url = (...pezzi) => pathToFileURL(join(qui, ...pezzi)).href;
const json = (f) => JSON.parse(readFileSync(join(qui, 'dati', f), 'utf8'));
const csv = (f) => readFileSync(join(qui, '..', 'mazzi', f), 'utf8').trim().split('\n').slice(1).map((r) => r.trim().split(','));

const attitudini = Object.fromEntries(csv('lavoratori.csv').map((r) => [r[0], r.slice(1)]));
const lavoratori = json('lavoratori.json');
const ambiti = json('ambiti.json');

const testo = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Numeri sempre uguali per la stessa carta: gli scarabocchi non cambiano a ogni montaggio.
function casuale(seme) {
  let a = [...String(seme)].reduce((x, c) => (x * 31 + c.charCodeAt(0)) | 0, 7);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCARABOCCHI = [
  'M0 -22 L6 -7 L22 -7 L9 3 L14 19 L0 9 L-14 19 L-9 3 L-22 -7 L-6 -7 Z',
  'M-26 6 Q-6 -14 20 -4 M8 -15 L21 -4 L9 8',
  'M-28 0 L-17 -9 L-6 6 L6 -9 L17 6 L28 -5',
  'M-4 -22 L-14 2 L-2 0 L-8 22 L14 -6 L2 -4 Z',
  'M-20 4 q5 -16 12 0 t12 0 t12 0',
];
function scarabocchio(rnd, x, y, colore, scala = 1) {
  const d = SCARABOCCHI[Math.floor(rnd() * SCARABOCCHI.length)];
  return `<path d="${d}" transform="translate(${x} ${y}) rotate(${Math.round(rnd() * 50 - 25)}) scale(${scala})"
    fill="none" stroke="${colore}" stroke-width="${5 / scala}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

const STILE = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Special+Elite&display=block');
  * { box-sizing: border-box; }
  html, body { margin: 0; width: ${L}px; height: ${H}px; overflow: hidden; background: ${CARTA}; }
  .foglio { position: relative; width: ${L}px; height: ${H}px; overflow: hidden; color: ${PETROLIO}; }
  .foglio > svg { position: absolute; inset: 0; }
  .targhetta {
    position: absolute; left: 12px; top: 40px; padding: 7px 16px 3px;
    font: 21px/1.1 'Special Elite', 'Courier New', monospace; letter-spacing: .08em; text-transform: uppercase;
    transform: rotate(-3.5deg); box-shadow: 4px 4px 0 var(--ombra);
  }
  .testi { position: absolute; left: 34px; top: 566px; width: 566px; height: 146px; display: flex; flex-direction: column; gap: 7px; }
  .nome {
    margin: 0; font: 400 68px/1 'Anton', Impact, 'Arial Narrow', sans-serif; text-transform: uppercase;
    letter-spacing: .01em; transform: rotate(-1.2deg); transform-origin: left center;
    text-shadow: 3.5px 3.5px 0 ${ROSA};
  }
  .battuta { margin: 0; font: 23px/1.22 'Special Elite', 'Courier New', monospace; }
  .fascia { position: absolute; left: 26px; right: 26px; bottom: 20px; height: 132px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px 0 20px; color: ${PETROLIO}; }
  .eti { font: 21px/1.1 'Special Elite', 'Courier New', monospace; letter-spacing: .1em; text-transform: uppercase; }
  .icone { display: flex; gap: 14px; }
  .icone figure { margin: 0; text-align: center; font: 15px/1 'Special Elite', 'Courier New', monospace; letter-spacing: .08em; }
  .icone img { display: block; width: 98px; height: 98px; margin-bottom: 1px; }
  .icone figure:nth-child(1) { transform: rotate(-3deg); }
  .icone figure:nth-child(3) { transform: rotate(2.5deg); }
  .lav { --ombra: ${PETROLIO}; }
  .lav .targhetta { background: ${ROSA}; color: ${PETROLIO}; }
  .amb { --ombra: ${ROSA}; }
  .amb .targhetta { background: ${PETROLIO}; color: ${CARTA}; }
  .amb .testi { color: ${CARTA}; }
`;

const DEFS = `<defs>${FILTRO}
  <filter id="grana" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.09  0 0 0 0 0.28  0 0 0 0 0.30  0 0 0 0.9 -0.42"/>
  </filter>
  <clipPath id="taglio"><polygon points="30,32 602,24 606,548 26,556"/></clipPath>
</defs>`;

// Adatta il nome: lo rimpicciolisce finché nome e battuta stanno sopra la fascia.
const ADATTA = `<script>
  document.fonts.ready.then(() => {
    const testi = document.querySelector('.testi'), nome = document.querySelector('.nome');
    if (!testi) return;
    let pt = 68;
    while (pt > 30 && (testi.scrollHeight > testi.clientHeight || nome.scrollWidth > testi.clientWidth)) nome.style.fontSize = (pt -= 2) + 'px';
  });
</script>`;

function carta({ tipo, targhetta, nome, battuta, etichetta, terna, arte, seme }) {
  const rnd = casuale(seme);
  const sotto = tipo === 'amb'
    ? `<polygon points="-20,520 650,500 650,900 -20,900" fill="${PETROLIO}" filter="url(#stampa)"/>
       <polygon points="22,726 606,718 610,862 20,866" fill="${CARTA}" filter="url(#stampa)"/>`
    : `<path d="M30 728 Q160 720 300 726 T602 722" fill="none" stroke="${PETROLIO}" stroke-width="4" stroke-linecap="round" filter="url(#stampa)"/>`;
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><style>${STILE}</style></head>
<body><div class="foglio ${tipo}">
  <svg viewBox="0 0 ${L} ${H}" width="${L}" height="${H}">${DEFS}
    ${sotto}
    <polygon points="30,32 602,24 606,548 26,556" fill="${ROSA}" transform="translate(9 9)" filter="url(#stampa)"/>
    <image href="${arte}" x="20" y="-6" width="592" height="592" preserveAspectRatio="xMidYMid slice" clip-path="url(#taglio)"/>
    <polygon points="30,32 602,24 606,548 26,556" fill="none" stroke="${PETROLIO}" stroke-width="5" stroke-linejoin="round" filter="url(#stampa)"/>
    ${scarabocchio(rnd, 566 + rnd() * 30, 40 + rnd() * 30, ROSA, 1.5)}
    ${nome.length <= 16 && battuta.length <= 44 ? scarabocchio(rnd, 548 + rnd() * 40, 676 + rnd() * 24, ROSA, 1.1) : ''}
    <rect width="${L}" height="${H}" filter="url(#grana)" opacity=".5"/>
  </svg>
  <div class="targhetta">${testo(targhetta)}</div>
  <div class="testi"><h1 class="nome">${testo(nome)}</h1><p class="battuta">${testo(battuta)}</p></div>
  <div class="fascia"><span class="eti">${etichetta}</span>
    <div class="icone">${terna.map((s) => `<figure><img src="${url('icone', `${s}.svg`)}" alt="${SIMBOLI[s].nome}">${s}</figure>`).join('')}</div>
  </div>
</div>${ADATTA}</body></html>`;
}

function dorso(tipo, titolo) {
  const fondo = tipo === 'lav' ? ROSA : PETROLIO;
  const segno = tipo === 'lav' ? PETROLIO : ROSA;
  const rnd = casuale(`dorso-${tipo}`);
  let sparsi = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 6; c++) {
      sparsi += scarabocchio(rnd, 62 + c * 102 + (r % 2) * 40 + rnd() * 20, 70 + r * 108 + rnd() * 24, segno, 1.25);
    }
  }
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><style>${STILE}
  .titolo { position: absolute; left: 0; right: 0; top: 300px; text-align: center; transform: rotate(-6deg); }
  .titolo b { display: inline-block; padding: 18px 30px 8px; background: ${CARTA}; color: ${PETROLIO};
    font: 400 96px/1 'Anton', Impact, sans-serif; text-transform: uppercase; box-shadow: 9px 9px 0 ${segno}; }
  .titolo i { display: block; margin-top: 26px; font: 26px/1 'Special Elite', 'Courier New', monospace; font-style: normal;
    letter-spacing: .3em; text-transform: uppercase; color: ${CARTA}; }
  </style></head>
<body><div class="foglio">
  <svg viewBox="0 0 ${L} ${H}" width="${L}" height="${H}">${DEFS}
    <rect width="${L}" height="${H}" fill="${fondo}"/>
    <g opacity=".85" filter="url(#stampa)">${sparsi}</g>
    <rect width="${L}" height="${H}" filter="url(#grana)" opacity=".45"/>
  </svg>
  <div class="titolo"><b>${titolo}</b><i>Collocamento</i></div>
</div></body></html>`;
}

function legenda() {
  const righe = Object.entries(SIMBOLI).map(([s, { nome }]) =>
    `<li><img src="${url('icone', `${s}.svg`)}" alt=""><b>${nome}</b><span>${s}</span></li>`).join('');
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><style>${STILE}
  .foglio { padding: 34px 36px; }
  h1 { margin: 0 0 4px; font: 400 62px/1 'Anton', Impact, sans-serif; text-transform: uppercase; text-shadow: 3.5px 3.5px 0 ${ROSA}; transform: rotate(-1.2deg); transform-origin: left; }
  ul { list-style: none; margin: 22px 0 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; }
  li { display: grid; grid-template-columns: 76px 1fr; align-items: center; column-gap: 12px; }
  li img { width: 76px; height: 76px; grid-row: span 2; }
  li b { font: 400 27px/1 'Anton', Impact, sans-serif; text-transform: uppercase; align-self: end; }
  li span { font: 17px/1 'Special Elite', 'Courier New', monospace; letter-spacing: .1em; align-self: start; padding-top: 4px; }
  p { margin: 26px 0 0; font: 21px/1.3 'Special Elite', 'Courier New', monospace; }
  </style></head>
<body><div class="foglio">
  <svg viewBox="0 0 ${L} ${H}" width="${L}" height="${H}">${DEFS}<rect width="${L}" height="${H}" filter="url(#grana)" opacity=".5"/></svg>
  <div style="position:relative">
    <h1>I simboli</h1>
    <ul>${righe}</ul>
    <p>Rosa: si trovano spesso.<br>Petrolio: si trovano meno.<br>Con la stellina: rari.</p>
  </div>
</div></body></html>`;
}

// ---------------------------------------------------------------------------
const pagine = [];
for (const l of lavoratori) {
  pagine.push({
    nome: l.n, file: `lavoratori/${l.n}.png`, arte: join(qui, 'illustrazioni', 'lav', `${l.n}.png`),
    html: (arte) => carta({
      tipo: 'lav', targhetta: `${l.genere === 'F' ? 'Lavoratrice' : 'Lavoratore'} ${l.n}`, nome: l.nome, battuta: l.battuta,
      etichetta: 'Attitudini', terna: attitudini[l.n], arte, seme: l.n,
    }),
  });
}
for (const a of ambiti) {
  pagine.push({
    nome: a.id, file: `ambiti/${a.id}.png`, arte: join(qui, 'illustrazioni', 'amb', `${a.id}.png`),
    html: (arte) => carta({ tipo: 'amb', targhetta: 'Ambito', nome: a.nome, battuta: a.battuta, etichetta: 'Competenze', terna: a.terna, arte, seme: a.id }),
  });
}
pagine.push({ nome: 'dorso_lavoratori', file: 'dorso_lavoratori.png', html: () => dorso('lav', 'Lavoratori') });
pagine.push({ nome: 'dorso_ambiti', file: 'dorso_ambiti.png', html: () => dorso('amb', 'Ambiti') });
pagine.push({ nome: 'legenda', file: 'legenda.png', html: legenda });

const richieste = process.argv.slice(2);
const daFare = pagine.filter((p) => (!richieste.length || richieste.includes(p.nome)) && (!p.arte || existsSync(p.arte)));
const saltate = pagine.filter((p) => p.arte && !existsSync(p.arte) && (!richieste.length || richieste.includes(p.nome)));

const lavoro = join(tmpdir(), 'collocamento-carte');
const uscita = join(qui, 'carte');
for (const d of ['', 'lavoratori', 'ambiti']) mkdirSync(join(uscita, d), { recursive: true });
mkdirSync(lavoro, { recursive: true });

// Un solo Edge senza finestra, comandato dal protocollo degli strumenti di
// sviluppo: si apre ogni pagina, si aspetta che i caratteri siano caricati e
// il nome adattato, poi si scatta. (Lanciato una carta alla volta con
// --screenshot, Edge torna subito e scrive il file quando gli pare.)
const PORTA = 9337;
const barre = (percorso) => percorso.split(sep).join('/');
const pausa = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function apriEdge() {
  spawn(EDGE, ['--headless', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORTA}`,
    `--user-data-dir=${barre(join(lavoro, 'edge'))}`, 'about:blank'], { detached: true, stdio: 'ignore' }).unref();
  for (let i = 0; i < 80; i++) {
    try {
      return (await (await fetch(`http://127.0.0.1:${PORTA}/json/version`)).json()).webSocketDebuggerUrl;
    } catch {
      await pausa(250);
    }
  }
  throw new Error('Edge non risponde.');
}

function collega(indirizzo) {
  const ws = new WebSocket(indirizzo);
  const attese = new Map();
  const eventi = [];
  let n = 0;
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && attese.has(m.id)) {
      const { ok, no } = attese.get(m.id);
      attese.delete(m.id);
      if (m.error) no(new Error(m.error.message));
      else ok(m.result);
    } else if (m.method) {
      for (const e of eventi.filter((x) => x.metodo === m.method)) {
        eventi.splice(eventi.indexOf(e), 1);
        e.ok(m.params);
      }
    }
  };
  const manda = (method, params = {}, sessionId) => new Promise((ok, no) => {
    attese.set(++n, { ok, no });
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });
  const evento = (metodo) => new Promise((ok) => eventi.push({ metodo, ok }));
  return new Promise((ok) => { ws.onopen = () => ok({ manda, evento, chiudi: () => ws.close() }); });
}

const edge = await collega(await apriEdge());
const { targetId } = await edge.manda('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await edge.manda('Target.attachToTarget', { targetId, flatten: true });
const scheda = (metodo, parametri) => edge.manda(metodo, parametri, sessionId);
await scheda('Page.enable');
await scheda('Emulation.setDeviceMetricsOverride', { width: L, height: H, deviceScaleFactor: SCALA, mobile: false });

for (const pagina of daFare) {
  const html = join(lavoro, `${pagina.nome}.html`);
  writeFileSync(html, pagina.html(pagina.arte ? pathToFileURL(pagina.arte).href : null));
  const caricata = edge.evento('Page.loadEventFired');
  await scheda('Page.navigate', { url: pathToFileURL(html).href });
  await caricata;
  await scheda('Runtime.evaluate', {
    expression: 'document.fonts.ready.then(() => new Promise((ok) => setTimeout(ok, 120)))', awaitPromise: true,
  });
  const { data } = await scheda('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(uscita, pagina.file), Buffer.from(data, 'base64'));
}
await edge.manda('Browser.close').catch(() => {});
edge.chiudi();

console.log(`${daFare.length} carte montate in grafica/carte/` + (saltate.length ? `, ${saltate.length} senza illustrazione: ${saltate.map((p) => p.nome).join(' ')}` : ''));
