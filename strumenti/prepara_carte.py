"""Corregge l'etichetta nel PDF del primo mazzo (60 carte a due facce, 120 pagine):
la fascia del lavoratore era intitolata COMPETENZE, diventa ATTITUDINI.
Scrive carte/mazzo_v2_60_carte_63x88.pdf.

Quel mazzo è superato: le carte attuali stanno in grafica/ e arrivano alla
webapp con strumenti/porta_carte.mjs.

Uso:  py -3 strumenti/prepara_carte.py percorso/del/mazzo_60_carte_63x88.pdf
"""
import sys
from pathlib import Path

import fitz  # PyMuPDF

RADICE = Path(__file__).resolve().parent.parent

doc = fitz.open(Path(sys.argv[1]))
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
