# Prossima versione del print and play

Il 28 ottobre 2026 Vittorio ha stampato il print and play, il regolamento e la scatola di Collocamento.
Quella versione è fissata nel tag git `stampa-2026-10-28`, e i PDF stampati sono su Drive in
`Collocamento - immagini della grafica/stampa/stampato 2026-10-28/`.

Da allora i cambiamenti si accumulano qui per la versione successiva. Quelli segnati "nei sorgenti" sono
già fatti nei dati e negli script, ma i PDF non sono stati rifatti: si rifanno tutti insieme quando
serve la versione nuova (`py -3 grafica/pnp.py`, `py -3 grafica/scatola.py`, poi `pitch/` per il pitch).

I file di taglio delle carte in laser-designs (`designs/collocamento-print-and-play`) hanno due livelli di
crocini, grandi per le stampe fino al 28/10 e piccoli per quella del 28/10: dopo averci copiato gli SVG
nuovi da `grafica/stampa/taglio/` va rilanciato `crocini_due_versioni.py` in quella cartella.

| Data | Cambiamento | Dove | Stato |
|---|---|---|---|
| 28/10/2026 | Il potere 2, Colloquio, si chiama **Ho un amico**. | `grafica/dati/poteri.json`: lo prendono carte, carte riassunto, libretto e pitch | nei sorgenti |
| 28/10/2026 | Scatola più profonda: interno **65 x 90 x 44 mm** invece di 40. Le 124 carte plastificate misurano circa 40 mm (0,32 mm a carta, più delle stime), più circa 1,3 mm di token. Linguette da 11 mm invece di 14, per restare nell'A4. | `grafica/scatola.py` (`PROFONDITA`, `LINGUETTA`); poi il progetto LightBurn in laser-designs, `designs/collocamento-scatola` | nei sorgenti |
