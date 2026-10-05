// Prova il tavolo come da telefono: schermo da telefono e tocchi veri (eventi
// touch del browser, non clic del mouse), con due giocatori finti al tavolo.
//
// Serve puppeteer-core (npm install, in questa cartella) e un Edge avviato a parte:
//   msedge --headless --disable-gpu --remote-debugging-port=9333 --user-data-dir=<cartella vuota> about:blank
// Uso: node strumenti/prova_telefono.mjs [http://localhost:8791] [cartella per le immagini]
import puppeteer from 'puppeteer-core';

const base = process.argv[2] ?? 'http://localhost:8791';
const dove = process.argv[3] ?? '.';
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));
const esiti = [];
const verifica = (ok, cosa, extra = '') => { esiti.push(!!ok); console.log(ok ? '  ok ' : '  NO ', cosa, ok ? '' : extra); };

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333', defaultViewport: null });
const page = await browser.newPage();
const TELEFONO = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36');
await page.setViewport(TELEFONO);
const cdp = await page.createCDPSession();
const errori = [];
// gli errori delle estensioni del browser non riguardano la pagina
page.on('pageerror', (e) => { if (!String(e.stack).includes('chrome-extension://')) errori.push(String(e)); });
page.on('dialog', (d) => d.accept());

// Le azioni passano dal server: invece di aspettare un tempo fisso si aspetta
// che ogni richiesta partita abbia avuto la sua risposta.
await page.evaluateOnNewDocument(() => {
  window.__inAttesa = 0;
  const Vero = window.WebSocket;
  window.WebSocket = class extends Vero {
    constructor(...a) {
      super(...a);
      this.addEventListener('message', (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.t === 'stato' || m.t === 'errore') window.__inAttesa = Math.max(0, window.__inAttesa - 1);
        } catch {}
      });
    }
    send(d) {
      try {
        const m = JSON.parse(d);
        const mosse = m.op?.o === 'molte' ? m.op.ops : [m.op];
        if (m.a !== 'op' || !mosse.every((x) => x?.o === 'trascina')) window.__inAttesa++;
      } catch {}
      return super.send(d);
    }
  };
});
let piuLenta = 0;
async function quiete() {
  const t0 = Date.now();
  await attesa(150);
  while (Date.now() - t0 < 8000 && (await page.evaluate(() => window.__inAttesa > 0))) await attesa(30);
  piuLenta = Math.max(piuLenta, Date.now() - t0);
  await attesa(120);
}

const tocco = (tipo, punti) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: punti.map((p, i) => ({ x: p.x, y: p.y, id: i })) });
async function tocca(p) {
  await tocco('touchStart', [p]);
  await attesa(50);
  await tocco('touchEnd', []);
  await quiete();
}
async function trascina(a, b, { passi = 14, fermo = 60 } = {}) {
  await tocco('touchStart', [a]);
  await attesa(30);
  for (let i = 1; i <= passi; i++) {
    await tocco('touchMove', [{ x: a.x + ((b.x - a.x) * i) / passi, y: a.y + ((b.y - a.y) * i) / passi }]);
    await attesa(16);
  }
  await attesa(fermo);
  await tocco('touchEnd', []);
  await quiete();
}
async function pizzico(c, da, a, passi = 12) {
  const punti = (d) => [{ x: c.x - d, y: c.y }, { x: c.x + d, y: c.y }];
  await tocco('touchStart', [punti(da)[0]]);
  await attesa(20);
  await tocco('touchStart', punti(da));
  await attesa(30);
  for (let i = 1; i <= passi; i++) {
    await tocco('touchMove', punti(da + ((a - da) * i) / passi));
    await attesa(16);
  }
  await tocco('touchEnd', []);
  await attesa(400);
}
const centro = (sel, i = 0) => page.evaluate((s, k) => {
  const e = document.querySelectorAll(s)[k];
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.width, a: r.height, alto: r.top, sx: r.left };
}, sel, i);
const bottone = (testo) => page.evaluate((t) => {
  const e = [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.innerText.trim().startsWith(t));
  if (!e) return null;
  e.scrollIntoView({ block: 'nearest' }); // nella sala d'attesa il pulsante può stare sotto lo schermo
  const r = e.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.width, a: r.height };
}, testo);
const stato = () => page.evaluate(() => ({
  mano: document.querySelectorAll('.mano .tc').length,
  tavolo: [...document.querySelectorAll('.carte .tc')].map((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top), coperta: e.classList.contains('coperta') })),
  scorri: [Math.round(document.querySelector('.scena').scrollLeft), Math.round(document.querySelector('.scena').scrollTop)],
  scorriMano: document.querySelector('.mano').scrollLeft,
  zoom: parseFloat(document.querySelector('.zoom').textContent.replace(/[^0-9]/g, '')),
  scelte: document.querySelectorAll('.tc.scelta').length,
  anteprima: !!document.querySelector('.anteprima.visibile .tc'),
  scalaPagina: window.visualViewport?.scale ?? 1,
}));
const misure = () => page.evaluate(() => {
  const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { alto: Math.round(b.top), a: Math.round(b.height), l: Math.round(b.width) }; };
  const piccoli = [...document.querySelectorAll('.tts button')].filter((b) => b.offsetParent).map((b) => ({ t: b.innerText.trim() || b.getAttribute('aria-label'), q: b.getBoundingClientRect() }))
    .filter(({ q }) => q.height < 34 || q.width < 34).map(({ t, q }) => `${t} ${Math.round(q.width)}x${Math.round(q.height)}`);
  return { vista: [innerWidth, innerHeight], barra: r('.barra'), scena: r('.scena'), manobar: r('.manobar'), piccoli, larga: document.documentElement.scrollWidth, cartaMano: r('.mano .tc') };
});
const foto = (nome) => page.screenshot({ path: `${dove}/${nome}.png` });

// --- ingresso e sala d'attesa
await page.goto(base, { waitUntil: 'networkidle0' });
await tocca(await centro('#nome'));
await page.keyboard.type('Tel');
await tocca(await bottone('Crea una stanza nuova'));
await page.waitForSelector('.sala .scheda', { timeout: 8000 });
const codice = await page.evaluate(() => location.hash.slice(1));
const finti = ['Bruno', 'Carla'].map((nome) => {
  const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/ws/${codice}`);
  ws.onopen = () => ws.send(JSON.stringify({ a: 'entra', nome }));
  return ws;
});
await page.waitForFunction(() => document.querySelectorAll('.elenco li').length === 3, { timeout: 8000 });
await foto('tel_0_sala');
await tocca(await bottone('Apparecchia il tavolo'));
await page.waitForSelector('.tts', { timeout: 8000 });
await attesa(700);
await foto('tel_1_tavolo');

let m = await misure();
console.log('  misure', JSON.stringify(m));
verifica(m.larga <= 390, 'la pagina non scorre di lato', m.larga);
verifica(m.scena.a >= 420, `il tavolo occupa buona parte dello schermo (${m.scena.a}px su ${m.vista[1]})`);
verifica(m.piccoli.length === 0, 'tutti i pulsanti sono a misura di dito', m.piccoli.join(' | '));
let s = await stato();
verifica(s.zoom >= 70, `si parte con la propria corsia ben leggibile (zoom ${s.zoom}%)`, `zoom ${s.zoom}%`);

// --- pescare: dal pulsante sempre a portata e toccando il mazzo
let s0 = s;
await tocca(await bottone('Pesca un lavoratore'));
s = await stato();
verifica(s.mano === s0.mano + 1, 'il pulsante "Pesca un lavoratore" pesca', `${s0.mano} -> ${s.mano}`);
await tocca(await bottone('Menu'));
await tocca(await centro('.zoom .piccolo'));
await tocca(await bottone('Chiudi menu'));
s0 = await stato();
const mazzo = await centro('.pila.mazzo.for');
verifica(mazzo.x > 0 && mazzo.x < 390 && s0.zoom < 40, 'toccando lo zoom si vede tutto il tavolo, mazzi compresi', `zoom ${s0.zoom}%, mazzo a x=${Math.round(mazzo.x)}`);
await foto('tel_2_tavolo_intero');
await tocca(mazzo);
s = await stato();
verifica(s.mano === s0.mano + 1, 'toccare un mazzo pesca una carta', `${s0.mano} -> ${s.mano}`);
await tocca(await bottone('Menu'));
await tocca(await centro('.zoom .piccolo'));
await tocca(await bottone('Chiudi menu'));
s = await stato();
verifica(s.zoom >= 70, 'ritoccando lo zoom si torna alla propria corsia', `zoom ${s.zoom}%`);

// --- trascinare una carta dalla mano al tavolo
const sc = await centro('.scena');
s0 = s;
await trascina(await centro('.mano .tc'), { x: sc.x + 40, y: sc.y });
s = await stato();
verifica(s.mano === s0.mano - 1 && s.tavolo.length === 1, 'trascinare dalla mano al tavolo gioca la carta', `mano ${s0.mano} -> ${s.mano}, tavolo ${s.tavolo.length}`);
await foto('tel_3_carta_giocata');

// --- spostare una carta sul tavolo
s0 = s;
let c = await centro('.carte .tc');
await trascina(c, { x: c.x - 60, y: c.y + 120 });
s = await stato();
verifica(s.tavolo.length === 1 && Math.abs(s.tavolo[0].y - s0.tavolo[0].y) > 60, 'una carta sul tavolo si sposta col dito', JSON.stringify([s0.tavolo[0], s.tavolo[0]]));
verifica(s.scorri.join() === s0.scorri.join(), 'spostando una carta il tavolo resta fermo', `${s0.scorri} -> ${s.scorri}`);

// --- toccare una carta: azioni e anteprima grande
c = await centro('.carte .tc');
await tocca(c);
s = await stato();
const copri = await bottone('Copri');
verifica(!!copri && s.anteprima, 'toccare una carta mostra le azioni e la carta in grande', `azioni ${!!copri}, anteprima ${s.anteprima}`);
await foto('tel_4_carta_toccata');
// la carta in grande si chiude toccandola, senza che il tocco arrivi al tavolo che ha sotto
s0 = s;
await tocca(await centro('.anteprima .tc'));
s = await stato();
verifica(!s.anteprima && s.scelte === 1 && JSON.stringify(s.tavolo) === JSON.stringify(s0.tavolo) && !!(await bottone('Copri')), 'toccare la carta in grande la chiude e lascia il resto com’è', JSON.stringify(s));
if (copri) await tocca(copri);
s = await stato();
verifica(s.tavolo[0].coperta, 'il pulsante "Copri" gira la carta');

// --- spostare il tavolo col dito sul vuoto
s0 = s;
c = await centro('.carte .tc');
const vuoto = { x: c.x > 195 ? c.x - 150 : c.x + 150, y: sc.alto + 50 };
await trascina(vuoto, { x: vuoto.x - 120, y: vuoto.y + 90 });
s = await stato();
verifica(Math.abs(s.scorri[0] - s0.scorri[0]) > 60, 'col dito sul tavolo vuoto il tavolo si sposta', `${s0.scorri} -> ${s.scorri}`);
verifica(JSON.stringify(s.tavolo) === JSON.stringify(s0.tavolo) && s.mano === s0.mano, 'spostando il tavolo non si muove né si gioca nessuna carta');

// --- ingrandire il tavolo con due dita
s0 = s;
await pizzico({ x: sc.x, y: sc.alto + 70 }, 40, 110);
s = await stato();
verifica(s.zoom > s0.zoom + 5, 'allargando due dita il tavolo si ingrandisce', `${s0.zoom}% -> ${s.zoom}%`);
verifica(s.scalaPagina === 1, 'la pagina intera non si ingrandisce', s.scalaPagina);
s0 = s;
await pizzico({ x: sc.x, y: sc.alto + 70 }, 110, 50);
s = await stato();
verifica(s.zoom < s0.zoom - 5, 'stringendo due dita si rimpicciolisce', `${s0.zoom}% -> ${s.zoom}%`);
await foto('tel_5_dopo_pizzico');

// --- molte carte in mano: la mano scorre di lato senza giocare
for (let i = 0; i < 7; i++) await tocca(await bottone('Pesca un ambito'));
s0 = await stato();
const mano = await centro('.mano');
await trascina({ x: 330, y: mano.y + 10 }, { x: 80, y: mano.y + 14 });
s = await stato();
verifica(s.scorriMano > s0.scorriMano + 60, 'la mano scorre di lato col dito', `${s0.scorriMano} -> ${s.scorriMano}, carte ${s.mano}`);
verifica(s.mano === s0.mano && s.tavolo.length === s0.tavolo.length, 'scorrendo la mano non si gioca nessuna carta', `mano ${s0.mano} -> ${s.mano}`);
await foto('tel_6_mano_piena');

// --- toccare una carta della mano e poi il tavolo
s0 = s;
await tocca(await centro('.mano .tc', 4));
s = await stato();
verifica(s.scelte === 1 && s.anteprima, 'toccare una carta della mano la seleziona e la mostra in grande', `scelte ${s.scelte}, anteprima ${s.anteprima}`);
await tocca(await bottone('Menu'));
await tocca(await bottone('Chiudi menu'));
s = await stato();
verifica(!s.anteprima && s.scelte === 1 && s.mano === s0.mano, 'toccando altro la carta in grande si chiude, e la carta resta scelta', JSON.stringify(s));
await tocca({ x: sc.x - 60, y: sc.alto + sc.a - 70 });
s = await stato();
verifica(s.mano === s0.mano - 1 && s.tavolo.length === s0.tavolo.length + 1, 'poi toccare il tavolo la mette lì', `mano ${s0.mano} -> ${s.mano}`);

// --- scegliere più carte col dito
await tocca(await centro('.mano .tc', 4));
await tocca({ x: sc.x + 110, y: sc.alto + sc.a - 70 });
await tocca(await bottone('Scegli più carte'));
let quante = (await stato()).tavolo.length;
let k1 = await centro('.carte .tc', quante - 2);
let k2 = await centro('.carte .tc', quante - 1);
await tocca(k1);
await tocca(k2);
s0 = await stato();
verifica(s0.scelte === 2 && !!(await bottone('Deseleziona')), 'con "Scegli più carte" ogni tocco aggiunge una carta alla scelta', `scelte ${s0.scelte}`);
await trascina(k2, { x: k2.x + 20, y: k2.y - 160 });
s = await stato();
const spinta = (i) => [Math.round(s.tavolo[i].x - s0.tavolo[i].x), Math.round(s.tavolo[i].y - s0.tavolo[i].y)];
verifica(spinta(quante - 1)[1] < -80 && spinta(quante - 1).join() === spinta(quante - 2).join(), 'trascinandone una si spostano tutte insieme', `${spinta(quante - 2)} / ${spinta(quante - 1)}`);
await tocca(await bottone('Deseleziona'));
await tocca(await bottone('Scegli più carte'));
k1 = await centro('.carte .tc', quante - 2);
k2 = await centro('.carte .tc', quante - 1);
s0 = await stato();
await trascina({ x: Math.min(k1.x, k2.x) - 85, y: Math.min(k1.y, k2.y) - 110 }, { x: Math.max(k1.x, k2.x) + 85, y: Math.max(k1.y, k2.y) + 110 });
s = await stato();
verifica(s.scelte >= 2 && s.scorri.join() === s0.scorri.join(), 'trascinando sul tavolo si prendono le carte dentro il riquadro, e il tavolo resta fermo', `scelte ${s.scelte}, ${s0.scorri} -> ${s.scorri}`);
const coperte = s.tavolo.filter((c) => c.coperta).length;
await tocca(await bottone('Copri'));
s = await stato();
verifica(s.tavolo.filter((c) => c.coperta).length === coperte + 2 && s.scelte === 0, 'i pulsanti valgono per tutte le carte scelte');

// --- tenere una carta al bordo fa scorrere il tavolo
// (prima porto l'ultima carta giocata in vista, a sinistra)
const inVista = () => page.evaluate(() => {
  const sc = document.querySelector('.scena');
  const r = [...document.querySelectorAll('.carte .tc')].at(-1).getBoundingClientRect();
  sc.scrollLeft += r.left - 110;
  sc.scrollTop += r.top - (sc.getBoundingClientRect().top + 140);
});
await inVista();
s0 = await stato();
c = await centro('.carte .tc', s0.tavolo.length - 1);
await trascina(c, { x: 380, y: c.y }, { fermo: 900 });
s = await stato();
verifica(s.scorri[0] > s0.scorri[0] + 30, 'tenendo una carta al bordo il tavolo scorre da quella parte', `${s0.scorri} -> ${s.scorri}`);

// --- riprendere in mano una carta trascinandola giù
await inVista();
s0 = await stato();
c = await centro('.carte .tc', s0.tavolo.length - 1);
const barra = await centro('.manobar');
await trascina(c, { x: Math.max(40, Math.min(c.x, 300)), y: barra.y });
s = await stato();
verifica(s.mano === s0.mano + 1 && s.tavolo.length === s0.tavolo.length - 1, 'trascinare una carta sulla mano la riprende', `mano ${s0.mano} -> ${s.mano}`);

// --- menu
await tocca(await bottone('Menu'));
verifica((await bottone('Ricomincia')) && (await bottone('Mescola i lavoratori')), 'il menu mostra le voci secondarie');
await foto('tel_7_menu');
await tocca(await bottone('Chiudi menu'));
m = await misure();
verifica(m.piccoli.length === 0, 'anche a partita avviata i pulsanti sono a misura di dito', m.piccoli.join(' | '));

// --- telefono in orizzontale
await page.setViewport({ ...TELEFONO, width: 844, height: 390 });
await attesa(800);
m = await misure();
await foto('tel_8_orizzontale');
verifica(m.scena.a >= 190, `in orizzontale il tavolo ha spazio (${m.scena.a}px su 390)`, JSON.stringify({ barra: m.barra.a, mano: m.manobar.a }));
verifica(m.larga <= 844, 'in orizzontale la pagina non scorre di lato', m.larga);

verifica(errori.length === 0, 'nessun errore nella pagina', errori.join(' | '));
console.log(`  (risposta più lenta del server: ${piuLenta} ms)`);
for (const ws of finti) ws.close();
await page.close();
await browser.disconnect();
const no = esiti.filter((x) => !x).length;
console.log(no ? `\n${no} controlli falliti su ${esiti.length}` : `\nTutti i ${esiti.length} controlli superati`);
process.exit(no ? 1 : 0);
