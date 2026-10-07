# Mercato del Lavoro v0.1: cosa dicono le simulazioni

Regolamento simulato: [REGOLAMENTO.md](REGOLAMENTO.md), prototipo v0.1 del 6 ottobre 2026.

Le regole riviste che ne sono uscite (meeple personali, uno per round e posato per primo, la carta toccata per fermare il round) sono in [../pitch/REVISIONI.md](../pitch/REVISIONI.md), con i loro numeri: `node mercato-del-lavoro/analisi.mjs revisione`.

## Come leggere questo documento

Un gioco di destrezza non si simula come un gioco di carte. Le regole non dicono quanto è grande la pedana, che forma hanno i pezzi, quanto spesso cade qualcosa: sono cose che si scoprono solo con i pezzi in mano. Per questo i risultati sono di tre tipi, e accanto a ognuno c'è scritto quale.

- **Conto.** Segue dalle regole e dai numeri dei componenti. Vale qualunque sia la fisica.
- **Regge.** Viene da un modello in cui la fisica è fatta di numeri scelti a occhio. Ho cambiato quei numeri uno alla volta, in su e in giù, e la conclusione non cambia. La tabella è nel capitolo 10.
- **Dipende.** Cambia con la fisica. Qui il modello dice solo da che cosa dipende e che cosa misurare al tavolo.

Le percentuali non sono previsioni: contano i confronti.

L'unità di tempo è il **gesto**: prendere un componente dal centro e posarlo. Ogni prova è fatta su migliaia di partite (da 5.000 a 20.000). Dove non è detto altrimenti si gioca in 4, con la fisica "di mezzo" e col meeple posato per primo.

## 1. In breve

1. **La partita è molto corta, e più si è più è corta** (conto). I 25 meeple bastano per 13 round in 2, 9 in 3, 7 in 4. In 4 ognuno fa 6 tentativi e posa 14 componenti: la Sede che "cresce, si affolla, sale in altezza" non fa in tempo ad arrivare.
2. **L'ultimo round di solito non è una gara** (conto). 25 è un multiplo di 2, di 3 e di 4, più uno: resta un meeple solo, e chi lo afferra prende la carta senza avversari.
3. **Se il meeple si posa per ultimo invece che per primo, la partita cambia del tutto** (regge): dura molto di più, in 4 più del doppio, i pezzi finiscono prima dei meeple e la regola di fine partita non scatta.
4. **Vince il più veloce, senza appello** (regge). In 4, chi è il 10% più veloce vince una partita su due invece di una su quattro; chi è il 10% più lento ne vince una su sedici. Non c'è niente che freni chi è avanti.
5. **Correre conviene** (regge). In una partita così corta cadono pochi componenti, e una carta vale quanto un componente caduto. La scelta tra fretta e cura, che è il cuore del gioco, oggi ha una risposta sola.
6. **Il gioco vero è riusare i pezzi** (regge). Già al secondo round due carte su tre le vince chi infila il meeple contro un pezzo che ha già; dal quarto, quasi tutte.
7. **Il bonus altezza pesa quasi quanto le carte, ma niente spinge a salire** (conto il primo, dipende il secondo). In 4 le carte danno 7 punti in tutto, l'altezza 6. Se la pedana tiene in piano quei 14 componenti, le Sedi restano basse e il bonus si assegna al millimetro.
8. **Mancano alcune regole che in tempo reale servono subito**: due chiamate insieme, un round che nessuno può chiudere, quanti componenti si possono prendere per volta. Sono nel capitolo 9.

## 2. I conti

Nell'esempio del regolamento chi gareggia posa per prima cosa il meeple (Luca "ha già posato un nuovo meeple e un pezzo B"). Se si gioca così, ogni round consuma un meeple a giocatore.

| | In 2 | In 3 | In 4 |
|---|---|---|---|
| Round pieni | 12 | 8 | 6 |
| Meeple rimasti per l'ultimo round | 1 | 1 | 1 |
| Carte assegnate, su 30 | 13 | 9 | 7 |
| Carte mai viste | 17 | 21 | 23 |
| Tentativi a testa | 12 o 13 | 8 o 9 | 6 o 7 |
| Carte a testa, in media | 6,5 | 3 | 1,75 |
| Punti dalle carte, in tutto | 13 | 9 | 7 |
| Punti dall'altezza, in tutto | 5 | 6 | 6 |

Il modello conferma: 13,0, 9,0 e 6,9 round.

**Quanto dura.** Un round si chiude in 4 o 5 gesti. La partita intera sono 64 gesti in 2, 40 in 3, 30 in 4. Se un gesto dura due o tre secondi, in 4 si sta con le mani sui pezzi per un minuto, un minuto e mezzo. Il resto è girare carte e controllare.

**Quanto si riempie la Sede.** Componenti posati a testa a fine partita, tra meeple e pezzi: 28 in 2, 18 in 3, 14 in 4. Una pedana pensata per affollarsi in 2, in 4 resta mezza vuota; una pensata per 4, in 2 trabocca.

**L'ultimo round.** Con 25 meeple ne resta sempre uno, a meno che un round finisca prima che tutti abbiano posato il proprio, o che un meeple cada e vada sostituito. Nel modello l'ultimo round ha meno meeple che giocatori nel 60% delle partite in 2, nell'82% in 3, nell'88% in 4. In una partita su due c'è un solo giocatore in gara: per lui è una carta regalata, e in 4 una carta è un settimo di tutte quelle assegnate.

**Chi resta a zero.** In 4, con 7 carte in tutto, tra giocatori di pari abilità uno su quattro finisce senza nemmeno una carta. Per puro caso sarebbe uno su otto: il resto lo fa il riuso (capitolo 4), e infatti si va dal 10% al 31% secondo quanto è facile riusare.

**I pezzi bastano.** I 75 pezzi sono 3 per meeple. Giocando col meeple per primo ne restano al centro 43-46: non finiscono mai, e un tipo si esaurisce al più in una partita su cento.

**Il mazzo.** Il regolamento non dice come sono fatte le 30 carte. Ho preso le 10 combinazioni di tre simboli diversi più le 20 con due simboli uguali e uno diverso: fanno giusto 30, con 18 simboli per tipo. Conta poco: col meeple per primo se ne vedono al massimo 13.

## 3. Vince il più veloce

Un giocatore è più veloce degli altri, a parità di precisione. Vittorie sue:

| | In 2 | In 3 | In 4 |
|---|---|---|---|
| Alla pari | 50% | 33% | 25% |
| Il 10% più veloce | 74% | 60% | 54% |
| Il 20% più veloce | 89% | 82% | 77% |
| Il 30% più veloce | 95% | 93% | 91% |

In 4, chi è il 10% più veloce prende 3,0 carte contro 1,3 degli altri. Chi è il 10% più lento vince il 6% delle partite, chi è il 20% più lento l'1%.

Quanto è netto dipende da quanto variano i tempi da un gesto all'altro: per il 20% più veloce si va dal 61% (tempi molto irregolari) al 92% (tempi regolari). Il verso non cambia mai.

Avere la mano ferma conta molto meno che essere veloci: chi urta la metà degli altri, alla stessa velocità, vince dal 26% al 35% delle partite secondo quanto traballano i pezzi.

**Perché è così netto.** Ogni round è una gara secca e le carte sono poche: non c'è un secondo posto, non c'è un handicap per chi è avanti, e chi ha vinto un round ha anche una Sede più ricca per il successivo (capitolo 4). In più gli spareggi dell'altezza premiano chi ha più carte.

## 4. Il gioco vero è il riuso

Dopo il primo round ogni Sede ha già due o tre pezzi, dopo il secondo tre o quattro. Chi ne trova uno utile risparmia un gesto su quattro, o due.

| | In 2 | In 4 |
|---|---|---|
| Carte vinte riusando almeno un pezzo, in tutta la partita | 88% | 78% |
| Al secondo round | 75% | 68% |
| Al terzo | 90% | 88% |
| Dal quarto in poi | 97% e più | 95% e più |
| Vittorie di chi non riusa mai | 2% | 6% |

Regge anche se riusare costa il doppio di quanto ho ipotizzato (87% e 76% delle carte).

**Chi vince, vince ancora?** Dipende da quanti meeple possono toccare lo stesso pezzo, cioè dalla forma dei pezzi.

| Un pezzo può essere toccato da | Chi ha vinto vince anche il round dopo (in 4, a caso 25%) |
|---|---|
| Un solo meeple | 18% |
| Tre meeple | 34% |
| Sei meeple | 35% |

Se un pezzo regge un solo meeple, i pezzi di chi ha vinto sono occupati e restano utili quelli posati da chi ha perso: il gioco aiuta chi è indietro. Se un pezzo ne regge tre o più, la Sede di chi vince diventa un vantaggio che cresce. È una scelta di forma dei pezzi, e decide il carattere del gioco.

## 5. Correre o andare piano

Chi corre fa prima ma urta di più: nel modello chi va il 30% più veloce urta il 69% più spesso. Un giocatore cambia andatura, gli altri tre restano a 1. Vittorie sue:

| Andatura | Pezzi stabili | Di mezzo | Pezzi che traballano |
|---|---|---|---|
| 0,70 (molto cauto) | 0% | 0% | 1% |
| 0,85 | 4% | 4% | 7% |
| 1 (come gli altri) | 25% | 25% | 26% |
| 1,15 | 61% | 56% | 45% |
| 1,30 | 85% | 76% | 57% |
| 1,50 | 95% | 89% | 64% |
| 1,80 (a rotta di collo) | 98% | 92% | 58% |

"Pezzi stabili" vuol dire un urto ogni 200 gesti, "di mezzo" uno ogni 50, "che traballano" uno ogni 15.

Andare piano perde sempre. Correre vince sempre, e solo con pezzi che traballano molto c'è un punto oltre il quale si torna indietro, ma comunque sopra il doppio della parità. Regge anche se la fretta costa in urti molto più di quanto ho ipotizzato.

**Perché.** Una carta vale +1 e un componente caduto vale -1. In 4 un giocatore fa 6 tentativi e posa 14 componenti in tutta la partita: con la fisica di mezzo, anche correndo molto ne perde uno, mentre le sue carte passano da 1,7 a 5. Componenti caduti per ogni tentativo, round per round:

| | Round 1 | 3 | 5 | 7 | 9 | 11 | 13 |
|---|---|---|---|---|---|---|---|
| In 4, di mezzo (un tentativo vale 0,25 carte) | 0,03 | 0,03 | 0,03 | 0,06 | | | |
| In 4, pezzi che traballano | 0,09 | 0,09 | 0,10 | 0,19 | | | |
| In 2, di mezzo (un tentativo vale 0,50 carte) | 0,03 | 0,03 | 0,04 | 0,06 | 0,12 | 0,22 | 0,38 |
| In 2, pezzi che traballano | 0,10 | 0,10 | 0,13 | 0,21 | 0,36 | 0,62 | 0,93 |

In 4 il costo di un tentativo non si avvicina mai a quello che vale: la partita finisce prima. In 2, con pezzi che traballano, dall'undicesimo round un tentativo costa più di quanto rende: è l'unico caso in cui compare il momento descritto nel regolamento, quello in cui "costruire diventa sempre più rischioso". Lì però nasce un altro problema: se a nessuno conviene più tentare, nessuno prende meeple, e la partita non finisce (capitolo 9).

## 6. Cadute e pedana

Quanti componenti cadono dipende quasi solo da due cose: quanto traballano i pezzi e quanti componenti la pedana tiene in piano prima che si debba salire. Fisica di mezzo:

| Componenti che stanno in piano | In 2: piani / caduti a testa | In 3 | In 4 |
|---|---|---|---|
| 8 | 6,7 / 10,9 | 4,4 / 1,6 | 2,6 / 0,4 |
| 12 | 4,0 / 1,4 | 2,1 / 0,35 | 1,7 / 0,2 |
| 24 | 1,8 / 0,4 | 1,0 / 0,2 | 1,0 / 0,15 |
| 40 | 1,0 / 0,3 | 1,0 / 0,2 | 1,0 / 0,13 |

I numeri precisi dipendono dalla fisica. Il quadro no:

- **In 4 le cadute contano poco**: con la pedana da 12, da 0,05 a 0,6 componenti a testa in tutta la partita secondo quanto traballano i pezzi; con la pedana da 8 e pezzi che traballano, 1,2. Cambiano il vincitore dal 2% al 17% delle partite.
- **In 2 la stessa pedana riceve il doppio dei componenti.** Se è piccola la partita diventa un crollo (con 8 posti tre giocatori su quattro finiscono sotto zero), se è grande non succede niente.
- La pedana giusta per 2 e quella giusta per 4 non sono la stessa. O cambia la pedana, o cambia il numero di round.

## 7. L'altezza

**Quanto pesa** (conto). Tra la Sede più alta e la più bassa ci sono 3 punti in 4, 2 in 3, 1 in 2. In 4 il giocatore medio ha 1,75 carte: un bonus da 3 vale più di tutte le sue carte. In 2 il bonus è un punto di differenza su 13 carte.

**Che cosa fa salire.** Con le regole scritte, niente obbliga a salire finché sulla pedana c'è posto. In 4 ognuno posa 14 componenti: se la pedana li tiene, tutte le Sedi sono alte un componente e il bonus si decide col righello, cioè con un meeple in piedi invece che sdraiato. Nel modello, secondo come si misura, il bonus cambia il vincitore dal 10% al 42% delle partite in 4.

**Salire apposta** è indifferente (regge): chi costruisce sempre un piano più su vince dal 22% al 28% delle partite in 4, cioè come gli altri. Prende quasi un punto di bonus in più, e lo paga con qualche carta e qualche componente caduto.

**Fare solo la torre** senza giocare le carte perde sempre (regge): prende al massimo 3 punti, mentre gli altri tre si dividono 9 carte e il migliore di loro ne ha almeno 3, più il suo bonus. Nel modello non arriva primo nemmeno una volta, neanche con i pezzi più stabili e la pedana più larga. **Non fare niente** vale 0 punti in 4, 1 in 3 e 2 in 2, perché alla lettera anche una Sede vuota è "la seconda più alta".

**Gli spareggi.** A parità di altezza prevale chi ha meno caduti, poi chi ha più carte. Il secondo spareggio dà il bonus a chi è già avanti.

## 8. Meeple per primo o per ultimo

Il regolamento chiede di usare "un nuovo meeple preso dal centro durante questo round", ma non dice quando posarlo. Si può posare per primo, come nell'esempio, oppure sistemare prima i pezzi e posare il meeple come ultimo gesto. Nel secondo caso chi perde il round ha ancora il meeple in mano, e il meeple torna al centro.

| Tutti posano il meeple | In 2 | In 3 | In 4 |
|---|---|---|---|
| Per primo: round | 13 | 9 | 7 |
| Per ultimo: round | circa 20 | 19 | 16 |
| Per ultimo: carte assegnate | da 16 a 18 | 15 | 12 |
| Per ultimo: pezzi rimasti al centro | 7 | 2 | 2 |
| Per ultimo: meeple rimasti al centro | 5 | 9 | 12 |
| Per ultimo: partite che finiscono perché nessuno può più completare | 9 su 10 | tutte | tutte |

Con il meeple per ultimo chi perde lascia sulla Sede fino a tre pezzi a round invece di un meeple e due pezzi. I 75 pezzi finiscono tra il decimo e il dodicesimo round, da lì si va avanti solo riusando, e a un certo punto nessuno può più chiudere una carta. I meeple non sono finiti, quindi **la regola di fine partita non scatta**: la partita si ferma e basta.

**Che cosa conviene al singolo** dipende da una cosa che si vede solo al tavolo: se infilare il meeple tra tre pezzi già posati è più difficile che accostare tre pezzi a un meeple.

- Se è uguale, chi posa per ultimo in un tavolo che posa per primo vince quanto gli altri (25% in 4).
- Se è il 25% più difficile, vince il 10%.
- In un tavolo dove tutti posano per ultimo, chi torna a posare per primo perde (14% in 4): a ogni round perso si ritrova un meeple inutile nella Sede e un pezzo in meno da riusare.

Sono quindi due giochi diversi, e quale dei due si gioca oggi lo decide un'abitudine. Va scritto.

**Bruciare i meeple.** Niente vieta di prendere più meeple in un round e posarli sulla Sede per far finire prima la partita quando si è in testa. Posandone uno per gesto non conviene (chi lo fa vince il 20% in 4, il 28% in 2), perché intanto gli altri prendono le carte. Se però si possono prendere a manciate, basta vincere la prima carta e rovesciare i meeple rimasti sulla propria pedana. Serve una regola (capitolo 9).

## 9. Che cosa non è scritto

Per ogni punto: che cosa manca e come l'ho inteso per poter simulare.

1. **Due giocatori annunciano insieme.** In 4, un round su quattro si decide per meno di un quarto di gesto, cioè circa mezzo secondo (dal 17% al 36% secondo quanto variano i tempi; il 12% in 2). Non c'è una regola. Nel modello vince chi arriva prima, anche di un soffio.
2. **Un round che nessuno può chiudere.** Il regolamento lo prevede solo per l'ultimo meeple. Può succedere prima: un tipo di pezzo è finito, oppure tutti hanno fatto una chiamata errata. Nel modello la carta si scarta e se ne gira un'altra; dopo tre carte scartate di fila la partita finisce.
3. **Smettere non si può.** La partita finisce solo quando tutti e 25 i meeple sono stati presi. Se a nessuno conviene più tentare, non finisce.
4. **"Preso" l'ultimo meeple.** Se chi lo prende ce l'ha ancora in mano a fine round, il meeple torna al centro: la partita è finita o no? Nel modello no: finisce quando al centro non ci sono più meeple.
5. **Quanti componenti per volta, e con quante mani.** Nel modello uno per gesto. Senza una regola si prendono a manciate: i meeple per chiudere la partita, o gli ultimi pezzi di un tipo per toglierli agli altri finché il round dura.
6. **Quando si posa il meeple** (capitolo 8), e se si può prendere più di un meeple a round.
7. **Costruire senza gareggiare.** "Tutti possono prendere componenti dal centro e costruire": alla lettera si possono posare pezzi che non servono alla carta, per l'altezza o per riusarli dopo. Nel modello è permesso.
8. **Un meeple urtato durante il suo round.** Non si può spostare, quindi ne serve un altro nuovo. Nel modello è così.
9. **Una carta già vinta la cui costruzione poi crolla.** Nel modello la carta resta.
10. **La Sede vuota e il bonus altezza.** Alla lettera lo prende. In 2 sono 2 punti a chi non posa niente.
11. **"Condividono quel bonus".** Lo prendono intero tutti e due, o lo dividono? Nel modello intero.
12. **Che cosa si misura per l'altezza.** Un meeple in piedi, un pezzo messo di taglio all'ultimo secondo: è il modo più economico di prendere 3 punti.
13. **La chiamata errata non costa niente**, a parte la carta. Farla costare un punto cambia poco: chi corre a rotta di collo passa dal 92% all'87% di vittorie.
14. **Com'è fatto il mazzo**, e se esistono carte con tre simboli uguali.

## 10. Il modello e la tenuta

Ogni giocatore, a ogni round: legge la carta, sceglie quanti pezzi riusare, poi fa un gesto alla volta. Ogni gesto ha una durata a caso e una probabilità di urtare qualcosa, che cresce con la fretta, con quanto è pieno il piano e con l'altezza. Un componente urtato può uscire dalla pedana (-1) o restarci; quello che gli stava sopra e resta senza appoggio viene giù. Vince il round il primo che ha il meeple e i tre pezzi a posto. Il codice è in [modello.mjs](modello.mjs), le prove in [analisi.mjs](analisi.mjs).

I numeri della fisica, tutti ipotesi mie:

| Che cosa | Valore di partenza | Provato anche |
|---|---|---|
| Urti: probabilità per gesto, a terra, pedana vuota | 2% | 0,5% e 6,5% |
| Componenti che stanno in piano sulla pedana | 12 | 8, 24, 40 |
| Meeple che possono toccare lo stesso pezzo | 3 | 1 e 6 |
| Pezzi già posati che un meeple nuovo può toccare insieme | 2 | 1 e 3 |
| Variabilità dei tempi da un gesto all'altro | 0,3 | 0,15 e 0,5 |
| Quanto la fretta aumenta gli urti | al quadrato | lineare e al cubo |
| Un componente urtato a terra esce dalla pedana | 35% | 15% e 70% |
| Ogni piano più su aumenta gli urti | +60% | +20% e +150% |

Le stesse domande, in 4, cambiando un numero alla volta. Le ultime cinque colonne sono le vittorie di un giocatore che gioca diverso dagli altri tre (alla pari 25%).

| Fisica | Caduti a testa | Il 20% più veloce | Corre (1,3) | Meeple per ultimo | Sale sempre | Solo torre |
|---|---|---|---|---|---|---|
| Di partenza | 0,20 | 77% | 76% | 24% | 25% | 0% |
| Urti un quarto | 0,05 | 82% | 85% | 23% | 26% | 0% |
| Urti il triplo | 0,62 | 67% | 57% | 26% | 23% | 0% |
| Pedana da 8 | 0,41 | 71% | 67% | 25% | 24% | 0% |
| Pedana da 24 | 0,15 | 73% | 70% | 23% | 28% | 0% |
| Un pezzo, un solo meeple | 0,23 | 65% | 60% | 25% | 23% | 0% |
| Riuso largo (6 meeple, 3 pezzi) | 0,20 | 78% | 78% | 26% | 26% | 0% |
| Tempi regolari | 0,21 | 92% | 90% | 29% | 25% | 0% |
| Tempi irregolari | 0,19 | 61% | 60% | 24% | 23% | 0% |
| La fretta costa poco | 0,20 | 77% | 80% | 24% | 25% | 0% |
| La fretta costa molto | 0,20 | 77% | 71% | 24% | 25% | 0% |
| Quasi tutto resta sulla pedana | 0,09 | 79% | 80% | 24% | 25% | 0% |
| Quasi tutto esce | 0,37 | 75% | 72% | 26% | 25% | 0% |
| In alto molto più rischioso | 0,23 | 75% | 73% | 27% | 22% | 0% |
| In alto poco più rischioso | 0,18 | 78% | 79% | 25% | 27% | 0% |
| Altezza misurata al millimetro | 0,19 | 78% | 81% | 25% | 27% | 0% |
| Meeple per ultimo più difficile del 25% | 0,20 | 77% | 76% | 10% | 25% | 0% |

In tutte le righe la partita dura 7 round, con una sola eccezione di mezzo round.

**Che cosa il modello non sa fare.** Non conosce la forma dei pezzi, quindi non sa dire se un contatto a tre è facile o no. Non sa quanto è alta una Sede in centimetri: conta i piani. I giocatori non cambiano idea durante la partita: non smettono di tentare quando la Sede diventa pericolosa, e per questo non riporto risultati sui casi in cui un giocatore resta solo a posare decine di componenti (in 2 contro uno che non fa niente). E non vede quello che succede tra le mani: gomiti, pezzi che volano nelle Sedi degli altri, discussioni sul contatto.

## 11. Varianti provate

Tutti uguali, fisica di mezzo. Non sono proposte: servono a vedere dove sta ogni problema.

| Variante | Effetto |
|---|---|
| 24 meeple invece di 25 | L'ultimo round con meno meeple che giocatori scende dall'88% al 52% in 4, dall'82% al 53% in 3, dal 60% al 40% in 2. Non sparisce, perché ogni tanto un round finisce prima che tutti abbiano posato il meeple. |
| Ognuno ha i suoi meeple (6 in 4, 8 in 3, 12 in 2) | Come sopra: 56%, 57%, 47%. |
| La partita finisce dopo un numero fisso di carte | L'ultimo round è sempre una gara vera e la durata è la stessa in 2, in 3 e in 4. Col meeple per primo servono più meeple: 12 round in 4 ne consumano 48. |
| Meeple per ultimo, fine dopo 10 carte | Funziona con i componenti di adesso: in 4 restano 8 pezzi e 14 meeple, ognuno posa 19 componenti invece di 14. In 3 e in 2 avanzano pezzi. |
| Meeple per ultimo, fine dopo 14 carte | In 4 non ci si arriva: i pezzi finiscono a 12 carte. In 3 ci si arriva 9 volte su 10, in 2 quasi sempre. |
| Bonus altezza 2, 1, 0 | In 2 e in 3 toglie un punto a tutti: l'ordine non cambia, ma la Sede vuota non prende più niente. In 4 la terza e la quarta Sede valgono uguale. |
| Al massimo 3 punti persi per le cadute | In 4 non cambia niente: più di 3 componenti non li perde quasi nessuno. |

## 12. Che cosa misurare al tavolo

Sono le cose che decidono in quale dei casi qui sopra cade il gioco vero.

1. **Quanti round dura la partita**, e quanti meeple ci sono al centro quando comincia l'ultimo.
2. **Quando posano il meeple**: per primo o per ultimo? Lo fanno tutti allo stesso modo?
3. **Quanti componenti stanno in piano sulla pedana**, e a che round qualcuno è costretto a salire. Se in 4 non succede mai, l'altezza non è in gioco.
4. **Quanti componenti cadono fuori in tutta la partita**, per giocatore. Se sono meno di uno a testa, correre è sempre giusto.
5. **Il round vinto: con quanti pezzi riusati?** E quanti meeple riescono a toccare lo stesso pezzo.
6. **Le carte a fine partita**: quante al primo, quante all'ultimo, quanti a zero.
7. **Quante chiamate sono contese**, e quante errate.
8. **Il cronometro**: quanto dura un round, quanto la partita.
9. **È più facile accostare tre pezzi a un meeple o infilare un meeple tra tre pezzi?**
