# Collocamento — regolamento v0.3 (bozza)

Gioco di carte competitivo. Formi dei lavoratori e li mandi a lavorare: vince chi fa più punti, e i punti arrivano dai lavoratori collocati, tanto più se il lavoro combacia con le loro attitudini.

> **Come leggere questa bozza.** Le regole senza segno sono quelle fissate da Vittorio. Le regole marcate **[P]** sono proposte provvisorie, aggiunte per poter giocare una partita di prova: vanno confermate o cambiate. I motivi e le alternative sono in [BUCHI.md](BUCHI.md).
>
> **Per provarlo:** <https://collocamento.cortivo81.workers.dev>. È un tavolo virtuale libero: le carte si pescano, si trascinano, si girano e si scartano come quelle vere, e le regole le applicate voi.

## 1. Materiale

Due mazzi separati di carte 63 × 88 mm. I dorsi sono coperti: da dietro una carta dice solo a quale mazzo appartiene.

**Lavoratori (60 carte).** Ogni lavoratore ha un nome, una battuta e una fascia con 3 icone: le sue **attitudini**. I lavoratori sono tutti diversi.

**Ambiti (60 carte).** Ogni ambito ha una terna di 3 icone e si può giocare in due modi: come **formazione** dà quelle 3 icone a un lavoratore come competenze; come **lavoro** quelle 3 icone sono il requisito per essere assunti.

Le icone vengono da un insieme di 10 simboli e sulla stessa terna possono ripetersi. I simboli non sono ugualmente diffusi, ed è voluto: un lavoro con simboli rari è più difficile da ottenere.

| Sigla | Nome **[P]** | Icona | Colore | Icone sugli ambiti | Icone sui lavoratori |
|---|---|---|---|---|---|
| CL | Collaborazione | due persone | rosa | 26 | 24 |
| DI | Digitale | monitor | rosa | 26 | 24 |
| OR | Organizzazione | elenco spuntato | rosa | 26 | 24 |
| MA | Manualità | chiave inglese | rosa | 25 | 24 |
| CO | Comunicazione | fumetto | rosa | 23 | 24 |
| CR | Creatività | stella | petrolio | 14 | 14 |
| CD | Coordinamento | organigramma | petrolio | 13 | 14 |
| AN | Analisi | grafico a barre | petrolio | 11 | 14 |
| RI | Ricerca | lente | petrolio con stellina | 8 | 9 |
| ST | Strategia | bandierina | petrolio con stellina | 8 | 9 |

Il colore dell'icona dice quanto è diffuso il simbolo: rosa si trova spesso, petrolio meno, con la stellina è raro.

### Gli ambiti del mazzo

Gli ambiti diversi sono 24, alcuni molto più frequenti di altri: due copie dello stesso ambito permettono di formare un lavoratore esattamente per quel lavoro.

| Copie | Ambiti |
|---|---|
| 5 | Logistica `MA DI OR` · Segreteria `CO OR CL` |
| 4 | Assistenza tecnica `MA DI CL` · Assistenza clienti `DI CO OR` · Ristorazione `MA CO CL` |
| 3 | Contabilità `DI OR AN` · Controllo qualità `MA DI AN` · Artigianato `MA CL CR` · Educazione `OR CL CR` · Risorse umane `CO CL CD` · Gestione progetti `DI CO CD` |
| 2 | Giornalismo `CO CR RI` · Ricerca `OR CD RI` · Prototipazione `MA DI RI` · Agricoltura `MA AN ST` · Consulenza `OR AN ST` · Pubblicità `CL CR ST` · Spettacolo `MA CR CD` |
| 1 | Archivio `OR RI RI` · Marketing `DI CO ST` · Direzione `CL CD ST` · Torre di controllo `CO CD CD` · Architettura `CL AN CR` · Sviluppo web `DI OR CR` |

Ogni ambito ha un nome di mestiere **[P]** e, tra i lavoratori, qualcuno con esattamente quelle attitudini. Gli elenchi completi sono in [mazzi/lavoratori.csv](mazzi/lavoratori.csv) e [mazzi/lavori_v3.csv](mazzi/lavori_v3.csv).

## 2. Tre parole

- **Attitudini**: le 3 icone stampate sul lavoratore. Non cambiano mai e servono a fare punti.
- **Competenze**: le icone delle formazioni che il lavoratore ha ricevuto. Servono a ottenere un lavoro.
- **Colonna**: un lavoratore con le sue formazioni. Ogni carta si appoggia sopra la precedente, spostata verso l'alto quanto basta a lasciare scoperta la fascia delle icone di quella sotto. **[P]**

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

- **Requisito del lavoro.** Ogni icona del lavoro deve trovare una competenza uguale tra le formazioni del lavoratore. Un lavoro `CO CD CD` richiede un `CO` e due `CD`. Le competenze in più non danno fastidio. Le attitudini **non** contano per il requisito: contano solo le formazioni. **[P]**
- **Attitudini che combaciano.** Lavoratore `DI OR OR`, lavoro `OR CL CR`: combacia 1 icona (un solo `OR` trova il compagno). Lavoratore `CO OR OR`, lavoro `CO OR CL`: ne combaciano 2.

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

**Formazione mirata.** Anna ha in mano due copie dell'ambito `CO OR CL` e il lavoratore 09, attitudini `CO OR CL`.

1. Apre come formazione una delle due copie e pesca una carta.
2. Al turno dopo mette il lavoratore 09 sopra la formazione e pesca.
3. Al turno successivo gioca l'altra copia come lavoro. Il requisito è coperto dall'unica formazione e le attitudini combaciano con tutte e 3 le icone: 5 + 12 = **17 punti** in tre carte.

Se prima del passo 2 Bruno, nel suo turno, avesse messo sulla formazione di Anna il suo lavoratore 45 (attitudini `DI CO AN`), il lavoratore di Bruno sarebbe rimasto lì, nell'area di Anna, e Anna avrebbe pescato 1 carta: combacia solo `CO`.

**Due formazioni diverse.** Un lavoratore con le formazioni `MA CO CL` e `DI CO OR` ha le competenze `MA CO CL DI CO OR`: può fare il lavoro `MA DI OR`, oppure `DI CO OR`, `MA CO CL`, `CO OR CL`, `MA DI CL`.

## 10. Riassunto

| | |
|---|---|
| **All'inizio** | 2 lavoratori e 2 ambiti a testa |
| **Nel tuo turno** | giochi una carta: apri una formazione · inserisci un lavoratore · aggiungi una formazione · manda a lavorare |
| **Poi** | peschi 1 carta |

Punti per lavoratore occupato: 5, più 3 / 7 / 12 per 1 / 2 / 3 icone del lavoro che combaciano con le attitudini.
