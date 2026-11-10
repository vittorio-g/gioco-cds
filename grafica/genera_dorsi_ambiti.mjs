// Cinque proposte per il dorso degli Ambiti, con l'API immagini di OpenAI (2/11/2026).
// Dopo il playtest di novembre un Ambito giocato coperto vale come un ambito qualsiasi: il dorso lo deve
// raccontare. Un timbro JOLLY sopra il vecchio dorso B non bastava a Vittorio: voleva
// dorsi ripensati da capo, un paio con le sei icone delle competenze e gli altri illustrati.
// Il 5/11/2026 aveva scelto la Ruota; il 10/11 l'ha sostituita con i Timbri (proposta grafica_timbri, sotto).
// Le immagini vanno in grafica/dorsi_proposte/ambiti_<nome>.png (fuori da git: stanno su Drive).
// La chiave si legge da OPENAI_API_KEY e non va mai scritta qui.
//
// Uso:  node grafica/genera_dorsi_ambiti.mjs [fascia_ruota fascia_dadi fascia_urna fascia_ventaglio ruota trama ...]
// Le due proposte con le icone usano come riferimento dorsi_proposte/rif_icone.png: le sei icone di
// grafica/dati/icone_hd come adesivi (carte_nuove.adesivo), in due file da tre, su fondo bianco.
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

export const COMUNE = `The back of a playing card (portrait, 63 x 88 mm) for the "Ambiti" deck of "Collocamento", a card game about job placement. An Ambito is a field of work or training (technical trades, services and care, organisation and management, creativity and communication, research). In the game a card played face down counts as ANY field the player chooses: this back has to tell that story visually, the idea of "any field, your choice, a wild card".

The fronts of the cards are punk-fanzine two-colour risograph illustrations: fluorescent pink and petrol-teal ink on warm off-white paper, grainy print texture, scratchy hand-drawn marker lines. This back must belong to the same deck. The Ambiti fronts have a petrol-teal background, so petrol teal is the dominant colour here.

Full-bleed design that fills the card to every edge, because it will be trimmed; keep every important element and all text well inside a 5 mm safe margin. Use only three inks: petrol teal (#17474D), fluorescent pink (#FF3D8B) and off-white (#F3ECDD). Flat printed look, no photographs, no people, no gradients other than risograph grain. Clean and readable from across a table: one strong idea, not a cluttered page.`;

// Il 10/11/2026 Vittorio ha chiesto quattro proposte con la fascia centrale, come i dorsi di Persone ed Eventi,
// mantenendo il significato della carta coperta: le proposte fascia_*, che hanno come riferimenti il dorso
// delle Persone (per la fascia) e le sei icone.
const FASCIA = `The first reference image is the back of the other deck of the same game (the "Persone" deck): copy its central band exactly, an off-white torn-paper band across the middle of the card with "COLLOCAMENTO" small and widely letter-spaced and the deck title large in bold condensed petrol-teal capitals, two small pink asterisks at its ends, and the same risograph grain and drawing style. Here the title is "AMBITI" and the background is petrol teal with the drawings in fluorescent pink and off-white, the opposite of the Persone back. The second reference image only shows the six competence symbols of the game, to copy their shapes; when they appear in a row or around a circle, keep this order: wrench, computer screen, speech bubble, checklist, four-pointed sparkle, magnifying glass. Create a brand new card back, not an edit of the references. The only text, spelled exactly: "COLLOCAMENTO" and "AMBITI" on the band, plus a question mark where the proposal asks for one.`;

// Sempre il 10/11 Vittorio ha detto che l'idea del jolly (punti di domanda, ruote, dadi) rovina il dorso: bastano le
// icone a farlo capire. Le proposte grafica_* hanno la fascia e le sei icone e riprendono la grafica delle carte,
// senza altri significati.
const COMUNE_GRAFICA = `The back of a playing card (portrait, 63 x 88 mm) for the "Ambiti" deck of "Collocamento", a card game about job placement. The back shows the six competence symbols of the game, the icons printed on every card, so that players recognise the deck at a glance. Nothing else: no question marks, no wheels, no dice, no jokers, no hidden meaning.

It must look like part of the same game as the card fronts and the other backs: punk-fanzine risograph printing with slight grain, scratchy hand-drawn marker doodles, bold condensed DIN-style capitals, sticker-like icons with a thin off-white outline. The Ambiti fronts have a petrol-teal background, so petrol teal (#17474D) is the dominant colour, with fluorescent pink (#FF3D8B) and off-white (#F3ECDD).

Full-bleed design that fills the card to every edge, because it will be trimmed; keep every important element and all text well inside a 5 mm safe margin. Flat printed look, no photographs, no people. Clean and readable from across a table.`;

// "icone": true = si passa il riferimento con le sei icone delle competenze; "fascia": true = anche il dorso delle Persone;
// "comune": un testo comune diverso da COMUNE
export const PROPOSTE = {
  grafica_adesivi: {
    fascia: true,
    comune: COMUNE_GRAFICA,
    prompt: `Proposal "the stickers". The six competence symbols as big stickers exactly like the second reference image, keeping their own colours (orange wrench, blue screen, pink speech bubble, yellow checklist, red sparkle, brown magnifying glass) and the off-white outline, as they appear on the card fronts: these six colours are the only exception to the three inks. Three stickers above the band and three below it, in order, each slightly tilted as if stuck on by hand, with a few small pink scribbled stars and sparks between them.`,
  },
  grafica_parati: {
    fascia: true,
    comune: COMUNE_GRAFICA,
    prompt: `Proposal "the wallpaper". The six competence symbols repeated as a regular all-over pattern behind the band, like a printed wallpaper or the inside of a security envelope: medium-size simple symbols in fluorescent pink and off-white on the petrol-teal background, in neat diagonal rows, always in the same order, each slightly tilted like a sticker. The band sits on top of the pattern.`,
  },
  grafica_collage: {
    fascia: true,
    comune: COMUNE_GRAFICA,
    prompt: `Proposal "the collage". A sibling of the Persone back: where that back has a collage of work tools, this one has the six competence symbols drawn big, as large fluorescent pink and off-white risograph cut-outs overlapping like a photocopied fanzine page, three above the band and three below, with scratchy marker zigzags and lightning bolts around them.`,
  },
  grafica_timbri: {
    fascia: true,
    comune: COMUNE_GRAFICA,
    prompt: `Proposal "the stamps". The six competence symbols as rubber-stamp impressions, each inside a square stamp frame, printed in fluorescent pink with uneven ink and small gaps, scattered at different angles above and below the band, some overlapping, some stamped twice slightly out of register, like the office stamps of an old job centre.`,
  },
  fascia_ruota: {
    fascia: true,
    prompt: `Proposal "the wheel behind the band". A big prize wheel with six slots fills the card, centred so that the band runs across its middle: above the band the upper half of the wheel with three of the competence symbols as stickers (wrench, computer screen, speech bubble), below the band the lower half with the other three (checklist, four-pointed sparkle, magnifying glass). The tip of a large pink spinner arrow pokes out from behind the band, mid-spin, with a few motion lines: wherever it stops, that is your field.`,
  },
  fascia_dadi: {
    fascia: true,
    prompt: `Proposal "the dice". Two big chunky risograph dice tumble across the card, one above the band and one below it, tilted, with motion lines and a few sparks, as if just thrown. Instead of dots, the visible faces of the dice show the competence symbols, a different symbol on each face: roll and you get a field.`,
  },
  fascia_urna: {
    fascia: true,
    prompt: `Proposal "the draw". Above the band a big glass raffle jar, like the ones used to draw lottery numbers, full of round tokens, each token printed with one of the six competence symbols. Below the band a few tokens that have just tumbled out, scattered, and one of them in front, larger and flipped, showing only a big question mark: it can be any of them.`,
  },
  fascia_ventaglio: {
    fascia: true,
    prompt: `Proposal "the fan of cards". Above the band a fan of six small playing cards held open, each card showing one of the six competence symbols, in order from left to right. Below the band a single card lying face down and slightly tilted, its back showing only a big question mark, with a few pink sparks around it: the covered card can be any of the six.`,
  },
  ruota: {
    icone: true,
    prompt: `Proposal "the wheel". Use the six competence symbols shown in the reference image (wrench, computer screen, speech bubble, checklist, four-pointed sparkle, magnifying glass), redrawn as off-white and pink risograph stickers with a thin off-white outline, all the same size. Arrange them evenly spaced on a big ring in the middle of the card, like the six slots of a prize wheel or a spinner, and put a large hand-drawn pink spinner arrow in the centre of the ring, mid-spin, with a few motion lines: wherever it stops, that is your field. The only text, spelled exactly: "COLLOCAMENTO" small and widely letter-spaced above the wheel, and "AMBITI" large in bold condensed capitals below it.`,
  },
  trama: {
    icone: true,
    prompt: `Proposal "the pattern". Use the six competence symbols shown in the reference image (wrench, computer screen, speech bubble, checklist, four-pointed sparkle, magnifying glass) as a tight all-over repeating pattern that covers the whole card, like the security pattern inside an envelope or a wallpaper: small simple pink symbols on the petrol-teal background, in a regular diagonal grid, each of the six repeated many times in the same order. In the centre an off-white rectangular label, like a blank name tag stuck on top of the pattern, slightly tilted: it reads "AMBITO" in bold condensed petrol-teal capitals followed by an empty hand-drawn dotted line to be filled in by hand, and above it "COLLOCAMENTO" small and widely letter-spaced. No other text.`,
  },
  modulo: {
    icone: false,
    prompt: `Proposal "the blank form". A bureaucratic job-centre application form in off-white, printed like a risograph photocopy, slightly crooked on the petrol-teal background and held by a big pink paper clip. The form has a large empty field labelled "AMBITO" with a long blank line, a few short empty lines and five empty tick boxes below it, nothing filled in. Across the form a pink rubber stamp, slightly rotated, reads "A SCELTA". At the top of the card "COLLOCAMENTO" small and widely letter-spaced. The only text, spelled exactly: "COLLOCAMENTO", "AMBITO", "A SCELTA". No other letters or numbers.`,
  },
  multiutensile: {
    icone: false,
    prompt: `Proposal "the multitool". A giant Swiss army knife drawn in the risograph fanzine style, pink with off-white highlights, opened like a fan in the centre of the card: instead of blades, each tool that folds out comes from a different field of work, one per tool: a wrench, a pencil, a paintbrush, a magnifying glass, a computer mouse, a small megaphone, a stethoscope, a ruler. One tool for any job. A few scratchy stars and sparks around it. The only text, spelled exactly: "COLLOCAMENTO" small and widely letter-spaced at the top, "AMBITI" large in bold condensed off-white capitals at the bottom.`,
  },
  passepartout: {
    icone: false,
    prompt: `Proposal "the master key". A big old-fashioned master key (a passe-partout skeleton key) drawn in the risograph fanzine style, pink with off-white highlights, diagonal across the middle of the card. Behind it, in petrol teal and off-white line work, a wall of many different doors and keyholes, like the corridor of an office building, each door slightly different (a workshop, an office, a studio, a lab, a shop). Tied to the key with a string, an off-white luggage tag that reads "AMBITI" in bold condensed petrol-teal capitals. At the top "COLLOCAMENTO" small and widely letter-spaced. The only text, spelled exactly: "COLLOCAMENTO" and "AMBITI".`,
  },
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
  const file = join(USCITA, `ambiti_${id}.png`);
  if (existsSync(file)) return;
  const { icone, fascia, comune, prompt } = PROPOSTE[id];
  const testo = `${comune ?? COMUNE}\n\n${prompt}`;
  const riferimenti = fascia ? ['B_persone.png', 'rif_icone.png'] : ['rif_icone.png'];
  const premessa = fascia ? FASCIA
    : 'The reference image only shows the six competence symbols of the game, to copy their shapes. Create a brand new card back, not an edit of the reference.';
  const png = icone || fascia
    ? await chiedi(id, () => {
      const modulo = new FormData();
      modulo.append('model', MODELLO);
      modulo.append('prompt', `${premessa}\n\n${testo}`);
      modulo.append('size', DIMENSIONE);
      modulo.append('quality', QUALITA);
      for (const nome of riferimenti) {
        modulo.append('image[]', new Blob([readFileSync(join(USCITA, nome))], { type: 'image/png' }), nome);
      }
      return fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${chiave}` }, body: modulo });
    })
    : await chiedi(id, () => fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chiave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODELLO, prompt: testo, size: DIMENSIONE, quality: QUALITA, output_format: 'png', n: 1 }),
    }));
  if (png) writeFileSync(file, png);
}));
console.log(`spesa di questo lancio $${totale.toFixed(3)}`);
