"""Il dorso B degli Ambiti con il timbro JOLLY.

Dopo il playtest di novembre 2026 una carta Ambito giocata coperta vale come un ambito a scelta:
il dorso lo deve dire a chi guarda il tavolo. Sul dorso disegnato resta tutto com'era e sotto la
fascia AMBITI si aggiunge un timbro rosa su fondo panna, nello stile dei timbri delle carte
(grafica/carte_nuove.py). Non serve una nuova immagine generata.

    py -3 grafica/dorso_ambiti.py

Legge grafica/dorsi_proposte/B_ambiti.png e scrive grafica/dorsi_proposte/B_ambiti_jolly.png,
che usano grafica/pnp.py e pitch/figure.py.
"""
import sys
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
sys.path.insert(0, str(QUI))
import carte_nuove as c  # noqa: E402

ORIGINE = QUI / "dorsi_proposte" / "B_ambiti.png"
DESTINO = QUI / "dorsi_proposte" / "B_ambiti_jolly.png"

CENTRO = (735, 905)      # in pixel del dorso (1008 x 1408): sotto la fascia, a destra, sopra la spillatrice
ANGOLO = -6
PANNA, ROSA = "#f5efe3", "#ff3d8b"


def main():
    dorso = Image.open(ORIGINE).convert("RGBA")
    scala = dorso.width / 63 / c.PX          # il dorso ha più pixel per millimetro delle carte di carte_nuove
    timbro = c.timbro("JOLLY", c.font(c.BAHN, 17, "Bold Condensed"), ROSA, ANGOLO, 11, c.PT(17) * 0.12,
                      sotto="UN AMBITO A SCELTA", f_sotto=c.font(c.BAHN, 6.6, "Bold Condensed"), fondo=PANNA,
                      sbavature=0.12, aria_sotto=1.0)
    timbro = timbro.resize((round(timbro.width * scala), round(timbro.height * scala)), Image.LANCZOS)
    dorso.alpha_composite(timbro, (round(CENTRO[0] - timbro.width / 2), round(CENTRO[1] - timbro.height / 2)))
    dorso.convert("RGB").save(DESTINO)
    print(DESTINO)


if __name__ == "__main__":
    main()
