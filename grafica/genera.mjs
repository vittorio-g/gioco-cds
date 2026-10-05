// Genera illustrazioni con l'API immagini di OpenAI a partire da un file JSON.
// Due forme:
// - prove di stile: "stili" x "soggetti", un'immagine per ogni coppia;
// - mazzo: "stile" unico + "dati" (elenco con un campo "soggetto"), un'immagine
//   per voce, chiamata come il campo indicato da "chiave".
// Le immagini già presenti non vengono rifatte: per rifarne una basta
// cancellarla. La chiave si legge da OPENAI_API_KEY e non va mai scritta in
// questa cartella: il repository è pubblico.
//
// Uso:  node grafica/genera.mjs grafica/lavoratori.spec.json
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// Dollari per milione di token (listino del 5/10/2026).
const LISTINO = {
  'gpt-image-2.5-flare': { testo: 5, immagineIn: 8, immagineOut: 30 },
  'gpt-image-2.5-sunburst': { testo: 5, immagineIn: 8, immagineOut: 30 },
  'gpt-image-2': { testo: 5, immagineIn: 8, immagineOut: 30 },
  'gpt-image-1-mini': { testo: 2, immagineIn: 2.5, immagineOut: 8 },
};

const chiave = process.env.OPENAI_API_KEY;
if (!chiave) throw new Error('Manca OPENAI_API_KEY.');
const fileSpec = resolve(process.argv[2] ?? '');
const spec = JSON.parse(readFileSync(fileSpec, 'utf8'));
const cartella = join(dirname(fileSpec), spec.uscita ?? '.');
mkdirSync(cartella, { recursive: true });
const fileRegistro = join(cartella, 'registro.json');
const registro = existsSync(fileRegistro) ? JSON.parse(readFileSync(fileRegistro, 'utf8')) : {};

function costo(modello, uso) {
  const l = LISTINO[modello];
  if (!l || !uso) return null;
  const dett = uso.input_tokens_details ?? {};
  const testo = dett.text_tokens ?? uso.input_tokens ?? 0;
  const immagini = dett.image_tokens ?? 0;
  return (testo * l.testo + immagini * l.immagineIn + (uso.output_tokens ?? 0) * l.immagineOut) / 1e6;
}

// L'account ha un tetto di immagini al minuto: "ritmo" è la pausa minima, in
// millisecondi, tra l'inizio di una richiesta e la successiva.
let prossimaPartenza = 0;
async function turno() {
  const ora = Date.now();
  const attesa = Math.max(0, prossimaPartenza - ora);
  prossimaPartenza = Math.max(ora, prossimaPartenza) + (spec.ritmo ?? 0);
  if (attesa) await new Promise((ok) => setTimeout(ok, attesa));
}

async function genera(nome, prompt) {
  const file = join(cartella, `${nome}.${spec.formato ?? 'png'}`);
  if (existsSync(file)) return;
  await turno();
  const corpo = {
    model: spec.modello,
    prompt,
    size: spec.dimensione ?? '1024x1024',
    quality: spec.qualita ?? 'medium',
    output_format: spec.formato ?? 'png',
    n: 1,
  };
  const t0 = Date.now();
  for (let tentativo = 1; ; tentativo++) {
    let r, j;
    try {
      r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${chiave}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      j = await r.json();
    } catch (errore) {
      // rete caduta a metà: si riprova, senza perdere il resto del mazzo
      console.log(`${nome}: rete non raggiungibile (${errore.cause?.code ?? errore.message})${tentativo < 5 ? ', riprovo' : ''}`);
      if (tentativo >= 5) return;
      await new Promise((ok) => setTimeout(ok, 10000 * tentativo));
      continue;
    }
    if (r.ok) {
      writeFileSync(file, Buffer.from(j.data[0].b64_json, 'base64'));
      registro[nome] = {
        modello: spec.modello, qualita: corpo.quality, dimensione: corpo.size,
        secondi: Math.round((Date.now() - t0) / 1000), uso: j.usage ?? null, dollari: costo(spec.modello, j.usage),
      };
      writeFileSync(fileRegistro, JSON.stringify(registro, null, 2));
      console.log(`${nome}: ${registro[nome].secondi}s, $${registro[nome].dollari?.toFixed(4) ?? '?'}`);
      return;
    }
    const riprova = (r.status === 429 || r.status >= 500) && tentativo < 4;
    console.log(`${nome}: errore ${r.status} ${j.error?.message ?? ''}${riprova ? ', riprovo' : ''}`);
    if (!riprova) return;
    await new Promise((ok) => setTimeout(ok, 8000 * tentativo));
  }
}

const lavori = [];
if (spec.dati) {
  const voci = JSON.parse(readFileSync(join(dirname(fileSpec), spec.dati), 'utf8'));
  for (const voce of voci) {
    const nome = voce[spec.chiave];
    if (spec.solo && !spec.solo.includes(nome)) continue;
    lavori.push([nome, `${spec.prima ?? ''}${voce.soggetto}${spec.dopo ?? ''}\n\nStyle: ${spec.stile}`]);
  }
} else {
  for (const [idStile, stile] of Object.entries(spec.stili)) {
    for (const [idSoggetto, soggetto] of Object.entries(spec.soggetti)) {
      if (spec.solo && !spec.solo.includes(`${idStile}_${idSoggetto}`)) continue;
      lavori.push([`${idStile}_${idSoggetto}`, `${soggetto}\n\nStyle: ${stile}`]);
    }
  }
}
const inParallelo = spec.inParallelo ?? 4;
let prossimo = 0;
await Promise.all(Array.from({ length: inParallelo }, async () => {
  while (prossimo < lavori.length) await genera(...lavori[prossimo++]);
}));

const totale = Object.values(registro).reduce((s, x) => s + (x.dollari ?? 0), 0);
console.log(`\n${Object.keys(registro).length} immagini nel registro, spesa totale $${totale.toFixed(2)}`);
