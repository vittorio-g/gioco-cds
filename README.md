# Collocamento

Gioco di carte competitivo: formi dei lavoratori e li mandi a lavorare. Due mazzi, 60 lavoratori e 60 ambiti.

- **Tavolo online per provarlo:** <https://collocamento.cortivo81.workers.dev>
- **Regole:** [REGOLAMENTO.md](REGOLAMENTO.md)
- **Problemi aperti e cose da guardare nei playtest:** [BUCHI.md](BUCHI.md)

## Cosa c'è nel repository

| Cartella | Contenuto |
|---|---|
| `mazzi/` | Gli elenchi delle carte: `lavoratori.csv`, `lavori_v3.csv` (gli ambiti in uso, con copie ripetute), `lavori_v2.csv` (ambiti tutti diversi). |
| `webapp/` | Il tavolo online: un Worker di Cloudflare con un Durable Object per stanza. Non applica regole: le carte si muovono liberamente. |
| `webapp/public/carte/` | Le carte nella versione leggera che il tavolo mostra. |
| `strumenti/` | Simulazioni tra bot, prove automatiche del tavolo, script di servizio. |
| `grafica/` | Script, dati e icone con cui si generano le illustrazioni e si montano le carte. |
| `carte/` | Il PDF del primo mazzo a due facce, superato. |

## Le immagini che non stanno qui

Le immagini pesanti della grafica (circa 380 MB) sono su Google Drive, non su GitHub:

**<https://drive.google.com/drive/folders/1UkiaF48R0Z50-YaqFt-eZ8gDOUbSMj-E>**

| Cartella su Drive | Contenuto |
|---|---|
| `illustrazioni/` | Le 84 illustrazioni originali: 60 lavoratori e 24 ambiti. |
| `carte/` | Le carte montate, in PNG, e la versione leggera per il web. |
| `prove_stile/` | Le prove dei quattro stili fatte prima di scegliere. |

La cartella è privata: si apre con l'account Google di Vittorio.

## Ripartire da un altro computer

Servono Git, Node 22 o successivo, Python 3 con Pillow, Microsoft Edge e Wrangler (`npm install -g wrangler`).

1. **Scaricare il progetto.**
   ```bash
   git clone https://github.com/vittorio-g/gioco-cds
   ```
2. **Recuperare le immagini.** Scaricare da Drive le tre cartelle `illustrazioni`, `carte` e `prove_stile` e metterle dentro `grafica/`. Servono solo per lavorare sulla grafica: il tavolo funziona già con quello che c'è nel repository.
3. **Collegare Cloudflare.** `wrangler login`, con l'account che ospita il Worker `collocamento`.

I comandi qui sotto si danno dalla cartella del progetto.

### Tavolo online

```bash
wrangler dev --config webapp/wrangler.jsonc --port 8791
```

Si apre su <http://localhost:8791>. Per pubblicare: `wrangler deploy --config webapp/wrangler.jsonc`.

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

Tutte e tre accettano anche l'indirizzo del tavolo online. Subito dopo una pubblicazione la stanza si riavvia e una prova può fallire: basta rilanciarla.

### Simulazioni

```bash
node strumenti/analisi.mjs
```

Conti sui mazzi e partite tra bot, con le regole scritte in `strumenti/regole.mjs`. I numeri di [BUCHI.md](BUCHI.md) vengono da qui.

### Grafica

Dall'illustrazione alla carta sul tavolo i passi sono quattro:

```bash
node grafica/genera.mjs grafica/lavoratori.spec.json
node grafica/carte.mjs
py -3 grafica/esporta.py
node strumenti/porta_carte.mjs
```

1. `genera.mjs` crea le illustrazioni che mancano in `grafica/illustrazioni/`. Usa l'API immagini di OpenAI: vuole la chiave nella variabile d'ambiente `OPENAI_API_KEY` e ha un costo per immagine. Con le illustrazioni scaricate da Drive non rifà niente. Per gli ambiti il file è `grafica/ambiti.spec.json`.
2. `carte.mjs` monta le carte in `grafica/carte/`, con nome, battuta e icone presi da `grafica/dati/`.
3. `esporta.py` ne ricava la versione leggera in `grafica/carte/web/` e le tavole d'insieme.
4. `porta_carte.mjs` copia la versione leggera in `webapp/public/carte/`. Poi si pubblica.

Per cambiare un nome o una battuta basta correggere il file in `grafica/dati/` e ripartire dal passo 2: l'illustrazione resta quella.

## Cosa non è nel repository

- La chiave di OpenAI e l'accesso a Cloudflare: vanno impostati su ogni computer.
- Le stanze aperte e il loro stato: stanno su Cloudflare.
- Le immagini pesanti della grafica: stanno su Drive, come spiegato sopra.
