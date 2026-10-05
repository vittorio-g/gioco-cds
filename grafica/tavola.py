"""Affianca alcune carte montate in un'unica immagine, per guardarle insieme.

Uso:  py -3 grafica/tavola.py uscita.jpg carta1.png carta2.png ... [--colonne N]
I percorsi delle carte sono relativi a grafica/carte/.
"""
import sys
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
argomenti = sys.argv[1:]
colonne = 6
if "--colonne" in argomenti:
    i = argomenti.index("--colonne")
    colonne = int(argomenti[i + 1])
    del argomenti[i:i + 2]
uscita, carte = argomenti[0], argomenti[1:]

lato, margine = 378, 14  # metà della carta montata
immagini = [Image.open(QUI / "carte" / c).convert("RGB").resize((lato, round(lato * 880 / 630)), Image.LANCZOS) for c in carte]
alto = immagini[0].height
righe = -(-len(immagini) // colonne)
tela = Image.new("RGB", (margine + min(colonne, len(immagini)) * (lato + margine), margine + righe * (alto + margine)), (60, 60, 60))
for i, img in enumerate(immagini):
    tela.paste(img, (margine + (i % colonne) * (lato + margine), margine + (i // colonne) * (alto + margine)))
tela.save(uscita, quality=88)
print(uscita, tela.size)
