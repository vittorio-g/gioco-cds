# Collocamento — buchi del regolamento v0.4

I numeri vengono da [strumenti/analisi.mjs](strumenti/analisi.mjs): conti sulle carte e partite a 3 tra bot, 4.000 per ogni variante, chiuse a 4 occupati. Le regole usate dai bot sono in [strumenti/regole.mjs](strumenti/regole.mjs).

I bot giocano in modo semplice: scelgono la coppia lavoratore–lavoro che rende di più tra quelle che hanno in mano e la portano a termine. Servono a misurare ritmo e ordini di grandezza. Un giocatore vero troverà mosse migliori, quindi i numeri vanno confermati al tavolo.

Il tavolo online e quello per Tabletop Simulator non applicano regole: le varianti si provano giocandole.

## 1. Cosa è cambiato dalla v0.3

| Decisione | Effetto |
|---|---|
| I simboli scendono da 10 a 6 | Le icone combaciano molto più spesso: partite più corte e punteggi più alti. Vedi la tabella sotto. |
| Gli ambiti sono 30, tutti con un nome diverso, 6 per categoria | Prima erano 60 carte con 24 ambiti ripetuti. Il mazzo è la metà: vedi 2.3. Le categorie non hanno ancora un effetto. |
| Tre simboli comuni, due non comuni, uno raro | Manualità, Digitale e Comunicazione fanno due terzi delle icone. Ricerca è su 12 lavoratori e 6 ambiti. |

Le stesse regole, con le terne a 10 simboli delle prime carte e con quelle di adesso:

| | 10 simboli | 6 simboli |
|---|---|---|
| Coppie lavoratore–ambito con 2 o 3 icone in comune | 16% | 53% |
| Mano iniziale con una coppia da 12 punti | 6% | 24% |
| Giri per partita | 16,6 | 13,5 |
| Formazioni per lavoratore collocato | 2,6 | 1,8 |
| Punti medi per collocato | 9,5 | 12,6 |
| Collocati con 3 icone (17 punti) | 5% | 26% |
| Collocati con 2 icone (12 punti) | 36% | 57% |
| Collocati con 1 icona (8 punti) | 46% | 15% |
| Collocati con 0 icone (5 punti) | 13% | 1% |
| Carte di premio pescate da chi ospita, a partita | 5,3 | 8,0 |

Il lavoratore tipico ora vale 12 punti e uno su quattro ne vale 17. Scegliere il lavoro giusto è diventato facile; resta da vedere se è diventato troppo facile (2.4).

## 2. Buchi aperti

### 2.1 La formazione altrui resta una mossa quasi obbligata

Mandare un lavoratore sulla formazione di un altro fa risparmiare un turno. Con 6 simboli è ancora più conveniente di prima, perché quasi ogni formazione serve a qualcosa. Un bot che lo fa, contro due che non lo fanno:

| Premio a chi ospita | Chi va dagli altri | Ognuno degli altri due |
|---|---|---|
| 1 carta per attitudine (regola attuale) | vince il 78%, 47,1 punti | 11%, 36,5 punti |
| quelle, più 1 carta | 74%, 47,2 punti | 13%, 37,6 punti |
| quelle, più 2 carte | 69%, 46,9 punti | 16%, 38,6 punti |

Quando lo fanno tutti, il 46% delle formazioni aperte riceve il lavoratore di un altro.

- **Non andare dagli altri non è una scelta.** Chi rinuncia perde.
- **Le carte di premio non compensano.** Anche con 2 carte fisse in più chi va dagli altri vince più di due partite su tre.
- **Chi apre non può difendersi.** La formazione resta libera un giro e il primo a poterla usare è il giocatore alla tua sinistra.
- **Il lavoratore ospite sta nell'area di un altro.** Senza un segno non si capisce di chi è.

La proposta del campo comune (3.1) nasce da qui.

### 2.2 Chi comincia vince troppo spesso

In tre, il primo di turno vince il 44% delle partite; a caso sarebbe il 33%. Se nessuno va sulle formazioni altrui scende al 32%: il vantaggio viene dall'arrivare per primi sulle formazioni libere e dal ricevere per primi i lavoratori degli altri. Più la partita è lunga, più cresce: 45% chiudendo a 3 occupati, 49% a 5.

È un numero dei bot, da controllare al tavolo. Se si conferma, serve un compenso per chi gioca dopo, per esempio una carta in più all'inizio.

### 2.3 Trenta ambiti sono pochi

Ogni lavoratore collocato consuma circa tre ambiti: quasi due formazioni e il lavoro. In una partita a 3 gli scarti degli ambiti si rimescolano in media 3,4 volte. A fine partita 16 dei 30 ambiti sono nelle mani dei giocatori, e tra mazzo e scarti ne restano 2.

- Con il mazzo che gira così spesso si rivedono sempre le stesse carte.
- Chi accumula ambiti li toglie agli altri. Senza un limite di carte in mano il mazzo può restare vuoto.

Le leve sono un limite di carte in mano, oppure due copie di ogni ambito.

### 2.4 Il premio da 12 non è più un premio

Con 10 simboli tre icone in comune erano un colpo di fortuna. Ora 51 lavoratori su 60 hanno nel mazzo un ambito con le loro stesse icone, e una mano iniziale su quattro contiene già una coppia perfetta. I punti si giocano tra 12 e 17: i gradini da 5 e da 8 quasi non si vedono più.

Se il punteggio deve distinguere chi sceglie bene, la tabella 3 / 7 / 12 va ripensata, o il premio pieno va reso più difficile.

### 2.5 Le attitudini valgono per ottenere il lavoro?

Non è ancora deciso.

| | Solo le formazioni | Formazioni e attitudini |
|---|---|---|
| Giri per partita | 13,5 | 9,7 |
| Formazioni per collocato | 1,8 | 1,2 |
| Collocati da 17 punti | 26% | 33% |
| Formazioni aperte usate da un altro | 46% | 79% |

Con 6 simboli e le attitudini nel conto basta quasi sempre una formazione sola: la partita si accorcia di un terzo e quattro formazioni su cinque vengono prese da un altro.

### 2.6 Molte carte hanno le stesse icone

I nomi sono tutti diversi, le icone no. Tra i 60 lavoratori le terne diverse sono 23: nove lavoratori hanno `MA DI CO`, sette `MA DI OR`. Tra i 30 ambiti le terne diverse sono 19: Artigianato, Educazione, Pubblicità e Architettura sono lo stesso ambito con quattro nomi.

Con 6 simboli le terne possibili sono 56, quindi c'è spazio per distinguerle di più. Oppure si dà un effetto alle categorie, che oggi sono l'unica cosa che separa due ambiti con le stesse icone.

### 2.7 Nove lavoratori non possono arrivare a 17

Non hanno nel mazzo un ambito con le loro stesse icone: L'Artista dei Grafici `RI CR CR`, L'Inventore da Garage `MA RI CR`, Il Nerd dei Dati `DI DI RI`, La Capoclasse `CO CO DI`, La Signora delle Slide `CO MA RI`, La Curiosa `CO CO DI`, Il Muratore Filosofo `MA MA CO`, La Multischeda `DI DI CR`, Il Mago del Nastro Adesivo `MA MA OR`. Prima erano 36 su 60.

### 2.8 Regole ancora provvisorie

Nel regolamento sono marcate **[P]**.

| Regola | Valore provvisorio | Nota |
|---|---|---|
| Da quale mazzo si pesca | A scelta | L'alternativa è ripescare dallo stesso mazzo della carta giocata, e avere sempre 2 + 2. |
| Chi non può giocare | Pesca soltanto | Succede con soli lavoratori in mano e nessuna formazione libera. |
| Il premio di chi ospita | 1 carta per attitudine, dal mazzo che vuole | Vedi 2.1 e 3.2. |
| Il lavoratore ospite | Resta di chi l'ha mandato, girato verso di lui | Vedi 2.1. |
| Rifiutare un ospite | Non si può | — |
| Limite di carte in mano | Nessuno | Vedi 2.3. |
| Icone ripetute | Si contano una per una | `CO MA CO` contro `CO CR OR` fa 1. |
| 3 / 7 / 12 | Totali, non si sommano | Un lavoratore perfetto vale 17. Vedi 2.4. |
| Fine partita | 5 / 4 / 3 occupati in 2 / 3 / 4 giocatori | In 3 sono circa 13 giri. A 3 occupati 10, a 5 occupati 17. |
| Lavoratori non collocati, carte in mano | Valgono 0 | Senza penalità non costa niente lasciare colonne a metà. |
| Scartare | Non previsto | Sui tavoli virtuali si può fare comunque, per provarlo. |
| Giocatori, spareggio | 2–4, più lavoratori da 17 | — |

### 2.9 Le carte

1. **Sulla carta 59 il titolo esce dal margine.** "Quello che ha letto un articolo" arriva a toccare il bordo destro.
2. **Attitudini o competenze?** Sul dorso dei lavoratori c'è scritto "6 attitudini", la legenda si intitola "6 competenze". Nel regolamento sono due cose diverse: le attitudini stanno sul lavoratore, le competenze arrivano dalle formazioni.
3. **I PDF di stampa non hanno abbondanza.** Sono in `grafica/stampa/`, con i segni di taglio: le carte arrivano al filo.
4. **Sugli ambiti la colonna è intitolata "Competenze".** Vale quando l'ambito è giocato come formazione; come lavoro le stesse icone sono il requisito.

## 3. Le due proposte da valutare

Due idee di Vittorio del 5 ottobre 2026, provate con i bot sul mazzo a 6 simboli. Non sono nel regolamento.

### 3.1 Il campo è di tutti: ambito su ambito anche senza lavoratore

**Impilare su una formazione vuota conviene di rado.** Chi ha un lavoratore in mano fa sempre meglio a metterlo prima e ad aggiungere le formazioni dopo, quando la colonna è sua. Una pila senza lavoratore è un regalo al primo che ci entra, cioè al giocatore alla propria sinistra. In 4.000 partite i bot non l'hanno fatto mai, e i numeri sono identici a quelli delle regole di adesso. Serve solo a chi è rimasto senza lavoratori.

**L'effetto vero è un altro: sparisce "la mia formazione".** Oggi andare sulle formazioni altrui è una mossa quasi obbligata (2.1). Se il campo è comune la differenza tra chi lo fa e chi no non esiste più, e non serve nemmeno ricordare in quale area sta un lavoratore ospite.

**Resta un buco.** Il premio oggi va a "chi aveva aperto la formazione". Se le formazioni non sono di nessuno, bisogna dire a chi va.

### 3.2 Piazzare invece di pescare

Dipende da chi prende il premio.

| | Regole di adesso | Premio a chi aveva aperto, pescare o piazzare | Premio a chi mette il lavoratore, solo pescare | Premio a chi mette il lavoratore, pescare o piazzare |
|---|---|---|---|---|
| Giri per partita | 13,5 | 14,3 | 12,9 | 10,2 |
| Carte di premio a partita | 8,0 | 8,9 | 16,9 | 15,4 |
| Di cui piazzate | — | 95% | — | 58% |
| Carte giocate nel turno più lungo | 1 | 3,2 | 1 | 3,0 |
| Carte in mano a fine partita | 6,7 | 2,3 | 9,6 | 3,2 |
| Collocati da 17 punti | 26% | 14% | 32% | 19% |
| Vittorie di chi comincia | 44% | 13% | 44% | 35% |

**Se il premio resta a chi aveva aperto.** Arriva fuori turno, quando di rado si ha una carta buona da piazzare: un bot che piazza solo per far avanzare un suo lavoratore usa il premio così una volta su cento, e non cambia niente. L'uso naturale è riaprire subito una formazione al posto di quella presa. Ma quella viene presa di nuovo dal giocatore dopo: chi apre diventa quello che apparecchia per gli altri. Con bot che riaprono sempre (seconda colonna), chi comincia vince il 13% delle partite. Pescare resta quasi sempre meglio.

**Se il premio va a chi mette il lavoratore.** Diventa un motore di combinazioni: metto il lavoratore, le attitudini combaciano, piazzo subito una formazione o il lavoro. Con 6 simboli le attitudini combaciano spesso, quindi le carte di premio raddoppiano, da 8 a 15–17 a partita.

- Solo pescando, le mani arrivano a quasi 10 carte e il mazzo degli ambiti non regge (2.3).
- Potendo piazzare, la partita scende da 13,5 a 10 giri, le mani restano piccole e il vantaggio di chi comincia quasi sparisce. I turni lunghi sono di 3 carte; turni da 4 o più capitano in una partita su dieci solo se col premio si riaprono anche formazioni.
- I collocati da 17 punti calano perché i bot piazzano appena possono invece di aspettare la carta giusta. Un giocatore vero sceglierà.

È la versione più promettente delle due, e si incastra bene col campo comune: se le formazioni non sono di nessuno, premiare chi ci mette il lavoratore è la scelta naturale.

### 3.3 Da decidere perché stiano in piedi

1. **A chi va il premio**, se il campo è di tutti: a chi mette il lavoratore, a chi aveva giocato la prima formazione della pila, a nessuno.
2. **Su quali icone si conta**, quando la pila ha più formazioni: su tutte, o solo su quella in cima.
3. **Si può aggiungere un ambito sopra la colonna di un lavoratore altrui?** Non danneggia nessuno, ma permette di aiutare un giocatore contro un altro.
4. **Una carta di premio piazzata può dare altro premio?** Mettere un secondo lavoratore con una carta di premio ne genera altre. Nei numeri qui sopra sì.

## 4. Cosa guardare nel playtest

1. **Si sceglie il lavoro giusto, o va bene quasi tutto?** Contate quanti collocati fanno 12 o 17.
2. **Il mazzo degli ambiti finisce?** Segnate quante volte si rimescolano gli scarti e quante carte ha in mano ognuno alla fine.
3. **Chi comincia vince?** Segnate chi era primo di turno.
4. **Campo comune.** Qualcuno impila su una formazione vuota? Perché?
5. **Piazzare invece di pescare.** Provate una partita col premio a chi mette il lavoratore: quanto durano i turni più lunghi?
6. **Solo formazioni o formazioni e attitudini?** Una partita per variante.
