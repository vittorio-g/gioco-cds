// Il dorso delle carte evento di Collocamento (playtest di novembre 2026), con l'API immagini di OpenAI.
// Le Persone hanno il dorso rosa, gli Ambiti petrolio (la Ruota): gli eventi hanno il fondo panna.
// Scrive grafica/dorsi_proposte/eventi.png (fuori da git: sta su Drive). La chiave si legge da
// OPENAI_API_KEY e non va mai scritta qui.
//
// Uso:  node grafica/genera_dorso_eventi.mjs
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const USCITA = join(QUI, 'dorsi_proposte');
mkdirSync(USCITA, { recursive: true });
const FILE = join(USCITA, 'eventi.png');
const LISTINO = { testo: 5, immagineIn: 8, immagineOut: 30 }; // dollari per milione di token

export const PROMPT = `The back of a playing card (portrait, 63 x 88 mm) for the "Eventi" deck of "Collocamento", a card game about job placement. An event card changes a rule for one round and tells something true about the job market in Italy: news, laws, strikes, public funds, deadlines.

The other card backs of the game are punk-fanzine two-colour risograph illustrations: fluorescent pink and petrol-teal ink, grainy print texture, scratchy hand-drawn marker lines. This back must belong to the same deck. The other two backs are dominated by pink and by petrol teal: this one is dominated by the warm off-white paper colour.

Proposal "the news". On the off-white background a risograph collage of newspaper front pages and clippings with unreadable scribbled headlines (only lines and blocks, no real words), a megaphone, a tear-off calendar page, an alarm clock and a rubber stamp, printed in petrol teal and fluorescent pink, overlapping like a photocopied fanzine page. Across the middle a horizontal petrol-teal band carries the title.

Full-bleed design that fills the card to every edge, because it will be trimmed; keep every important element and all text well inside a 5 mm safe margin. Use only three inks: off-white (#F3ECDD), petrol teal (#17474D) and fluorescent pink (#FF3D8B). Flat printed look, no photographs, no people. The only text, spelled exactly: "COLLOCAMENTO" small and widely letter-spaced, and "EVENTI" large in bold condensed off-white capitals on the band. No other letters or numbers.`;

const chiave = (process.env.OPENAI_API_KEY ?? '').trim();
// controllata prima di usarla: un valore storto finirebbe per intero nel messaggio d'errore di fetch
if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(chiave)) throw new Error('OPENAI_API_KEY manca o non ha la forma di una chiave.');

if (existsSync(FILE)) {
  console.log(`${FILE} c'è già`);
} else {
  for (let tentativo = 1; tentativo <= 3; tentativo++) {
    const t0 = Date.now();
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chiave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-image-2.5-sunburst', prompt: PROMPT, size: '1008x1408', quality: 'max', output_format: 'png', n: 1 }),
    });
    const j = await r.json();
    if (r.ok) {
      const u = j.usage ?? {};
      const d = u.input_tokens_details ?? {};
      const spesa = ((d.text_tokens ?? u.input_tokens ?? 0) * LISTINO.testo + (d.image_tokens ?? 0) * LISTINO.immagineIn + (u.output_tokens ?? 0) * LISTINO.immagineOut) / 1e6;
      writeFileSync(FILE, Buffer.from(j.data[0].b64_json, 'base64'));
      console.log(`eventi: ${Math.round((Date.now() - t0) / 1000)}s, spesa $${spesa.toFixed(3)}`);
      break;
    }
    console.log(`eventi: errore ${r.status} ${j.error?.message ?? ''}`);
    if (!(r.status === 429 || r.status >= 500)) break;
    await new Promise((ok) => setTimeout(ok, 10000 * tentativo));
  }
}
