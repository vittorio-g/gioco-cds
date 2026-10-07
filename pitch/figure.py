"""
Prepara le immagini che servono a regolamenti.tex, in pitch/img/.

    py -3 pitch/figure.py

Legge regolamenti.tex e produce solo le immagini che il documento usa:

    lav_NN.jpg   la carta del lavoratore NN        (da grafica/carte_v2/lavoratori)
    amb_NN.jpg   la carta dell'ambito NN           (da grafica/carte_v2/ambiti)
    dorso_lav.jpg, dorso_amb.jpg                   i due dorsi
    ill_NN.jpg   l'illustrazione del lavoratore NN (da grafica/illustrazioni/lav)
    art_NN.jpg   l'illustrazione dell'ambito NN, ritagliata dalla carta
    ico_XX.png   le sei icone                      (da webapp/public/icone)

Le carte a piena misura e le illustrazioni non stanno su GitHub ma su Drive
(vedi README): vanno rimesse in grafica/ prima di lanciare lo script.
Servono Python 3 e Pillow.
"""
import re
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent
IMG = QUI / "img"
IMG.mkdir(exist_ok=True)

LARGA_CARTA = 620  # punti: a 50 mm di larghezza sono più di 300 punti per pollice
LATO_ILLUSTRAZIONE = 900
RIQUADRO_AMBITO = (161, 129, 733, 701)  # l'illustrazione dentro una carta da 756 x 1056

tex = (QUI / "regolamenti.tex").read_text(encoding="utf-8")
usate = set(re.findall(r"\b((?:lav|amb|ill|art)_\d\d|dorso_(?:lav|amb))\b", tex))


def salva(img, nome, qualita=88):
    img.convert("RGB").save(IMG / f"{nome}.jpg", quality=qualita, optimize=True, progressive=True)


for nome in sorted(usate):
    tipo, _, numero = nome.partition("_")
    if tipo == "dorso":
        cartella = "lavoratori" if numero == "lav" else "ambiti"
        img = Image.open(RADICE / "grafica" / "carte_v2" / cartella / "dorso.png")
        salva(img.resize((LARGA_CARTA, round(LARGA_CARTA * img.height / img.width)), Image.LANCZOS), nome)
    elif tipo in ("lav", "amb"):
        cartella = "lavoratori" if tipo == "lav" else "ambiti"
        img = Image.open(RADICE / "grafica" / "carte_v2" / cartella / f"{numero}.png")
        salva(img.resize((LARGA_CARTA, round(LARGA_CARTA * img.height / img.width)), Image.LANCZOS), nome)
    elif tipo == "ill":
        img = Image.open(RADICE / "grafica" / "illustrazioni" / "lav" / f"{numero}.png")
        salva(img.resize((LATO_ILLUSTRAZIONE, LATO_ILLUSTRAZIONE), Image.LANCZOS), nome, 86)
    elif tipo == "art":
        img = Image.open(RADICE / "grafica" / "carte_v2" / "ambiti" / f"{numero}.png").crop(RIQUADRO_AMBITO)
        salva(img.resize((LATO_ILLUSTRAZIONE, LATO_ILLUSTRAZIONE), Image.LANCZOS), nome, 86)

for sigla in ("MA", "DI", "CO", "OR", "CR", "RI"):
    icona = Image.open(RADICE / "webapp" / "public" / "icone" / f"{sigla}.png").convert("RGBA")
    icona.resize((icona.width * 3, icona.height * 3), Image.LANCZOS).save(IMG / f"ico_{sigla}.png", optimize=True)

# toglie le immagini che il documento non usa più
for f in IMG.glob("*.jpg"):
    if f.stem not in usate:
        f.unlink()

peso = sum(f.stat().st_size for f in IMG.iterdir()) / 1e6
print(f"pitch/img: {len(list(IMG.iterdir()))} immagini, {peso:.1f} MB")
