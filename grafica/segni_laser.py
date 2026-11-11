"""I marker ArUco di aira laser, dalle pagine dei segni di laser-designs.

Il laser di aira (sessione LASER) trova i fogli sul piano con la telecamera leggendo tre marker ArUco
(DICT_4X4_250) stampati sul fronte. Le pagine coi marker le fa laser-designs (designs/fogli-stampati/segni.py)
e sono copiate in grafica/stampa/segni/lavoro_NN_segni.svg: 4 = fogli da 9 carte, 5 = foglio da 7 carte,
11 = scatola, 12 = fogli del libretto del regolamento. Qui si leggono come rettangoli, da ridisegnare in vettoriale nei PDF (pnp.py, scatola.py).
"""
import re
from pathlib import Path

SEGNI = Path(__file__).resolve().parent / "stampa" / "segni"


def marker(lavoro):
    """I tre marker del lavoro: [(riquadro bianco, [quadretti neri]), ...], ogni rettangolo come
    (x, y dall'alto, larghezza, altezza) in mm sulla pagina."""
    testo = (SEGNI / f"lavoro_{lavoro:02d}_segni.svg").read_text(encoding="utf-8")
    trovati = re.findall(r'<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#fff"/>'
                         r'<path d="([^"]+)" fill="#000"/>', testo)
    if len(trovati) != 3:
        raise SystemExit(f"lavoro_{lavoro:02d}_segni.svg: mi aspettavo tre marker, ne ho trovati {len(trovati)}")
    return [((float(x), float(y), float(w), float(h)),
             [tuple(map(float, q)) for q in re.findall(r"M([\d.]+) ([\d.]+)h([\d.]+)v([\d.]+)h-[\d.]+z", nero)])
            for x, y, w, h, nero in trovati]
