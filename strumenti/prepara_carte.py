"""Parte dal PDF originale del mazzo (60 carte, 120 pagine) e produce:

- carte/mazzo_v2_60_carte_63x88.pdf   lo stesso mazzo con la fascia del
                                      lavoratore intitolata ATTITUDINI
- webapp/public/img/lav/NN.png        l'illustrazione di ogni lavoratore
- webapp/public/img/sim/XX.png        le 10 icone dei simboli
- webapp/public/img/lavoro.png        l'illustrazione delle carte lavoro/formazione

Uso:  py -3 strumenti/prepara_carte.py percorso/del/mazzo_60_carte_63x88.pdf
"""
import sys
from pathlib import Path

import fitz  # PyMuPDF

RADICE = Path(__file__).resolve().parent.parent
ILLUSTRAZIONE = fitz.Rect(10, 49.4, 168.6, 192.4)  # riquadro del lavoratore sul fronte
ICONE_X = (37, 77, 117)  # le tre icone della fascia sul retro
ICONA_Y, ICONA_LATO = 210.4, 25

origine = Path(sys.argv[1])
doc = fitz.open(origine)

# 1. Etichetta: sul fronte la fascia delle attitudini era intitolata COMPETENZE.
corrette = 0
for pagina in doc:
    for xref in pagina.get_contents():
        flusso = doc.xref_stream(xref)
        if b"(COMPETENZE) Tj" in flusso:
            doc.update_stream(xref, flusso.replace(b"(COMPETENZE) Tj", b"(ATTITUDINI) Tj"))
            corrette += 1
(RADICE / "carte").mkdir(exist_ok=True)
uscita = RADICE / "carte" / "mazzo_v2_60_carte_63x88.pdf"
doc.save(uscita, garbage=3, deflate=True)
print(f"{uscita.relative_to(RADICE)}: etichetta corretta su {corrette} carte")

# 2. Illustrazioni dei lavoratori (pagine dispari = fronti).
lav = RADICE / "webapp" / "public" / "img" / "lav"
lav.mkdir(parents=True, exist_ok=True)
peso = 0
for i in range(0, len(doc), 2):
    pix = doc[i].get_pixmap(matrix=fitz.Matrix(2.2, 2.2), clip=ILLUSTRAZIONE, alpha=False)
    file = lav / f"{i // 2 + 1:02d}.png"
    pix.save(file)
    peso += file.stat().st_size
print(f"webapp/public/img/lav: {len(doc) // 2} illustrazioni, {peso // 1024} KB")

# 3. Icone dei simboli, ritagliate dalla fascia di un retro che le contiene.
sim = RADICE / "webapp" / "public" / "img" / "sim"
sim.mkdir(parents=True, exist_ok=True)
fatte = {}
for i in range(1, len(doc), 2):
    sigle = [s["text"] for b in doc[i].get_text("dict")["blocks"] for l in b.get("lines", [])
             for s in l["spans"] if s["bbox"][1] > 230]
    for x, sigla in zip(ICONE_X, sigle):
        if sigla not in fatte:
            ritaglio = fitz.Rect(x, ICONA_Y, x + ICONA_LATO, ICONA_Y + ICONA_LATO)
            doc[i].get_pixmap(matrix=fitz.Matrix(6, 6), clip=ritaglio, alpha=False).save(sim / f"{sigla}.png")
            colore = next(g["fill"] for g in doc[i].get_drawings()
                          if g.get("fill") and abs(g["rect"].x0 - x) < 0.5 and abs(g["rect"].width - ICONA_LATO) < 0.5)
            fatte[sigla] = "#%02x%02x%02x" % tuple(round(255 * c) for c in colore)
print("webapp/public/img/sim:", fatte)

# 4. Illustrazione delle carte lavoro/formazione: la scrivania, uguale per tutte.
SCRIVANIA = fitz.Rect(16, 49.4, 162.6, 167.4)
doc[1].get_pixmap(matrix=fitz.Matrix(2.2, 2.2), clip=SCRIVANIA, alpha=False).save(RADICE / "webapp" / "public" / "img" / "lavoro.png")
print("webapp/public/img/lavoro.png")
