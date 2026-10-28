"""Icone delle sei competenze e delle cinque categorie in alta risoluzione, per le carte nuove.

Le competenze sono i disegni di grafica/icone/*.svg (gli stessi che usano le carte dei designer)
ricolorati come sulle carte: quadrato del colore della competenza, disegno bianco. Le rende Edge
senza interfaccia, a sfondo trasparente. Le categorie degli Ambiti si ricavano dal riquadro in basso
a sinistra delle carte dei designer: la forma scura viene ingrandita e ripulita.

    py -3 grafica/icone_hd.py

Scrive grafica/dati/icone_hd/{MA,DI,CO,OR,CR,RI}.png e cat_01..05.png (480 px).
"""
import csv
import re
import subprocess
import tempfile
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent
OUT = QUI / "dati" / "icone_hd"
LATO = 480

# colori delle icone sulle carte dei designer (campionati da webapp/public/icone)
COLORI = {"MA": "#d85820", "DI": "#2878c8", "CO": "#d03880", "OR": "#d0a018", "CR": "#b83830", "RI": "#705038"}
ROSA, PETROLIO, CARTA = "#ff3d8b", "#17474d", "#f1ebdd"
EDGE = Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")


def ricolora(svg, colore):
    """Il quadrato prende il colore della competenza, il disegno diventa bianco, l'ombra sparisce."""
    svg = re.sub(r'<polygon[^>]*transform="translate[^>]*/>\s*', "", svg)  # l'ombra spostata
    sfondo = re.search(r'<polygon[^>]*fill="(#[0-9a-f]{6})"', svg).group(1)
    tmp = "#000001"
    svg = svg.replace(sfondo, tmp)
    for c in (ROSA, PETROLIO, CARTA):
        svg = svg.replace(c, "#ffffff")
    return svg.replace(tmp, colore)


def competenze():
    # Una pagina sola con le sei icone in fila e uno screenshot: lanciando Edge più volte di seguito
    # sullo stesso profilo, le chiamate dopo la prima passano all'istanza aperta e non scrivono niente.
    # Edge tiene aperti per un po' i file del profilo: la cartella si pulisce come può.
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        tmp = Path(tmp)
        img = ""
        for k, colore in COLORI.items():
            svg = ricolora((QUI / "icone" / f"{k}.svg").read_text(encoding="utf-8"), colore)
            (tmp / f"{k}.svg").write_text(svg, encoding="utf-8")
            img += f"<img src='{k}.svg' style='display:block;float:left;width:{LATO}px;height:{LATO}px'>"
        pagina = tmp / "icone.html"
        pagina.write_text(f"<html><body style='margin:0;background:transparent'>{img}</body></html>", encoding="utf-8")
        fila = tmp / "fila.png"
        subprocess.run([str(EDGE), "--headless=new", "--disable-gpu", f"--user-data-dir={tmp / 'profilo'}",
                        "--default-background-color=00000000", "--hide-scrollbars",
                        f"--screenshot={fila}", f"--window-size={LATO * len(COLORI)},{LATO}", pagina.as_uri()],
                       check=True, capture_output=True)
        for _ in range(60):  # Edge può tornare prima di aver scritto lo screenshot
            if fila.exists() and fila.stat().st_size:
                break
            time.sleep(0.5)
        time.sleep(0.5)
        fila = Image.open(fila).convert("RGBA")
        for i, k in enumerate(COLORI):
            fila.crop((i * LATO, 0, (i + 1) * LATO, LATO)).save(OUT / f"{k}.png")
            print((OUT / f"{k}.png").relative_to(RADICE))


def categorie():
    """Ritaglia la forma scura del riquadro di categoria da un Ambito per categoria."""
    righe = list(csv.DictReader(open(RADICE / "mazzi" / "ambiti.csv", encoding="utf-8")))
    for cat in sorted({r["cat"] for r in righe}):
        n = next(r["n"] for r in righe if r["cat"] == cat)
        carta = Image.open(QUI / "carte_v2" / "ambiti" / f"{n}.png").convert("RGB").crop((20, 900, 120, 985))
        a = np.asarray(carta).astype(int)
        scuro = (a.sum(axis=2) < 300).astype(np.uint8) * 255  # il disegno è petrolio scuro sul pastello
        ys, xs = np.nonzero(scuro)
        m = Image.fromarray(scuro).crop((xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3))
        s = (LATO - 40) / max(m.size)
        m = m.resize((round(m.width * s), round(m.height * s)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(3))
        m = m.point(lambda v: 255 if v > 128 else 0).filter(ImageFilter.GaussianBlur(1.2))
        tela = Image.new("L", (LATO, LATO), 0)
        tela.paste(m, ((LATO - m.width) // 2, (LATO - m.height) // 2))
        out = Image.new("RGBA", (LATO, LATO), PETROLIO)
        out.putalpha(tela)
        out.save(OUT / f"cat_{cat}.png")
        print((OUT / f"cat_{cat}.png").relative_to(RADICE))


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    competenze()
    categorie()
