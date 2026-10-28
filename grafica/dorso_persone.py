"""Il dorso B delle Persone: la fascia diceva LAVORATORI, ora dice PERSONE.

La parola vecchia si cancella ricostruendo la carta della fascia (inpainting di OpenCV), poi si
scrive quella nuova con un bastone stretto, nello stesso petrolio e con una grana di stampa simile.
Non serve una nuova immagine generata.

    py -3 grafica/dorso_persone.py

Legge grafica/dorsi_proposte/B_lavoratori.png e scrive grafica/dorsi_proposte/B_persone.png.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

QUI = Path(__file__).resolve().parent
ORIGINE = QUI / "dorsi_proposte" / "B_lavoratori.png"
DESTINO = QUI / "dorsi_proposte" / "B_persone.png"

PAROLA = "PERSONE"
ZONA = (118, 636, 892, 846)        # il riquadro della parola vecchia, in pixel (x0, y0, x1, y1)
ALTEZZA = 184                       # altezza delle maiuscole della parola vecchia
LARGHEZZA = 640                     # la parola nuova si stringe a questa larghezza, tra le due stelle
LINEA_BASE = 832
INCHIOSTRO = (16, 62, 67)


def main():
    im = Image.open(ORIGINE).convert("RGB")
    a = np.asarray(im).copy()
    x0, y0, x1, y1 = ZONA
    # 1. via la parola vecchia: i pixel scuri della zona, allargati, ricostruiti dalla carta intorno
    zona = a[y0:y1, x0:x1].astype(int)
    scuro = (zona.sum(axis=2) < 420).astype(np.uint8) * 255
    maschera = np.zeros(a.shape[:2], np.uint8)
    maschera[y0:y1, x0:x1] = cv2.dilate(scuro, np.ones((7, 7), np.uint8))
    a = cv2.inpaint(a, maschera, 9, cv2.INPAINT_TELEA)
    # un po' di grana sulla carta ricostruita, perché non sembri liscia
    rng = np.random.default_rng(7)
    grana = rng.normal(0, 5, a.shape[:2])[..., None]
    a = np.where(maschera[..., None] > 0, np.clip(a + grana, 0, 255), a).astype(np.uint8)
    im = Image.fromarray(a)
    # 2. la parola nuova: Impact stretto come il bastone del dorso, alto come la vecchia
    font = ImageFont.truetype("impact.ttf", 100)
    asc = font.getbbox("H")[3] - font.getbbox("H")[1]
    font = ImageFont.truetype("impact.ttf", round(100 * ALTEZZA / asc))
    spazio = 18
    larghi = [font.getlength(c) for c in PAROLA]
    largo = round(sum(larghi) + spazio * (len(PAROLA) - 1))
    parola = Image.new("L", (largo, ALTEZZA + 40), 0)
    d = ImageDraw.Draw(parola)
    x = 0
    for c, w in zip(PAROLA, larghi):
        d.text((x, ALTEZZA + 20), c, font=font, fill=255, anchor="ls")
        x += w + spazio
    parola = parola.resize((LARGHEZZA, parola.height), Image.LANCZOS)  # stretta come il bastone del dorso
    testo = Image.new("L", im.size, 0)
    testo.paste(parola, (round((x0 + x1) / 2 - LARGHEZZA / 2), LINEA_BASE - ALTEZZA - 20))
    # 3. grana di stampa: puntini chiari dentro le lettere, bordi appena mossi
    t = np.asarray(testo).astype(float)
    buchi = rng.random(t.shape)
    buchi = np.asarray(Image.fromarray((buchi * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.3))).astype(float)
    t = t * (buchi > np.quantile(buchi, 0.035))
    alfa = Image.fromarray(t.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    colore = Image.new("RGB", im.size, INCHIOSTRO)
    im = Image.composite(colore, im, alfa)
    im.save(DESTINO)
    print(DESTINO)


if __name__ == "__main__":
    main()
