// Prova una stanza vera del tavolo libero: più giocatori si collegano e fanno
// le azioni che si fanno a un tavolo (pescare, giocare, spostare, girare,
// scartare…), controllando che tutti vedano la stessa cosa e solo quella.
//
// Uso:  node strumenti/prova_stanza.mjs [http://localhost:8791]
const base = (process.argv[2] ?? 'http://localhost:8791').replace(/^http/, 'ws');
const codice = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');
const falliti = [];
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));

function giocatore(nome, crea = false) {
  const g = { nome, stato: null, rev: 0, errori: [], trascinate: [], sostituito: false, ws: new WebSocket(`${base}/ws/${codice}`) };
  g.invia = (m) => g.ws.send(JSON.stringify(m));
  g.ws.onopen = () => g.invia({ a: 'entra', nome, crea });
  g.ws.onerror = (e) => console.log(`  connessione di ${nome} fallita: ${e.message ?? 'errore di rete'}`);
  g.ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.t === 'stato') { g.stato = m; g.rev++; } else if (m.t === 'errore') g.errori.push(m.testo);
    else if (m.t === 'trascina') g.trascinate.push(m);
    else if (m.t === 'sostituito') g.sostituito = true;
  };
  return g;
}

async function finche(condizione, cosa, ms = 8000) {
  const t0 = Date.now();
  while (!condizione()) {
    if (Date.now() - t0 > ms) throw new Error(`tempo scaduto: ${cosa}`);
    await attesa(15);
  }
}
const verifica = (ok, cosa) => { console.log(ok ? '  ok ' : '  NO ', cosa); if (!ok) falliti.push(cosa); };

let tavolo = [];
// Un'azione sul tavolo: aspetta che tutti abbiano ricevuto il nuovo stato.
async function op(g, o) {
  const prima = tavolo.map((x) => x.rev);
  g.invia({ a: 'op', op: o });
  await finche(() => tavolo.every((x, i) => x.rev > prima[i]), `${g.nome}: ${o.o}`);
}
// Un'azione che deve essere rifiutata.
async function rifiutata(g, o) {
  const n = g.errori.length;
  g.invia({ a: 'op', op: o });
  await finche(() => g.errori.length > n, `rifiuto di ${o.o}`);
  return g.errori.at(-1);
}
const t = (g) => g.stato.tavolo;
const totale = (v) => v.mazzi.lav + v.mazzi.for + v.scarti.lav.n + v.scarti.for.n + v.tavolo.length
  + v.giocatori.reduce((s, x) => s + x.lav + x.for, 0);

const anna = giocatore('Anna', true);
await finche(() => anna.stato, 'Anna entra');
let bruno = giocatore('Bruno');
await finche(() => anna.stato.giocatori.length === 2 && bruno.stato, 'entra Bruno');
verifica(anna.stato.host === 'Anna' && anna.stato.giocatori.every((g) => g.collegato), 'chi crea la stanza la gestisce, tutti collegati');

bruno.invia({ a: 'inizia' });
await finche(() => bruno.errori.length, 'rifiuto a Bruno');
verifica(/Anna/.test(bruno.errori[0]), `solo Anna può apparecchiare ("${bruno.errori[0]}")`);
const revisione = bruno.rev;
anna.invia({ a: 'opzioni', opzioni: { ...anna.stato.opzioni, lavoratori: 99, carte: 2, altro: 'toString' } });
await finche(() => bruno.rev > revisione, 'opzioni');
verifica(bruno.stato.opzioni.lavoratori === 2 && !('altro' in bruno.stato.opzioni), 'un’opzione senza senso viene ignorata');

anna.invia({ a: 'inizia' });
await finche(() => anna.stato.tavolo && bruno.stato.tavolo, 'tavolo apparecchiato');
tavolo = [anna, bruno];
verifica(t(anna).mano.length === 4 && t(anna).mano.filter((c) => c.t === 'lav').length === 2 && t(anna).mano.every((c) => c.att || c.lav),
  'parto con 2 lavoratori e 2 carte lavoro/formazione');
verifica(t(anna).mazzi.lav === 56 && t(anna).mazzi.for === 26 && t(anna).tavolo.length === 0, 'nei mazzi restano 56 lavoratori e 26 ambiti, il tavolo è vuoto');
verifica(JSON.stringify(t(bruno)).includes('"att"') && !t(bruno).giocatori.some((g) => g.mano), 'delle mani altrui si conosce solo il numero di carte');
verifica(totale(t(anna)) === 90 && t(anna).mazzi.for === 30 - 4, 'in tutto ci sono 90 carte: 60 lavoratori e 30 ambiti');

await op(anna, { o: 'pesca', m: 'lav' });
verifica(t(anna).mano.length === 5 && t(bruno).giocatori[0].lav === 3 && t(bruno).mazzi.lav === 55, 'pescare: una carta in più in mano, una in meno nel mazzo');
verifica(/pesca un lavoratore/.test(t(bruno).log.at(-1).testo) && !/\(/.test(t(bruno).log.at(-1).testo), 'la cronaca non dice quale carta è stata pescata');

const lavoratore = t(anna).mano.find((c) => c.t === 'lav');
await op(anna, { o: 'gioca', c: lavoratore.id, x: 200, y: 400 });
const vistoDaBruno = t(bruno).tavolo.find((c) => c.id === lavoratore.id);
verifica(vistoDaBruno && vistoDaBruno.att.join() === lavoratore.att.join() && vistoDaBruno.x === 200 && vistoDaBruno.y === 400,
  'una carta giocata scoperta la vedono tutti, nel punto dove è stata messa');

await op(bruno, { o: 'sposta', c: lavoratore.id, x: 900.4, y: 99999 });
const mossa = t(anna).tavolo.find((c) => c.id === lavoratore.id);
verifica(mossa.x === 900 && mossa.y === 900 - 176, 'chiunque può spostare una carta; non esce dal tavolo');

const cronacaPrima = t(anna).log.length;
bruno.invia({ a: 'op', op: { o: 'trascina', c: lavoratore.id, x: 640, y: 480 } });
await finche(() => anna.trascinate.length, 'trascinamento visto da Anna');
verifica(anna.trascinate[0].id === lavoratore.id && anna.trascinate[0].x === 640 && bruno.trascinate.length === 0 && t(anna).log.length === cronacaPrima,
  'il trascinamento in corso arriva agli altri e non riempie la cronaca');

await op(anna, { o: 'gira', c: lavoratore.id });
const coperta = t(bruno).tavolo.find((c) => c.id === lavoratore.id);
verifica(coperta.coperta && !coperta.att && !coperta.n && coperta.t === 'lav', 'di una carta coperta si vede solo il dorso del suo mazzo');

await op(bruno, { o: 'prendi', c: lavoratore.id });
verifica(t(bruno).mano.some((c) => c.id === lavoratore.id && c.att) && t(anna).tavolo.length === 0 && t(anna).giocatori[1].lav === 3,
  'una carta del tavolo si può prendere in mano');

const daScartare = t(bruno).mano.find((c) => c.t === 'for');
await op(bruno, { o: 'scarta', c: daScartare.id });
verifica(t(anna).scarti.for.n === 1 && t(anna).scarti.for.cima.lav.join() === daScartare.lav.join(), 'lo scarto finisce scoperto in cima agli scarti');
await op(anna, { o: 'ripesca', m: 'for' });
verifica(t(anna).mano.some((c) => c.id === daScartare.id) && t(anna).scarti.for.n === 0, 'la cima degli scarti si può riprendere');
await op(anna, { o: 'rimetti', c: daScartare.id });
await op(bruno, { o: 'pesca', m: 'for' });
verifica(t(bruno).mano.some((c) => c.id === daScartare.id), 'una carta rimessa in cima al mazzo è la prossima pescata');

await op(bruno, { o: 'dalMazzo', m: 'for', x: 700, y: 500 });
verifica(t(anna).tavolo.length === 1 && t(anna).tavolo[0].coperta && !t(anna).tavolo[0].lav, 'dal mazzo al tavolo la carta arriva coperta');
await op(anna, { o: 'scarta', c: t(anna).tavolo[0].id });
await op(anna, { o: 'rimescola', m: 'for' });
verifica(t(anna).scarti.for.n === 0 && totale(t(anna)) === 90, 'gli scarti si rimescolano nel mazzo, le carte restano 90');

verifica(/scarti/.test(await rifiutata(anna, { o: 'rimescola', m: 'lav' })), 'rimescolare scarti vuoti viene rifiutato con un messaggio');
verifica(/mano/.test(await rifiutata(anna, { o: 'gioca', c: t(bruno).mano[0].id, x: 0, y: 0 })), 'non si gioca una carta che sta nella mano di un altro');
verifica(/sconosciuta/.test(await rifiutata(bruno, { o: 'esplodi' })), 'un’azione sconosciuta viene rifiutata');

await op(anna, { o: 'punti', g: 0, d: 5 });
await op(anna, { o: 'punti', g: 0, d: 7 });
await op(bruno, { o: 'punti', g: 0, v: 17 });
verifica(t(bruno).giocatori[0].punti === 17, 'i punti si segnano a mano, anche scrivendo il totale');
verifica(!('turno' in t(anna)) && !t(anna).log.some((r) => /turno|Comincia/.test(r.testo)), 'il tavolo non tiene il turno: ce lo si dice a voce');

// --- più carte insieme
const due = t(anna).mano.slice(0, 2);
await op(anna, { o: 'molte', ops: due.map((c, i) => ({ o: 'gioca', c: c.id, x: 300 + 40 * i, y: 300 })) });
await op(bruno, { o: 'molte', ops: due.map((c, i) => ({ o: 'sposta', c: c.id, x: 500 + 40 * i, y: 350 })) });
const insieme = () => due.map((c) => t(anna).tavolo.find((x) => x.id === c.id));
verifica(insieme().every((c, i) => c && c.x === 500 + 40 * i && c.y === 350), 'un gruppo di carte si gioca e si sposta in un colpo solo');
const giaViste = anna.trascinate.length;
const righe = t(anna).log.length;
bruno.invia({ a: 'op', op: { o: 'molte', ops: due.map((c, i) => ({ o: 'trascina', c: c.id, x: 600 + 40 * i, y: 360 })) } });
await finche(() => anna.trascinate.length >= giaViste + 2, 'trascinamento di un gruppo');
verifica(anna.trascinate.slice(giaViste).map((m) => m.id).join() === due.map((c) => c.id).join() && t(anna).log.length === righe,
  'il trascinamento di un gruppo arriva agli altri carta per carta, senza riempire la cronaca');
await op(anna, { o: 'molte', ops: due.map((c) => ({ o: 'gira', c: c.id, coperta: true })) });
await op(anna, { o: 'gira', c: due[0].id, coperta: true });
verifica(insieme().every((c) => c.coperta), 'un gruppo si copre insieme, e coprire una carta già coperta non la scopre');
const sulTavolo = t(anna).tavolo.length;
verifica(/non è più/.test(await rifiutata(anna, { o: 'molte', ops: [{ o: 'scarta', c: due[0].id }, { o: 'scarta', c: 99999 }] })) && t(anna).tavolo.length === sulTavolo
  && t(anna).scarti.lav.n + t(anna).scarti.for.n === 0, 'se un’azione del gruppo non si può fare, non se ne fa nessuna');
await op(anna, { o: 'molte', ops: due.map((c) => ({ o: 'prendi', c: c.id })) });
verifica(due.every((c) => t(anna).mano.some((x) => x.id === c.id)) && t(anna).tavolo.length === sulTavolo - 2, 'un gruppo si riprende in mano insieme');

const carla = giocatore('Carla');
await finche(() => carla.stato?.tavolo && anna.stato.giocatori.length === 3, 'Carla arriva dopo');
tavolo = [anna, bruno, carla];
verifica(t(carla).io === 2 && t(carla).mano.length === 0 && t(anna).giocatori.length === 3, 'chi arriva a tavolo apparecchiato si siede con la mano vuota');
await op(carla, { o: 'pesca', m: 'lav' });
await op(carla, { o: 'gioca', c: t(carla).mano[0].id, x: 1200, y: 600, coperta: true });
verifica(t(anna).tavolo.at(-1).coperta && /coperta/.test(t(anna).log.at(-1).testo), 'si può giocare una carta coperta');

bruno.ws.close();
await finche(() => anna.stato.giocatori.find((x) => x.nome === 'Bruno').collegato === false, 'Bruno risulta scollegato');
const manoBruno = t(bruno).mano.map((c) => c.id).join();
bruno = giocatore('bruno');
tavolo = [anna, bruno, carla];
await finche(() => bruno.stato?.tavolo && anna.stato.giocatori.find((x) => x.nome === 'Bruno').collegato, 'Bruno rientra');
verifica(bruno.stato.tu === 'Bruno' && t(bruno).mano.map((c) => c.id).join() === manoBruno, 'chi rientra con lo stesso nome ritrova posto e mano');

// Un po' di azioni a caso da parte di tutti: le carte non devono mai sparire.
let casuali = 0;
for (let i = 0; i < 60; i++) {
  const g = tavolo[i % 3];
  const v = t(g);
  const scelte = [{ o: 'pesca', m: i % 2 ? 'lav' : 'for' }];
  if (v.mano.length) scelte.push({ o: 'gioca', c: v.mano[0].id, x: Math.random() * 1400, y: 260 + Math.random() * 500 }, { o: 'scarta', c: v.mano.at(-1).id });
  if (v.tavolo.length) {
    const c = v.tavolo[Math.floor(Math.random() * v.tavolo.length)].id;
    scelte.push({ o: 'sposta', c, x: Math.random() * 1400, y: Math.random() * 800 }, { o: 'gira', c }, { o: 'sotto', c }, { o: 'rimetti', c, fondo: true }, { o: 'prendi', c });
  }
  await op(g, scelte[Math.floor(Math.random() * scelte.length)]);
  casuali++;
  if (totale(t(anna)) !== 90) break;
}
verifica(totale(t(anna)) === 90 && [anna, bruno, carla].every((g) => totale(t(g)) === 90), `dopo ${casuali} azioni a caso le carte sono sempre 90`);
verifica(JSON.stringify(t(anna).tavolo) === JSON.stringify(t(bruno).tavolo), 'tutti vedono lo stesso tavolo');

await op(anna, { o: 'nuova' });
verifica(t(carla).tavolo.length === 0 && [anna, bruno, carla].every((g) => t(g).mano.length === 4) && t(anna).giocatori.every((g) => g.punti === 0)
  && t(anna).mazzi.lav === 54, 'ricominciare rimette tutto nei mazzi e ridà 2 + 2 carte a tutti');
verifica([anna, bruno, carla].every((g) => !g.errori.some((e) => /interno/.test(e))), 'nessun errore interno');

const doppio = giocatore('Carla');
await finche(() => carla.sostituito && doppio.stato, 'seconda finestra di Carla');
verifica(true, 'una seconda finestra con lo stesso nome sostituisce la prima');

anna.invia({ a: 'sala' });
await finche(() => !bruno.stato.tavolo, 'ritorno alla sala');
verifica(bruno.stato.giocatori.length === 3, 'sparecchiando si torna in sala con gli stessi giocatori');

for (const g of [anna, bruno, carla, doppio]) g.ws.close();
console.log(falliti.length ? `\n${falliti.length} controlli falliti` : '\nTutti i controlli superati');
process.exit(falliti.length ? 1 : 0);
