"""
Il regolamento di Collocamento in libretto A5, nello stile delle carte: da HTML a PDF con Edge.

    py -3 pitch/libretto.py

Legge pitch/regolamento_a5.html (il sorgente), riempie i segnaposto (nomi ed effetti dei poteri da
grafica/dati/poteri.json, icone delle carte da mazzi/), scrive pitch/_libretto.html e lo stampa in
pitch/regolamento_a5.pdf. Si ferma se una pagina trabocca dal suo pannello o se le pagine non sono 12:
grafica/pnp.py le impagina quattro per foglio, da piegare a metà.

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
PDF = QUI / "regolamento_a5.pdf"
PAGINE = 12
EDGE = Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")


def _csv(nome):
    with open(RADICE / "mazzi" / nome, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def riempi(html):
    nomi = poteri.nomi()
    terne = {("per", r["n"]): [r["a1"], r["a2"], r["a3"]] for r in _csv("lavoratori.csv")}
    terne.update({("amb", r["n"]): [r["l1"], r["l2"], r["l3"]] for r in _csv("ambiti.csv")})

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


def main():
    PRONTO.write_text(riempi(SORGENTE.read_text(encoding="utf-8")), encoding="utf-8")
    PDF.unlink(missing_ok=True)
    edge("--no-pdf-header-footer", f"--print-to-pdf={PDF}", PRONTO.as_uri())
    for _ in range(60):  # Edge può tornare prima di aver finito di scrivere
        if PDF.exists() and PDF.stat().st_size:
            break
        time.sleep(0.5)
    time.sleep(0.5)
    pdf = fitz.open(PDF)
    # lo script della pagina scrive TRABOCCA dove il contenuto esce dal pannello
    fuori = [str(i + 1) for i, p in enumerate(pdf) if "TRABOCCA" in p.get_text()]
    if fuori:
        raise SystemExit(f"Il testo esce dal pannello nelle pagine {', '.join(fuori)} di pitch/regolamento_a5.html")
    if len(pdf) != PAGINE:
        raise SystemExit(f"Il libretto ha {len(pdf)} pagine invece di {PAGINE}")
    n = len(pdf)
    print(f"pitch/regolamento_a5.pdf: {n} pagine A5, {PDF.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
