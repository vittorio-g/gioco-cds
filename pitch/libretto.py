"""
Il regolamento di Collocamento in libretto A5, nello stile delle carte: da HTML a PDF con Edge.

    py -3 pitch/libretto.py          # le due versioni
    py -3 pitch/libretto.py B        # una sola

Legge pitch/regolamento_a5.html (il sorgente), riempie i segnaposto (nomi ed effetti dei poteri da
grafica/dati/poteri.json, icone delle carte da mazzi/), scrive pitch/_libretto.html e lo stampa in
pitch/regolamento_a5_A.pdf e pitch/regolamento_a5_B.pdf. Si ferma se una pagina trabocca dal suo pannello
o se le pagine non sono 12: grafica/pnp.py le impagina quattro per foglio, da piegare a metà.

Le versioni servono al playtest a confronto di novembre 2026: A con gli eventi, B senza. Nel sorgente i
pezzi che valgono per una sola versione stanno tra <!--A--> e <!--/A--> o tra <!--B--> e <!--/B-->;
il segnaposto {{versione}} diventa "versione A, con eventi" o "versione B, senza eventi".

Le immagini vengono da pitch/img/ (py -3 pitch/figure.py). Il carattere è Bahnschrift, di Windows.
"""
import csv
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import fitz

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent
sys.path.insert(0, str(RADICE / "grafica"))
import poteri  # noqa: E402

SORGENTE = QUI / "regolamento_a5.html"
PRONTO = QUI / "_libretto.html"
PAGINE = 12
VERSIONI = {"A": "con eventi", "B": "senza eventi"}


def pdf_di(versione):
    return QUI / f"regolamento_a5_{versione}.pdf"
EDGE = Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")


def _csv(nome):
    with open(RADICE / "mazzi" / nome, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def riempi(html, versione):
    # prima i pezzi dell'altra versione, poi i segnaposto
    html = re.sub(r"<!--([AB])-->(.*?)<!--/\1-->", lambda m: m.group(2) if m.group(1) == versione else "", html,
                  flags=re.S)
    html = html.replace("{{versione}}", f"versione {versione}, {VERSIONI[versione]}")
    nomi = poteri.nomi()
    # le icone nello stesso ordine delle carte (grafica/carte_nuove.py, ORDINE_ICONE)
    ordine = ("MA", "DI", "CO", "OR", "CR", "RI").index
    terne = {("per", r["n"]): sorted([r["a1"], r["a2"], r["a3"]], key=ordine) for r in _csv("lavoratori.csv")}
    terne.update({("amb", r["n"]): sorted([r["l1"], r["l2"], r["l3"]], key=ordine) for r in _csv("ambiti.csv")})

    def icona(sigla):
        return f'<img class="ico" src="img/adesivo_{sigla}.png" alt="{sigla}">'

    def sostituisci(m):
        parti = m.group(1).split()
        if parti[0] in ("potere", "effetto", "breve"):
            p = nomi[int(parti[1])]
            return {"potere": p["nome"], "effetto": p["effetto"],
                    "breve": p["breve"][0].upper() + p["breve"][1:]}[parti[0]]
        if parti[0] == "ico":
            return icona(parti[1])
        if parti[0] == "terna":
            return '<span style="white-space: nowrap">' + "".join(icona(s) for s in terne[(parti[1], parti[2])]) + "</span>"
        raise SystemExit(f"segnaposto sconosciuto: {m.group(0)}")

    return re.sub(r"\{\{([^}]+)\}\}", sostituisci, html)


def edge(*argomenti):
    """Una chiamata a Edge senza interfaccia, con un profilo tutto suo (se no passa all'istanza aperta)."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as profilo:
        return subprocess.run([str(EDGE), "--headless=new", "--disable-gpu", f"--user-data-dir={profilo}",
                               "--run-all-compositor-stages-before-draw", "--virtual-time-budget=8000", *argomenti],
                              capture_output=True, text=True, encoding="utf-8", errors="replace")


def main(versione, destino=None):
    """Stampa il libretto di una versione; destino = un altro PDF, per le prove."""
    destino = destino or pdf_di(versione)
    PRONTO.write_text(riempi(SORGENTE.read_text(encoding="utf-8"), versione), encoding="utf-8")
    destino.unlink(missing_ok=True)
    edge("--no-pdf-header-footer", f"--print-to-pdf={destino}", PRONTO.as_uri())
    for _ in range(60):  # Edge può tornare prima di aver finito di scrivere
        if destino.exists() and destino.stat().st_size:
            break
        time.sleep(0.5)
    time.sleep(0.5)
    pdf = fitz.open(destino)
    # lo script della pagina scrive TRABOCCA dove il contenuto esce dal pannello
    fuori = [str(i + 1) for i, p in enumerate(pdf) if "TRABOCCA" in p.get_text()]
    if fuori:
        raise SystemExit(f"Versione {versione}: il testo esce dal pannello nelle pagine {', '.join(fuori)}")
    if len(pdf) != PAGINE:
        raise SystemExit(f"Versione {versione}: il libretto ha {len(pdf)} pagine invece di {PAGINE}")
    print(f"{destino.name}: {len(pdf)} pagine A5, {destino.stat().st_size / 1e6:.1f} MB")
    return destino


if __name__ == "__main__":
    for v in sys.argv[1:] or VERSIONI:
        main(v.upper())
