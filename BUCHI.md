# Collocamento — buchi del regolamento v0.3

I numeri vengono da [strumenti/analisi.mjs](strumenti/analisi.mjs): conti sulle carte e partite a 3 tra bot, 4.000 per ogni variante, chiuse a 4 occupati. Le regole usate dai bot sono in [strumenti/regole.mjs](strumenti/regole.mjs).

I bot giocano in modo semplice: scelgono la coppia lavoratore–lavoro che rende di più tra quelle che hanno in mano e la portano a termine. Servono a misurare ritmo e ordini di grandezza. Un giocatore vero troverà mosse migliori, quindi i numeri vanno confermati al tavolo.

La webapp non applica più le regole: è un tavolo libero. Le varianti si provano giocandole.

## 1. Cosa è cambiato dalla v0.2

| Decisione | Effetto |
|---|---|
| Due mazzi separati: lavoratori e ambiti | Una carta non è più lavoratore e lavoro insieme. In mano le combinazioni possibili calano molto: vedi 2.1. |
| Dorsi coperti | Gli avversari non vedono più le terne che hai in mano né la prima carta del mazzo. Spariscono i buchi sulle carte a due facce. |
| Si parte con 2 lavoratori e 2 ambiti | — |
| Ogni turno si gioca una carta e se ne pesca una | Da quale mazzo si pesca non è fissato: ho messo "a scelta". |
| Il lavoratore va sulla formazione altrui e ci resta | La formazione non si sposta. Serve un modo di riconoscere di chi è il lavoratore: vedi 2.2. |

Con le regole nuove è sparito anche il vantaggio di chi corre: il bot che punta al lavoro più rapido vince il 35% delle partite contro il 33% degli altri due.

## 2. Buchi aperti

### 2.1 Con quattro carte in mano si sceglie poco

Prima ogni carta era insieme un lavoratore e un lavoro: cinque carte in mano davano venti abbinamenti possibili. Ora la mano di partenza ne dà quattro, 2 lavoratori per 2 ambiti.

| | Carte a due facce, 5 in mano | Due mazzi, 2 + 2 in mano |
|---|---|---|
| Mano iniziale con una coppia da 12 punti | 28% | 6% |
| Collocati con 3 icone (17 punti) | 24% | 5% |
| Collocati con 2 icone (12 punti) | 51% | 35% |
| Collocati con 1 icona (8 punti) | 21% | 47% |
| Collocati con 0 icone (5 punti) | 3% | 14% |
| Punti medi per collocato | 12,1 | 9,4 |
| Formazioni per collocato | 1,8 | 2,1 |

Il lavoratore tipico ora fa 8 punti e il premio da 12 è tornato raro. Quanto combacia un lavoro dipende soprattutto da cosa si pesca, perché in mano non c'è abbastanza da scegliere.

Tenere in mano 2 lavoratori invece di 1 aiuta poco: i collocati da 17 punti passano dal 5% al 6%.

Se l'abbinamento deve essere una scelta e non una pesca, le leve sono tre:

1. **Mano più grande**, per esempio 3 + 3. Nella sala d'attesa della webapp si può cambiare.
2. **Pescare 2 e tenerne 1.**
3. **Carte scoperte da cui pescare**, per esempio tre ambiti e due lavoratori visibili accanto ai mazzi.

### 2.2 La formazione altrui resta una mossa quasi obbligata

Mandare un lavoratore sulla formazione di un altro fa risparmiare un turno su circa 4,5 che ne servono per collocarlo. Un bot che lo fa, contro due che non lo fanno:

| Premio a chi ospita | Chi va dagli altri | Ognuno degli altri due |
|---|---|---|
| 1 carta per attitudine (regola attuale) | vince il 70%, 35,6 punti | 15%, 27,4 punti |
| quelle, più 1 carta | 64%, 35,3 punti | 18%, 28,9 punti |
| quelle, più 2 carte | 55%, 34,9 punti | 23%, 30,3 punti |

Quando lo fanno tutti, il 53% delle formazioni aperte riceve il lavoratore di un altro, e chi ospita pesca in media 1 carta.

- **Non andare dagli altri non è una scelta.** Chi rinuncia perde.
- **Le carte ora compensano di più, ma non abbastanza.** Con la mano piccola una carta in più pesa: con 2 carte di premio fisso chi va dagli altri scende dal 70% al 55% di vittorie. Resta comunque molto sopra il 33% di una partita equilibrata.
- **Chi apre non può difendersi.** La formazione resta libera un giro e il primo a poterla usare è il giocatore alla tua sinistra.
- **Il lavoratore ospite sta nell'area di un altro.** Le carte sono tutte uguali: senza un segno non si capisce di chi è. Ho messo "girato verso il proprietario"; con più ospiti nella stessa area può diventare confuso.

### 2.3 Le attitudini valgono per ottenere il lavoro?

Non è ancora deciso.

| | Solo le formazioni | Formazioni e attitudini |
|---|---|---|
| Giri per partita | 14,6 | 11,8 |
| Formazioni per collocato | 2,1 | 1,5 |
| Collocati da 17 punti | 5% | 10% |
| Formazioni aperte usate da un altro | 53% | 65% |

Con le attitudini nel conto la partita dura un quinto in meno e i collocamenti perfetti raddoppiano.

### 2.4 Trentasei lavoratori su 60 non possono arrivare a 12

Ogni ambito ha un lavoratore ideale, ma gli ambiti sono 24: gli altri 36 lavoratori hanno come massimo il premio da 7. Chi pesca il lavoratore `MA DI OR` ha cinque lavori da 17 punti nel mazzo; chi pesca `DI DI CR` non ne ha nessuno.

Con i due mazzi separati questo si può sistemare senza toccare gli ambiti: basta dare a più lavoratori le stesse attitudini.

### 2.5 Sessanta lavoratori sono molti

In una partita a 3 si collocano circa 10 lavoratori. Il mazzo dei lavoratori non finisce mai e non serve rimescolarlo. Non è un difetto di gioco, ma sono 60 carte da disegnare e stampare per usarne una piccola parte a partita. Degli ambiti invece ne servono circa tre per ogni lavoratore collocato, e il loro mazzo gira.

### 2.6 Regole ancora provvisorie

Nel regolamento sono marcate **[P]**.

| Regola | Valore provvisorio | Nota |
|---|---|---|
| Da quale mazzo si pesca | A scelta | L'alternativa è ripescare dallo stesso mazzo della carta giocata, e avere sempre 2 + 2. |
| Chi non può giocare | Pesca soltanto | Succede con soli lavoratori in mano e nessuna formazione libera. Ai bot non capita mai, perché tengono sempre almeno un ambito; a un giocatore può capitare. |
| Il premio di chi ospita | 1 carta per attitudine, dal mazzo che vuole | Vedi 2.2. |
| Il lavoratore ospite | Resta di chi l'ha mandato, girato verso di lui | Vedi 2.2. |
| Rifiutare un ospite | Non si può | — |
| Limite di carte in mano | Nessuno | Chi ospita spesso accumula. |
| Icone ripetute | Si contano una per una | `DI OR OR` contro `OR CL CR` fa 1. |
| 3 / 7 / 12 | Totali, non si sommano | Un lavoratore perfetto vale 17. |
| Fine partita | 5 / 4 / 3 occupati in 2 / 3 / 4 giocatori | In 3 sono circa 15 giri. A 3 occupati 11, a 5 occupati 18. |
| Lavoratori non collocati, carte in mano | Valgono 0 | Senza penalità non costa niente lasciare colonne a metà. |
| Scartare | Non previsto | Sul tavolo virtuale si può fare comunque, per provarlo. |
| Giocatori, spareggio | 2–4, più lavoratori da 17 | — |

### 2.7 Le carte

Le carte nuove (stile fanzine, rosa e petrolio) sono in `grafica/` e il tavolo online le usa.

1. **I nomi dei 10 simboli e dei 24 ambiti non sono ancora confermati.** Sono sulla carta della legenda e sugli ambiti; cambiarli vuol dire correggere un testo e rimontare la carta, senza rifare l'illustrazione.
2. **Sulle carte la fascia delle icone è piccola.** Occupa meno di un quinto della carta: stampata a 63 × 88 mm le icone vengono di circa 8 mm, a schermo molto meno. Nel tavolo online c'è una fascia ingrandita, che si può togliere; sulla carta vera conviene provare una stampa prima di decidere.
3. **Manca il PDF di stampa.** Le carte montate non hanno abbondanza. Il PDF in [carte/](carte/) è il vecchio mazzo a due facce e non corrisponde più al gioco.
4. **Sugli ambiti la fascia è intitolata "Competenze".** Vale quando l'ambito è giocato come formazione; come lavoro le stesse icone sono il requisito.

## 3. Cosa guardare nel playtest

Il tavolo virtuale non impone niente: le varianti si provano mettendosi d'accordo prima.

1. **Si riesce a scegliere il lavoro giusto, o si gioca quello che capita?** Provate una partita con 2 + 2 e una con 3 + 3 carte iniziali.
2. **Farsi usare una formazione dà fastidio o fa parte del gioco?** Provate anche a dare a chi ospita 2 carte in più.
3. **Solo formazioni o formazioni e attitudini?** Una partita per variante.
4. **Si capisce di chi è un lavoratore ospite?** Guardate se nell'area di chi ospita nasce confusione.
5. **Quanto dura?** In 3 a 4 occupati le simulazioni danno 15 giri.
