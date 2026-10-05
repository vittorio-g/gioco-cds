# Collocamento — regolamento v0.4 (bozza)

Gioco di carte competitivo. Formi dei lavoratori e li mandi a lavorare: vince chi fa più punti, e i punti arrivano dai lavoratori collocati, tanto più se il lavoro combacia con le loro attitudini.

> **Come leggere questa bozza.** Le regole senza segno sono quelle fissate da Vittorio. Le regole marcate **[P]** sono proposte provvisorie, aggiunte per poter giocare una partita di prova: vanno confermate o cambiate. I motivi e le alternative sono in [BUCHI.md](BUCHI.md).
>
> **Per provarlo:** <https://collocamento.cortivo81.workers.dev>, oppure il salvataggio per Tabletop Simulator in [tts/](tts/). Sono tavoli liberi: le carte si pescano, si trascinano, si girano e si scartano come quelle vere, e le regole le applicate voi.

## 1. Materiale

Due mazzi separati di carte 63 × 88 mm. I dorsi sono coperti: da dietro una carta dice solo a quale mazzo appartiene.

**Lavoratori (60 carte).** Ogni lavoratore ha un nome, una battuta e una colonna con 3 icone: le sue **attitudini**.

**Ambiti (30 carte).** Ogni ambito ha un nome, una categoria e una colonna con 3 icone, e si può giocare in due modi: come **formazione** dà quelle 3 icone a un lavoratore come competenze; come **lavoro** quelle 3 icone sono il requisito per essere assunti. Gli ambiti hanno tutti un nome diverso e sono 6 per ognuna delle 5 categorie.

Le icone vengono da un insieme di **6 simboli** e sulla stessa carta possono ripetersi. I simboli non sono ugualmente diffusi, ed è voluto: un lavoro con simboli rari è più difficile da ottenere.

| Sigla | Nome | Icona | Diffusione | Icone sui lavoratori | Icone sugli ambiti |
|---|---|---|---|---|---|
| MA | Manualità | chiave inglese | comune | 40 | 20 |
| DI | Digitale | monitor | comune | 40 | 20 |
| CO | Comunicazione | fumetto | comune | 40 | 20 |
| OR | Organizzazione | elenco spuntato | non comune | 24 | 12 |
| CR | Creatività | stella | non comune | 24 | 12 |
| RI | Ricerca | lente, con una stellina | rara | 12 | 6 |

### Gli ambiti

| Categoria | Ambiti |
|---|---|
| 01 Tecnica e produzione | Assistenza tecnica `MA DI CO` · Controllo qualità `MA DI DI` · Artigianato `MA CO CR` · Agricoltura `MA DI OR` · Produzione `MA DI CO` · Manutenzione `MA MA DI` |
| 02 Servizi e relazioni | Assistenza clienti `DI CO MA` · Ristorazione `MA CO CO` · Educazione `MA CO CR` · Risorse umane `CO CR OR` · Turismo `CO CO CR` · Sanità `CO RI DI` |
| 03 Organizzazione e gestione | Logistica `MA DI OR` · Segreteria `DI OR CO` · Contabilità `DI OR MA` · Gestione progetti `DI CO OR` · Direzione `CO MA OR` · Torre di controllo `CO MA OR` |
| 04 Creatività e comunicazione | Giornalismo `CO CR RI` · Pubblicità `CO CR MA` · Spettacolo `MA CR OR` · Marketing `DI CO OR` · Architettura `CO MA CR` · Grafica `DI CR CO` |
| 05 Ricerca e innovazione | Ricerca `CR DI RI` · Prototipazione `MA DI RI` · Archivio `OR DI RI` · Sviluppo web `DI MA CR` · Consulenza `CR DI OR` · Analisi dati `DI RI MA` |

Ambiti diversi possono avere le stesse icone: per esempio Direzione e Torre di controllo, oppure Artigianato, Educazione, Pubblicità e Architettura. Due ambiti con le stesse icone permettono di formare un lavoratore esattamente per quel lavoro. Le categorie per ora non hanno un effetto nelle regole.

Gli elenchi completi sono in [mazzi/lavoratori.csv](mazzi/lavoratori.csv) e [mazzi/ambiti.csv](mazzi/ambiti.csv).

## 2. Tre parole

- **Attitudini**: le 3 icone stampate sul lavoratore. Non cambiano mai e servono a fare punti.
- **Competenze**: le icone delle formazioni che il lavoratore ha ricevuto. Servono a ottenere un lavoro.
- **Colonna**: un lavoratore con le sue formazioni. Ogni carta si appoggia sopra la precedente, spostata di lato quanto basta a lasciare scoperta la colonna delle icone di quella sotto. **[P]**

## 3. Preparazione

1. Si gioca da 2 a 4 giocatori. **[P]**
2. Mescolate i due mazzi e metteteli al centro, coperti. Lasciate spazio per gli scarti.
3. Ogni giocatore pesca **2 lavoratori e 2 ambiti**.
4. Le carte in mano sono coperte agli altri: si vede solo quante ne hai di ciascun mazzo.
5. Comincia un giocatore a caso; si procede in senso orario. **[P]**

## 4. Il turno

Nel tuo turno **giochi una carta e ne peschi una**. La peschi dal mazzo che preferisci. **[P]**

Se non puoi giocare nessuna carta, peschi soltanto. **[P]** Non c'è limite di carte in mano. **[P]** Quando il mazzo degli ambiti finisce, si rimescolano i suoi scarti. **[P]**

La carta si gioca in uno di questi quattro modi. L'ordine è obbligato: prima la formazione, poi il lavoratore, poi eventualmente altre formazioni, infine il lavoro.

**a) Aprire una formazione.** Metti un ambito davanti a te, scoperto. È una formazione *libera*: aspetta un lavoratore. Resta libera almeno per un giro, perché il tuo lavoratore potrai metterlo solo al turno dopo.

**b) Inserire un lavoratore.** Metti un lavoratore sopra una formazione libera, tua o di un altro giocatore (capitolo 5). Il lavoratore acquisisce come competenze le 3 icone di quella formazione.

**c) Aggiungere una formazione.** Metti un ambito sopra un tuo lavoratore: le sue 3 icone si sommano alle competenze che ha già. Un lavoratore può ricevere quante formazioni vuoi, una per turno.

**d) Mandare a lavorare.** Metti un ambito, come lavoro, sopra un tuo lavoratore. Puoi farlo solo se **tutte e 3** le icone del lavoro sono coperte, una per una, dalle competenze del lavoratore (capitolo 6). Segna subito i punti (capitolo 7), poi:

- lavoratore e lavoro vanno nella tua pila degli **occupati**; **[P]**
- le formazioni della colonna vanno negli scarti. **[P]**

Quel lavoratore ha finito: non torna più in gioco.

## 5. Formarsi da un altro giocatore

Puoi mettere un tuo lavoratore su una formazione libera aperta da un altro giocatore. È il lavoratore che va dalla formazione, non il contrario: la formazione resta dov'è, nell'area di chi l'ha aperta.

1. Il giocatore che aveva aperto la formazione **pesca subito 1 carta per ogni attitudine del tuo lavoratore che combacia** con un'icona della formazione (da 0 a 3 carte), dal mazzo che preferisce. **[P]**
2. Il lavoratore resta tuo: sei tu ad aggiungergli altre formazioni e a mandarlo a lavorare, e i punti sono tuoi. Per riconoscerlo tienilo girato verso di te. **[P]**
3. Chi aveva aperto la formazione non può rifiutare. **[P]**

Una formazione che ha già un lavoratore non è più libera: nessun altro può entrarci. **[P]**

## 6. Come si contano le icone

Le icone si accoppiano **una per una**: ogni icona può essere usata per un solo abbinamento. **[P]**

- **Requisito del lavoro.** Ogni icona del lavoro deve trovare una competenza uguale tra le formazioni del lavoratore. Un lavoro `MA CO CO` richiede un `MA` e due `CO`. Le competenze in più non danno fastidio. Le attitudini **non** contano per il requisito: contano solo le formazioni. **[P]**
- **Attitudini che combaciano.** Lavoratore `CO MA CO`, lavoro `CO CR OR`: combacia 1 icona (un solo `CO` trova il compagno). Lavoratore `CO MA CO`, lavoro `MA CO CR`: ne combaciano 2.

## 7. Punteggio

Per ogni lavoratore mandato a lavorare:

- **5 punti**, sempre;
- più un premio in base a quante icone del lavoro combaciano con le sue attitudini:

| Icone che combaciano | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Premio | 0 | 3 | 7 | 12 |
| Totale del lavoratore | 5 | 8 | 12 | 17 |

Il premio non si somma tra le colonne della tabella: con 2 icone il premio è 7, non 3 + 7. **[P]**

## 8. Fine della partita

La fine scatta quando un giocatore manda a lavorare il suo: **[P]**

- 5° lavoratore, in 2 giocatori;
- 4° lavoratore, in 3 giocatori;
- 3° lavoratore, in 4 giocatori.

Si completa il giro, in modo che tutti abbiano giocato lo stesso numero di turni. Poi ognuno somma i punti dei propri occupati.

- I lavoratori rimasti in formazione e le carte in mano valgono 0. **[P]**
- In caso di parità vince chi ha più lavoratori da 17 punti; se la parità resta, la vittoria è condivisa. **[P]**

## 9. Due esempi

**Formazione mirata.** Anna ha in mano Direzione e Torre di controllo, che hanno le stesse icone `CO MA OR`, e il lavoratore 04, Il Venditore di Trapani, attitudini `MA CO OR`.

1. Apre Direzione come formazione e pesca una carta.
2. Al turno dopo mette Il Venditore di Trapani sopra la formazione e pesca.
3. Al turno successivo gioca Torre di controllo come lavoro. Il requisito è coperto dall'unica formazione e le attitudini combaciano con tutte e 3 le icone: 5 + 12 = **17 punti** in tre carte.

Se prima del passo 2 Bruno, nel suo turno, avesse messo sulla formazione di Anna il suo lavoratore 45, Quello dei Grafici (attitudini `DI CO MA`), il lavoratore di Bruno sarebbe rimasto lì, nell'area di Anna, e Anna avrebbe pescato 2 carte: combaciano `CO` e `MA`.

**Due formazioni diverse.** Un lavoratore con le formazioni Logistica `MA DI OR` e Ristorazione `MA CO CO` ha le competenze `MA DI OR MA CO CO`: può fare, tra gli altri, i lavori Contabilità `DI OR MA`, Manutenzione `MA MA DI`, Produzione `MA DI CO`, Segreteria `DI OR CO` e Direzione `CO MA OR`.

## 10. Riassunto

| | |
|---|---|
| **All'inizio** | 2 lavoratori e 2 ambiti a testa |
| **Nel tuo turno** | giochi una carta: apri una formazione · inserisci un lavoratore · aggiungi una formazione · manda a lavorare |
| **Poi** | peschi 1 carta |

Punti per lavoratore occupato: 5, più 3 / 7 / 12 per 1 / 2 / 3 icone del lavoro che combaciano con le attitudini.

## 11. Proposte in valutazione

Due idee di Vittorio (5 ottobre 2026), non ancora adottate. La valutazione, con i numeri delle simulazioni, è in [BUCHI.md](BUCHI.md), capitolo 3.

1. **Il campo è di tutti.** Si può mettere un ambito sopra un altro ambito anche se sopra non c'è ancora un lavoratore.
2. **Piazzare invece di pescare.** Dove le regole fanno pescare carte in più, si può scegliere se pescarle o giocare altrettante carte.
