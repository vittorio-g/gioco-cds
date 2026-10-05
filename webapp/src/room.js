import { DurableObject } from 'cloudflare:workers';
import { MAZZI } from './decks.js';
import { Rifiuto, nuovoTavolo, aggiungiGiocatore, esegui, vista } from './tavolo.js';

const MAX_GIOCATORI = 5;
const SCADENZA = 7 * 24 * 3600 * 1000; // una stanza ferma da una settimana si cancella

// Cambia quando cambia la forma dello stato salvato: una stanza rimasta
// aperta con una versione vecchia torna in sala d'attesa invece di rompersi.
const VERSIONE = 3;

const OPZIONI = { mazzo: 'v3', lavoratori: 2, carte: 2 };
const vuota = () => ({ v: VERSIONE, giocatori: [], opzioni: { ...OPZIONI }, tavolo: null });
const uguale = (a, b) => a.toLowerCase() === b.toLowerCase();

function pulisci(o = {}) {
  const tra = (v, ammessi, base) => (ammessi.includes(v) ? v : base);
  return {
    mazzo: Object.hasOwn(MAZZI, o.mazzo) ? o.mazzo : OPZIONI.mazzo,
    lavoratori: tra(o.lavoratori, [0, 1, 2, 3, 4, 5], OPZIONI.lavoratori),
    carte: tra(o.carte, [0, 1, 2, 3, 4, 5], OPZIONI.carte),
  };
}

// Una stanza = un tavolo. I giocatori si riconoscono dal nome: chi rientra
// con lo stesso nome ritrova il suo posto e la sua mano.
export class Stanza extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.st = vuota();
    // il segnale di vita dei telefoni riceve risposta senza svegliare la stanza
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    ctx.blockConcurrencyWhile(async () => {
      const st = (await ctx.storage.get('st')) ?? vuota();
      this.st = st.v === VERSIONE ? st : { ...vuota(), giocatori: (st.giocatori ?? []).map((g) => ({ nome: g.nome })) };
    });
  }

  async fetch() {
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, dati) {
    if (dati === 'ping') return ws.send('pong');
    let msg;
    try {
      msg = JSON.parse(dati);
    } catch {
      return;
    }
    try {
      await this.gestisci(ws, msg ?? {});
    } catch (e) {
      if (!(e instanceof Rifiuto)) console.error(e);
      const testo = e instanceof Rifiuto ? e.message : 'Errore interno: l’azione non è stata eseguita.';
      ws.send(JSON.stringify({ t: 'errore', testo, codice: e.codice ?? null }));
    }
  }

  webSocketClose(ws) {
    this.diffondi(ws);
  }

  webSocketError(ws) {
    this.diffondi(ws);
  }

  async alarm() {
    for (const ws of this.ctx.getWebSockets()) ws.close(1000, 'Stanza scaduta');
    await this.ctx.storage.deleteAll();
    this.st = vuota();
  }

  mazzo() {
    return MAZZI[this.st.opzioni.mazzo];
  }

  async gestisci(ws, msg) {
    if (msg.a === 'entra') return this.entra(ws, msg);
    const chi = ws.deserializeAttachment();
    if (!chi) throw new Rifiuto('Prima entra nella stanza.');

    // Un'azione sul tavolo: la più frequente, e l'unica che può non essere salvata.
    if (msg.a === 'op') {
      const tavolo = this.st.tavolo;
      if (!tavolo) throw new Rifiuto('Il tavolo non è ancora apparecchiato.');
      const p = tavolo.giocatori.findIndex((g) => g.nome === chi.nome);
      if (p < 0) throw new Rifiuto('Stai guardando il tavolo senza essere seduto.');
      const op = msg.op ?? {};
      if (op.o === 'trascina') {
        // movimento in corso: aggiorna la posizione in memoria e avvisa solo gli altri
        try {
          esegui(tavolo, this.mazzo(), p, op);
        } catch {
          return; // la carta nel frattempo è stata presa da un altro
        }
        const c = tavolo.tavolo.at(-1);
        this.aTutti({ t: 'trascina', id: c.id, x: c.x, y: c.y }, ws);
        return;
      }
      const st = structuredClone(this.st);
      esegui(st.tavolo, this.mazzo(), p, op);
      await this.salva(st);
      return this.diffondi();
    }

    const st = structuredClone(this.st);
    const host = st.giocatori[0]?.nome === chi.nome;
    const soloHost = () => {
      if (!host) throw new Rifiuto(`Può farlo solo ${st.giocatori[0]?.nome ?? 'chi ha creato la stanza'}.`);
    };

    if (msg.a === 'opzioni') {
      soloHost();
      if (st.tavolo) throw new Rifiuto('Le opzioni si cambiano dalla sala d’attesa.');
      st.opzioni = pulisci(msg.opzioni);
    } else if (msg.a === 'togli') {
      soloHost();
      if (st.tavolo) throw new Rifiuto('Il tavolo è già apparecchiato.');
      st.giocatori = st.giocatori.filter((g, i) => i === 0 || g.nome !== msg.nome);
    } else if (msg.a === 'esci') {
      if (st.tavolo) throw new Rifiuto('Il tavolo è già apparecchiato.');
      st.giocatori = st.giocatori.filter((g) => g.nome !== chi.nome);
      ws.serializeAttachment({ nome: chi.nome });
    } else if (msg.a === 'inizia') {
      soloHost();
      if (st.tavolo) throw new Rifiuto('Il tavolo è già apparecchiato.');
      if (!st.giocatori.length) throw new Rifiuto('Non c’è nessuno al tavolo.');
      st.tavolo = nuovoTavolo(MAZZI[st.opzioni.mazzo], st.giocatori.map((g) => g.nome),
        { lav: st.opzioni.lavoratori, for: st.opzioni.carte });
    } else if (msg.a === 'sala') {
      soloHost();
      st.tavolo = null;
    } else {
      throw new Rifiuto('Richiesta sconosciuta.');
    }
    await this.salva(st);
    this.diffondi();
  }

  async entra(ws, msg) {
    const nome = String(msg.nome ?? '').trim().replace(/\s+/g, ' ').slice(0, 16);
    if (!nome) throw new Rifiuto('Scrivi il tuo nome.');
    const st = structuredClone(this.st);
    if (msg.crea && (st.giocatori.length || st.tavolo)) throw new Rifiuto('Codice già in uso.', 'in-uso');

    // Chi arriva a tavolo già apparecchiato si siede con la mano vuota.
    const posto = st.giocatori.find((g) => uguale(g.nome, nome));
    if (!posto) {
      if (st.giocatori.length >= MAX_GIOCATORI) throw new Rifiuto(`Il tavolo è pieno: ${MAX_GIOCATORI} giocatori.`);
      st.giocatori.push({ nome });
      if (st.tavolo) aggiungiGiocatore(st.tavolo, nome);
    }
    const mio = posto?.nome ?? nome;

    // Chi era già collegato con questo nome lascia il posto alla nuova finestra.
    for (const altro of this.ctx.getWebSockets()) {
      const a = altro.deserializeAttachment();
      if (altro !== ws && a && uguale(a.nome, mio)) {
        try {
          altro.send(JSON.stringify({ t: 'sostituito' }));
          altro.close(4000, 'sostituito');
        } catch {}
      }
    }
    ws.serializeAttachment({ nome: mio });
    await this.salva(st);
    this.diffondi();
  }

  async salva(st) {
    await Promise.all([this.ctx.storage.put('st', st), this.ctx.storage.setAlarm(Date.now() + SCADENZA)]);
    this.st = st;
  }

  aTutti(msg, tranne = null) {
    const testo = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === tranne || !ws.deserializeAttachment()) continue;
      try {
        ws.send(testo);
      } catch {}
    }
  }

  // Manda a ogni finestra quello che il suo giocatore può vedere.
  diffondi(chiusa = null) {
    const st = this.st;
    const finestre = this.ctx.getWebSockets().filter((ws) => ws !== chiusa);
    const collegati = finestre.map((ws) => ws.deserializeAttachment()?.nome).filter(Boolean);
    for (const ws of finestre) {
      const a = ws.deserializeAttachment();
      if (!a) continue;
      const p = st.tavolo ? st.tavolo.giocatori.findIndex((g) => g.nome === a.nome) : -1;
      const stato = {
        t: 'stato',
        tu: a.nome,
        host: st.giocatori[0]?.nome ?? null,
        giocatori: st.giocatori.map((g) => ({ nome: g.nome, collegato: collegati.includes(g.nome) })),
        opzioni: st.opzioni,
        tavolo: st.tavolo ? vista(st.tavolo, this.mazzo(), p) : null,
      };
      try {
        ws.send(JSON.stringify(stato));
      } catch {}
    }
  }
}
