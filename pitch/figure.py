"""
Prepara le immagini e i nomi dei poteri che servono ai documenti di pitch/:
regolamenti.tex (il documento del pitch) e regolamento_a5.tex (il libretto del print and play).

    py -3 pitch/figure.py

Legge i .tex e produce solo le immagini che usano, in pitch/img/:

    lav_NN.jpg   la carta della Persona NN          (da grafica/carte_v3/persone, senza abbondanza)
    amb_NN.jpg   la carta dell'ambito NN            (da grafica/carte_v3/ambiti, senza abbondanza)
    dorso_lav.jpg, dorso_amb.jpg                   i dorsi originali delle carte
    dorsoB_lav.jpg, dorsoB_amb.jpg                 i dorsi della proposta B (grafica/dorsi_proposte; per le
                                                   Persone B_persone.png, se c'è)
    ill_NN.jpg   l'illustrazione del lavoratore NN (da grafica/illustrazioni/lav)
    art_NN.jpg   l'illustrazione dell'ambito NN, ritagliata dalla carta
    ico_XX.png   le sei icone                      (da grafica/dati/icone_hd)

e scrive pitch/poteri.tex, coi nomi dei poteri (grafica/dati/poteri.json) e i
numeri delle Persone che hanno ciascun potere.

Le carte nuove si fanno con py -3 grafica/carte_nuove.py B (o con grafica/pnp.py). Le
illustrazioni e le carte dei designer non stanno su GitHub ma su Drive (vedi README): vanno
rimesse in grafica/ prima di lanciare lo script.
Servono Python 3 e Pillow.
"""
import re
import sys
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent
sys.path.insert(0, str(RADICE / "grafica"))
import poteri  # noqa: E402

IMG = QUI / "img"
IMG.mkdir(exist_ok=True)

LARGA_CARTA = 620  # punti: a 50 mm di larghezza sono più di 300 punti per pollice
LATO_ILLUSTRAZIONE = 900
RIQUADRO_AMBITO = (161, 129, 733, 701)  # l'illustrazione dentro una carta dei designer da 756 x 1056
ABBONDANZA = 24  # 2 mm a 12 pixel per millimetro, intorno alle carte nuove

tex = "\n".join(f.read_text(encoding="utf-8") for f in QUI.glob("*.tex") if f.name != "poteri.tex")
usate = set(re.findall(r"\b((?:lav|amb|ill|art)_\d\d|dorso[ABC]?_(?:lav|amb))\b", tex))


def salva(img, nome, qualita=88):
    img.convert("RGB").save(IMG / f"{nome}.jpg", quality=qualita, optimize=True, progressive=True)


def ridotta(img):
    return img.resize((LARGA_CARTA, round(LARGA_CARTA * img.height / img.width)), Image.LANCZOS)


for nome in sorted(usate):
    tipo, _, numero = nome.partition("_")
    mazzo = "lavoratori" if numero == "lav" or tipo == "lav" else "ambiti"
    if tipo == "dorso":
        salva(ridotta(Image.open(RADICE / "grafica" / "carte_v2" / mazzo / "dorso.png")), nome)
    elif tipo.startswith("dorso"):
        proposta = tipo[-1]
        file = RADICE / "grafica" / "dorsi_proposte" / f"{proposta}_{mazzo}.png"
        persone = file.with_name(f"{proposta}_persone.png")  # il dorso riscritto da grafica/dorso_persone.py
        if mazzo == "lavoratori" and persone.exists():
            file = persone
        salva(ridotta(Image.open(file)), nome)
    elif tipo in ("lav", "amb"):  # le carte di grafica/carte_nuove.py, tolti i 2 mm di abbondanza
        carta = Image.open(RADICE / "grafica" / "carte_v3" / ("persone" if tipo == "lav" else "ambiti") / f"{numero}.png")
        salva(ridotta(carta.crop((ABBONDANZA, ABBONDANZA, carta.width - ABBONDANZA, carta.height - ABBONDANZA))), nome)
    elif tipo == "ill":
        img = Image.open(RADICE / "grafica" / "illustrazioni" / "lav" / f"{numero}.png")
        salva(img.resize((LATO_ILLUSTRAZIONE, LATO_ILLUSTRAZIONE), Image.LANCZOS), nome, 86)
    elif tipo == "art":
        img = Image.open(RADICE / "grafica" / "carte_v2" / "ambiti" / f"{numero}.png").crop(RIQUADRO_AMBITO)
        salva(img.resize((LATO_ILLUSTRAZIONE, LATO_ILLUSTRAZIONE), Image.LANCZOS), nome, 86)

for sigla in ("MA", "DI", "CO", "OR", "CR", "RI"):
    icona = Image.open(RADICE / "grafica" / "dati" / "icone_hd" / f"{sigla}.png").convert("RGBA")
    icona.resize((300, 300), Image.LANCZOS).save(IMG / f"ico_{sigla}.png", optimize=True)

# toglie le immagini che i documenti non usano più
for f in IMG.glob("*.jpg"):
    if f.stem not in usate:
        f.unlink()

# i poteri: \potereUno = il nome, \effettoUno = che cosa fa, \breveUno = in poche parole, \chiUno = i numeri delle carte
PAROLE = {1: "Uno", 2: "Due", 3: "Tre", 4: "Quattro"}
nomi, chi = poteri.nomi(), poteri.assegnazione()
righe = ["% Scritto da pitch/figure.py a partire da grafica/dati/poteri.json: non modificarlo a mano."]
for k, p in nomi.items():
    numeri = " · ".join(sorted(n for n, q in chi.items() if q == k))
    righe += [rf"\newcommand{{\potere{PAROLE[k]}}}{{{p['nome']}}}", rf"\newcommand{{\effetto{PAROLE[k]}}}{{{p['effetto']}}}",
              rf"\newcommand{{\breve{PAROLE[k]}}}{{{p['breve']}}}", rf"\newcommand{{\chi{PAROLE[k]}}}{{{numeri}}}"]
(QUI / "poteri.tex").write_text("\n".join(righe) + "\n", encoding="utf-8")

peso = sum(f.stat().st_size for f in IMG.iterdir()) / 1e6
print(f"pitch/img: {len(list(IMG.iterdir()))} immagini, {peso:.1f} MB; pitch/poteri.tex scritto")
