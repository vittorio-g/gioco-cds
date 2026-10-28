"""
Le carte nuove di Collocamento: tre proposte di design (28/10/2026).

Rispetto alle carte dei designer (grafica/carte_v2):
- un solo colore di sfondo su tutta la carta, abbondanza compresa: se il taglio scappa di un
  millimetro non compare il bordo di una fascia d'altro colore;
- caratteri più grandi, scelti per stare con i disegni;
- le illustrazioni delle Persone vengono dagli originali (grafica/illustrazioni/lav, 1024 px) e il
  ritaglio tiene dentro la testa: i riquadri dei volti sono in grafica/dati/volti.json e lo script
  si ferma se un ritaglio ne taglia uno;
- le carte Lavoratore si chiamano Persone.

    py -3 grafica/carte_nuove.py proposte   # nove carte per proposta, confronto e PDF da stampare
    py -3 grafica/carte_nuove.py proposte B # solo la proposta B
    py -3 grafica/carte_nuove.py A          # tutte le carte nella proposta A, in grafica/carte_v3/

Le carte escono a 12 px/mm, 67 x 92 mm: 63 x 88 più 2 mm di abbondanza per lato.
"""
import csv
import json
import os
import subprocess
import sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent
sys.path.insert(0, str(QUI))
import poteri  # noqa: E402

PX = 12                      # pixel per millimetro
W, H, ABB = 63, 88, 2        # carta e abbondanza, mm
LARGO, ALTO = (W + 2 * ABB) * PX, (H + 2 * ABB) * PX

CARTA, PETROLIO, ROSA, BIANCO = "#f3ecdd", "#17474d", "#ff3d8b", "#fffaf0"
MANILA = "#ecdcb9"
PANNA = "#f5efe3"      # il bianco caldo delle Persone nella proposta B: più chiaro della carta dei disegni
MAGENTA = "#d53883"    # il rosa scuro dei titoletti: si legge anche sul bianco

FONT_WIN = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
FONT_TEX = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs/MiKTeX/fonts/opentype/public/tex-gyre"
MACCHINA = FONT_TEX / "texgyrecursor-bold.otf"   # Courier da macchina da scrivere, in grassetto


def X(mm):
    """Da millimetri sulla carta tagliata a pixel sulla tela con l'abbondanza."""
    return round((mm + ABB) * PX)


def L(mm):
    return round(mm * PX)


def PT(pt):
    return pt * 0.3528 * PX


@lru_cache(maxsize=None)
def font(file, pt, variante=None):
    f = ImageFont.truetype(str(file), round(PT(pt)))
    if variante:
        f.set_variation_by_name(variante)
    return f


# ---------------------------------------------------------------- dati

def _csv(nome):
    with open(RADICE / "mazzi" / nome, encoding="utf-8") as f:
        return {r["n"]: r for r in csv.DictReader(f)}


PERSONE = {x["n"]: x for x in json.loads((QUI / "dati" / "lavoratori.json").read_text(encoding="utf-8"))}
AMBIZIONI = {n: [r["a1"], r["a2"], r["a3"]] for n, r in _csv("lavoratori.csv").items()}
_amb = json.loads((QUI / "dati" / "ambiti_v4.json").read_text(encoding="utf-8"))
AMBITI = {x["n"]: x for x in _amb["ambiti"]}
CATEGORIE = _amb["categorie"]
COMPETENZE = {n: [r["l1"], r["l2"], r["l3"]] for n, r in _csv("ambiti.csv").items()}
CATEGORIA = {n: r["cat"] for n, r in _csv("ambiti.csv").items()}
POTERI = poteri.nomi()
CHI = poteri.assegnazione()
VOLTI = {k: v for k, v in json.loads((QUI / "dati" / "volti.json").read_text(encoding="utf-8")).items()
         if not k.startswith("_")}


# ---------------------------------------------------------------- testo

def larghezza(s, f, spazio=0):
    return f.getlength(s) + spazio * max(len(s) - 1, 0)


def scrivi(d, x, y, s, f, colore, spazio=0, ancora="ls"):
    """Testo con spaziatura tra le lettere; ancora l/m/r sulla linea di base."""
    w = larghezza(s, f, spazio)
    x = {"l": x, "m": x - w / 2, "r": x - w}[ancora[0]]
    if not spazio:
        d.text((x, y), s, font=f, fill=colore, anchor="ls")
        return
    for c in s:
        d.text((x, y), c, font=f, fill=colore, anchor="ls")
        x += f.getlength(c) + spazio


def a_capo(s, f, largo, spazio=0):
    righe, cur = [], ""
    for parola in s.split():
        prova = f"{cur} {parola}".strip()
        if not cur or larghezza(prova, f, spazio) <= largo:
            cur = prova
        else:
            righe.append(cur)
            cur = parola
    righe.append(cur)
    return righe


def adatta(s, file, pt_max, pt_min, largo, max_righe, variante=None, spazio_em=0.0):
    """Il corpo più grande, tra pt_max e pt_min, che sta in max_righe righe larghe largo."""
    pt = pt_max
    while True:
        f = font(file, pt, variante)
        spazio = spazio_em * PT(pt)
        righe = a_capo(s, f, largo, spazio)
        if (len(righe) <= max_righe and max(larghezza(r, f, spazio) for r in righe) <= largo) or pt <= pt_min:
            return f, righe, pt, spazio
        pt = round(pt - 0.25, 2)


def paragrafo(d, x, y, righe, f, colore, interlinea, spazio=0, ancora="ls"):
    for i, r in enumerate(righe):
        scrivi(d, x, y + i * interlinea, r, f, colore, spazio, ancora)
    return y + (len(righe) - 1) * interlinea


# ---------------------------------------------------------------- immagini

def ritaglio_persona(n, rapporto):
    """Il riquadro (x0, y0, x1, y1) dell'illustrazione 1024 x 1024 con il rapporto largo/alto voluto.

    Si parte dall'alto, dove stanno le teste, e si scende solo se la testa non ci sta. Restituisce
    anche se la testa, con un margine del 3%, è dentro il riquadro.
    """
    lato = 1024
    cw, ch = (lato, lato / rapporto) if rapporto >= 1 else (lato * rapporto, lato)
    x0, y0, x1, y1 = (v * lato / 10 for v in VOLTI[n])
    m = 0.03 * lato
    y = 0.0
    if y1 + m > ch:
        y = min(y1 + m - ch, max(y0 - m, 0))
    x = min(max((x0 + x1) / 2 - cw / 2, 0), lato - cw)
    dentro = x <= max(x0 - m, 0) + 0.5 and x + cw >= min(x1 + m, lato) - 0.5 and y <= max(y0 - m, 0) + 0.5 \
        and y + ch >= min(y1 + m, lato) - 0.5
    return (x, y, x + cw, y + ch), dentro


def illustrazione(tipo, n, w_mm, h_mm):
    rapporto = w_mm / h_mm
    if tipo == "persona":
        im = Image.open(QUI / "illustrazioni" / "lav" / f"{n}.png").convert("RGB")
        box, dentro = ritaglio_persona(n, rapporto)
        if not dentro:
            raise SystemExit(f"Il ritaglio della Persona {n} taglia la testa: guarda grafica/dati/volti.json")
    else:  # il disegno dell'Ambito, ritagliato dalla carta dei designer (570 x 570)
        im = Image.open(QUI / "carte_v2" / "ambiti" / f"{n}.png").convert("RGB").crop((161, 130, 731, 700))
        lato = im.width
        cw, ch = (lato, lato / rapporto) if rapporto >= 1 else (lato * rapporto, lato)
        box = ((lato - cw) / 2, (lato - ch) / 2, (lato + cw) / 2, (lato + ch) / 2)
    return im.resize((L(w_mm), L(h_mm)), Image.LANCZOS, box=box)


def controlla_volti(rapporto):
    tagliati = [n for n in VOLTI if not ritaglio_persona(n, rapporto)[1]]
    if tagliati:
        raise SystemExit(f"Volti tagliati col rapporto {rapporto:.2f}: {', '.join(tagliati)}")


def ruota(img, angolo):
    return img.rotate(angolo, resample=Image.BICUBIC, expand=True)


def incolla(tela, img, cx, cy):
    tela.alpha_composite(img, (round(cx - img.width / 2), round(cy - img.height / 2)))


def con_bordo(img, bordo, colore):
    out = Image.new("RGBA", (img.width + 2 * bordo, img.height + 2 * bordo), colore)
    out.paste(img, (bordo, bordo))
    return out


def adesivo(codice, lato_mm, angolo=0.0, bordo_mm=0.7, colore=BIANCO):
    """Un'icona come adesivo: contorno chiaro intorno alla forma, un po' storto."""
    ic = Image.open(QUI / "dati" / "icone_hd" / f"{codice}.png").convert("RGBA")
    ic = ic.resize((L(lato_mm), L(lato_mm)), Image.LANCZOS)
    b = L(bordo_mm)
    if b:
        tela = Image.new("RGBA", (ic.width + 2 * b, ic.height + 2 * b), (0, 0, 0, 0))
        tela.paste(ic, (b, b))
        alfa = tela.getchannel("A").point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(2 * b + 1))
        fondo = Image.new("RGBA", tela.size, colore)
        fondo.putalpha(alfa.filter(ImageFilter.GaussianBlur(0.8)))
        fondo.alpha_composite(tela)
        ic = fondo
    return ruota(ic, angolo)


def simbolo_categoria(cat, lato_mm, colore):
    m = Image.open(QUI / "dati" / "icone_hd" / f"cat_{cat}.png").getchannel("A").resize((L(lato_mm), L(lato_mm)), Image.LANCZOS)
    out = Image.new("RGBA", m.size, colore)
    out.putalpha(m)
    return out


def nastro(w_mm, h_mm, angolo, colore=(255, 61, 139, 115)):
    """Un pezzo di nastro adesivo con i capi strappati."""
    w, h = L(w_mm), L(h_mm)
    rng = np.random.default_rng(int(w_mm * 100 + h_mm))
    denti = 7
    sx = [(rng.uniform(0, L(0.8)), i * h / denti) for i in range(denti + 1)]
    dx = [(w - rng.uniform(0, L(0.8)), (denti - i) * h / denti) for i in range(denti + 1)]
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(img).polygon(sx + dx, fill=colore)
    return ruota(img, angolo)


def sporca(img, seme, quanto=0.18):
    """Toglie inchiostro qua e là, come un timbro."""
    a = np.asarray(img.getchannel("A")).astype(float)
    rng = np.random.default_rng(seme)
    rumore = Image.fromarray((rng.random(a.shape) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.4))
    r = np.asarray(rumore).astype(float)
    soglia = np.quantile(r, quanto)
    img.putalpha(Image.fromarray((a * (r > soglia)).astype(np.uint8)))
    return img


def timbro(testo, f, colore, angolo, seme, spazio=0, sotto=None, f_sotto=None, fondo=None, sbavature=0.18):
    """Un timbro a doppia cornice con una parola (e una riga più piccola sotto)."""
    tw = larghezza(testo, f, spazio)
    pad_x, pad_y = L(2.2), L(1.5)
    asc = f.getbbox("ÀG")[3] - f.getbbox("ÀG")[1]
    h = asc + 2 * pad_y
    w2 = larghezza(sotto, f_sotto) if sotto else 0
    w = max(tw, w2) + 2 * pad_x
    if sotto:
        h += L(3.2)
    img = Image.new("RGBA", (round(w), round(h)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if fondo:  # un fondo chiaro sotto l'inchiostro, perché si legga anche sopra la foto
        d.rectangle([L(0.3), L(0.3), w - 1 - L(0.3), h - 1 - L(0.3)], fill=fondo)
    d.rectangle([0, 0, w - 1, h - 1], outline=colore, width=L(0.55))
    d.rectangle([L(0.9), L(0.9), w - 1 - L(0.9), h - 1 - L(0.9)], outline=colore, width=L(0.22))
    scrivi(d, w / 2, pad_y + asc - L(0.1), testo, f, colore, spazio, "ms")
    if sotto:
        scrivi(d, w / 2, h - pad_y + L(0.2), sotto, f_sotto, colore, 0, "ms")
    if fondo:  # le sbavature solo sull'inchiostro, non sul fondo
        inchiostro = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(inchiostro)
        a = np.asarray(img).copy()
        colore_rgb = np.array(Image.new("RGB", (1, 1), colore).getpixel((0, 0)))
        e_inchiostro = np.abs(a[..., :3].astype(int) - colore_rgb).sum(axis=2) < 90
        macchia = np.asarray(sporca(Image.new("RGBA", img.size, (0, 0, 0, 255)), seme, sbavature).getchannel("A")) == 0
        fondo_rgb = np.array(Image.new("RGB", (1, 1), fondo).getpixel((0, 0)))
        a[e_inchiostro & macchia, :3] = fondo_rgb
        return ruota(Image.fromarray(a), angolo)
    return ruota(sporca(img, seme, sbavature), angolo)


# ---------------------------------------------------------------- proposta A: fanzine

FRANKLIN_H = "FRAHV.TTF"     # Franklin Gothic Heavy
FRANKLIN_C = "FRADMCN.TTF"   # Franklin Gothic Demi Cond
FRANKLIN_B = "FRABK.TTF"     # Franklin Gothic Book


def carta_A(tipo, n):
    """Fanzine: fondo carta, illustrazione storta col nastro, icone come adesivi, titoli da giornale."""
    persona = tipo == "persona"
    dati = PERSONE[n] if persona else AMBITI[n]
    tela = Image.new("RGBA", (LARGO, ALTO), CARTA)
    d = ImageDraw.Draw(tela)
    colore = PETROLIO
    accento = ROSA if persona else PETROLIO
    # intestazione
    f = font(FRANKLIN_C, 8.5)
    scrivi(d, X(5.5), X(7.4), "PERSONA" if persona else "AMBITO", f, accento, PT(8.5) * 0.18)
    scrivi(d, X(57.5), X(7.4), n, f, colore, PT(8.5) * 0.1, "rs")
    # illustrazione, storta di un grado e mezzo, con un filo scuro e il nastro
    aw, ah = 53, 36
    img = con_bordo(illustrazione(tipo, n, aw, ah).convert("RGBA"), L(0.35), PETROLIO)
    incolla(tela, ruota(img, 1.4 if int(n) % 2 else -1.4), X(31.5), X(10 + ah / 2))
    incolla(tela, nastro(15, 4.6, -3 if int(n) % 2 else 4), X(31.5), X(10.4))
    # icone come adesivi sul bordo basso dell'illustrazione
    codici = AMBIZIONI[n] if persona else COMPETENZE[n]
    for i, (k, ang) in enumerate(zip(codici, (-7, 5, -3))):
        incolla(tela, adesivo(k, 11.5, ang), X(12 + i * 12.6), X(46.4))
    if not persona:  # la categoria accanto agli adesivi
        cat = CATEGORIA[n]
        incolla(tela, simbolo_categoria(cat, 6.5, PETROLIO), X(54), X(47.6))
    # nome e battuta; la battuta si stringe per non toccare il potere in fondo
    f_nome, righe, pt, sp = adatta(dati["nome"].upper(), FRANKLIN_H, 15.5, 11, L(52), 2, spazio_em=0.01)
    y = X(54.6) + PT(pt) * 0.72
    y = paragrafo(d, X(5.5), y, righe, f_nome, colore, PT(pt) * 1.0, sp)
    limite = X(72.6 if persona else 78.6)
    for pt_b in (9.5, 9, 8.5, 8, 7.5):
        f_bat = font(MACCHINA, pt_b)
        r_bat = a_capo(dati["battuta"], f_bat, L(52))
        primo = y + PT(pt_b) * 1.5
        if primo + (len(r_bat) - 1) * PT(pt_b) * 1.2 <= limite:
            break
    paragrafo(d, X(5.5), primo, r_bat, f_bat, colore, PT(pt_b) * 1.2)
    # in fondo: il potere come etichetta rosa, o la categoria
    if persona:
        p = POTERI[CHI[n]]
        f_e = font(FRANKLIN_H, 9.5)
        testo = p["nome"].upper()
        tw = larghezza(testo, f_e, PT(9.5) * 0.06)
        et = Image.new("RGBA", (round(tw + L(3.2)), L(5.4)), ROSA)
        scrivi(ImageDraw.Draw(et), L(1.6), L(4.0), testo, f_e, BIANCO, PT(9.5) * 0.06)
        et = ruota(et, -1.5)
        tela.alpha_composite(et, (X(5.0), X(76.4) - et.height // 2))
        f_b, r_b, pt_e, _ = adatta(p["breve"][0].upper() + p["breve"][1:], FRANKLIN_B, 8, 6.75, L(52), 2)
        paragrafo(d, X(5.5), X(81.9 if len(r_b) == 2 else 82.8), r_b, f_b, colore, PT(pt_e) * 1.15)
    else:
        f_c = font(FRANKLIN_C, 9)
        scrivi(d, X(5.5), X(83.4), CATEGORIE[CATEGORIA[n]].upper(), f_c, colore, PT(9) * 0.12)
    return tela.convert("RGB")


# ---------------------------------------------------------------- proposta B: manifesto

BAHN = "bahnschrift.ttf"   # Bahnschrift: il DIN dei cartelli, con le larghezze strette


def carta_B(tipo, n):
    """Manifesto: Persone su bianco panna con i titoletti rosa, Ambiti su petrolio; titolo stretto e grande.

    Il 28/10/2026 il fondo delle Persone era rosa pieno come il dorso: a Vittorio sembrava aggressivo.
    """
    persona = tipo == "persona"
    dati = PERSONE[n] if persona else AMBITI[n]
    fondo, colore, accento = (PANNA, PETROLIO, MAGENTA) if persona else (PETROLIO, BIANCO, BIANCO)
    tela = Image.new("RGBA", (LARGO, ALTO), fondo)
    d = ImageDraw.Draw(tela)
    f = font(BAHN, 8.5, "SemiBold Condensed")
    scrivi(d, X(5.5), X(7.6), "PERSONA" if persona else "AMBITO", f, accento, PT(8.5) * 0.22)
    scrivi(d, X(57.5), X(7.6), n, f, colore, PT(8.5) * 0.1, "rs")
    # nome in alto, grande
    f_nome, righe, pt, _ = adatta(dati["nome"].upper(), BAHN, 21, 13, L(52), 2, "Bold Condensed")
    y = X(10.2) + PT(pt) * 0.74
    y = paragrafo(d, X(5.5), y, righe, f_nome, colore, PT(pt) * 0.92)
    # illustrazione dritta, con la cornice chiara di una stampa, fino a 64 mm
    top = y / PX - ABB + 2.6
    aw, ah = 46, 64 - top
    img = con_bordo(illustrazione(tipo, n, aw, ah).convert("RGBA"), L(1.0), BIANCO)
    if persona:  # sul fondo chiaro la stampa si stacca con un'ombra leggera
        ombra = Image.new("RGBA", (img.width + L(3), img.height + L(3)), (0, 0, 0, 0))
        ombra.paste(Image.new("RGBA", img.size, (23, 71, 77, 75)), (L(1.5), L(1.5)))
        ombra = ombra.filter(ImageFilter.GaussianBlur(L(0.5)))
        tela.alpha_composite(ombra, (X(5.5) - L(1.0) - L(1.5) + L(0.5), X(top) - L(1.5) + L(0.6)))
    tela.alpha_composite(img, (X(5.5) - L(1.0), X(top)))
    # icone in colonna a destra, attaccate al bordo della stampa
    codici = AMBIZIONI[n] if persona else COMPETENZE[n]
    passo = min(12.6, (ah - 2) / 3)
    for i, (k, ang) in enumerate(zip(codici, (4, -4, 3))):
        incolla(tela, adesivo(k, 10.5, ang, 0.8, BIANCO), X(54.5), X(top + 1 + passo / 2 + i * passo))
    # battuta
    f_bat, r_bat, pt_b, _ = adatta(dati["battuta"], BAHN, 10.5, 8.5, L(52), 2, "SemiBold SemiCondensed")
    paragrafo(d, X(5.5), X(66.4) + PT(pt_b) * 0.75, r_bat, f_bat, colore, PT(pt_b) * 1.12)
    # in fondo: il potere o la categoria
    if persona:
        p = POTERI[CHI[n]]
        f_p = font(BAHN, 12, "Bold Condensed")
        scrivi(d, X(5.5), X(79.4), p["nome"].upper(), f_p, accento, PT(12) * 0.05)
        f_b, r_b, pt_e, _ = adatta(p["breve"][0].upper() + p["breve"][1:], BAHN, 9, 7.5, L(52), 2, "SemiCondensed")
        paragrafo(d, X(5.5), X(79.4) + PT(pt_e) * 1.35, r_b, f_b, PETROLIO, PT(pt_e) * 1.1)
    else:
        cat = CATEGORIA[n]
        incolla(tela, simbolo_categoria(cat, 7, BIANCO), X(9.0), X(80.4))
        f_c = font(BAHN, 11, "Bold Condensed")
        scrivi(d, X(14.2), X(82.3), CATEGORIE[cat].upper(), f_c, BIANCO, PT(11) * 0.06)
    return tela.convert("RGB")


# ---------------------------------------------------------------- proposta C: schedario

ROCK_X, ROCK, ROCK_C = "ROCKEB.TTF", "ROCK.TTF", "ROCCB___.TTF"   # Rockwell Extra Bold, normale, Condensed Bold


def carta_C(tipo, n):
    """Schedario: fondo color cartellina, foto come in una pratica, potere timbrato, campi a macchina."""
    persona = tipo == "persona"
    dati = PERSONE[n] if persona else AMBITI[n]
    tela = Image.new("RGBA", (LARGO, ALTO), MANILA)
    d = ImageDraw.Draw(tela)
    colore = PETROLIO
    f_m = font(MACCHINA, 8)
    scrivi(d, X(5.5), X(7.4), "SCHEDA PERSONA" if persona else "SCHEDA AMBITO", f_m, colore, PT(8) * 0.08)
    scrivi(d, X(57.5), X(7.4), f"N. {n}", f_m, colore, 0, "rs")
    d.line([X(5.5), X(8.8), X(57.5), X(8.8)], fill=colore, width=L(0.3))
    # foto con il margine bianco, appena storta
    aw, ah = 51, 35
    img = con_bordo(illustrazione(tipo, n, aw, ah).convert("RGBA"), L(1.3), BIANCO)
    ombra = Image.new("RGBA", img.size, (23, 71, 77, 70)).filter(ImageFilter.GaussianBlur(2))
    ang = -0.9 if int(n) % 2 else 0.9
    incolla(tela, ruota(ombra, ang), X(31.5) + L(0.6), X(10.6 + ah / 2 + 1.3) + L(0.6))
    incolla(tela, ruota(img, ang), X(31.5), X(10.6 + ah / 2 + 1.3))
    # campi
    y0 = 10.6 + ah + 2.6 + 3.2
    f_et = font(MACCHINA, 7)
    scrivi(d, X(5.5), X(y0), "Nome" if persona else "Ambito", f_et, colore)
    f_nome, righe, pt, _ = adatta(dati["nome"], ROCK_X, 14, 10, L(52), 2)
    y = paragrafo(d, X(5.5), X(y0) + PT(pt) * 1.02, righe, f_nome, colore, PT(pt) * 1.02)
    yy = y / PX - ABB + 3.4
    scrivi(d, X(5.5), X(yy), "Note", f_et, colore)
    for pt_b in (9, 8.5, 8, 7.5):
        f_bat = font(MACCHINA, pt_b)
        r_bat = a_capo(dati["battuta"], f_bat, L(52))
        if X(yy) + PT(pt_b) * 1.3 + (len(r_bat) - 1) * PT(pt_b) * 1.2 <= X(71.8):
            break
    paragrafo(d, X(5.5), X(yy) + PT(pt_b) * 1.3, r_bat, f_bat, colore, PT(pt_b) * 1.2)
    # icone in fila in basso a sinistra, con l'etichetta del campo
    codici = AMBIZIONI[n] if persona else COMPETENZE[n]
    scrivi(d, X(5.5), X(74.8), "Ambizioni" if persona else "Competenze", f_et, colore)
    for i, k in enumerate(codici):
        incolla(tela, adesivo(k, 10.5, (-3, 2, -2)[i], 0, BIANCO), X(10.8 + i * 11.6), X(80.6))
    if persona:  # il potere timbrato in rosa sull'angolo della foto; cosa fa lo dice la carta riassunto
        p = POTERI[CHI[n]]
        nome = p["nome"].upper()
        f_t = font(ROCK_C, 11.5)
        t = timbro(nome, f_t, ROSA, 5 if int(n) % 2 else -4, int(n), PT(11.5) * 0.04, fondo=MANILA, sbavature=0.1)
        incolla(tela, t, X(57.0) - t.width / 2, X(10.6 + ah + 1.6))
    else:
        cat = CATEGORIA[n]
        incolla(tela, simbolo_categoria(cat, 7.5, PETROLIO), X(44), X(80.4))
        f_c, r_c, pt_c, _ = adatta(CATEGORIE[cat], MACCHINA, 7.5, 6.5, L(11.5), 3)
        paragrafo(d, X(48.6), X(78.6), r_c, f_c, colore, PT(pt_c) * 1.1)
    return tela.convert("RGB")


PROPOSTE = {
    "A": ("Fanzine", "Franklin Gothic Heavy e macchina da scrivere, fondo carta", carta_A, 53 / 39),
    "B": ("Manifesto", "Bahnschrift stretto, Persone su bianco panna, Ambiti su petrolio", carta_B, 46 / 30),
    "C": ("Schedario", "Rockwell e macchina da scrivere, fondo cartellina", carta_C, 51 / 37),
}
CAMPIONE = [("persona", "27"), ("persona", "55"), ("persona", "19"), ("persona", "59"), ("persona", "07"),
            ("persona", "48"), ("ambito", "01"), ("ambito", "12"), ("ambito", "26")]


def proposte(chiavi=tuple(PROPOSTE)):
    """Le carte di prova delle proposte, un'immagine di confronto e il PDF a grandezza vera.

    Con tutte le proposte: confronto.jpg (una riga per proposta) e proposte_carte.pdf.
    Con una sola, per esempio B: confronto_B.jpg (sei carte su due righe) e proposta_B.pdf.
    """
    out = QUI / "proposte_carte"
    out.mkdir(exist_ok=True)
    for chiave in chiavi:
        nome, _, fn, rapporto = PROPOSTE[chiave]
        controlla_volti(rapporto)
        for tipo, n in CAMPIONE:
            fn(tipo, n).save(out / f"{chiave}_{tipo}_{n}.png")
        print(chiave, nome)
    scala = 0.42
    cw, ch = round(LARGO * scala), round(ALTO * scala)
    if len(chiavi) > 1:  # una riga per proposta, quattro carte
        righe = [(k, [CAMPIONE[0], CAMPIONE[1], CAMPIONE[3], CAMPIONE[6]]) for k in chiavi]
        nome_file = "confronto"
    else:  # una proposta sola: tre Persone e tre Ambiti
        righe = [(chiavi[0], CAMPIONE[:3]), (chiavi[0], CAMPIONE[6:])]
        nome_file = f"confronto_{chiavi[0]}"
    colonne = max(len(s) for _, s in righe)
    foglio = Image.new("RGB", (colonne * (cw + 20) + 20, len(righe) * (ch + 70) + 10), "white")
    d = ImageDraw.Draw(foglio)
    for r, (chiave, scelte) in enumerate(righe):
        nome, desc, _, _ = PROPOSTE[chiave]
        if r == 0 or len(chiavi) > 1:
            titolo = f"{chiave}  {nome}  ·  {desc}" if len(chiavi) > 1 else f"{chiave}  {nome}"
            d.text((20, r * (ch + 70) + 18), titolo, font=font("arialbd.ttf", 9), fill="black")
        for c, (tipo, n) in enumerate(scelte):
            im = Image.open(out / f"{chiave}_{tipo}_{n}.png").resize((cw, ch), Image.LANCZOS)
            foglio.paste(im, (20 + c * (cw + 20), r * (ch + 70) + 55))
    foglio.save(out / f"{nome_file}.jpg", quality=88)
    pdf_proposte(out, chiavi, "proposte_carte" if len(chiavi) > 1 else f"proposta_{chiavi[0]}")


def pdf_proposte(out, chiavi, nome_file):
    """Una pagina A4 per proposta con le nove carte a grandezza vera e la linea di taglio."""
    x0, y0 = (210 - 3 * (W + 2 * ABB)) / 2, (297 - 3 * (H + 2 * ABB)) / 2
    pagine = []
    for chiave in chiavi:
        nome, desc, _, _ = PROPOSTE[chiave]
        corpo = [rf"\node[anchor=north west,font=\sffamily\bfseries\small] at (12mm,-5mm) {{Proposta {chiave}: {nome}}};",
                 rf"\node[anchor=north east,font=\sffamily\small] at (198mm,-5mm) {{{desc}}};"]
        for k, (tipo, n) in enumerate(CAMPIONE):
            riga, col = divmod(k, 3)
            x, y = x0 + col * (W + 2 * ABB), y0 + riga * (H + 2 * ABB)
            corpo.append(rf"\node[anchor=north west,inner sep=0] at ({x}mm,-{y}mm) "
                         rf"{{\includegraphics[width={W + 2 * ABB}mm]{{{chiave}_{tipo}_{n}.png}}}};")
            corpo.append(rf"\draw[black!45,line width=0.15pt,dashed] ({x + ABB}mm,-{y + ABB}mm) "
                         rf"rectangle ({x + ABB + W}mm,-{y + ABB + H}mm);")
        pagine.append(r"\begin{tikzpicture}[remember picture,overlay,shift={(current page.north west)}]" + "\n"
                      + "\n".join(corpo) + "\n" + r"\end{tikzpicture}\clearpage")
    tex = (r"\documentclass{article}\usepackage[a4paper,margin=0mm]{geometry}\usepackage{graphicx,tikz}"
           r"\usepackage{tgheros}\renewcommand{\familydefault}{\sfdefault}\pagestyle{empty}"
           r"\pdfinfo{/Title (Collocamento - tre proposte per le carte)}"
           "\n" r"\begin{document}" "\n" + "\n".join(f"\\null\n{p}" for p in pagine) + "\n" r"\end{document}" "\n")
    (out / f"{nome_file}.tex").write_text(tex, encoding="utf-8")
    subprocess.run(["pdflatex", "-interaction=nonstopmode", f"{nome_file}.tex"], cwd=out, check=True,
                   capture_output=True)
    print(out / f"{nome_file}.pdf")


def mazzo(chiave):
    _, _, fn, rapporto = PROPOSTE[chiave]
    controlla_volti(rapporto)
    out = QUI / "carte_v3"
    for tipo, cartella, numeri in (("persona", "persone", PERSONE), ("ambito", "ambiti", AMBITI)):
        (out / cartella).mkdir(parents=True, exist_ok=True)
        for n in numeri:
            fn(tipo, n).save(out / cartella / f"{n}.png")
        print(out / cartella, len(numeri))


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else "proposte"
    if arg == "proposte":
        proposte(tuple(k.upper() for k in sys.argv[2:]) or tuple(PROPOSTE))
    else:
        mazzo(arg.upper())
