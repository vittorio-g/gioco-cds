"""
La scatola di Collocamento: una scatola a ribalta classica, da mazzo di carte, su un A4 orizzontale.

    py -3 grafica/scatola.py

Scrive grafica/stampa/collocamento_scatola.pdf (da stampare su cartoncino, al 100%, solo fronte) e
grafica/stampa/taglio/collocamento_scatola_taglio.svg (taglio, pieghe da cordonare e crocini,
per tools/svg_to_lbrn2.py della repo laser-designs), più un'anteprima con le linee sovrapposte.

Dentro ci vanno le carte plastificate, senza il regolamento: 120 carte, 4 carte riassunto e 4 token.
Vittorio plastifica con buste da 2 x 75 micron (75 per foglio, 150 la busta intera): ogni carta ha
0,15 mm di plastica, e con carta da 100-120 g viene 0,25-0,30 mm. 124 carte e 4 token fanno 35-38 mm,
e la scatola ne tiene 40 (PROFONDITA). Se il mazzo viene più spesso basta cambiare quel numero: la
fustella sta nell'A4 con almeno 4,5 mm di margine finché 2 x (LINGUETTA + PROFONDITA) + ALTO non
supera 201 mm. Le linguette restano dentro la scatola: se la stampante ne perde l'abbondanza non si vede.

Linguette a tutta larghezza fino allo spigolo, con i lati a quarto di cerchio (senza i gradini di
scarico ai lati, che a Vittorio non piacevano); alette dei fianchi con gli angoli tondi.

Chiusura "reverse tuck": il coperchio è attaccato al retro e si infila davanti, dove c'è la tacca per
il pollice; il fondo è attaccato al fronte e si infila dietro. La linguetta di colla sta sul retro.
Stile delle carte (proposta B): fronte petrolio come la copertina del regolamento, retro panna.
"""
import math
import sys
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFilter

QUI = Path(__file__).resolve().parent
sys.path.insert(0, str(QUI))
import carte_nuove as cn  # noqa: E402
from carte_nuove import BAHN, BIANCO, MAGENTA, PANNA, PETROLIO, ROSA, font, larghezza, scrivi  # noqa: E402

STAMPA = QUI / "stampa"
TAGLIO = STAMPA / "taglio"

# ---------------------------------------------------------------- misure, in mm
LARGO = 65         # fronte e retro: carte da 63 mm più un millimetro per parte
ALTO = 90          # carte da 88 mm più un millimetro sopra e sotto
PROFONDITA = 40    # i fianchi: il mazzo plastificato, 35-38 mm, più un po' di gioco
LINGUETTA = 14     # la parte che si infila, sopra e sotto: lingua tonda, lati a quarto di cerchio
COLLA = 12         # la linguetta da incollare
ALETTA = 20        # le alette parapolvere sopra e sotto i fianchi
R_ALETTA = 6       # gli angoli tondi delle alette
SMUSSO = 5         # gli angoli smussati della linguetta di colla
POLLICE = 9        # raggio della tacca sul fronte
ABB = 2            # abbondanza della stampa oltre il taglio
FOGLIO = (297, 210)
CROCINI = [(14, 10), (283, 10), (14, 200), (283, 200)]
R_CROCINO, BRACCIO = 2, 3

larghezza_tot = COLLA + 2 * LARGO + 2 * PROFONDITA
altezza_tot = 2 * (LINGUETTA + PROFONDITA) + ALTO
X0 = (FOGLIO[0] - larghezza_tot) / 2
Y0 = (FOGLIO[1] - altezza_tot) / 2
if Y0 < 4.5:
    raise SystemExit(f"Con una profondità di {PROFONDITA} mm la scatola non sta nell'A4 con i margini")

# le colonne e le righe della fustella
xb = X0 + COLLA            # retro
xs1 = xb + LARGO           # fianco sinistro (visto dal fronte)
xf = xs1 + PROFONDITA      # fronte
xs2 = xf + LARGO           # fianco destro
xe = xs2 + PROFONDITA      # bordo destro
yt0 = Y0                   # punta della linguetta del coperchio
yt1 = yt0 + LINGUETTA      # coperchio
yb0 = yt1 + PROFONDITA     # bordo alto del corpo
yb1 = yb0 + ALTO           # bordo basso del corpo
ybb = yb1 + PROFONDITA     # fondo
ybt = ybb + LINGUETTA      # punta della linguetta del fondo


# ---------------------------------------------------------------- la fustella
def linguetta(xa, xz, y_attacco, y_punta):
    """La parte che si infila, percorsa da xa a xz: parte dallo spigolo, a tutta larghezza, e i due
    lati sono quarti di cerchio grandi quanto la linguetta: una lingua tonda.

    Il coperchio si percorre da sinistra a destra con la punta in alto, il fondo da destra a sinistra
    con la punta in basso: sono la stessa forma girata di 180 gradi, quindi gli archi girano nello
    stesso verso.
    """
    r = abs(y_attacco - y_punta)
    h = 1 if xz > xa else -1               # verso di percorrenza
    return (f"A {r} {r} 0 0 1 {xa + h * r:.2f} {y_punta:.2f} L {xz - h * r:.2f} {y_punta:.2f} "
            f"A {r} {r} 0 0 1 {xz:.2f} {y_attacco:.2f}")


def aletta(xa, xz, y_attacco, y_punta, primo_lato=True):
    """Un'aletta parapolvere percorsa da xa a xz, con gli angoli tondi.

    Senza il primo lato quando quel lato è già tagliato da un'altra parte (il bordo del coperchio o del fondo).
    """
    r = R_ALETTA
    h = 1 if xz > xa else -1
    v = 1 if y_punta < y_attacco else -1
    inizio = f"M {xa} {y_attacco} L {xa} {y_punta + v * r:.2f}" if primo_lato else f"M {xa} {y_punta + v * r:.2f}"
    return (f"{inizio} A {r} {r} 0 0 1 {xa + h * r:.2f} {y_punta} L {xz - h * r:.2f} {y_punta} "
            f"A {r} {r} 0 0 1 {xz} {y_punta + v * r:.2f} L {xz} {y_attacco}")


def tagli():
    t = []
    # linguetta di colla, a sinistra del retro
    t.append(f"M {xb} {yb0} L {X0} {yb0 + SMUSSO} L {X0} {yb1 - SMUSSO} L {xb} {yb1}")
    # bordo basso del retro
    t.append(f"M {xb} {yb1} L {xs1} {yb1}")
    # coperchio e la sua linguetta, sopra il retro
    t.append(f"M {xb} {yb0} L {xb} {yt1} " + linguetta(xb, xs1, yt1, yt0) + f" L {xs1} {yb0}")
    # aletta alta del fianco sinistro (il lato sinistro è già il taglio del coperchio)
    a = yb0 - ALETTA
    t.append(aletta(xs1, xf, yb0, a, primo_lato=False))
    # bordo alto del fronte, con la tacca per il pollice
    c = xf + LARGO / 2
    t.append(f"M {xf} {yb0} L {c - POLLICE} {yb0} A {POLLICE} {POLLICE} 0 0 0 {c + POLLICE} {yb0} L {xs2} {yb0}")
    # aletta alta del fianco destro e bordo destro
    t.append(aletta(xs2, xe, yb0, a) + f" L {xe} {yb1}")
    # aletta bassa del fianco destro (il lato sinistro è il taglio del fondo)
    b = yb1 + ALETTA
    t.append(aletta(xe, xs2, yb1, b).rsplit(" L ", 1)[0])
    # fondo e la sua linguetta, sotto il fronte
    t.append(f"M {xs2} {yb1} L {xs2} {ybb} " + linguetta(xs2, xf, ybb, ybt) + f" L {xf} {yb1}")
    # aletta bassa del fianco sinistro (il lato destro è il taglio del fondo)
    t.append(aletta(xf, xs1, yb1, b, primo_lato=False))
    return t


def pieghe():
    p = [f"M {x} {yb0} L {x} {yb1}" for x in (xb, xs1, xf, xs2)]          # i quattro spigoli e la colla
    p.append(f"M {xb} {yb0} L {xs1} {yb0}")                                  # retro | coperchio
    p.append(f"M {xb} {yt1} L {xs1} {yt1}")                                  # coperchio | linguetta
    p.append(f"M {xf} {yb1} L {xs2} {yb1}")                                  # fronte | fondo
    p.append(f"M {xf} {ybb} L {xs2} {ybb}")                                  # fondo | linguetta
    for xa, xz in ((xs1, xf), (xs2, xe)):                                    # fianchi | alette
        p.append(f"M {xa} {yb0} L {xz} {yb0}")
        p.append(f"M {xa} {yb1} L {xz} {yb1}")
    return p


def svg():
    segni = [f"M {cx - R_CROCINO} {cy} A {R_CROCINO} {R_CROCINO} 0 1 0 {cx + R_CROCINO} {cy} "
             f"A {R_CROCINO} {R_CROCINO} 0 1 0 {cx - R_CROCINO} {cy} Z" for cx, cy in CROCINI]
    segni += [f"M {cx - BRACCIO} {cy} H {cx + BRACCIO} M {cx} {cy - BRACCIO} V {cy + BRACCIO}" for cx, cy in CROCINI]
    w, h = FOGLIO
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}mm" height="{h}mm" viewBox="0 0 {w} {h}">\n'
            f'  <rect id="A4_riferimento" x="0" y="0" width="{w}" height="{h}" fill="none" stroke="#00AA00" stroke-width="0.1" stroke-dasharray="2 2"/>\n'
            '  <g id="MARK" fill="none" stroke="#0000FF" stroke-width="0.2">\n'
            + "".join(f'    <path d="{d}"/>\n' for d in segni + pieghe())
            + '  </g>\n  <g id="CUT" fill="none" stroke="#FF0000" stroke-width="0.2">\n'
            + "".join(f'    <path d="{d}"/>\n' for d in tagli())
            + '  </g>\n</svg>\n')


# ---------------------------------------------------------------- la grafica
def P(mm):
    return round(mm * cn.PX)


def campitura(d, x0, y0, x1, y1, colore, lati=""):
    """Un rettangolo di colore, allargato dell'abbondanza sui lati che vengono tagliati (s, d, a, b)."""
    x0 -= ABB if "s" in lati else 0
    x1 += ABB if "d" in lati else 0
    y0 -= ABB if "a" in lati else 0
    y1 += ABB if "b" in lati else 0
    d.rectangle([P(x0), P(y0), P(x1) - 1, P(y1) - 1], fill=colore)


def carta_piccola(tipo, n, largo_mm, angolo):
    """Una carta del mazzo, senza abbondanza, con gli angoli tondi e un'ombra."""
    cartella = "persone" if tipo == "persona" else "ambiti"
    im = Image.open(QUI / "carte_v3" / cartella / f"{n}.png").convert("RGBA")
    im = im.crop((24, 24, im.width - 24, im.height - 24))
    w = P(largo_mm)
    im = im.resize((w, round(w * 88 / 63)), Image.LANCZOS)
    maschera = Image.new("L", im.size, 0)
    ImageDraw.Draw(maschera).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=P(1.4), fill=255)
    im.putalpha(maschera)
    bordo = P(1.5)
    ombra = Image.new("RGBA", (im.width + 2 * bordo, im.height + 2 * bordo), (0, 0, 0, 0))
    ombra.paste(Image.new("RGBA", im.size, (0, 0, 0, 110)), (bordo, bordo + P(0.5)), maschera)
    ombra = ombra.filter(ImageFilter.GaussianBlur(P(0.6)))
    ombra.alpha_composite(im, (bordo, bordo))
    return ombra.rotate(angolo, resample=Image.BICUBIC, expand=True)


def pannello(larghezza_mm, altezza_mm):
    im = Image.new("RGBA", (P(larghezza_mm), P(altezza_mm)), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def chip(testo, pt, fondo, colore, angolo):
    f = font(BAHN, pt, "Bold Condensed")
    spazio = cn.PT(pt) * 0.16
    w = larghezza(testo, f, spazio) + P(5)
    h = cn.PT(pt) * 1.9
    im = Image.new("RGBA", (round(w), round(h)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=P(1), fill=fondo)
    scrivi(d, im.width / 2, im.height / 2 + cn.PT(pt) * 0.36, testo, f, colore, spazio, "ms")
    return im.rotate(angolo, resample=Image.BICUBIC, expand=True)


def incolla_centro(tela, im, cx, cy):
    tela.alpha_composite(im, (round(cx - im.width / 2), round(cy - im.height / 2)))


def fronte():
    """Come la copertina del regolamento: petrolio, titolo grande, un ventaglio di carte."""
    im, d = pannello(LARGO, ALTO)
    f_et = font(BAHN, 7, "SemiBold Condensed")
    scrivi(d, P(4.5), P(6.5), "CDS", f_et, ROSA, cn.PT(7) * 0.24)
    scrivi(d, P(LARGO - 4.5), P(6.5), "PROTOTIPO", f_et, PANNA, cn.PT(7) * 0.2, "rs")
    f_t, righe, pt, _ = cn.adatta("COLLOCAMENTO", BAHN, 26, 14, P(LARGO - 8), 1, "Bold Condensed")
    scrivi(d, P(LARGO / 2), P(15) + cn.PT(pt) * 0.72, righe[0], f_t, PANNA, 0, "ms")
    barra = Image.new("RGBA", (P(22), P(1.3)), ROSA).rotate(-2, resample=Image.BICUBIC, expand=True)
    incolla_centro(im, barra, P(LARGO / 2), P(26.8))
    for tipo, n, cx, cy, ang in (("persona", "03", 18.5, 52, 13), ("ambito", "27", 46.5, 52, -13),
                                 ("persona", "07", LARGO / 2, 49, 0)):
        incolla_centro(im, carta_piccola(tipo, n, 21, ang), P(cx), P(cy))
    incolla_centro(im, chip("2-4 PARTECIPANTI · CARTE · A TURNI", 6.5, ROSA, "#ffffff", -1.5), P(LARGO / 2), P(80.5))
    return im


def retro():
    """Panna: che cosa c'è dentro, in una frase il gioco, le sei competenze."""
    im, d = pannello(LARGO, ALTO)
    f_et = font(BAHN, 7, "SemiBold Condensed")
    scrivi(d, P(5), P(7.5), "COLLOCAMENTO", f_et, MAGENTA, cn.PT(7) * 0.24)
    scrivi(d, P(LARGO - 5), P(7.5), "CDS", f_et, PETROLIO, cn.PT(7) * 0.2, "rs")
    scrivi(d, P(5), P(17), "IN QUESTA SCATOLA", font(BAHN, 15, "Bold Condensed"), PETROLIO)
    f_l = font(BAHN, 10.5, "Bold Condensed")
    for i, riga in enumerate(("60 carte Persona", "60 carte Ambito", "4 carte riassunto", "4 token obiettivo")):
        y = 24.5 + i * 5.4
        q = Image.new("RGBA", (P(2), P(2)), ROSA).rotate(-9, resample=Image.BICUBIC, expand=True)
        incolla_centro(im, q, P(6.2), P(y - 1.3))
        scrivi(d, P(9.4), P(y), riga, f_l, PETROLIO)
    motto = ("Forma le persone rispettando le loro ambizioni, trova a ciascuna il lavoro giusto "
             "e chiudi il collocamento prima del resto del tavolo.")
    f_m, righe, pt, _ = cn.adatta(motto, BAHN, 8.6, 7, P(LARGO - 10), 4, "SemiBold SemiCondensed")
    cn.paragrafo(d, P(5), P(49.5), righe, f_m, PETROLIO, cn.PT(pt) * 1.22)
    for i, sigla in enumerate(("MA", "DI", "CO", "OR", "CR", "RI")):
        incolla_centro(im, cn.adesivo(sigla, 7.2, (-6, 4, -3, 5, -4, 3)[i], 0.6), P(9.2 + i * 9.3), P(70))
    f_p = font(BAHN, 6.2, "SemiCondensed")
    scrivi(d, P(5), P(80.5), "Il regolamento si stampa a parte.", f_p, PETROLIO)
    scrivi(d, P(5), P(84), "Prototipo: immagini generate con l'intelligenza artificiale.", f_p, PETROLIO)
    return im


def titolo_verticale(larghezza_mm, altezza_mm, fondo, colore, sotto=None):
    """Un fianco: il titolo in verticale, da leggere dal basso verso l'alto."""
    im, d = pannello(altezza_mm, larghezza_mm)  # disegnato in orizzontale, poi ruotato
    f_t, righe, pt, _ = cn.adatta("COLLOCAMENTO", BAHN, 40, 16, P(altezza_mm - 14), 1, "Bold Condensed")
    yb = P(larghezza_mm / 2) + cn.PT(pt) * 0.36 - (P(3.2) if sotto else 0)
    scrivi(d, P(altezza_mm / 2), yb, righe[0], f_t, colore, 0, "ms")
    if sotto:
        f_s = font(BAHN, 7.5, "SemiBold Condensed")
        scrivi(d, P(altezza_mm / 2), yb + P(7.4), sotto, f_s, colore, cn.PT(7.5) * 0.22, "ms")
    return im.rotate(90, expand=True)


def fianco_destro():
    """Petrolio, con le sei competenze come adesivi in colonna."""
    im, d = pannello(PROFONDITA, ALTO)
    for i, sigla in enumerate(("MA", "DI", "CO", "OR", "CR", "RI")):
        incolla_centro(im, cn.adesivo(sigla, 10, (-6, 5, -3, 6, -5, 3)[i], 0.8),
                       P(PROFONDITA / 2 + (-4 if i % 2 else 4)), P(11 + i * 13.6))
    return im


def coperchio():
    """Rosa, col titolo: si legge dal davanti a scatola chiusa, quindi sul foglio è capovolto."""
    im, d = pannello(LARGO, PROFONDITA)
    f_t, righe, pt, _ = cn.adatta("COLLOCAMENTO", BAHN, 26, 14, P(LARGO - 10), 1, "Bold Condensed")
    scrivi(d, P(LARGO / 2), P(PROFONDITA / 2) + cn.PT(pt) * 0.36, righe[0], f_t, PETROLIO, 0, "ms")
    f_s = font(BAHN, 7, "SemiBold Condensed")
    scrivi(d, P(LARGO / 2), P(PROFONDITA / 2) + P(9.5), "CDS · CARTE", f_s, PETROLIO, cn.PT(7) * 0.24, "ms")
    return im.rotate(180)


def fondo():
    im, d = pannello(LARGO, PROFONDITA)
    f_s = font(BAHN, 7, "SemiBold Condensed")
    scrivi(d, P(LARGO / 2), P(PROFONDITA / 2) + P(1), "CDS · COLLOCAMENTO · PROTOTIPO 2026", f_s, PANNA,
           cn.PT(7) * 0.2, "ms")
    return im


def grafica():
    tela = Image.new("RGBA", (P(FOGLIO[0]), P(FOGLIO[1])), "white")
    d = ImageDraw.Draw(tela)
    a, b = yb0 - ALETTA, yb1 + ALETTA
    # prima le alette e le linguette, poi i pannelli: dove si toccano vince il pannello
    campitura(d, xs1, a, xf, yb0, ROSA, "sda")
    campitura(d, xs1, yb1, xf, b, ROSA, "sdb")
    campitura(d, xs2, a, xe, yb0, PETROLIO, "sda")
    campitura(d, xs2, yb1, xe, b, PETROLIO, "sdb")
    campitura(d, xb, yt0, xs1, yt1, ROSA, "sda")          # linguetta del coperchio
    campitura(d, xf, ybb, xs2, ybt, PETROLIO, "sdb")      # linguetta del fondo
    campitura(d, xb, yt1, xs1, yb0, ROSA, "sd")           # coperchio
    campitura(d, xf, yb1, xs2, ybb, PETROLIO, "sd")       # fondo
    campitura(d, xb, yb0, xs1, yb1, PANNA, "b")           # retro
    campitura(d, xs1, yb0, xf, yb1, ROSA, "")             # fianco sinistro
    campitura(d, xf, yb0, xs2, yb1, PETROLIO, "a")        # fronte
    campitura(d, xs2, yb0, xe, yb1, PETROLIO, "d")        # fianco destro
    tela.alpha_composite(retro(), (P(xb), P(yb0)))
    tela.alpha_composite(titolo_verticale(PROFONDITA, ALTO, ROSA, PETROLIO, "CDS · 2-4 PARTECIPANTI"), (P(xs1), P(yb0)))
    tela.alpha_composite(fronte(), (P(xf), P(yb0)))
    tela.alpha_composite(fianco_destro(), (P(xs2), P(yb0)))
    tela.alpha_composite(coperchio(), (P(xb), P(yt1)))
    tela.alpha_composite(fondo(), (P(xf), P(yb1)))
    return tela.convert("RGB")


def pdf(img, destino):
    doc = fitz.open()
    w, h = FOGLIO[0] * 72 / 25.4, FOGLIO[1] * 72 / 25.4
    pagina = doc.new_page(width=w, height=h)
    temp = STAMPA / "_scatola.jpg"
    img.save(temp, quality=92)
    pagina.insert_image(pagina.rect, filename=str(temp))
    temp.unlink()
    k = 72 / 25.4
    for cx, cy in CROCINI:
        pagina.draw_circle((cx * k, cy * k), R_CROCINO * k, color=(0, 0, 0), width=0.25 * k)
        pagina.draw_line(((cx - BRACCIO) * k, cy * k), ((cx + BRACCIO) * k, cy * k), color=(0, 0, 0), width=0.25 * k)
        pagina.draw_line((cx * k, (cy - BRACCIO) * k), (cx * k, (cy + BRACCIO) * k), color=(0, 0, 0), width=0.25 * k)
    doc.set_metadata({"title": "Collocamento - scatola (A4 orizzontale, solo fronte, al 100%)"})
    doc.save(destino, garbage=3, deflate=True)


def anteprima(img, destino):
    """La grafica con le linee della fustella: rosso taglio, blu pieghe."""
    import re
    a = img.resize((img.width // 4, img.height // 4), Image.LANCZOS)
    d = ImageDraw.Draw(a)
    k = cn.PX / 4

    def arco(p0, r, grande, verso, p1, n=16):
        """I punti di un arco SVG di raggio r da p0 a p1 (solo cerchi, senza rotazione)."""
        (x0, y0), (x1, y1) = p0, p1
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        dx, dy = x1 - x0, y1 - y0
        corda = math.hypot(dx, dy)
        h = math.sqrt(max(r * r - corda * corda / 4, 0))
        segno = 1 if grande != verso else -1
        cx, cy = mx - segno * h * dy / corda, my + segno * h * dx / corda
        a0, a1 = math.atan2(y0 - cy, x0 - cx), math.atan2(y1 - cy, x1 - cx)
        da = a1 - a0
        if verso and da < 0:
            da += 2 * math.pi
        if not verso and da > 0:
            da -= 2 * math.pi
        return [(cx + r * math.cos(a0 + da * j / n), cy + r * math.sin(a0 + da * j / n)) for j in range(1, n + 1)]

    def punti(path):
        toks = re.findall(r"[MLAHVZ]|-?\d+(?:\.\d+)?", path)
        pts, i, cur = [], 0, None
        while i < len(toks):
            t = toks[i]
            if t in "ML":
                cur = (float(toks[i + 1]), float(toks[i + 2])); pts.append(cur); i += 3
            elif t == "A":
                fine = (float(toks[i + 6]), float(toks[i + 7]))
                pts += arco(cur, float(toks[i + 1]), int(float(toks[i + 4])), int(float(toks[i + 5])), fine)
                cur = fine; i += 8
            elif t == "H":
                cur = (float(toks[i + 1]), cur[1]); pts.append(cur); i += 2
            elif t == "V":
                cur = (cur[0], float(toks[i + 1])); pts.append(cur); i += 2
            else:
                i += 1
        return pts

    for colore, paths in (((0, 90, 255), pieghe()), ((255, 0, 0), tagli())):
        for path in paths:
            pts = [(x * k, y * k) for x, y in punti(path)]
            d.line(pts, fill=colore, width=2)
    a.save(destino)


if __name__ == "__main__":
    TAGLIO.mkdir(parents=True, exist_ok=True)
    img = grafica()
    pdf(img, STAMPA / "collocamento_scatola.pdf")
    (TAGLIO / "collocamento_scatola_taglio.svg").write_text(svg(), encoding="utf-8")
    anteprima(img, STAMPA / "collocamento_scatola_anteprima.png")
    print(f"scatola: interno {LARGO} x {ALTO} x {PROFONDITA} mm; fustella {larghezza_tot} x {altezza_tot} mm su A4, "
          f"margini {X0:.1f} e {Y0:.1f} mm")
    print("grafica/stampa/collocamento_scatola.pdf, grafica/stampa/taglio/collocamento_scatola_taglio.svg")
