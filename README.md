# Collocamento

Gioco di carte competitivo: formi dei lavoratori e li mandi a lavorare. Due mazzi, 60 lavoratori e 30 ambiti.

- **Tavolo online per provarlo:** <https://collocamento.cortivo81.workers.dev>
- **Salvataggio per Tabletop Simulator:** [tts/Collocamento.json](tts/Collocamento.json)
- **Regole:** [REGOLAMENTO.md](REGOLAMENTO.md)
- **Problemi aperti e cose da guardare nei playtest:** [BUCHI.md](BUCHI.md)

## Cosa c'è nel repository

| Cartella | Contenuto |
|---|---|
| `mazzi/` | Gli elenchi delle carte: `lavoratori.csv` (60) e `ambiti_v4.csv` (30 ambiti in 5 categorie), il mazzo in uso. `lavori_v3.csv` e `lavori_v2.csv` sono i mazzi precedenti da 60 ambiti: li usano ancora le simulazioni. |
| `webapp/` | Il tavolo online: un Worker di Cloudflare con un Durable Object per stanza. Non applica regole: le carte si muovono liberamente. |
| `webapp/public/carte/` | Le carte nella versione leggera che il tavolo mostra. |
| `webapp/public/tts/` | I fogli di carte che Tabletop Simulator scarica dal tavolo online. |
| `tts/` | Il salvataggio per Tabletop Simulator. |
| `strumenti/` | Simulazioni tra bot e prove automatiche del tavolo. |
| `grafica/` | `da_pdf.py`, che dai PDF di stampa ricava tutte le immagini, e i dati delle carte (`dati/`). Gli altri script sono quelli della prima grafica. |
| `carte/` | Il PDF del primo mazzo a due facce, superato. |

## Le immagini che non stanno qui

Le immagini pesanti della grafica sono su Google Drive, non su GitHub:

**<https://drive.google.com/drive/folders/1UkiaF48R0Z50-YaqFt-eZ8gDOUbSMj-E>**

| Cartella su Drive | Contenuto |
|---|---|
| `pdf/` | I due PDF di stampa della grafica in uso: `lavoratori_A4.pdf` e `ambiti_A4.pdf`. Da qui si rifà tutto. |
| `carte_v2/` | Le carte della grafica in uso, una per file in PNG: `lavoratori/` (60 più il dorso) e `ambiti/` (30 più il dorso). |
| `illustrazioni/` | Le illustrazioni originali della prima grafica: 60 lavoratori e 24 ambiti. |
| `carte/` | Le carte della prima grafica. |
| `prove_stile/` | Le prove dei quattro stili fatte prima di scegliere. |

La cartella è privata: si apre con l'account Google di Vittorio.

## Ripartire da un altro computer

Servono Git, Node 22 o successivo, Python 3 con PyMuPDF e Pillow, Microsoft Edge e Wrangler (`npm install -g wrangler`).

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

Conti sui mazzi e partite tra bot, con le regole scritte in `strumenti/regole.mjs`. I numeri di [BUCHI.md](BUCHI.md) vengono da qui e riguardano ancora il mazzo da 60 ambiti.

### Grafica

La grafica in uso arriva come due PDF di stampa, con nove carte per pagina. Un comando solo ne ricava tutto il resto:

```bash
py -3 -m pip install pymupdf pillow
py -3 grafica/da_pdf.py
```

Legge `grafica/pdf/lavoratori_A4.pdf` e `grafica/pdf/ambiti_A4.pdf` e scrive:

- `grafica/carte_v2/` — le carte a piena misura, una per file;
- `webapp/public/carte/` — le carte leggere per il tavolo e `indice.json`, con nomi e battute presi da `grafica/dati/`;
- `webapp/public/icone/` — le dieci icone, ritagliate dalle carte;
- `webapp/public/tts/` e `tts/Collocamento.json` — fogli e salvataggio per Tabletop Simulator.

Controlla anche che le icone stampate su ogni carta siano quelle di `mazzi/lavoratori.csv` e `mazzi/ambiti_v4.csv`: se una carta non torna si ferma e dice quale. Poi si pubblica il tavolo, perché Tabletop Simulator scarica i fogli da lì.

Se nei PDF cambiano nomi o battute, vanno corretti a mano in `grafica/dati/lavoratori.json` e `grafica/dati/ambiti_v4.json`: nei PDF il testo è disegnato, lo script non lo legge.

Gli altri script di `grafica/` (`genera.mjs`, `carte.mjs`, `esporta.py`, `icone.mjs`, `tavola.py`) sono quelli della prima grafica: generano le illustrazioni e montano le carte nel vecchio formato.

## Cosa non è nel repository

- La chiave di OpenAI e l'accesso a Cloudflare: vanno impostati su ogni computer.
- Le stanze aperte e il loro stato: stanno su Cloudflare.
- Le immagini pesanti della grafica: stanno su Drive, come spiegato sopra.
