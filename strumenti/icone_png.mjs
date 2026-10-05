// Ricava da grafica/icone/XX.svg le icone in PNG usate dal tavolo online
// (webapp/public/icone/XX.png). Le SVG hanno filtri che il browser ricalcola a
// ogni disegno: sul tavolo le icone sono decine e sui telefoni pesano.
//
// Come le prove nel browser, vuole puppeteer-core e un Edge avviato a parte
// con --remote-debugging-port=9333 (vedi README).
//
// Uso:  node strumenti/icone_png.mjs
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const radice = fileURLToPath(new URL('..', import.meta.url));
const da = `${radice}grafica/icone`;
const a = `${radice}webapp/public/icone`;
const LATO = 144;

mkdirSync(a, { recursive: true });
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333', defaultViewport: null });
const page = await browser.newPage();
await page.setViewport({ width: LATO, height: LATO, deviceScaleFactor: 1 });
for (const file of readdirSync(da).filter((f) => f.endsWith('.svg'))) {
  const svg = readFileSync(`${da}/${file}`).toString('base64');
  await page.setContent(`<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${svg}" style="display:block;width:${LATO}px;height:${LATO}px"></body>`);
  await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0);
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: LATO, height: LATO } });
  writeFileSync(`${a}/${file.replace('.svg', '.png')}`, png);
  console.log(`${file} -> ${file.replace('.svg', '.png')} (${png.length} byte)`);
}
await page.close();
await browser.disconnect();
