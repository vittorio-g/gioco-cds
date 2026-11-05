"""Il dorso delle carte evento, disegnato senza immagini generate: una prima pagina di giornale.

    py -3 grafica/dorso_eventi.py

Le Persone hanno il dorso rosa, gli Ambiti petrolio (la Ruota): gli eventi il fondo panna. In alto la
testata COLLOCAMENTO, il titolo EVENTI, due colonne di righe come un articolo e il timbro rosa QUESTO
GIRO, con i caratteri e i timbri di grafica/carte_nuove.py. È il dorso provvisorio del 5/11/2026: quello
illustrato (grafica/genera_dorso_eventi.mjs) non si è potuto generare perché i crediti OpenAI erano finiti.
Scrive grafica/dorsi_proposte/eventi_giornale.png (63 x 88 mm senza abbondanza: la aggiunge pnp.py).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

QUI = Path(__file__).resolve().parent
sys.path.insert(0, str(QUI))
import carte_nuove as c  # noqa: E402

DESTINO = QUI / "dorsi_proposte" / "eventi_giornale.png"


def M(mm):
    """Da millimetri sulla carta (senza abbondanza) a pixel."""
    return round(mm * c.PX)


def main():
    tela = Image.new("RGBA", (M(c.W), M(c.H)), c.PANNA)
    d = ImageDraw.Draw(tela)
    # la testata
    f_t = c.font(c.BAHN, 8.5, "SemiBold Condensed")
    c.scrivi(d, M(31.5), M(11.5), "COLLOCAMENTO", f_t, c.PETROLIO, c.PT(8.5) * 0.3, "ms")
    d.rectangle([M(5), M(13.6), M(58), M(14.4)], fill=c.PETROLIO)
    d.rectangle([M(5), M(15.2), M(58), M(15.5)], fill=c.PETROLIO)
    f_g, righe, pt, _ = c.adatta("EVENTI", c.BAHN, 60, 30, M(50), 1, "Bold Condensed")
    c.scrivi(d, M(31.5), M(16.6) + c.PT(pt) * 0.76, "EVENTI", f_g, c.PETROLIO, 0, "ms")
    y = 16.6 + pt * 0.3528 * 0.76 + 2.4
    d.rectangle([M(5), M(y), M(58), M(y + 0.3)], fill=c.PETROLIO)
    d.rectangle([M(5), M(y + 1.1), M(58), M(y + 1.9)], fill=c.PETROLIO)
    # due colonne di articolo: un titoletto rosa e righe di testo finto
    rng = np.random.default_rng(5)
    top = y + 5
    for x0, x1 in ((5, 30), (33, 58)):
        d.rectangle([M(x0), M(top), M(x1), M(top + 3.2)], fill=c.ROSA)
        r = top + 6
        while r < 82:
            fine = x1 if rng.random() > 0.18 else x0 + (x1 - x0) * rng.uniform(0.35, 0.8)
            d.rectangle([M(x0), M(r), M(fine), M(r + 0.65)], fill=c.PETROLIO)
            r += 2.3 if fine == x1 else 4.2   # a fine paragrafo una riga di stacco
    # il timbro, sopra le colonne
    timbro = c.timbro("QUESTO GIRO", c.font(c.BAHN, 15, "Bold Condensed"), c.ROSA, -9, 3, c.PT(15) * 0.12,
                      fondo=c.PANNA, sbavature=0.12)
    c.incolla(tela, timbro, M(35), M(top + 24))
    tela.convert("RGB").save(DESTINO)
    print(DESTINO)


if __name__ == "__main__":
    main()
