"""
Il logo a timbro tondo con i simboli delle cinque categorie di Ambiti messi in ordine.

    py -3 grafica/logo_simboli.py

Parte da grafica/logo_proposte/A2_categorie.png (generato da genera_logo.mjs): la scritta e gli anelli
restano quelli, a Vittorio piacciono così. I simboli che ci aveva messo il generatore avevano misure
diverse e non stavano in fila sull'arco: qui si cancellano e al loro posto vanno i simboli veri delle
carte (grafica/dati/icone_hd/cat_01..05), tutti sulla stessa griglia, alla stessa distanza dal centro e
a passo costante, con la grana del timbro. Scrive grafica/logo_proposte/A2_categorie_sistemato.png.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

QUI = Path(__file__).resolve().parent
DIR = QUI / "logo_proposte"
ICONE = QUI / "dati" / "icone_hd"

# geometria del timbro, misurata sull'immagine (1536 x 1024)
CENTRO = (764, 508)
FASCIA = (258, 384)      # tra l'anello interno e quello esterno (r 383-399): lì stanno scritta e simboli
CANCELLA = (25, 170)     # gradi, 90 = in basso: la metà bassa della fascia, dove stavano i simboli
ASSE = 99.5              # la scritta va da -161 a 0 gradi: il timbro è ruotato di 9,5 gradi
PASSO = 23               # gradi tra un simbolo e l'altro
RAGGIO = 320             # distanza dei simboli dal centro
LATO = 100               # lato della griglia comune dei simboli, in px
FONDO = (252, 250, 241)
INCHIOSTRO = (19, 69, 78)


def grana(alfa, seme):
    """Bordi un po' mangiati e puntini senza inchiostro, come nella scritta del timbro."""
    rng = np.random.default_rng(seme)
    a = np.asarray(alfa).astype(float) / 255
    # bordo irregolare: soglia sul contorno sfumato, spostata da un rumore morbido
    morbido = np.asarray(alfa.filter(ImageFilter.GaussianBlur(1.6))).astype(float) / 255
    r1 = np.asarray(Image.fromarray((rng.random(a.shape) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(float) / 255
    bordo = morbido > 0.5 + (r1 - r1.mean()) * 2.2
    # puntini e piccole macchie bianche dentro
    r2 = np.asarray(Image.fromarray((rng.random(a.shape) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))).astype(float)
    buchi = r2 < np.quantile(r2, 0.13)
    pieno = bordo & ~buchi
    return Image.fromarray((pieno * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))


def main():
    img = Image.open(DIR / "A2_categorie.png").convert("RGB")
    a = np.asarray(img).copy()
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot(xx - CENTRO[0], yy - CENTRO[1])
    ang = np.degrees(np.arctan2(yy - CENTRO[1], xx - CENTRO[0]))
    # si cancellano solo le macchie d'inchiostro che stanno tutte dentro la fascia, nella metà bassa:
    # gli anelli non sono cerchi perfetti, e un taglio a raggio fisso li smussava
    inchiostro = a.astype(int).sum(axis=2) < 600
    etichette, n = ndimage.label(inchiostro)
    dentro = (r > FASCIA[0]) & (r < FASCIA[1]) & (ang > CANCELLA[0]) & (ang < CANCELLA[1])
    fuori_conta = ndimage.sum(~dentro, etichette, index=np.arange(1, n + 1))
    simboli = np.isin(etichette, np.nonzero(fuori_conta == 0)[0] + 1)
    resto = inchiostro & ~simboli
    zona = ndimage.binary_dilation(simboli, iterations=4) & ~ndimage.binary_dilation(resto, iterations=2)
    rng = np.random.default_rng(7)
    a[zona] = np.clip(np.array(FONDO) + rng.normal(0, 0.7, (zona.sum(), 3)), 0, 255).astype(np.uint8)
    out = Image.fromarray(a)

    for i in range(5):
        alfa = Image.open(ICONE / f"cat_0{i + 1}.png").getchannel("A").resize((LATO, LATO), Image.LANCZOS)
        alfa = alfa.rotate(-(ASSE - 90), resample=Image.BICUBIC, expand=True)   # dritti rispetto al timbro
        alfa = grana(alfa, 100 + i)
        # da sinistra a destra lungo l'arco basso: angoli decrescenti
        t = np.radians(ASSE + (2 - i) * PASSO)
        cx, cy = CENTRO[0] + RAGGIO * np.cos(t), CENTRO[1] + RAGGIO * np.sin(t)
        out.paste(Image.new("RGB", alfa.size, INCHIOSTRO), (round(cx - alfa.width / 2), round(cy - alfa.height / 2)), alfa)

    dest = DIR / "A2_categorie_sistemato.png"
    out.save(dest)
    print(dest)


if __name__ == "__main__":
    main()
