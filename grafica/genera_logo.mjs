// Tre proposte di logo per Collocamento, con l'API immagini di OpenAI. Le immagini vanno in
// grafica/logo_proposte/ (fuori da git: stanno su Drive). La chiave si legge da OPENAI_API_KEY e non va
// mai scritta qui.
//
// Uso:  node grafica/genera_logo.mjs [A B C]
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const USCITA = join(QUI, 'logo_proposte');
mkdirSync(USCITA, { recursive: true });
const MODELLO = 'gpt-image-2.5-sunburst';
const QUALITA = 'max';
const DIMENSIONE = '1536x1024';
const LISTINO = { testo: 5, immagineIn: 8, immagineOut: 30 }; // dollari per milione di token

export const COMUNE = `A logo for "Collocamento", a competitive card game about job placement: the players match people (cards called "Persone") with fields of work (cards called "Ambiti"). The name recalls the Italian "ufficio di collocamento", the old public employment office, and the game is ironic about the job market.

The game's graphic identity, which the logo must belong to: bold condensed DIN-style capitals (like Bahnschrift Bold Condensed), punk-fanzine risograph printing with slight grain, scratchy hand-drawn marker doodles (small stars, arrows, sparks), sticker-like icons with a thin off-white border. Only three inks: fluorescent pink (#FF3D8B), petrol teal (#17474D) and off-white (#F5EFE3).

Show the logo alone, flat and centred on a plain off-white background with generous empty margins: no mockup, no box, no table, no hands, no photograph. It has to stay readable when printed 3 cm wide, so keep shapes bold and simple. The only text, spelled exactly in capitals: "COLLOCAMENTO". No other letters, words or numbers.`;

export const PROPOSTE = {
  A: 'Proposal A, "il timbro": the logo is a rubber stamp of an old employment office. A slightly tilted rectangular stamp with rounded corners and a double border, printed in petrol teal with the uneven ink, small gaps and grain of a real rubber stamp. Inside it "COLLOCAMENTO" in big bold condensed capitals filling the width. Overlapping the top right corner of the stamp, a small fluorescent pink round sticker with a simple white person icon (head and shoulders), as if a card had just been approved. A couple of tiny hand-drawn pink sparks next to it.',
  // variazioni sul timbro, che Vittorio ha preferito il 30/10/2026
  A2: 'Proposal A2, "il timbro tondo": the logo is a round rubber stamp, like the official seal of an old public office. Two concentric rings printed in petrol teal with the uneven ink, small gaps and grain of a real rubber stamp. "COLLOCAMENTO" in bold condensed capitals runs along the upper arc between the rings; along the lower arc only a row of small five-pointed stars. In the centre a big simple person icon (head and shoulders) stamped in fluorescent pink, slightly out of register with the teal ring, as if stamped separately. The whole seal is tilted a few degrees.',
  A3: 'Proposal A3, "la O è una persona": a slightly tilted rectangular rubber stamp with rounded corners and a double border, printed in petrol teal with the uneven ink, small gaps and grain of a real rubber stamp. Inside it "COLLOCAMENTO" in big bold condensed capitals filling the width, where the first letter O (the second letter of the word) is a fluorescent pink filled circle with a simple off-white person icon (head and shoulders) inside, the same height as the letters, so the word still reads clearly as COLLOCAMENTO. Nothing outside the stamp except one or two tiny pink hand-drawn sparks.',
  A4: 'Proposal A4, "doppia timbratura": the word stamped twice in a hurry. A rectangular rubber stamp with rounded corners and a double border with "COLLOCAMENTO" in big bold condensed capitals, printed once in fluorescent pink and once again in petrol teal on top of it, the second impression shifted a few millimetres and rotated a couple of degrees, so the pink peeks out along the edges like a misregistered risograph print. Uneven rubber-stamp ink, small gaps and grain. A small hand-drawn pink tick mark next to the stamp, like a clerk approving a file.',
  B: 'Proposal B, "l\'incastro": a symbol above the wordmark. The symbol is a simple person silhouette (round head, shoulders) in petrol teal being lowered into a rectangular slot in a fluorescent pink block, like a piece fitting into its place, with a short hand-drawn arrow pointing down into the slot. Below it "COLLOCAMENTO" in bold condensed petrol teal capitals with a small offset shadow in fluorescent pink, a little hand-drawn star at one end. Clean and iconic, like a game publisher logo with a fanzine touch.',
  C: 'Proposal C, "la coppia di carte": two playing cards overlapping at an angle, as in a set being formed: behind, an off-white card with a petrol teal border showing a simple person silhouette; in front, a petrol teal card showing a simple wrench-and-briefcase pictogram in off-white. The two cards together sit to the left of the wordmark, or above it, whichever reads better. "COLLOCAMENTO" in bold condensed capitals, petrol teal, set on a slightly tilted fluorescent pink tape strip like a strip of masking tape stuck on a fanzine page, with a few scribbled marker stars around.',
};

const chiave = (process.env.OPENAI_API_KEY ?? '').trim();
// controllata prima di usarla: un valore storto finirebbe per intero nel messaggio d'errore di fetch
if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(chiave)) throw new Error('OPENAI_API_KEY manca o non ha la forma di una chiave.');
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
  const file = join(USCITA, `${id}.png`);
  if (existsSync(file)) return;
  const png = await chiedi(`logo ${id}`, () => fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chiave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODELLO, prompt: `${COMUNE}\n\n${PROPOSTE[id]}`, size: DIMENSIONE, quality: QUALITA, output_format: 'png', n: 1 }),
  }));
  if (png) writeFileSync(file, png);
}));
console.log(`spesa di questo lancio $${totale.toFixed(3)}`);
