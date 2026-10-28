# Collocamento

Gioco di carte competitivo: formi dei lavoratori e li mandi a lavorare. Due mazzi da 60 carte, lavoratori e ambiti, con sei simboli.

- **Tavolo online per provarlo:** <https://collocamento.cortivo81.workers.dev>
- **Salvataggio per Tabletop Simulator:** [tts/Collocamento.json](tts/Collocamento.json)
- **Regole:** [REGOLAMENTO.md](REGOLAMENTO.md)
- **Problemi aperti e cose da guardare nei playtest:** [BUCHI.md](BUCHI.md)
- **Variante Carte**, il prototipo di carte in tempo reale: [regole](variante-carte/REGOLAMENTO.md)
- **Mercato del Lavoro**, il prototipo di destrezza in tempo reale: [regole](mercato-del-lavoro/REGOLAMENTO.md) e [simulazioni](mercato-del-lavoro/BUCHI.md)
- **Il documento per il pitch**, con i tre regolamenti rivisti: [che cosa è stato rivisto](pitch/REVISIONI.md); il PDF è su Drive

## Cosa c'è nel repository

| Cartella | Contenuto |
|---|---|
| `mazzi/` | Gli elenchi delle carte in uso, a sei simboli: `lavoratori.csv` (60) e `ambiti.csv` (30 ambiti in 5 categorie; nel mazzo ce ne sono due copie di ognuno, 60 carte). In `dieci_simboli/` ci sono le terne stampate sui PDF originali: servono per confronto nelle simulazioni. |
| `webapp/` | Il tavolo online: un Worker di Cloudflare con un Durable Object per stanza. Non applica regole: le carte si muovono liberamente. |
| `webapp/public/carte/` | Le carte nella versione leggera che il tavolo mostra. |
| `webapp/public/tts/` | I fogli di carte che Tabletop Simulator scarica dal tavolo online. |
| `tts/` | Il salvataggio per Tabletop Simulator. |
| `strumenti/` | Simulazioni tra bot e prove automatiche del tavolo. |
| `variante-carte/` | Il prototipo di carte in tempo reale: le regole dei designer. |
| `mercato-del-lavoro/` | Il prototipo di destrezza: le regole dei designer, un modello della partita e i risultati. |
| `pitch/` | Il documento per il pitch: i tre regolamenti (Collocamento, Variante Carte, Mercato del Lavoro) rivisti e impaginati nello stile delle carte. Sorgente LaTeX, script delle figure ed elenco delle revisioni. |
| `grafica/` | `da_pdf.py`, che dai PDF della grafica ricava tutte le immagini, e i dati delle carte (`dati/`, con i nomi dei poteri in `poteri.json`). `carte_nuove.py` disegna le carte nuove (stile scelto: B), `pnp.py` fa il print and play; `poteri.py` decide quale Persona ha quale potere. In `stampa/` i sorgenti dei PDF da stampare e, in `stampa/taglio/`, i profili per il laser. Gli altri script sono quelli della prima grafica. |
| `carte/` | Il PDF del primo mazzo a due facce, superato. |

## Le immagini che non stanno qui

Le immagini pesanti della grafica sono su Google Drive, non su GitHub:

**<https://drive.google.com/drive/folders/1UkiaF48R0Z50-YaqFt-eZ8gDOUbSMj-E>**

| Cartella su Drive | Contenuto |
|---|---|
| `pdf/` | I due PDF originali della grafica, con le terne a 10 simboli: `lavoratori_A4.pdf` e `ambiti_A4.pdf`. Da qui si rifà tutto. |
| `carte_v2/` | Le carte dei designer, a sei simboli, una per file in PNG: `lavoratori/` (60 più il dorso) e `ambiti/` (30 più il dorso). Da qui vengono i disegni degli Ambiti delle carte nuove. |
| `carte_v3/` | Le carte nuove del print and play (stile B, con l'abbondanza): `persone/` (60), `ambiti/` (30) e le due facce della carta riassunto. Si rifanno con `py -3 grafica/carte_nuove.py B`. |
| `stampa/` | I PDF da stampare, con le carte in uso: nove per pagina, fronte e retro, con i segni di taglio. |
| `stampa/collocamento_pnp.pdf` | Il print and play di Collocamento in un file solo: 18 fogli A4 da stampare fronte e retro in una volta. 60 Persone col potere, 60 Ambiti, carte riassunto e token pronti per il taglio laser, e il regolamento da piegare in un libretto A5. |
| `pitch/` | Il documento per il pitch, `regolamenti.pdf`, il regolamento di Collocamento in libretto A5 (`regolamento_a5.pdf`) e le immagini che gli servono (`img/`). |
| `illustrazioni/` | Le illustrazioni originali della prima grafica: 60 lavoratori e 24 ambiti. |
| `carte/` | Le carte della prima grafica. |
| `prove_stile/` | Le prove dei quattro stili fatte prima di scegliere. |

La cartella è privata: si apre con l'account Google di Vittorio.

## Ripartire da un altro computer

Servono Git, Node 22 o successivo, Python 3 con PyMuPDF e Pillow, pdflatex (per i PDF da stampare), Microsoft Edge e Wrangler (`npm install -g wrangler`).

1. **Scaricare il progetto.**
   ```bash
   git clone https://github.com/vittorio-g/gioco-cds
   ```
2. **Recuperare le immagini.** Scaricare da Drive la cartella `pdf` e metterla dentro `grafica/`. Serve solo per rifare la grafica: il tavolo funziona già con quello che c'è nel repository.
3. **Collegare Cloudflare.** `wrangler login`, con l'account che ospita il Worker `collocamento`.

I comandi qui sotto si danno dalla cartella del progetto.

### Tavolo online

```bash
wrangler dev --config webapp/wrangler.jsonc --port 8791
```

Si apre su <http://localhost:8791>. Per pubblicare: `wrangler deploy --config webapp/wrangler.jsonc`.

### Tabletop Simulator

`tts/Collocamento.json` è un tavolo salvato con i due mazzi coperti e le mani dei giocatori. Si copia in `Documenti/My Games/Tabletop Simulator/Saves/` e si apre dal gioco con *Games → Save & Load*. Le immagini delle carte le scarica dal tavolo online (`/tts/...`), quindi funziona anche per chi si collega alla partita. I mazzi sono in ordine di numero: vanno mescolati.

### Prove automatiche

```bash
node strumenti/prova_stanza.mjs http://localhost:8791
```

Fa sedere tre giocatori finti e controlla le azioni del tavolo. Le prove nel browser, con mouse e tocchi veri, chiedono un passo in più:

```bash
npm install --prefix strumenti
```

Poi si avvia Edge a parte, in un altro terminale, e si lanciano le due prove:

```bash
"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless --disable-gpu --remote-debugging-port=9333 --user-data-dir=<cartella vuota> about:blank
```

```bash
node strumenti/prova_computer.mjs http://localhost:8791
node strumenti/prova_telefono.mjs http://localhost:8791
```

C'è anche una prova con WebKit, il motore di Safari, in formato iPhone. Non sostituisce un iPhone vero, ma trova gli errori che dipendono dal motore:

```bash
npx --prefix strumenti playwright-core install webkit
node strumenti/prova_iphone.mjs http://localhost:8791
```

Tutte accettano anche l'indirizzo del tavolo online. Subito dopo una pubblicazione la stanza si riavvia e una prova può fallire: basta rilanciarla.

### Simulazioni

```bash
node strumenti/analisi.mjs
```

Partite tra bot con le regole di [REGOLAMENTO.md](REGOLAMENTO.md), scritte in `strumenti/regole.mjs`. I numeri di [BUCHI.md](BUCHI.md) vengono da qui. Le varianti da provare (formazioni negli scarti, una copia sola degli ambiti, ricambio del mercato, chi ha quale potere) ci sono come opzioni. Tutto insieme ci mette qualche minuto; `node strumenti/analisi.mjs valore bilancia` lancia solo alcune parti. Le parti sugli stili di gioco sono `stili`, `risposta`, `selettivi`, `adattivi` e `regole`.

### Simulazioni di Mercato del Lavoro

```bash
node mercato-del-lavoro/analisi.mjs
```

Un modello della partita del prototipo di destrezza ([regole](mercato-del-lavoro/REGOLAMENTO.md)), scritto in `mercato-del-lavoro/modello.mjs`. La fisica (quanto spesso cade qualcosa, quanto è grande la pedana) è fatta di ipotesi dichiarate in cima al file; [mercato-del-lavoro/BUCHI.md](mercato-del-lavoro/BUCHI.md) dice quali conclusioni reggono quando cambiano. Tutto insieme ci mette una decina di minuti; `node mercato-del-lavoro/analisi.mjs conti base` lancia solo alcune parti.

### Print and play di Collocamento

```bash
py -3 grafica/pnp.py
```

Scrive `grafica/stampa/collocamento_pnp.pdf`: 36 pagine, 18 fogli A4 da stampare in una volta, fronte e retro sul lato lungo, al 100%.

| Fogli | Contenuto |
|---|---|
| 1-7 | Le 60 Persone, col potere scritto sulla carta, dorsi rosa |
| 8-14 | I 60 Ambiti (due copie dei 30), dorsi petrolio |
| 15 | 4 carte riassunto (il turno; punti e poteri) e 4 token obiettivo, stampati sui due lati |
| 16-18 | Il regolamento, già imposto: si piegano i tre fogli a metà, uno dentro l'altro, e viene il libretto A5 di 12 pagine |

Carte, riassunti e token hanno un solo colore di fondo fino al bordo, 2 mm di abbondanza per lato su tutte e due le facciate e quattro crocini di registro per foglio: uno scarto del taglio non si vede. I profili di taglio sono in `grafica/stampa/taglio/` (SVG); i progetti LightBurn e le istruzioni sono nella repo `laser-designs`, cartella `designs/collocamento-print-and-play`. Senza laser si taglia a mano: lo spazio di 4 mm tra le carte basta per la taglierina.

Le carte sono quelle di `grafica/carte_nuove.py` nello stile B, scelto da Vittorio il 28 ottobre 2026: titolo stretto e grande in Bahnschrift, Persone su bianco panna, Ambiti su petrolio, icone come adesivi in colonna accanto all'illustrazione. Se `grafica/carte_v3/` manca, `pnp.py` la rifà. Le illustrazioni delle Persone vengono dagli originali (`grafica/illustrazioni/lav`) e il ritaglio tiene dentro la testa: i riquadri dei volti sono in `grafica/dati/volti.json`, e lo script si ferma se un ritaglio ne taglia uno. Le icone in alta risoluzione (`grafica/dati/icone_hd/`) le fa `grafica/icone_hd.py`. Lo stesso script, con `proposte`, rifà le tre proposte di design (A Fanzine, B Manifesto, C Schedario).

I dorsi sono quelli della proposta B di `grafica/dorsi_proposte/` (generati da `grafica/genera_dorsi.mjs`, su Drive); sul dorso delle Persone la fascia dice PERSONE (`grafica/dorso_persone.py`). Il regolamento viene da `pitch/regolamento_a5.tex`: lo script lo ricompila se il sorgente è più nuovo del PDF. Servono da Drive `grafica/illustrazioni/`, `grafica/carte_v2/` e `pitch/img/` (o `py -3 pitch/figure.py`).

I nomi dei poteri stanno in `grafica/dati/poteri.json`; quale Persona ha quale potere lo calcola `grafica/poteri.py`, col potere più utile alle Persone più difficili da formare. Li leggono sia `pnp.py` sia `pitch/figure.py`, che scrive `pitch/poteri.tex` per i documenti LaTeX.

### Documento per il pitch

```bash
py -3 pitch/figure.py
```

prepara in `pitch/img/` le immagini che il documento usa, partendo da `grafica/carte_v3/` (le carte nuove), `grafica/carte_v2/` e `grafica/illustrazioni/` (da Drive), e scrive `pitch/poteri.tex` coi nomi dei poteri. In alternativa si scarica da Drive la cartella `pitch/img`. Poi, da dentro `pitch/`, `pdflatex regolamenti.tex` (il documento del pitch) e `pdflatex regolamento_a5.tex` (il libretto di Collocamento). Serve una distribuzione LaTeX con TikZ, tcolorbox, TeX Gyre Heros e qrcode.

### Grafica

Le carte si ricavano da due PDF con nove carte per pagina, e dai due elenchi in `mazzi/`. Un comando solo fa tutto il resto:

```bash
py -3 -m pip install pymupdf pillow
py -3 grafica/da_pdf.py
```

Legge `grafica/pdf/lavoratori_A4.pdf` e `grafica/pdf/ambiti_A4.pdf` e scrive:

- `grafica/carte_v2/` — le carte a piena misura, una per file;
- `grafica/stampa/` — i PDF da stampare, fatti con pdflatex;
- `webapp/public/carte/` — le carte leggere per il tavolo, la legenda e `indice.json`, con nomi e battute presi da `grafica/dati/`;
- `webapp/public/icone/` — le icone, ritagliate dalle carte;
- `webapp/public/tts/` e `tts/Collocamento.json` — fogli e salvataggio per Tabletop Simulator.

**Le icone di ogni carta le decidono i mazzi, non i PDF.** I PDF portano ancora le terne a 10 simboli: dove `mazzi/lavoratori.csv` o `mazzi/ambiti.csv` vogliono un'icona diversa, lo script la ridisegna copiando icona e sigla da una carta che ha già quel simbolo. Per cambiare le icone di una carta basta correggere il CSV e rilanciare. Poi si pubblica il tavolo, perché Tabletop Simulator scarica i fogli da lì.

In `grafica/dati/` ci sono anche la legenda dei simboli (`legenda.png`) e il dorso dei lavoratori (`dorso_lavoratori.png`), che dice quante sono le attitudini: se cambiano i simboli vanno rifatti.

Se nei PDF cambiano nomi o battute, vanno corretti a mano in `grafica/dati/lavoratori.json` e `grafica/dati/ambiti_v4.json`: nei PDF il testo è disegnato, lo script non lo legge.

Gli altri script di `grafica/` (`genera.mjs`, `carte.mjs`, `esporta.py`, `icone.mjs`, `tavola.py`) sono quelli della prima grafica: generano le illustrazioni e montano le carte nel vecchio formato.

## Cosa non è nel repository

- La chiave di OpenAI e l'accesso a Cloudflare: vanno impostati su ogni computer.
- Le stanze aperte e il loro stato: stanno su Cloudflare.
- Le immagini pesanti della grafica: stanno su Drive, come spiegato sopra.
