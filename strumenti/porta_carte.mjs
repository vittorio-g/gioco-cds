// Porta nella webapp le carte montate dalla grafica: copia grafica/carte/web
// (immagini leggere e indice.json) e grafica/icone in webapp/public/carte.
// Va rilanciato ogni volta che la grafica rifà le carte (py -3 grafica/esporta.py).
//
// Uso:  node strumenti/porta_carte.mjs
import { cpSync, rmSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const radice = fileURLToPath(new URL('..', import.meta.url));
const da = `${radice}grafica/carte/web`;
const a = `${radice}webapp/public/carte`;

rmSync(a, { recursive: true, force: true });
cpSync(da, a, { recursive: true });
cpSync(`${radice}grafica/icone`, `${a}/icone`, { recursive: true });

const indice = JSON.parse(readFileSync(`${a}/indice.json`, 'utf8'));
const mancanti = [
  ...Object.values(indice.lavoratori).map((x) => x.file),
  ...Object.values(indice.ambiti).map((x) => x.file),
  indice.dorsi.lavoratori, indice.dorsi.ambiti, indice.legenda,
].filter((f) => !statSync(`${a}/${f}`, { throwIfNoEntry: false }));
if (mancanti.length) throw new Error(`immagini citate nell'indice ma assenti: ${mancanti.join(', ')}`);

const peso = (cartella) => readdirSync(cartella, { withFileTypes: true, recursive: true })
  .filter((f) => f.isFile()).reduce((s, f) => s + statSync(`${f.parentPath ?? f.path}/${f.name}`).size, 0);
console.log(`webapp/public/carte: ${Object.keys(indice.lavoratori).length} lavoratori, ${Object.keys(indice.ambiti).length} ambiti,`,
  `${(peso(a) / 1e6).toFixed(1)} MB`);
