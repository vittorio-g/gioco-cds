# Collocamento — cosa dicono le simulazioni

Riguarda il [regolamento](REGOLAMENTO.md) del 5 ottobre 2026: mercato dei lavoratori, un'azione per turno, poteri delle categorie, token obiettivo.

I numeri vengono da [strumenti/analisi.mjs](strumenti/analisi.mjs): 3.000 partite tra bot per ogni variante, con le regole scritte in [strumenti/regole.mjs](strumenti/regole.mjs) e il mazzo a sei simboli.

I bot cercano il set che rende di più per i turni che costa (una pila, un lavoratore del mercato, un lavoro che hanno in mano) e fanno il primo passo; se non vedono niente che valga, pescano. Misurano ritmo e ordini di grandezza: un giocatore vero troverà mosse migliori, quindi i numeri vanno confermati al tavolo.

## 1. In breve

1. **Il mazzo degli ambiti finisce prima di tutto il resto.** Il quinto set non arriva quasi mai: la partita si chiude perché sono finite le carte. In 3 e in 4 i token obiettivo sono fuori portata.
2. **Vince chi chiude in fretta**, non chi aspetta l'abbinamento perfetto.
3. **I poteri 1 e 2 valgono molto più degli altri tre.** Con le regole come sono scritte i poteri 3, 4 e 5 non spostano quasi niente.
4. **Il mercato può bloccarsi**, e le regole non dicono come uscirne.
5. **Il bonus per le ambizioni è quasi automatico**: i set da 5 e da 7 punti praticamente non esistono.

## 2. Il mazzo degli ambiti

Un set chiuso resta sul tavolo con tutte le sue carte: in media 2 formazioni e il lavoro, cioè 3 ambiti. Gli ambiti sono 30. Tolte le carte che restano in mano, bastano per 7 o 8 set in tutto, da dividere tra i giocatori.

Con le regole come sono scritte, senza poteri:

| | In 2 | In 3 | In 4 |
|---|---|---|---|
| Partite che finiscono perché gli ambiti sono finiti | 99% | 100% | 100% |
| Partite in cui qualcuno arriva al quinto set | 3% | 0% | 0% |
| Set chiusi a testa | 3,9 | 2,4 | 1,7 |
| Punti a testa | 46 | 29 | 21 |
| Giri | 23 | 15 | 11 |
| Token "tre set della stessa categoria" assegnato | 33% | 6% | 0% |
| Token "quattro categorie diverse" assegnato | 39% | 0% | 0% |
| Turni in cui non si può fare niente | 4% | 8% | 12% |
| Carte rimaste in mano alla fine | 2,9 | 2,5 | 2,2 |

In 4 si chiudono meno di due set a testa. Per il token delle quattro categorie servono quattro set: in 3 e in 4 non ci arriva nessuno. Negli ultimi giri il mazzo è vuoto e chi non ha la carta giusta passa.

Abbassare la soglia non basta: chiudendo al terzo set, in 3 ci arriva qualcuno in una partita su due, in 4 in una su cento.

### Cosa lo sistema

| Variante | In 2 | In 3 | In 4 |
|---|---|---|---|
| Chiuso un set, le sue formazioni vanno negli scarti (restano lavoratore e lavoro) | finisce col quinto set 100% | 100% | 6% |
| Due copie di ogni ambito (60 carte) | 100% | 100% | 4% |
| Tutte e due insieme | — | — | 100% |

Con una qualunque delle due, in 3 la partita dura 27 giri, si chiudono 4,6 set a testa per 58 punti, e ognuno dei due token viene assegnato in 6–8 partite su 10. In 4 ne serve una in più, oppure una soglia più bassa.

Rimettere le formazioni negli scarti ha un difetto: la fine "mazzo esaurito senza scarti" scatta ancora, nei momenti in cui gli scarti sono vuoti per caso. Conviene toglierla, o farla valere solo per il mazzo dei lavoratori.

## 3. Ritmo e punteggi

**Due formazioni per set.** Una formazione sola basta se lavoratore, formazione e lavoro hanno le stesse tre icone: 51 lavoratori su 60 hanno un ambito gemello, ma servono due ambiti uguali e quel lavoratore al mercato insieme. Con la mano iniziale si può accogliere un lavoratore del mercato con una formazione in una partita su due (33% in 2, 45% in 3, 55% in 4), con due formazioni quasi sempre.

**Il bonus è quasi automatico.** La pila deve coprire sia le ambizioni del lavoratore sia le icone del lavoro, quindi lavoratore e lavoro finiscono per somigliarsi.

| Ambizioni che combaciano col lavoro | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Punti | 5 | 7 | 10 | 16 |
| Set chiusi così, in 3 | 0% | 4% | 61% | 35% |

Un set vale 10 o 16 punti: le prime due righe della tabella non servono. La partita si decide su quanti set chiudi e su quante volte fai 16.

**Vince chi fa in fretta.** Tre bot uguali tranne che per la pazienza:

| | Vittorie | Punti |
|---|---|---|
| Chiude appena può | 52% | 31 |
| Via di mezzo | 33% | 29 |
| Aspetta l'abbinamento migliore | 15% | 25 |

Succede anche con le formazioni che tornano negli scarti (54%, 33%, 13%). Gli ambiti sono pochi e comuni a tutti: chi aspetta li lascia agli altri.

**Chi comincia è avvantaggiato di poco.** Vittorie per posto al tavolo: 52% e 48% in 2; 37%, 33%, 30% in 3; 27%, 25%, 24%, 24% in 4.

**Un quarto dei turni si passa a pescare.** In 3: aprire 18%, migliorare 17%, inserire 16%, completare 16%, pescare 25%, niente 8%.

**Il limite di mano non morde quasi mai.** In 3 si scarta una carta ogni dieci partite.

## 4. I poteri

Per misurare quanto vale un potere l'ho dato a un giocatore solo, su tutte le categorie, contro due che non ne hanno. In 3, alla pari vincerebbe il 33% delle volte.

| Potere | Regole come sono scritte | Con le formazioni che tornano negli scarti |
|---|---|---|
| 1. Pesca 2 ambiti | vince il 57% | 77% |
| 2. Tre punti in più | 69% | 67% |
| 3. Gioca subito una formazione | 37% | 57% |
| 4. Un lavoratore da parte | 37% | 50% |
| 5. Piazza subito un lavoratore | 34% | 47% |

- **Con le regole come sono scritte mancano le carte, non le azioni.** I poteri che fanno risparmiare un'azione (3 e 5) non valgono quasi niente. Il potere 1 prende due delle poche carte rimaste, il 2 sono punti puri.
- **Se il mazzo viene sistemato** contano di più tutti, ma l'ordine resta: 1 e 2 davanti, 5 in fondo.
- **Il potere 3 va a vuoto 4 volte su 10**: chi ha appena chiuso un set spesso non ha più carte in mano.
- **Il potere 5 va a vuoto una volta su due**: serve una seconda formazione libera già aperta, con un lavoratore a un'icona di distanza. I bot la preparano quando possono; un giocatore attento farà meglio.

### L'abbinamento con le categorie

Senza poteri le categorie non si chiudono con la stessa frequenza. Ricerca e innovazione ha quasi tutte le icone Ricerca, che sono rare.

| | Tecnica | Servizi | Organizzazione | Creatività | Ricerca |
|---|---|---|---|---|---|
| Set chiusi, senza poteri | 25% | 19% | 22% | 19% | 14% |
| Poteri 5 · 3 · 4 · 1 · 2 | 20% | 18% | 19% | 24% | 19% |
| Poteri 2 · 3 · 1 · 4 · 5 | 33% | 18% | 24% | 14% | 12% |

Dare i poteri forti alle categorie che si chiudono meno le pareggia: **Tecnica 5, Servizi 3, Organizzazione 4, Creatività 1, Ricerca 2**. Il contrario porta un terzo dei set su Tecnica e lascia Ricerca al 12%.

I bot scelgono sapendo quanto vale ogni potere. Un tavolo vero può valutarli diversamente, soprattutto il 5.

## 5. Il mercato dei lavoratori

- Un lavoratore aspetta in media da 3 a 4,4 giri prima che qualcuno lo prenda.
- A fine partita uno o due lavoratori sono fermi lì da quattro giri o più. Un terzo ha Ricerca tra le ambizioni e un terzo ha due icone uguali: il doppio di quanto pesano nel mazzo.
- Nel 15% dei turni un giocatore ha una formazione libera e nessun lavoratore che ci possa salire.

**Può bloccarsi del tutto.** In una partita su 3.000, in 2, al mercato sono rimasti due lavoratori con Ricerca quando i sei ambiti con Ricerca erano già tutti chiusi nei set. Nessuno poteva più inserire un lavoratore. I giocatori pescavano e scartavano per il limite di mano, gli scarti si rimescolavano, e il mazzo non finiva mai: secondo le regole quella partita non termina.

È raro, ma le regole non hanno un'uscita. Due modi provati in 3:

| | Set a testa | Punti a testa | Attesa al mercato |
|---|---|---|---|
| Regole come sono scritte | 2,4 | 28,7 | 3,6 giri |
| Un lavoratore fermo da 3 giri viene sostituito | 2,4 | 28,7 | 1,1 giri |
| Mercato con 2 lavoratori in più | 2,6 | 33,8 | 4,8 giri |

Sostituire i lavoratori fermi non cambia i punteggi e toglie il blocco. Un mercato più largo fa salire i punti del 18%, perché si trova più spesso il lavoratore gemello.

## 6. Cose che il testo non dice

Per simulare ho dovuto scegliere. Sono le domande da chiudere nel regolamento.

| Punto | Come l'ho inteso |
|---|---|
| Chi non può fare nessuna azione | Passa. Succede col mazzo vuoto e nessuna carta utile. |
| Quando scatta "mazzo esaurito" | Quando si pesca l'ultima carta e non ci sono scarti. Se poi arrivano scarti, si rimescolano e si pesca ancora. |
| Potere 5: quale lavoratore | Uno del mercato, che si ripristina, oppure uno tenuto da parte. |
| Potere 5: l'icona ignorata vale anche dopo? | No: conta solo per salire sulla formazione. |
| Potere 4: quanti lavoratori da parte | Quanti se ne pescano. Li può usare solo chi li ha. |
| Potere 3 senza carte in mano | Non succede niente. |
| Quante pile si possono aprire | Quante se ne vuole. |
| Il limite di mano | Riguarda gli ambiti. I lavoratori da parte non contano. |
| Gli scarti dei lavoratori | Non esistono: nessuna regola scarta un lavoratore. Il mazzo da 60 non finisce mai. |
| Se due giocatori raggiungono un obiettivo insieme | Non può succedere: si chiude un set alla volta. |

## 7. Cosa guardare al tavolo

1. **Come finisce la partita?** Segnate se per il quinto set o per le carte finite, e quanti set ha chiuso ognuno.
2. **Quante formazioni per set?** Se sono quasi sempre due, il conto delle carte qui sopra regge.
3. **Qualcuno prende un token?** In 3 e in 4, con le regole come sono scritte, non dovrebbe succedere.
4. **Chi vince: chi chiude presto o chi aspetta il 16?**
5. **Quanto restano fermi i lavoratori al mercato?** Segnate se qualcuno ha una formazione pronta e nessuno da metterci.
6. **Il potere 5 si riesce a usare?** Serve una seconda formazione già aperta.
7. **Provate una partita rimettendo le formazioni negli scarti** quando un set si chiude.
