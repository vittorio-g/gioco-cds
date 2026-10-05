# Collocamento — cosa dicono le simulazioni

Riguarda il [regolamento](REGOLAMENTO.md) del 5 ottobre 2026 con le ultime modifiche: 60 lavoratori e **60 ambiti**, mercato dei lavoratori, un'azione per turno, **poteri sui lavoratori**, token obiettivo.

I numeri vengono da [strumenti/analisi.mjs](strumenti/analisi.mjs): 3.000 partite tra bot per ogni variante, con le regole scritte in [strumenti/regole.mjs](strumenti/regole.mjs) e il mazzo a sei simboli.

I bot cercano il set che rende di più per i turni che costa (una pila, un lavoratore del mercato, un lavoro che hanno in mano) e fanno il primo passo; se non vedono niente che valga, pescano. Misurano ritmo e ordini di grandezza: un giocatore vero troverà mosse migliori, quindi i numeri vanno confermati al tavolo.

Due cose non sono ancora decise e le ho fissate io per poter simulare: i 60 ambiti sono **due copie di ognuno dei 30**, e i poteri sono dati a **15 lavoratori per tipo**, a rotazione sul numero della carta. Le altre scelte sono nel capitolo 6.

## 1. In breve

1. **Con 60 ambiti la partita funziona in 2 e in 3**: finisce sempre al quinto set, in circa 25 giri, e i token si assegnano. **In 4 le carte finiscono ancora prima**, nove volte su dieci.
2. **"Pesca 2 ambiti" vale molto più degli altri tre poteri.** Chi lo ha da solo vince l'84% delle partite a tre.
3. **"Piazza un lavoratore" e "fino a 2 formazioni" vanno a vuoto una volta su due.**
4. **Vince chi chiude in fretta**, non chi aspetta l'abbinamento perfetto.
5. **Il bonus per le ambizioni è quasi automatico**: nove set su dieci valgono 10 o 16 punti.
6. **I poteri accorciano la partita di due giri e non spostano i punteggi.**

## 2. Come va la partita

Con i poteri sui lavoratori, 15 per tipo:

| | In 2 | In 3 | In 4 |
|---|---|---|---|
| Giri | 25 | 24 | 22 |
| Partite che finiscono al quinto set | 100% | 100% | 11% |
| Partite che finiscono perché gli ambiti sono finiti | 0% | 0% | 89% |
| Qualcuno arriva al quinto set | 100% | 100% | 37% |
| Set chiusi a testa | 4,7 | 4,6 | 4,0 |
| Punti a testa | 56 | 56 | 50 |
| Punti del vincitore | 62 | 65 | 59 |
| Token "tre set della stessa categoria" assegnato | 57% | 66% | 61% |
| Token "quattro categorie diverse" assegnato | 65% | 78% | 69% |
| Vittorie per posto al tavolo | 51% · 49% | 33% · 33% · 34% | 25% · 26% · 25% · 24% |

Chi comincia non ha vantaggio.

Senza poteri la partita è la stessa, due giri più lunga: in 3 sono 27 giri, 4,6 set e 57 punti a testa.

### In 4 le carte non bastano

Un set chiuso tiene sul tavolo 3 ambiti: 2 formazioni e il lavoro. Quattro giocatori per cinque set fanno 60 carte, cioè tutto il mazzo, senza contare quelle in mano. Due modi di sistemarlo, provati in 4:

| | Finisce col set che chiude | Giri | Set a testa | Punti a testa |
|---|---|---|---|---|
| Regole come sono | 11% | 22 | 4,0 | 50 |
| Chiuso un set, le sue formazioni vanno negli scarti | 100% | 24 | 4,5 | 56 |
| In 4 si chiude al quarto set | 99% | 19 | 3,5 | 43 |

### Con 30 ambiti non funziona

Per confronto, con una copia sola di ogni ambito le carte finiscono sempre prima: 3,9 set a testa in 2, 2,4 in 3, 1,6 in 4, e in 3 e in 4 i token non li prende quasi nessuno.

## 3. I poteri dei lavoratori

### Quanto vale ognuno

Per misurarlo ho fatto funzionare un potere per un giocatore solo, su tutti i lavoratori, contro avversari per cui non funziona.

| Potere | In 3 (alla pari: 33%) | In 4 (alla pari: 25%) |
|---|---|---|
| 1. Pesca 2 ambiti | vince l'84% | 72% |
| 2. Prenota un lavoratore | 51% | 35% |
| 4. Piazza subito un lavoratore | 42% | 28% |
| 3. Gioca fino a 2 formazioni | 41% | 23% |
| Tutti e quattro, 15 per tipo | 57% | — |

**"Pesca 2 ambiti" è fuori scala.** Chi lo ha chiude un set in più degli altri (5,1 contro 4,1) e fa 16 punti in più. Due carte gratis sono un'azione intera risparmiata ogni volta, e non possono andare a vuoto.

**Gli altri tre sono vicini tra loro e molto più deboli.**

### Come vengono usati

In 3, con 15 lavoratori per tipo:

| Potere | Attivazioni a partita | Va a vuoto | Attesa al mercato |
|---|---|---|---|
| 1. Pesca 2 ambiti | 3,8 | mai | 2,6 giri |
| 2. Prenota un lavoratore | 3,5 | mai | 3,1 giri |
| 3. Gioca fino a 2 formazioni | 2,8 | 44% | 4,0 giri |
| 4. Piazza subito un lavoratore | 2,9 | 59% | 3,8 giri |

- **"Fino a 2 formazioni" ne gioca in media 0,9.** Scatta quando inserisci un lavoratore, cioè quando la pila lo copre già: spesso copre già anche il lavoro, e in mano non ci sono le carte per cominciare un'altra pila. Con i bot usarlo fa perfino perdere punti: se tutti i lavoratori hanno questo potere la media scende da 57 a 52, probabilmente perché una carta giocata in fretta come formazione non può più fare da lavoro.
- **"Piazza un lavoratore" chiede una seconda formazione libera già aperta**, con un lavoratore a un'icona di distanza. I bot la preparano quando possono; un giocatore attento farà meglio, ma resta un potere che va costruito in anticipo.
- **I prenotati restano lì.** A fine partita ogni giocatore ha in media 0,7 lavoratori prenotati e mai usati.
- **I lavoratori coi poteri deboli aspettano di più al mercato**: quasi quattro giri contro meno di tre.

### Due correzioni provate

| | Risultato |
|---|---|
| "Pesca" fa pescare 1 carta invece di 2 | Chi lo ha da solo vince il 58% invece dell'84%: resta il più forte, ma nella fascia degli altri. |
| Il potere più forte ai lavoratori più difficili da accogliere (pesca ai 15 più difficili, poi prenota, piazza, formazioni) | Le attivazioni si pareggiano: 3,0 · 3,3 · 3,3 · 3,3 a partita. |
| Il contrario (pesca ai 15 più facili) | I lavoratori difficili col potere debole restano al mercato 5,3 giri; quelli con "pesca" 1,8. |

"Difficile da accogliere" vuol dire che poche coppie di ambiti coprono le sue tre ambizioni. I 15 più difficili sono i 12 lavoratori con Ricerca, più tre con Creatività o con due icone uguali.

Dare un potere a un lavoratore su due, invece che a tutti, non cambia niente di misurabile.

## 4. Ritmo e punteggi

**Due formazioni per set.** Una sola basta se lavoratore, formazione e lavoro hanno le stesse tre icone: 51 lavoratori su 60 hanno un ambito gemello. Con la mano iniziale si può accogliere un lavoratore del mercato con una formazione in una partita su due circa (33% in 2, 45% in 3, 54% in 4), con due formazioni quasi sempre.

**Il bonus è quasi automatico.** La pila deve coprire sia le ambizioni del lavoratore sia le icone del lavoro, quindi lavoratore e lavoro finiscono per somigliarsi.

| Ambizioni che combaciano col lavoro | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Punti | 5 | 7 | 10 | 16 |
| Set chiusi così, in 3 | 0% | 11% | 57% | 31% |

La partita si decide su quanti set chiudi e su quante volte fai 16.

**Vince chi fa in fretta.** Tre bot uguali tranne che per la pazienza:

| | Vittorie | Punti |
|---|---|---|
| Chiude appena può | 50% | 60 |
| Via di mezzo | 32% | 56 |
| Aspetta l'abbinamento migliore | 18% | 51 |

Chi chiude per primo il quinto set decide quando finisce la partita, e gli altri restano con i set a metà.

**Un quarto dei turni si passa a pescare.** In 3: aprire 19%, migliorare 18%, inserire 18%, completare 19%, pescare 26%.

**Il limite di mano conta poco.** In 3 si scarta una carta a partita. Abbassandolo a 4 se ne scartano tre e i punti scendono da 56 a 55.

## 5. Il mercato dei lavoratori

- Un lavoratore aspetta in media 3,4 giri prima che qualcuno lo prenda.
- A fine partita uno o due lavoratori sono fermi lì da quattro giri o più.
- Nel 16% dei turni un giocatore ha una formazione libera e nessun lavoratore che ci possa salire.

**Può bloccarsi del tutto, e le regole non dicono come uscirne.** Se al mercato restano solo lavoratori che nessuno può più accogliere, nessuno inserisce più niente; si pesca, si scarta per il limite di mano, gli scarti si rimescolano e il mazzo non finisce mai. Nelle simulazioni è successo un paio di volte su decine di migliaia di partite. È raro, ma serve una regola.

Due varianti provate in 3:

| | Punti a testa | Attesa al mercato |
|---|---|---|
| Regole come sono | 55,8 | 3,4 giri |
| Un lavoratore fermo da 3 giri viene sostituito | 57,0 | 1,0 giri |
| Mercato con 2 lavoratori in più | 58,6 | 4,7 giri |

Sostituire i lavoratori fermi toglie il blocco e cambia poco i punteggi.

## 6. Come ho inteso quello che non è scritto

Sono le domande da chiudere nel regolamento.

| Punto | Come l'ho inteso |
|---|---|
| I 60 ambiti | Due copie di ognuno dei 30 che abbiamo. |
| Quali lavoratori hanno quale potere | 15 per tipo, a rotazione sul numero della carta. Tutti i lavoratori ne hanno uno. |
| Quando si attiva il potere | Quando metti il lavoratore su una formazione con l'azione "Inserire un lavoratore", che venga dal mercato o dai prenotati. |
| Prenotare un lavoratore attiva il suo potere? | No: si attiva quando poi lo inserisci. |
| Potere 4: "ignorando una formazione" | L'ho letto come prima: ignorando una delle sue icone ambizione. Le altre due devono essere coperte. |
| Potere 4: quale lavoratore e dove | Uno del mercato, che si ripristina, oppure uno prenotato; su una tua formazione libera. |
| Potere 2: il mercato | Si ripristina subito. I prenotati non hanno limite e li usa solo chi li ha. |
| Potere 3: quali formazioni | Carte dalla mano, per aprire pile nuove o migliorare pile non chiuse. |
| Chi non può fare nessuna azione | Passa. |
| Quando scatta "mazzo esaurito" | Quando si pesca l'ultima carta e non ci sono scarti. |
| Quante pile si possono aprire | Quante se ne vuole. |
| Il limite di mano | Riguarda gli ambiti. I lavoratori prenotati non contano. |
| Le categorie | Servono solo per i token. |

## 7. Cosa guardare al tavolo

1. **In 4, come finisce la partita?** Segnate se per il quinto set o per le carte finite.
2. **Chi prende i lavoratori con "pesca 2 ambiti" vince?** Contate quanti ne ha preso il vincitore.
3. **"Piazza un lavoratore" si riesce a usare?** Segnate quante volte va a vuoto.
4. **"Fino a 2 formazioni": quante se ne giocano davvero?**
5. **I lavoratori prenotati vengono usati?**
6. **Chi vince: chi chiude presto o chi aspetta il 16?**
7. **Quanto restano fermi i lavoratori al mercato?**
