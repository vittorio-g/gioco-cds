# Che cosa è stato rivisto nei tre regolamenti

Il documento del pitch ([regolamenti.tex](regolamenti.tex), da cui si ricava `regolamenti.pdf`) riporta i tre regolamenti con alcune revisioni. Qui c'è l'elenco, gioco per gioco: che cosa diceva il testo dei designer, che cosa dice ora, perché. Dove c'è un numero, viene dalle simulazioni.

I testi dei designer sono trascritti senza modifiche in [REGOLAMENTO.md](../REGOLAMENTO.md) per Collocamento, [variante-carte/REGOLAMENTO.md](../variante-carte/REGOLAMENTO.md) per la Variante Carte e [mercato-del-lavoro/REGOLAMENTO.md](../mercato-del-lavoro/REGOLAMENTO.md) per Mercato del Lavoro.

Le revisioni sono proposte: le decisioni restano ai designer.

## 1. Collocamento

Testo di partenza: il regolamento dei designer del 5 ottobre 2026, con i 60 ambiti e i poteri sui lavoratori.

| | Prima | Ora | Perché |
|---|---|---|---|
| 1 | Chiuso un set, le sue Formazioni restano sul tavolo. | Vanno negli scarti. Restano Lavoratore e Lavoro. | In 4 gli Ambiti finivano prima del quinto set 9 volte su 10. |
| 2 | Il mercato dei lavoratori è un gruppo di carte. | È una fila: i nuovi entrano in coda, e chi sceglie "Pescare" fa uscire quello che c'è da più tempo. | Il mercato poteva bloccarsi senza via d'uscita, e i lavoratori difficili restavano lì per giri. |
| 3 | Potere 1: pesca 2 carte Ambito. | Pesca 1 carta. | Con 2 carte chi lo aveva da solo vinceva l'84% delle partite a tre. |
| 4 | Quali lavoratori hanno quale potere: da definire. | 15 per potere, il più utile ai lavoratori più difficili da formare. L'elenco per numero di carta è nel documento. | Senza un'assegnazione non si gioca. Messo sui lavoratori più difficili, il potere più forte è anche quello che si attiva meno: 2,8 volte a partita in 3, contro 3,2-3,7 degli altri. |
| 5 | I poteri hanno solo un numero. | Hanno anche un nome: Pesca, Prenota, Forma, Piazza. | Per poterne parlare. |
| 6 | Non scritto. | Il potere si attiva quando inserisci il lavoratore, anche se era prenotato; prenotare non lo attiva; i prenotati non contano nel limite di mano; un potere non usato va perso; si possono aprire quante pile si vuole; chi non può fare azioni passa. | Erano le domande aperte del capitolo 7 di [BUCHI.md](../BUCHI.md). |
| 7 | Esempio dei punti con un lavoratore "Digitale, Digitale, Comunicazione". | Esempio con carte vere: Il Tecnico Paziente, Logistica, Ristorazione, Direzione. | Una carta con quelle tre icone non esiste, e l'esempio serve anche alla figura. |

**Che cosa dicono le simulazioni delle regole riviste** (3.000 partite tra bot per riga; `node strumenti/analisi.mjs revisione`):

| | In 2 | In 3 | In 4 |
|---|---|---|---|
| Partite che arrivano al quinto set, regole scritte | 100% | 100% | 11% |
| Lo stesso, regole riviste | 100% | 100% | 100% |
| Giri, regole riviste | 25,8 | 25,0 | 24,5 |
| Punti a testa, regole riviste | 56,6 | 55,6 | 55,1 |
| Attesa di un lavoratore al mercato: scritte, riviste | 3,6 e 1,9 giri | 3,4 e 1,7 | 3,2 e 1,7 |
| Vittorie per posto al tavolo, regole riviste | 49% · 51% | 32% · 34% · 33% | 24% · 25% · 25% · 26% |

In 2 e in 3 la partita resta quella di prima. I quattro poteri, misurati dando ognuno a un giocatore solo, in 3: Pesca 60% di vittorie, Prenota 52%, Forma 39%, Piazza 38% (alla pari 33%). Prima erano 84%, 51%, 41%, 42%.

**Non toccato:** punti 5, 7, 10, 16; token obiettivo; fine al quinto set più un giro; spareggio «Lavoro!».

**Resta aperto:**

- Forma e Piazza vanno a vuoto circa una volta su due anche con le regole riviste.
- I 60 ambiti li ho intesi come due copie di ognuno dei 30: va confermato.
- Il regolamento chiama "ambizioni" le icone dei lavoratori, le carte le chiamano "attitudini". Nel documento ho tenuto "ambizioni", con una nota.

## 2. Variante Carte

Testo di partenza: il PDF "CDS Variante Carte", prototipo v0.1, ricevuto il 7 ottobre 2026. Questo gioco non è stato simulato: le revisioni vengono dalla lettura.

| | Prima | Ora | Perché |
|---|---|---|---|
| 1 | Combinazione errata: il Lavoratore torna al centro e la ricerca riprende. | In più, chi ha sbagliato è fuori dal round. | Senza un costo conviene prendere il Lavoratore appena si ha un dubbio, fermando tutti. È la stessa regola di Mercato del Lavoro. |
| 2 | Le carte trattenute restano davanti a te per il round. | Una carta posata non si gira e non torna nel Mercato fino a fine round. | Non era detto se si potesse cambiarle lato. |
| 3 | Non scritto. | Se il Lavoro chiede due volte la stessa competenza servono due fonti diverse. Si possono tenere più Lavori e più Formazioni del necessario. | Servono al controllo della combinazione. |
| 4 | Non scritto. | Se tutti sono fuori, o tutti sono d'accordo che non si può completare, il round si rigioca con un Lavoratore nuovo. | Le carte trattenute non tornano al Mercato: il round può restare senza soluzione. |
| 5 | Non scritto. | Il Lavoratore si prende con la mano libera. | Coerente con "una sola mano". |
| 6 | Numero di giocatori non indicato. | 2-4. | Preso dagli altri due giochi: da confermare. |

Il testo dell'introduzione è accorciato. Il resto è quello dei designer.

**Resta aperto:** com'è fatto il mazzo Mercato (quante carte, quante competenze chiede un Lavoro). Le carte a due facce non esistono ancora: nel documento sono disegnate come schema, e le figure del Mercato usano le carte di Collocamento, con la didascalia che lo dice.

## 3. Mercato del Lavoro

Testo di partenza: il PDF del prototipo v0.1 del 6 ottobre 2026. I numeri vengono dal modello descritto in [mercato-del-lavoro/BUCHI.md](../mercato-del-lavoro/BUCHI.md) (`node mercato-del-lavoro/analisi.mjs revisione`).

| | Prima | Ora | Perché |
|---|---|---|---|
| 1 | 25 meeple al centro, per tutti. La partita finisce col round in cui viene preso l'ultimo. | Ognuno ha i suoi meeple: 12 in 2, 8 in 3, 6 in 4. La partita finisce col round in cui un giocatore posa l'ultimo. | 25 è un multiplo di 2, 3 e 4 più uno: l'ultimo round aveva un meeple solo, cioè una carta regalata. E niente vietava di prendere più meeple per chiudere prima. |
| 2 | Non era detto quando posare il meeple. | È il primo componente che posi, uno solo per round. | È quello che fa l'esempio dei designer. Posandolo per ultimo la partita dura il doppio e i pezzi finiscono prima dei meeple. |
| 3 | Non scritto. | Un componente alla volta. | Senza limite si prendono a manciate. |
| 4 | Chi completa lo annuncia. | Chi completa mette la mano sulla Carta Lavoro: il primo che la tocca ferma il round. | Nel modello, in 4, un round su quattro si decide per circa mezzo secondo. La carta toccata decide senza discussioni, e obbliga ad avere lasciato i pezzi. |
| 5 | Non scritto. | Se il meeple nuovo cade o si sposta prima del contatto, per quella carta sei fuori. | Conseguenza di "uno per round" e di "non si ripara nulla". |
| 6 | Previsto solo per l'ultimo meeple. | Se nessuno può completare la carta, si scarta e se ne rivela un'altra. | Può succedere in qualunque round. |
| 7 | Non scritto. | Una carta vinta resta tua anche se la costruzione crolla dopo. | |
| 8 | Alla lettera anche una Sede vuota è "la seconda più alta". | Una Sede vuota non prende bonus. In caso di parità piena il bonus va intero a entrambi. | In 2 erano 2 punti a chi non posa niente. |

**Che cosa cambia nel modello** (tutti uguali, 20.000 partite per riga):

| | In 2 | In 3 | In 4 |
|---|---|---|---|
| Round: scritte, riviste | 13 e 12 | 9 e 8 | 7 e 6 |
| Ultimo round con un solo giocatore in gara: scritte, riviste | 60% e 0% | 52% e 0% | 52% e 0% |
| Componenti caduti a testa: scritte, riviste | 1,4 e 1,1 | 0,35 e 0,30 | 0,20 e 0,17 |

**Non toccato:** i punti (+1 a carta, +3, +2, +1 per l'altezza, -1 a componente caduto), i componenti, la regola fondamentale, l'esempio di Marta e Luca (adattato alle revisioni).

**Resta aperto,** e sta ai designer: vince quasi sempre il più veloce, correre conviene perché cadono pochi componenti, e il bonus altezza pesa quanto le carte in 4 senza che niente obblighi a salire. Dipendono dalla forma dei pezzi e dalla misura della pedana.

## Quello che nel documento non viene dai designer

- Le pagine "Un tema, tre giochi", "Il cast" e "A che punto siamo".
- Gli schemi: la carta Mercato a due facce, il meeple e i pezzi Competenza. Le forme sono inventate per spiegare la regola.
- La numerazione "prototipo 1, 2, 3" e l'ordine dei giochi.
- L'indirizzo del tavolo online di Collocamento, con il codice QR. Quel tavolo ha ancora 30 ambiti e non applica regole.

Nel documento mancano gli autori e un contatto: vanno aggiunti prima di mandarlo.

## Rifare il PDF

```bash
py -3 pitch/figure.py
```

prepara le immagini in `pitch/img/` a partire da `grafica/carte_v2/` e `grafica/illustrazioni/` (che stanno su Drive, vedi il README). Poi, da dentro `pitch/`:

```bash
pdflatex regolamenti.tex
```
