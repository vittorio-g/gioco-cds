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
| 02/11/2026 | Il dorso degli Ambiti è stato la **Ruota** dal 5/11 al 10/11 (cinque proposte, 0,87 $), poi sostituita dai Timbri (vedi sotto). | `grafica/dorsi_proposte/ambiti_ruota.png` (su Drive) | superato |
| 02/11/2026 | Il libretto non spiega più come stampare e tagliare il print and play: la pagina 12 è il retro di copertina, con la nota sulle immagini. | `pitch/regolamento_a5.html` | nel PDF del 5/11 |
| 05/11/2026 | Le **12 carte evento** entrano nel gioco: a ogni giro se ne scopre una, che vale per tutto il giro; quando finiscono si rimescolano. Fondo rosa, effetto su un cartoncino col timbro QUESTO GIRO, spunto vero sul mercato del lavoro in Italia (controllati sulle fonti il 5/11). Nel print and play il foglio 15 ha gli eventi 1-9, il 16 le carte riassunto e gli eventi 10-12. | `grafica/dati/eventi.json`, `carte_nuove.py` (`carta_evento`), `pnp.py`; libretto (pagine 2, 4, 5, 9, 11) | nel PDF del 5/11 |
| 05/11/2026 | Il dorso degli eventi è un collage di giornali, megafono, calendario, sveglia e timbro su fondo panna, con la fascia EVENTI, generato il 10/11 quando sono tornati i crediti OpenAI (0,17 $). Il 5/11 c'era una prima pagina di giornale disegnata a mano, che resta come riserva. | `grafica/genera_dorso_eventi.mjs` → `grafica/dorsi_proposte/eventi.png` (su Drive); riserva `grafica/dorso_eventi.py` | nel PDF A del 10/11 |
| 05/11/2026 | Al posto dei crocini, **tre marker ArUco** sul fronte dei fogli di carte (vedi sopra); file di taglio nuovi: `collocamento_carte_taglio.svg` (lavoro 4, fogli 1-15) e `collocamento_riassunti_eventi_taglio.svg` (lavoro 5, foglio 16, vuoti gli ultimi due posti). | `grafica/pnp.py`, `grafica/stampa/segni/`, `grafica/stampa/taglio/` | nel PDF del 5/11 |

**Non allineati.** `REGOLAMENTO.md` è la trascrizione del testo dei designer del 5 ottobre e resta com'è. Le
simulazioni (`strumenti/regole.mjs`, `strumenti/analisi.mjs`) e `BUCHI.md` conoscono ancora le regole e i quattro
poteri del 28 ottobre. Il documento del pitch (`pitch/regolamenti.tex`) descrive la versione stampata:
`pitch/poteri.tex` ora ha sei poteri, quindi va riallineato prima di ricompilarlo. Il riepilogo per i designer è
`playtest/feedback_playtest_2026-11.tex` (il PDF è su Drive, in `playtest/`; le figure le fa `py -3 playtest/figure.py`).
| 10/11/2026 | Il logo a timbro tondo ha sull'arco basso **le sei icone delle competenze**, nell'ordine delle carte, al posto dei simboli delle categorie. | `grafica/logo_simboli.py` → `grafica/logo_proposte/A2_competenze.png` (su Drive) | fatto |
| 10/11/2026 | **Due versioni per il confronto A/B**, con e senza eventi: un sorgente solo per il regolamento, con i pezzi di una sola versione fra i commenti A e B; carte riassunto con la lettera della versione; `pnp.py` fa i due PDF. | `pitch/regolamento_a5.html`, `pitch/libretto.py`, `carte_nuove.py` (`VERSIONI`), `pnp.py` | nei PDF del 10/11 |
| 10/11/2026 | **Scatola** da 45 mm con linguette da 10, nel formato del laser di aira (lavoro 11): marker 33-35 da 12 mm, file di taglio con CUT e pieghe in MARK. | `grafica/scatola.py`, `grafica/segni_laser.py`, `grafica/stampa/segni/lavoro_11_segni.svg` | nel PDF del 10/11 |
| 10/11/2026 | Sul retro della scatola, in fondo, il **logo del CdS** (Centro di Solidarietà della Compagnia delle Opere Liguria), ricolorato in petrolio come i testi; le due note piccole stanno in una riga. | `grafica/scatola.py` (`logo_cds`), `grafica/dati/logo_cds.svg` | nel PDF del 10/11 |
| 10/11/2026 | Eventi riscritti: **Click day** senza urlo (le 2 Persone in più si inseriscono come quelle del mercato e non si rimpiazzano: chi arriva prima le trova), **Centri per l'impiego** spiega che il posto preso resta vuoto fino a fine giro. Il mercato normale si ripristina sempre quando qualcuno prende una Persona; quello che è stato tolto è lo scorrimento quando si pesca. | `grafica/dati/eventi.json` | nei PDF del 10/11 |
| 10/11/2026 | La **scatola** è anche nel print and play, in fondo a ogni versione (A4 orizzontale e una pagina bianca dietro), con l'elenco della versione: nella B senza le carte evento. | `grafica/scatola.py` (`collocamento_scatola_A.pdf`, `_B.pdf`), `grafica/pnp.py` | nei PDF del 10/11 |
| 10/11/2026 | Dorso degli Ambiti da rifare **senza l'idea del jolly** (la Ruota per Vittorio «rovina il dorso»): quattro proposte con la fascia e le sei icone, Adesivi, Carta da parati, Collage, Timbri (0,76 $; prima altre quattro con la fascia e il jolly, 0,76 $). Vittorio ha scelto i **Timbri**, che prendono il posto della Ruota. | `grafica/genera_dorsi_ambiti.mjs` (`grafica_timbri`) → `grafica/dorsi_proposte/ambiti_grafica_timbri.png` (su Drive) | nei PDF del 10/11 |
| 10/11/2026 | Sul retro della scatola, sotto il logo del CdS, «Con il contributo del Fondo di beneficenza di» e il **logo Intesa Sanpaolo**, bianco su verde come l'originale (non ricolorato: è il marchio di un altro). Il logo è ricostruito in vettoriale dal tracciato che ha dato Vittorio, col verde e il margine del suo screenshot. | `grafica/scatola.py` (`logo_isp`), `grafica/dati/logo_intesa_sanpaolo.svg` | nei PDF del 10/11 |
| 10/11/2026 | Loghi del retro della scatola **tutti in petrolio**: quello di Intesa Sanpaolo senza il riquadro verde («rovina l'estetica»); sopra il logo del CdS «Dalla quotidiana esperienza del». Nell'elenco della scatola c'è anche il regolamento; la nota sulle immagini IA è l'ultima riga. | `grafica/scatola.py` (`LOGHI`, `logo_svg`), `grafica/dati/logo_intesa_sanpaolo.svg` | nei PDF del 10/11 |
| 10/11/2026 | **Regolamento su un foglio A4** fronte e retro, da piegare a fisarmonica 4 x 4 fino a 52,5 x 74,25 mm, per metterlo nella scatola: quattro colonne per lato larghe quanto le pieghe, copertina illustrata (ventaglio con L'Archistar fra Grafica e Ricerca, adesivi, timbro REGOLAMENTO) e retro coi loghi. Nel print and play prende il posto dei tre fogli del libretto A5 (A: 18 fogli, B: 17). Il libretto A5 resta come sorgente (`libretto.py a5`). | `pitch/regolamento_a4_piegato.html`, `pitch/libretto.py`, `pitch/figure.py`, `grafica/pnp.py` | nei PDF del 10/11 |
