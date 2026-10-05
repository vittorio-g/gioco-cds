// Prova il tavolo da computer, col mouse: clic, trascinamenti, anteprima, zoom.
//
// Serve puppeteer-core (npm install, in questa cartella) e un Edge avviato a parte:
//   msedge --headless --disable-gpu --remote-debugging-port=9333 --user-data-dir=<cartella vuota> about:blank
// Uso: node strumenti/prova_computer.mjs [http://localhost:8791] [cartella per le immagini]
import puppeteer from 'puppeteer-core';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

const base = process.argv[2] ?? 'http://localhost:8791';
const dove = process.argv[3] ?? '.';
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));
const esiti = [];
const verifica = (ok, cosa, extra = '') => { esiti.push(!!ok); console.log(ok ? '  ok ' : '  NO ', cosa, ok ? '' : extra); };

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333', defaultViewport: null });
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
const errori = [];
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
          if (m.t === 'stato') window.__stati = (window.__stati ?? 0) + 1;
        } catch {}
      });
    }
    send(d) {
      try {
        const m = JSON.parse(d);
        if (m.a !== 'op' || m.op?.o !== 'trascina') window.__inAttesa++;
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
const centro = (sel, i = 0) => page.evaluate((s, k) => { const e = document.querySelectorAll(s)[k]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, alto: r.top, a: r.height }; }, sel, i);
const bottone = (t) => page.evaluate((x) => { const e = [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.innerText.trim().startsWith(x)); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, t);
const stato = () => page.evaluate(() => ({
  mano: document.querySelectorAll('.mano .tc').length,
  tavolo: [...document.querySelectorAll('.carte .tc')].map((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) })),
  scorri: [Math.round(document.querySelector('.scena').scrollLeft), Math.round(document.querySelector('.scena').scrollTop)],
  zoom: parseFloat(document.querySelector('.zoom').innerText.replace(/[^0-9]/g, '')),
  anteprima: !!document.querySelector('.anteprima.visibile .tc'),
}));
async function trascina(a, b) {
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) { await page.mouse.move(a.x + ((b.x - a.x) * i) / 10, a.y + ((b.y - a.y) * i) / 10); await attesa(12); }
  await page.mouse.up();
  await quiete();
}

await page.goto(base, { waitUntil: 'networkidle0' });
await page.click('#nome', { clickCount: 3 });
await page.keyboard.type('Pc');
let b = await bottone('Crea una stanza nuova');
await page.mouse.click(b.x, b.y);
await page.waitForSelector('.sala .scheda');
const codice = await page.evaluate(() => location.hash.slice(1));
// il QR dell'invito: lo si fotografa e lo si decodifica come farebbe un telefono
const leggiQR = async (selettore) => {
  const png = PNG.sync.read(Buffer.from(await (await page.$(selettore)).screenshot()));
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null;
};
const lettoInSala = await leggiQR('.sala .qr');
await page.screenshot({ path: `${dove}/pc_sala.png` });
verifica(lettoInSala === `${base}/#${codice}`, 'il QR della sala d’attesa porta al link della stanza', `letto: ${lettoInSala}`);
const finti = ['Bruno', 'Carla'].map((nome) => {
  const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/ws/${codice}`);
  ws.onopen = () => ws.send(JSON.stringify({ a: 'entra', nome }));
  ws.onmessage = (e) => { try { const m = JSON.parse(e.data); if (m.t === 'stato') ws.stato = m; } catch {} };
  return ws;
});
await page.waitForFunction(() => document.querySelectorAll('.elenco li').length === 3);
b = await bottone('Apparecchia il tavolo');
await page.mouse.click(b.x, b.y);
await page.waitForSelector('.tts');
await attesa(600);

verifica(!(await bottone('Menu')) && (await bottone('Ricomincia')) && (await bottone('Mescola')), 'al computer le voci stanno nella barra e sotto i mazzi, senza menu');
let s0 = await stato();
verifica(s0.zoom > 60 && s0.scorri[0] === 0, `si vede tutto il tavolo in larghezza (zoom ${s0.zoom}%)`);
const mazzo = await centro('.pila.mazzo.lav');
await page.mouse.click(mazzo.x, mazzo.y);
await quiete();
let s = await stato();
verifica(s.mano === s0.mano + 1, 'un clic sul mazzo pesca', `${s0.mano} -> ${s.mano}`);
const sc = await centro('.scena');
await trascina(await centro('.mano .tc'), { x: sc.x, y: sc.y });
s0 = s; s = await stato();
verifica(s.tavolo.length === 1 && s.mano === s0.mano - 1, 'trascinare col mouse dalla mano al tavolo gioca la carta');
let c = await centro('.carte .tc');
await trascina(c, { x: c.x + 150, y: c.y - 60 });
s0 = s; s = await stato();
verifica(Math.abs(s.tavolo[0].x - s0.tavolo[0].x) > 100, 'una carta si sposta col mouse', JSON.stringify([s0.tavolo, s.tavolo]));
c = await centro('.carte .tc');
await page.mouse.move(c.x, c.y);
await attesa(200);
verifica((await stato()).anteprima, 'passando il mouse su una carta compare l’anteprima grande');

// --- l'anteprima segue quello che c'è sotto il mouse, anche quando il mouse sta fermo
const finche = async (cond, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await cond()) return true; await attesa(40); } return false; };
const bruno = finti[0];
// un'azione di Bruno, aspettando che il tavolo del computer l'abbia ricevuta
const faBruno = async (op) => {
  const n = await page.evaluate(() => window.__stati ?? 0);
  bruno.send(JSON.stringify({ a: 'op', op }));
  await finche(() => page.evaluate((k) => (window.__stati ?? 0) > k, n));
  await attesa(150);
};
await finche(() => bruno.stato?.tavolo?.tavolo.length === 1);
const idCarta = bruno.stato.tavolo.tavolo[0].id;
await faBruno({ o: 'gira', c: idCarta });
verifica(!(await stato()).anteprima, 'se un altro copre la carta che ho sotto il mouse, l’anteprima si chiude');
await faBruno({ o: 'gira', c: idCarta });
verifica((await stato()).anteprima, 'e ricompare quando la carta torna scoperta');
await faBruno({ o: 'prendi', c: idCarta });
s = await stato();
verifica(s.tavolo.length === 0 && !s.anteprima, 'se un altro prende la carta che ho sotto il mouse, l’anteprima si chiude', JSON.stringify(s));

c = await centro('.mano .tc');
await page.mouse.move(c.x, c.y);
await attesa(200);
const sullaMano = (await stato()).anteprima;
await faBruno({ o: 'pesca', m: 'for' }); // ogni azione degli altri ridisegna la mia mano
const dopoRidisegno = (await stato()).anteprima;
await page.mouse.move(sc.x - 250, sc.alto + 60); // via in un salto solo, senza passare dal bordo della carta
await attesa(200);
verifica(sullaMano && dopoRidisegno && !(await stato()).anteprima, 'dopo che la mano è stata ridisegnata, togliendo il mouse l’anteprima si chiude', `sulla mano ${sullaMano}, dopo il ridisegno ${dopoRidisegno}`);

await trascina(await centro('.mano .tc'), { x: sc.x + 150, y: sc.y - 60 });
c = await centro('.carte .tc');
const scarti = await centro('.pila.scarti.lav');
await page.mouse.move(c.x, c.y);
await page.mouse.down();
for (let i = 1; i <= 10; i++) { await page.mouse.move(c.x + ((scarti.x - c.x) * i) / 10, c.y + ((scarti.y - c.y) * i) / 10); await attesa(12); }
await page.mouse.up();
await page.mouse.move(scarti.x + 3, scarti.y + 2); // la mano trema appena lasciata la carta
await quiete();
s = await stato();
verifica(s.tavolo.length === 0 && !s.anteprima, 'scartando una carta col mouse l’anteprima non resta aperta', JSON.stringify(s));

await trascina(await centro('.mano .tc'), { x: sc.x + 150, y: sc.y - 60 });
const lasciata = (await stato()).anteprima;
await page.evaluate(() => window.dispatchEvent(new Event('blur')));
verifica(lasciata && !(await stato()).anteprima, 'la carta appena posata si vede in grande, e l’anteprima si chiude quando la finestra perde il mouse', `appena posata ${lasciata}`);
await page.mouse.move(sc.x + 152, sc.y - 58);
await attesa(200);
s0 = await stato();
await trascina({ x: sc.x - 250, y: sc.alto + 60 }, { x: sc.x - 250, y: sc.alto - 60 + 0 });
s = await stato();
verifica(s.scorri[1] > s0.scorri[1] + 40 && JSON.stringify(s.tavolo) === JSON.stringify(s0.tavolo), 'trascinando lo sfondo col mouse il tavolo si sposta', `${s0.scorri} -> ${s.scorri}`);
s0 = s;
await page.mouse.move(sc.x, sc.y);
await page.keyboard.down('Control');
await page.mouse.wheel({ deltaY: -240 });
await page.keyboard.up('Control');
await attesa(300);
s = await stato();
verifica(s.zoom > s0.zoom + 5, 'Ctrl + rotella ingrandisce il tavolo', `${s0.zoom}% -> ${s.zoom}%`);
b = await bottone('Invita');
await page.mouse.click(b.x, b.y);
await attesa(300);
const lettoAlTavolo = await leggiQR('.velo .qr');
verifica(lettoAlTavolo === `${base}/#${codice}`, 'anche a tavolo apparecchiato "Invita" mostra il QR giusto', `letto: ${lettoAlTavolo}`);
await page.screenshot({ path: `${dove}/pc_invito.png` });
b = await bottone('Chiudi');
await page.mouse.click(b.x, b.y);
await attesa(200);
verifica(!(await page.$('.velo')), 'la finestra di invito si chiude');
await page.screenshot({ path: `${dove}/pc_tavolo.png` });
verifica(errori.length === 0, 'nessun errore nella pagina', errori.join(' | '));
console.log(`  (risposta più lenta del server: ${piuLenta} ms)`);
for (const ws of finti) ws.close();
await page.close();
await browser.disconnect();
const no = esiti.filter((x) => !x).length;
console.log(no ? `\n${no} controlli falliti su ${esiti.length}` : `\nTutti i ${esiti.length} controlli superati`);
process.exit(no ? 1 : 0);
