// Tre proposte per i due dorsi di Collocamento (Lavoratori e Ambiti), con l'API immagini di OpenAI.
// Per ogni proposta si genera il dorso dei Lavoratori; quello degli Ambiti si ricava modificando il primo,
// così i due dorsi della stessa proposta restano gemelli. Le immagini vanno in grafica/dorsi_proposte/
// (fuori da git: stanno su Drive). La chiave si legge da OPENAI_API_KEY e non va mai scritta qui.
//
// Uso:  node grafica/genera_dorsi.mjs [A B C]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const USCITA = join(QUI, 'dorsi_proposte');
mkdirSync(USCITA, { recursive: true });
const MODELLO = 'gpt-image-2.5-sunburst';
const QUALITA = 'max';
const DIMENSIONE = '1008x1408'; // 63 x 88 in proporzione esatta, multipli di 16
const LISTINO = { testo: 5, immagineIn: 8, immagineOut: 30 }; // dollari per milione di token

export const COMUNE = `The back of a playing card (portrait, 63 x 88 mm) for "Collocamento", a card game about job placement. The fronts of the cards are punk-fanzine two-colour risograph illustrations: fluorescent pink and deep petrol-teal ink on warm off-white paper, grainy print texture, scratchy hand-drawn marker lines, scribbled stars, arrows, zigzags and lightning bolts. This back must clearly belong to the same deck and the same hand.

Full-bleed design that fills the card to every edge, because it will be trimmed; keep every important element well inside a 5 mm safe margin. Use only three inks: fluorescent pink (#FF3D8B), petrol teal (#17474D) and off-white (#F3ECDD). Flat printed look, no photographs, no people, no gradients other than risograph grain.

The only text on the card, spelled exactly: the word "COLLOCAMENTO" small and widely letter-spaced, and the word "LAVORATORI" large, in bold condensed capitals. No other letters or numbers.`;

export const PROPOSTE = {
  A: 'Proposal: fanzine doodles. Background in fluorescent pink. An all-over pattern of hand-drawn doodles in petrol teal (stars, arrows, zigzags, lightning bolts, small sparks), lively but not too dense, and in the centre a slightly tilted torn-paper label in off-white carrying the title in petrol teal with a small pink offset shadow, "COLLOCAMENTO" above it.',
  B: 'Proposal: cut-and-paste collage. Background in fluorescent pink. A risograph collage of silhouettes of work tools and office objects (hammer, wrench, laptop, megaphone, coffee mug, stapler, hard hat, clipboard, scissors, paint brush, magnifying glass) overlapping like a photocopied fanzine page, printed in petrol teal halftone on the pink. A horizontal off-white band across the middle carries the title in petrol teal, with "COLLOCAMENTO" just above it.',
  C: 'Proposal: rubber-stamp emblem. Background in fluorescent pink. In the centre a round emblem like a hand-printed rubber stamp in petrol teal: six simple symbols arranged in a ring (a wrench, a computer screen, a speech bubble, a checklist, a four-pointed sparkle, a magnifying glass) around the title, with "COLLOCAMENTO" curving along the ring. A thin hand-drawn double frame runs inside the card edge, and a sparse scatter of tiny stars fills the corners. Off-white for small highlights only.',
};

export const AMBITI = 'Turn this card back into its twin for the other deck of the same game. Keep the composition, the drawing style, the texture and every element exactly the same, but: replace the word "LAVORATORI" with the word "AMBITI" (spelled exactly, same lettering style), and swap the colour roles, so that petrol teal (#17474D) becomes the dominant background colour and fluorescent pink (#FF3D8B) becomes the colour of the doodles, shapes and details. Off-white stays where it is. "COLLOCAMENTO" stays unchanged. No other text.';

const chiave = process.env.OPENAI_API_KEY;
if (!chiave) throw new Error('Manca OPENAI_API_KEY.');
const scelte = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PROPOSTE);
let totale = 0;

function dollari(uso) {
  const u = uso ?? {};
  const d = u.input_tokens_details ?? {};
  return ((d.text_tokens ?? u.input_tokens ?? 0) * LISTINO.testo + (d.image_tokens ?? 0) * LISTINO.immagineIn + (u.output_tokens ?? 0) * LISTINO.immagineOut) / 1e6;
}

async function chiedi(nome, fai) {
  for (let tentativo = 1; tentativo <= 3; tentativo++) {
    const t0 = Date.now();
    const r = await fai();
    const j = await r.json();
    if (r.ok) {
      const spesa = dollari(j.usage);
      totale += spesa;
      console.log(`${nome}: ${Math.round((Date.now() - t0) / 1000)}s, $${spesa.toFixed(3)}`);
      return Buffer.from(j.data[0].b64_json, 'base64');
    }
    console.log(`${nome}: errore ${r.status} ${j.error?.message ?? ''}`);
    if (!(r.status === 429 || r.status >= 500)) return null;
    await new Promise((ok) => setTimeout(ok, 10000 * tentativo));
  }
  return null;
}

await Promise.all(scelte.map(async (id) => {
  const fileLav = join(USCITA, `${id}_lavoratori.png`);
  const fileAmb = join(USCITA, `${id}_ambiti.png`);
  if (!existsSync(fileLav)) {
    const png = await chiedi(`${id} lavoratori`, () => fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chiave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODELLO, prompt: `${COMUNE}\n\n${PROPOSTE[id]}`, size: DIMENSIONE, quality: QUALITA, output_format: 'png', n: 1 }),
    }));
    if (!png) return;
    writeFileSync(fileLav, png);
  }
  if (!existsSync(fileAmb)) {
    const png = await chiedi(`${id} ambiti`, () => {
      const modulo = new FormData();
      modulo.append('model', MODELLO);
      modulo.append('prompt', AMBITI);
      modulo.append('size', DIMENSIONE);
      modulo.append('quality', QUALITA);
      modulo.append('image[]', new Blob([readFileSync(fileLav)], { type: 'image/png' }), `${id}_lavoratori.png`);
      return fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${chiave}` }, body: modulo });
    });
    if (png) writeFileSync(fileAmb, png);
  }
}));
console.log(`spesa di questo lancio $${totale.toFixed(3)}`);
