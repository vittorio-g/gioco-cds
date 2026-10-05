# Collocamento — cosa dicono le simulazioni

Riguarda il [regolamento](REGOLAMENTO.md) del 5 ottobre 2026 con le ultime modifiche: 60 lavoratori e **60 ambiti**, mercato dei lavoratori, un'azione per turno, **poteri sui lavoratori**, token obiettivo.

I numeri vengono da [strumenti/analisi.mjs](strumenti/analisi.mjs): 3.000 partite tra bot per ogni variante, con le regole scritte in [strumenti/regole.mjs](strumenti/regole.mjs) e il mazzo a sei simboli.

I bot cercano il set che rende di più per i turni che costa (una pila, un lavoratore del mercato, un lavoro che hanno in mano) e fanno il primo passo; se non vedono niente che valga, pescano. Misurano ritmo e ordini di grandezza: un giocatore vero troverà mosse migliori, quindi i numeri vanno confermati al tavolo.

Due cose non sono ancora decise e le ho fissate io per poter simulare: i 60 ambiti sono **due copie di ognuno dei 30**, e i poteri sono dati a **15 lavoratori per tipo**, a rotazione sul numero della carta. Le altre scelte sono nel capitolo 7.

## 1. In breve

1. **Con 60 ambiti la partita funziona in 2 e in 3**: finisce sempre al quinto set, in circa 25 giri, e i token si assegnano. **In 4 le carte finiscono ancora prima**, nove volte su dieci.
2. **"Pesca 2 ambiti" vale molto più degli altri tre poteri.** Chi lo ha da solo vince l'84% delle partite a tre.
3. **"Piazza un lavoratore" e "fino a 2 formazioni" vanno a vuoto una volta su due.**
4. **Vince chi è esigente, non chi corre.** Chi pesca finché non vede un set che rende batte chi parte col primo che gli riesce; chi vuole solo set perfetti perde. In mezzo c'è una zona larga in cui lo stile non decide (capitolo 5).
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

**Un quarto dei turni si passa a pescare.** In 3: aprire 19%, migliorare 18%, inserire 18%, completare 19%, pescare 26%.

**Il limite di mano conta poco.** In 3 si scarta una carta a partita. Abbassandolo a 4 se ne scartano tre e i punti scendono da 56 a 55.

## 5. Gli stili di gioco

> **Correzione.** Fino alla versione precedente qui c'era scritto "vince chi chiude in fretta, non chi aspetta l'abbinamento perfetto". Era un'etichetta sbagliata. Il bot che chiamavo "rapido" non chiude prima degli altri: pesca di più, tiene più carte in mano e fa più set da 16. Quello che chiamavo "paziente" parte col primo set che gli riesce. Il dato era giusto, la lettura era al contrario.

### Che cosa distingue i bot

La manopola è una sola: **quanto deve rendere un set, per ogni azione che costa, perché valga la pena cominciarlo.** Chi la tiene bassa comincia qualunque set gli riesca. Chi la tiene alta pesca finché non ne vede uno buono.

Tre bot allo stesso tavolo:

| | Impulsivo (1) | Normale (2) | Esigente (3,5) |
|---|---|---|---|
| Vittorie | 19% | 33% | 48% |
| Punti | 51 | 56 | 60 |
| Set chiusi | 4,4 | 4,6 | 4,7 |
| Punti per set | 11,0 | 11,6 | 12,1 |
| Set da 16 punti | 25% | 32% | 40% |
| Turni passati a pescare | 25% | 26% | 28% |
| Carte in mano a fine partita | 3,1 | 3,4 | 3,8 |
| Chiude lui la partita | 24% | 35% | 41% |

Chiudono lo stesso numero di set e la partita dura uguale, 24 giri. Cambia quanto vale ogni set. Pescare prima o dopo costa le stesse azioni: chi pesca prima sceglie tra più carte.

### La curva

Un giocatore cambia stile, gli altri due restano normali. Alla pari vincerebbe il 33%.

| Quanto è esigente | Vittorie | Set chiusi | Punti per set | Set da 16 | Turni a pescare |
|---|---|---|---|---|---|
| 0,5 | 22% | 4,4 | 11,1 | 26% | 24% |
| 1 | 22% | 4,5 | 11,0 | 25% | 25% |
| 1,5 | 25% | 4,5 | 11,1 | 26% | 25% |
| **2 (come gli altri)** | 34% | 4,6 | 11,5 | 31% | 26% |
| 2,5 | 37% | 4,6 | 11,7 | 33% | 27% |
| 3 | 43% | 4,6 | 12,0 | 38% | 27% |
| 3,5 | 44% | 4,6 | 12,2 | 40% | 28% |
| 4 | 47% | 4,6 | 12,5 | 45% | 29% |
| 5 | 49% | 4,6 | 12,6 | 47% | 30% |
| 7 | 42% | 4,4 | 13,0 | 52% | 33% |

Le zone sono tre:

- **Sotto 2 si perde netto**, e non importa di quanto: da 0,5 a 1,5 le vittorie stanno tra il 22% e il 25%.
- **Tra 3 e 5 c'è un altopiano**: più set da 16 senza perdere set. È la zona dove conviene stare.
- **Oltre si comincia a pagare**: a 7 i set da 16 sono più della metà, ma se ne chiude uno in meno ogni cinque partite e le vittorie scendono.

### Se lo fanno tutti

Quando tutti e tre giocano allo stesso modo, più sono esigenti più punti fanno, e la partita non si allunga:

| Tutti a | 0,5 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Punti a testa | 54 | 53 | 56 | 58 | 61 | 61 |
| Giri | 25 | 25 | 24 | 24 | 24 | 24 |

### La risposta migliore a ogni tavolo

Vittorie di chi devia, contro due avversari uguali tra loro (alla pari 33%):

| Il tavolo gioca a | Lui a 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| 1 | 34% | 46% | 56% | 63% | 58% | 61% | 59% |
| 2 | 22% | 34% | 42% | 45% | 49% | 46% | 42% |
| 3 | 17% | 24% | 34% | 38% | 38% | 38% | 33% |
| 4 | 14% | 21% | 31% | 34% | 32% | 33% | 29% |
| 5 | 14% | 21% | 30% | 34% | 34% | 33% | 29% |
| 6 | 13% | 21% | 30% | 35% | 34% | 33% | 31% |

Contro qualunque tavolo la risposta migliore è tra 4 e 5. A un tavolo che gioca già a 4 nessuno guadagna cambiando: lì il gioco si ferma. Tra 3 e 6 le differenze sono di pochi punti: è la zona grigia vera, dove lo stile non decide.

### Altri modi di essere selettivi

Contro due avversari normali:

| Stile | Vittorie | Set chiusi | Punti per set | Set da 16 |
|---|---|---|---|---|
| Comincia qualunque set | 34% | 4,6 | 11,5 | 31% |
| Non comincia set sotto i 10 punti | 36% | 4,5 | 12,1 | 38% |
| Solo set perfetti, da 16 | 27% | 3,5 | 15,0 | 85% |
| Prima di costruire pesca fino a 3 carte | 40% | 4,5 | 12,4 | 44% |
| Fino a 4 carte | 42% | 4,4 | 13,1 | 54% |
| Fino a 5 carte | 43% | 4,3 | 13,6 | 60% |
| Fino a 6 carte, il limite di mano | 19% | 3,5 | 14,2 | 70% |
| Al massimo 2 formazioni per pila | 40% | 4,7 | 11,5 | 32% |
| Una sola formazione per pila | 22% | 3,1 | 15,2 | 86% |

**Il confine è un set.** Chi resta entro mezzo set dagli altri e guadagna uno o due punti a set vince. Chi rinuncia a un set intero per farne di perfetti perde: tre set e mezzo da 15 punti valgono quanto quattro e mezzo da 11,5, ma con meno set si prendono anche meno token (1,1 punti contro 3,0).

Chi tiene la mano a 4 o 5 carte chiude lui la partita solo una volta su sette, e vince lo stesso più degli altri: **non conta chi arriva primo al quinto set.**

### Cambiare passo a partita in corso

Contro due avversari normali:

| Stile | Vittorie |
|---|---|
| Mano da 5 carte, poi prende quello che c'è quando un avversario ha 4 set | 49% |
| Lo stesso, ma cambia quando un avversario ha 3 set | 45% |
| Esigente, poi prende quello che c'è quando un avversario ha 4 set | 48% |
| Lo stesso, a 3 set | 42% |
| Solo set perfetti, poi prende quello che c'è a 2, 3 o 4 set | 27%, 29%, 31% |
| Il contrario: impulsivo all'inizio, esigente quando un avversario ha 2 o 3 set | 34%, 29% |

Conviene restare selettivi fino all'ultimo e mollare solo quando la fine è vicina. Mollare prima costa. Per chi vuole solo set perfetti, mollare non basta a recuperare.

### Dipende dalle regole?

Vittorie di chi cambia stile, contro avversari normali:

| | Alla pari | Impulsivo | Esigente | Mano piena | Solo set perfetti |
|---|---|---|---|---|---|
| Regole di adesso, in 3 | 33% | 22% | 45% | 43% | 27% |
| Senza poteri | 33% | 19% | 45% | 38% | 27% |
| In 2 | 50% | 39% | 62% | 58% | 28% |
| In 4 | 25% | 15% | 41% | 38% | 32% |
| Si chiude al terzo set | 33% | 25% | 39% | 30% | 26% |
| Si chiude al settimo set, con le formazioni rimesse negli scarti | 33% | 19% | 51% | 52% | 29% |
| Il set perfetto vale 20 invece di 16 | 33% | 23% | 52% | 49% | 38% |
| Il set perfetto vale 25 | 33% | 23% | 54% | 58% | 48% |
| Scala più piatta: 5, 7, 9, 12 | 33% | 23% | 45% | 31% | 16% |
| Limite di mano 4 | 33% | 23% | 39% | 36% | 15% |
| Si pesca 1 carta invece di 2 | 33% | 21% | 45% | 34% | 27% |

- **L'impulsivo perde con qualunque regola**, l'esigente vince con qualunque regola.
- **Più la partita è corta, meno lo stile conta**: chiudendo al terzo set le differenze si riducono. Più è lunga, più conta.
- **"Solo set perfetti" diventa una strada vera solo se il 16 sale a 25**, oppure in 4, probabilmente perché lì le carte finiscono comunque e chiudere meno set costa meno.
- **Riempire la mano paga finché la mano è larga e si pesca in fretta**: con limite 4, o pescando una carta alla volta, il vantaggio quasi sparisce.

### Che cosa vuol dire per il gioco

La scelta "corro o aspetto" oggi non è un dilemma: aspettare un po' è sempre giusto, aspettare troppo è sempre sbagliato, e in mezzo c'è una zona larga in cui si equivalgono. Se si vuole che la fretta sia una strategia, deve esserci qualcosa che premia chi arriva prima: oggi chi chiude la partita non guadagna niente per averla chiusa.

## 6. Il mercato dei lavoratori

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

## 7. Come ho inteso quello che non è scritto

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

## 8. Cosa guardare al tavolo

1. **In 4, come finisce la partita?** Segnate se per il quinto set o per le carte finite.
2. **Chi prende i lavoratori con "pesca 2 ambiti" vince?** Contate quanti ne ha preso il vincitore.
3. **"Piazza un lavoratore" si riesce a usare?** Segnate quante volte va a vuoto.
4. **"Fino a 2 formazioni": quante se ne giocano davvero?**
5. **I lavoratori prenotati vengono usati?**
6. **Quante carte aveva in mano il vincitore quando cominciava i suoi set?** E quanti set da 16 ha fatto?
7. **Quanto restano fermi i lavoratori al mercato?**
