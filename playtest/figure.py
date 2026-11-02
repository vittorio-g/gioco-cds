"""
Le immagini del documento sul playtest di novembre 2026 (playtest/feedback_playtest_2026-11.tex).

    py -3 playtest/figure.py

Scrive in playtest/img/:
    carte.jpg   tre carte nuove con le icone in alto (grafica/carte_v3, senza abbondanza)
    dorsi.jpg   le cinque proposte di dorso degli Ambiti (grafica/dorsi_proposte/ambiti_*.png,
                fatte da grafica/genera_dorsi_ambiti.mjs)
Le carte si rifanno con py -3 grafica/carte_nuove.py B; i dorsi stanno su Drive.
"""
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
GRAFICA = QUI.parent / "grafica"
IMG = QUI / "img"
IMG.mkdir(exist_ok=True)
ABBONDANZA = 24  # 2 mm a 12 pixel per millimetro
DORSI = ["ruota", "trama", "modulo", "multiutensile", "passepartout"]


def fila(immagini, altezza, spazio):
    ridotte = [im.convert("RGB").resize((round(im.width * altezza / im.height), altezza), Image.LANCZOS) for im in immagini]
    tela = Image.new("RGB", (sum(r.width for r in ridotte) + spazio * (len(ridotte) - 1), altezza), "white")
    x = 0
    for r in ridotte:
        tela.paste(r, (x, 0))
        x += r.width + spazio
    return tela


carte = []
for cartella, n in (("persone", "01"), ("persone", "21"), ("ambiti", "17")):
    c = Image.open(GRAFICA / "carte_v3" / cartella / f"{n}.png")
    carte.append(c.crop((ABBONDANZA, ABBONDANZA, c.width - ABBONDANZA, c.height - ABBONDANZA)))
fila(carte, 900, 50).save(IMG / "carte.jpg", quality=88, optimize=True)

dorsi = [Image.open(GRAFICA / "dorsi_proposte" / f"ambiti_{n}.png") for n in DORSI]
fila(dorsi, 900, 40).save(IMG / "dorsi.jpg", quality=88, optimize=True)
print("playtest/img: carte.jpg, dorsi.jpg")
