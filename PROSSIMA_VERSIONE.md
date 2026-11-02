# Prossima versione del print and play

Il 28 ottobre 2026 Vittorio ha stampato il print and play e il regolamento di Collocamento (tag git
`stampa-2026-10-28`) e poi la scatola (tag `stampa-scatola-2026-10-28`: interno 65 x 90 x 44, sul fronte
l'Archistar con "2-4 partecipanti" e "15 min, gioco di carte"). I PDF stampati sono su Drive in
`Collocamento - immagini della grafica/stampa/stampato 2026-10-28/`.

Da allora i cambiamenti si accumulano qui per la versione successiva. Quelli segnati "nei sorgenti" sono
già fatti nei dati e negli script, ma i PDF non sono stati rifatti: si rifanno tutti insieme quando
serve la versione nuova (`py -3 grafica/pnp.py`, `py -3 grafica/scatola.py`, poi `pitch/` per il pitch).

**File di taglio.** Gli SVG di `grafica/stampa/taglio/` corrispondono a quello che si stampa. In laser-designs
(`designs/collocamento-print-and-play`, `designs/collocamento-scatola`) i file sono rifiniti dalla sessione
LASER: due versioni di crocini per le carte (`crocini_due_versioni.py`), segni di tolleranza incisi al posto
dei crocini ripassati (`tools/crocini_tolleranza.py`, vedi `docs/crocini-tolleranza.md`), impaginazioni per i
fogli plastificati. Quindi non si copiano sopra a mano: gli SVG nuovi si passano a LASER, oppure dopo la
copia si rilanciano quegli strumenti (per la scatola:
`python tools/crocini_tolleranza.py collocamento_scatola_taglio.svg --centri 14,10 283,10 14,200 283,200`).

| Data | Cambiamento | Dove | Stato |
|---|---|---|---|
| 28/10/2026 | Il potere 2, Colloquio, si chiama **Ho un amico**. | `grafica/dati/poteri.json`: lo prendono carte, carte riassunto, libretto e pitch | nei sorgenti |
| 02/11/2026 | Playtest: la partita finisce quando qualcuno manda al lavoro la **terza Persona**; ogni altro partecipante gioca ancora un turno. Prima: al quinto set, chiudere il giro e un giro in più. | libretto (pagine 2, 9, 11), carta riassunto | nei sorgenti |
| 02/11/2026 | Con la fine al terzo set i token diventano **due set della stessa categoria** e **tre di categorie diverse** (5 e 3 punti). È una proposta: con le regole vecchie (tre uguali, quattro diverse) uno non si raggiungeva più. | libretto (pagine 7, 11), carta riassunto | proposta, nei sorgenti |
| 02/11/2026 | Playtest: il set chiuso si gira **in orizzontale** davanti a sé, col Lavoro dritto sopra la Persona. Le Formazioni vanno ancora negli scarti (da confermare coi designer). | libretto (pagine 5, 6), carta riassunto | nei sorgenti |
| 02/11/2026 | Playtest: una carta Ambito giocata **coperta** vale come un ambito a scelta (si dice quale quando la si gioca). Da limitare: 51 Persone su 60 hanno le stesse tre icone di un ambito, e come Lavoro coperto chiuderebbero sempre a 16 punti. | libretto (pagine 3, 5, 10, 11), carta riassunto | nei sorgenti |
| 02/11/2026 | Il dorso degli Ambiti ha un timbro rosa **JOLLY · un ambito a scelta** sotto la fascia. | `grafica/dorso_ambiti.py` scrive `grafica/dorsi_proposte/B_ambiti_jolly.png` (su Drive), che usano `pnp.py` e `pitch/figure.py` | nei sorgenti |
| 02/11/2026 | Playtest: inizia **chi ha fatto per ultimo un colloquio di lavoro** (prima: chi è più giovane). | libretto (pagina 4) | nei sorgenti |
| 02/11/2026 | Playtest: **nessun limite di mano** (prima 6 carte) e **il mercato non scorre** quando qualcuno pesca. Le Persone in tavola restano una per partecipante. | libretto (pagine 4, 5, 11), carta riassunto | nei sorgenti |
| 02/11/2026 | Ogni azione si **annuncia** prima di farla: serve al potere Contrordine. | libretto (pagine 5, 11), carta riassunto | nei sorgenti |
| 02/11/2026 | Playtest: i poteri passano da quattro a **sei**, 10 Persone ciascuno. Restano Passaparola e Corso intensivo; escono Ho un amico (e con lui le Persone prenotate) e Chiamata diretta; entrano Networking (+2 punti al suo set), Concorrenza (prendi una Formazione), Cacciatore di teste e Contrordine (nomi proposti, da decidere). L'ordine di chi ha quale potere è provvisorio. | `grafica/dati/poteri.json`, `grafica/poteri.py`; li prendono carte, carte riassunto e libretto (pagine 8, 10, 11) | nei sorgenti |
| 02/11/2026 | Playtest: le tre icone delle carte stanno **in fila in alto a sinistra**: in colonna sul lato destro, a ventaglio in mano, le copriva la carta accanto. Le pile si sfalsano in verticale, ognuna sporge in alto da quella che ha sopra; l'illustrazione si allarga a tutta la carta. | `grafica/carte_nuove.py` (`carta_B`); libretto (pagine 3, 6) | nei sorgenti |
| 02/11/2026 | Il libretto non spiega più come stampare e tagliare il print and play: la pagina 12 è il retro di copertina, con la nota sulle immagini. | `pitch/regolamento_a5.html` | nei sorgenti |

**Non allineati al playtest.** `REGOLAMENTO.md` è la trascrizione del testo dei designer del 5 ottobre e resta
com'è. Le simulazioni (`strumenti/regole.mjs`, `strumenti/analisi.mjs`) e `BUCHI.md` conoscono ancora le regole e
i quattro poteri del 28 ottobre. Il documento del pitch (`pitch/regolamenti.tex`) descrive la versione stampata:
`pitch/poteri.tex` ora ha sei poteri, quindi va riallineato prima di ricompilarlo. Il riepilogo per i designer
è il documento "Collocamento — feedback del playtest" su Claude
(<https://claude.ai/artifact/1ebCJV5budUYQ4josNWeR9>), con le domande ancora aperte.
