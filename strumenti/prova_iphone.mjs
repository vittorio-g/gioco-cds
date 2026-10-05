// Prova il tavolo con WebKit, il motore di Safari, in formato iPhone.
// Non è un iPhone vero: trova gli errori e le differenze di disegno che
// dipendono dal motore, non quelle del dito sullo schermo.
//
// Serve playwright-core (npm install, in questa cartella) e il suo WebKit:
//   npx playwright-core install webkit
// Uso: node strumenti/prova_iphone.mjs [http://localhost:8791] [cartella per le immagini]
import { webkit, devices } from 'playwright-core';

const base = process.argv[2] ?? 'http://localhost:8791';
const dove = process.argv[3] ?? '.';
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));
const esiti = [];
const verifica = (ok, cosa, extra = '') => { esiti.push(!!ok); console.log(ok ? '  ok ' : '  NO ', cosa, ok ? '' : extra); };

const browser = await webkit.launch();
const contesto = await browser.newContext({ ...devices['iPhone 14'] });
const page = await contesto.newPage();
const errori = [];
page.on('pageerror', (e) => errori.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });
page.on('dialog', (d) => d.accept());
const falliti = [];
page.on('requestfailed', (r) => falliti.push(r.url()));
page.on('response', (r) => { if (r.status() >= 400) falliti.push(`${r.status()} ${r.url()}`); });

const stato = () => page.evaluate(() => ({
  mano: document.querySelectorAll('.mano .tc').length,
  tavolo: document.querySelectorAll('.carte .tc').length,
  scelte: document.querySelectorAll('.tc.scelta').length,
  anteprima: !!document.querySelector('.anteprima.visibile .tc'),
}));
const tocca = async (selettoreOTesto, n = 0) => {
  const el = selettoreOTesto.startsWith('.') || selettoreOTesto.startsWith('#')
    ? page.locator(selettoreOTesto).nth(n)
    : page.getByRole('button', { name: selettoreOTesto }).first();
  await el.scrollIntoViewIfNeeded();
  await el.tap();
  await attesa(500);
};

console.log('  motore:', browser.version(), '-', devices['iPhone 14'].viewport);
await page.goto(base, { waitUntil: 'networkidle' });
const campo = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#nome')).fontSize));
verifica(campo >= 16, `il campo del nome ha il carattere a ${campo}px: l'iPhone non ingrandisce la pagina`);
await page.locator('#nome').fill('iPhone');
await tocca('Crea una stanza nuova');
await page.waitForSelector('.sala .scheda');
await attesa(600);
verifica(await page.locator('.sala .qr svg').count() === 1, 'in sala d’attesa c’è il QR');
await page.screenshot({ path: `${dove}/ios_0_sala.png` });
await tocca('Apparecchia il tavolo');
await page.waitForSelector('.tts');
await attesa(1200);

const m = await page.evaluate(() => {
  const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { alto: Math.round(b.top), a: Math.round(b.height), l: Math.round(b.width) }; };
  const immagini = [...document.images].filter((i) => i.offsetParent);
  return {
    vista: [innerWidth, innerHeight],
    barra: r('.barra'), scena: r('.scena'), manobar: r('.manobar'),
    paginaFerma: getComputedStyle(document.body).position === 'fixed' && document.documentElement.scrollHeight <= innerHeight + 1,
    vistaMeta: document.querySelector('meta[name=viewport]').content,
    immaginiRotte: immagini.filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src),
    nImmagini: immagini.length,
    toccoScena: getComputedStyle(document.querySelector('.scena')).touchAction,
    toccoTavolo: getComputedStyle(document.querySelector('.tts')).touchAction,
  };
});
console.log('  misure', JSON.stringify(m));
verifica(m.barra.alto === 0 && m.manobar.alto + m.manobar.a <= m.vista[1] + 1, 'barra in alto e mano in basso stanno dentro lo schermo', JSON.stringify(m));
verifica(m.scena.a >= 400, `il tavolo occupa buona parte dello schermo (${m.scena.a}px su ${m.vista[1]})`);
verifica(m.paginaFerma, 'al tavolo la pagina è ferma: non scorre e non rimbalza');
verifica(/maximum-scale=1/.test(m.vistaMeta), 'al tavolo lo zoom della pagina è bloccato');
verifica(m.immaginiRotte.length === 0 && m.nImmagini >= 6, `tutte le immagini sono caricate (${m.nImmagini})`, m.immaginiRotte.join(' | '));
verifica(m.toccoScena === 'none' && m.toccoTavolo.includes('pan-x'), 'il motore di Safari accetta le regole sul tocco', `${m.toccoScena} / ${m.toccoTavolo}`);
await page.screenshot({ path: `${dove}/ios_1_tavolo.png` });

let s0 = await stato();
await tocca('Pesca un lavoratore');
let s = await stato();
verifica(s.mano === s0.mano + 1, 'toccare "Pesca un lavoratore" pesca', `${s0.mano} -> ${s.mano}`);

s0 = s;
await tocca('.mano .tc', 0);
s = await stato();
verifica(s.scelte === 1 && s.anteprima, 'toccare una carta della mano la seleziona e la mostra in grande', JSON.stringify(s));
await page.screenshot({ path: `${dove}/ios_2_carta_scelta.png` });
const sc = await page.locator('.scena').boundingBox();
await page.touchscreen.tap(sc.x + sc.width / 2, sc.y + sc.height / 2);
await attesa(600);
s = await stato();
verifica(s.tavolo === 1 && s.mano === s0.mano - 1, 'poi toccare il tavolo la mette lì', JSON.stringify(s));

await tocca('.carte .tc', 0);
verifica(await page.getByRole('button', { name: 'Copri' }).count() === 1, 'toccare una carta del tavolo mostra le azioni');
await tocca('Copri');
verifica(await page.locator('.carte .tc.coperta').count() === 1, 'il pulsante "Copri" gira la carta');
await page.screenshot({ path: `${dove}/ios_3_carta_coperta.png` });

// trascinare con un puntatore (WebKit qui non simula il dito che striscia)
const carta = await page.locator('.carte .tc').first().boundingBox();
await page.mouse.move(carta.x + carta.width / 2, carta.y + carta.height / 2);
await page.mouse.down();
await page.mouse.move(carta.x + carta.width / 2 - 60, carta.y + carta.height / 2 + 90, { steps: 8 });
await page.mouse.up();
await attesa(600);
const dopo = await page.locator('.carte .tc').first().boundingBox();
verifica(Math.abs(dopo.y - carta.y) > 50, 'una carta trascinata si sposta', `${Math.round(carta.y)} -> ${Math.round(dopo.y)}`);

// la connessione si rifà quando il telefono torna in rete
s0 = await stato();
await page.evaluate(() => window.dispatchEvent(new Event('online')));
await attesa(1800);
s = await stato();
verifica(s.mano === s0.mano && s.tavolo === s0.tavolo && !(await page.getByText('Connessione persa').count()), 'dopo una riconnessione ritrovo mano e tavolo', JSON.stringify(s));

await tocca('Menu');
await tocca('Invita');
verifica(await page.locator('.velo .qr svg').count() === 1, 'il QR si vede anche dietro "Invita"');
await page.screenshot({ path: `${dove}/ios_4_invito.png` });
await tocca('Chiudi');

verifica(falliti.length === 0, 'nessun file mancante', falliti.join(' | '));
verifica(errori.length === 0, 'nessun errore nella pagina', errori.join(' | '));
await browser.close();
const no = esiti.filter((x) => !x).length;
console.log(no ? `\n${no} controlli falliti su ${esiti.length}` : `\nTutti i ${esiti.length} controlli superati`);
process.exit(no ? 1 : 0);
