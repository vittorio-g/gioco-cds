# Prossima versione del print and play

Il 28 ottobre 2026 Vittorio ha stampato il print and play e il regolamento di Collocamento (tag git
`stampa-2026-10-28`) e poi la scatola (tag `stampa-scatola-2026-10-28`: interno 65 x 90 x 44, sul fronte
l'Archistar con "2-4 partecipanti" e "15 min, gioco di carte"). I PDF stampati sono su Drive in
`Collocamento - immagini della grafica/stampa/stampato 2026-10-28/`.

Il **5 novembre 2026** il print and play è stato rifatto con tutti i cambiamenti qui sotto, quelli del playtest
di novembre e le decisioni di Vittorio dello stesso giorno. Il **10 novembre** Vittorio ha chiesto due versioni per un
confronto A/B: **A con gli eventi** (`grafica/stampa/collocamento_pnp_A_con_eventi.pdf`, 19 fogli) e **B senza**
(`collocamento_pnp_B_senza_eventi.pdf`, 18 fogli), più i regolamenti a parte `collocamento_regolamento_a4_A.pdf` e
`_B.pdf`. Persone e Ambiti sono uguali; regolamento, carte riassunto e intestazioni dei fogli dicono la versione. Nella B
il foglio delle carte riassunto usa il lavoro 5 del laser, quindi i tre posti degli eventi si tagliano bianchi. È la
versione da stampare, non ancora stampata. Le carte si tagliano **plastificate** (buste in PET; in PVC il laser non
taglia). La scatola è stata rifatta il 10/11: interno 45 mm con linguette da 10 per le 136 carte, lavoro 11 del
laser (marker 33-35 da 12 mm, pieghe incise nel gruppo MARK); non si plastifica, sono tre fogli incollati (stampa e due
cartoncini). Elenca anche le 12 carte evento: con la versione B restano fuori.

**Taglio al laser.** Dal 5/11 il laser di aira (sessione LASER) trova i fogli con la telecamera: niente più crocini,
ma tre marker ArUco da 5 mm stampati solo sul fronte dei fogli di carte (lavoro 4 per i fogli da 9 carte, lavoro 5
per il foglio da 7). Le pagine coi marker vengono da laser-designs (`designs/fogli-stampati/segni`, commit
36d72a5) e sono copiate in `grafica/stampa/segni/`. I file di taglio (`grafica/stampa/taglio/`) hanno solo il gruppo
CUT: LASER li copia in `fogli-stampati` come `lavoro_04_taglio.svg` e `lavoro_05_taglio.svg` e aggiorna il suo
registro. In laser-designs non si scrive da qui.

| Data | Cambiamento | Dove | Stato |
|---|---|---|---|
| 28/10/2026 | Il potere 2, Colloquio, si chiama **Ho un amico** (poi tolto col playtest). | `grafica/dati/poteri.json` | superato |
| 02/11/2026 | La partita finisce quando qualcuno manda al lavoro la **terza Persona**; ogni altro partecipante gioca ancora un turno. Dal 5/11 la fine scatta anche quando qualcuno pesca **l'ultimo Ambito**: gli Ambiti non si rimescolano più. | libretto (pagine 2, 5, 9, 11), carta riassunto | nel PDF del 5/11 |
| 02/11/2026 | **Via i token obiettivo** e, dal 5/11, **via le cinque categorie** degli Ambiti: dalle carte, dal libretto, dal print and play (il foglio dei riassunti non ha più i token) e dall'elenco della scatola. | libretto, `carte_nuove.py`, `pnp.py`, `scatola.py` | nel PDF del 5/11 |
| 02/11/2026 | Il set chiuso si gira **in orizzontale** davanti a sé. Dal 5/11 resta intero, **Formazioni comprese**: gli Ambiti non hanno più scarti. | libretto (pagine 5, 6, 9, 11), carta riassunto | nel PDF del 5/11 |
| 02/11/2026 | Una carta Ambito giocata **coperta** vale come un ambito a scelta, che si dice quando la si gioca. Dal 5/11 **solo come Formazione**: come Lavoro chiudeva a 16 punti 51 Persone su 60. | libretto (pagine 3, 5, 10, 11), carta riassunto | nel PDF del 5/11 |
| 02/11/2026 | Inizia **chi ha fatto per ultimo un colloquio di lavoro** (prima: chi è più giovane). | libretto (pagina 4) | nel PDF del 5/11 |
| 02/11/2026 | **Nessun limite di mano** (prima 6 carte) e **il mercato non scorre** quando qualcuno pesca. Le Persone in tavola restano una per partecipante. | libretto (pagine 4, 5, 11), carta riassunto | nel PDF del 5/11 |
| 02/11/2026 | Ogni azione si **annuncia** prima di farla: serve al potere Contrordine. | libretto (pagine 5, 11), carta riassunto | nel PDF del 5/11 |
| 02/11/2026 | I poteri passano da quattro a **sei**, 10 Persone ciascuno: Passaparola, Corso intensivo, Networking (+2 punti al suo set), Concorrenza (prendi una Formazione, anche da sotto una Persona), Cacciatore di teste (prendi una Persona) e Contrordine. Contrordine, deciso il 5/11: chi lo subisce può rifare la stessa azione, ma non con quella carta. Escono Ho un amico e Chiamata diretta. L'ordine di chi ha quale potere è provvisorio. | `grafica/dati/poteri.json`, `grafica/poteri.py`; carte, carte riassunto, libretto (pagine 8, 10, 11) | nel PDF del 5/11 |
| 02/11/2026 | Le tre icone delle carte stanno **in fila in alto a sinistra**, sempre nell'ordine Manualità, Digitale, Comunicazione, Organizzazione, Creatività, Ricerca. Le pile si sfalsano in verticale. Sulle Persone potere e descrizione finiscono ad almeno 3 mm dal taglio, come chiede il laser; sugli Ambiti, senza categoria, l'illustrazione scende fino in fondo. | `grafica/carte_nuove.py` (`carta_B`, `ORDINE_ICONE`), `pitch/libretto.py`; libretto (pagine 3, 6) | nel PDF del 5/11 |
| 02/11/2026 | Il dorso degli Ambiti è la **Ruota** (scelta il 5/11 tra cinque proposte; spesa OpenAI 0,87 $), con le icone nell'ordine delle carte. | `grafica/genera_dorsi_ambiti.mjs`, `grafica/dorso_ruota.py` → `grafica/dorsi_proposte/ambiti_ruota_ordinata.png` (su Drive) | nel PDF del 5/11 |
| 02/11/2026 | Il libretto non spiega più come stampare e tagliare il print and play: la pagina 12 è il retro di copertina, con la nota sulle immagini. | `pitch/regolamento_a5.html` | nel PDF del 5/11 |
| 05/11/2026 | Le **12 carte evento** entrano nel gioco: a ogni giro se ne scopre una, che vale per tutto il giro; quando finiscono si rimescolano. Fondo rosa, effetto su un cartoncino col timbro QUESTO GIRO, spunto vero sul mercato del lavoro in Italia (controllati sulle fonti il 5/11). Nel print and play il foglio 15 ha gli eventi 1-9, il 16 le carte riassunto e gli eventi 10-12. | `grafica/dati/eventi.json`, `carte_nuove.py` (`carta_evento`), `pnp.py`; libretto (pagine 2, 4, 5, 9, 11) | nel PDF del 5/11 |
| 05/11/2026 | Il dorso degli eventi è **provvisorio**, una prima pagina di giornale disegnata senza immagini generate: quello illustrato non si è potuto fare perché i crediti OpenAI erano finiti. Ricaricati i crediti, `node grafica/genera_dorso_eventi.mjs` scrive `eventi.png` e `pnp.py` lo usa al posto del provvisorio. | `grafica/dorso_eventi.py` → `grafica/dorsi_proposte/eventi_giornale.png` | provvisorio |
| 05/11/2026 | Al posto dei crocini, **tre marker ArUco** sul fronte dei fogli di carte (vedi sopra); file di taglio nuovi: `collocamento_carte_taglio.svg` (lavoro 4, fogli 1-15) e `collocamento_riassunti_eventi_taglio.svg` (lavoro 5, foglio 16, vuoti gli ultimi due posti). | `grafica/pnp.py`, `grafica/stampa/segni/`, `grafica/stampa/taglio/` | nel PDF del 5/11 |

**Non allineati.** `REGOLAMENTO.md` è la trascrizione del testo dei designer del 5 ottobre e resta com'è. Le
simulazioni (`strumenti/regole.mjs`, `strumenti/analisi.mjs`) e `BUCHI.md` conoscono ancora le regole e i quattro
poteri del 28 ottobre. Il documento del pitch (`pitch/regolamenti.tex`) descrive la versione stampata:
`pitch/poteri.tex` ora ha sei poteri, quindi va riallineato prima di ricompilarlo. Il riepilogo per i designer è
`playtest/feedback_playtest_2026-11.tex` (il PDF è su Drive, in `playtest/`; le figure le fa `py -3 playtest/figure.py`).
| 10/11/2026 | Il logo a timbro tondo ha sull'arco basso **le sei icone delle competenze**, nell'ordine delle carte, al posto dei simboli delle categorie. | `grafica/logo_simboli.py` → `grafica/logo_proposte/A2_competenze.png` (su Drive) | fatto |
| 10/11/2026 | **Due versioni per il confronto A/B**, con e senza eventi: un sorgente solo per il regolamento, con i pezzi di una sola versione fra i commenti A e B; carte riassunto con la lettera della versione; `pnp.py` fa i due PDF. | `pitch/regolamento_a5.html`, `pitch/libretto.py`, `carte_nuove.py` (`VERSIONI`), `pnp.py` | nei PDF del 10/11 |
| 10/11/2026 | **Scatola** da 45 mm con linguette da 10, nel formato del laser di aira (lavoro 11): marker 33-35 da 12 mm, file di taglio con CUT e pieghe in MARK. | `grafica/scatola.py`, `grafica/segni_laser.py`, `grafica/stampa/segni/lavoro_11_segni.svg` | nel PDF del 10/11 |
