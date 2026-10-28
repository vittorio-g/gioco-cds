"""
Il print and play di Collocamento: un PDF solo, da stampare in una volta, A4 fronte e retro
sul lato lungo, e da tagliare al laser.

    py -3 grafica/pnp.py

Scrive grafica/stampa/collocamento_pnp.pdf (36 pagine, 18 fogli) e i file di taglio in
grafica/stampa/taglio/. Le immagini che servono le prepara in grafica/stampa/pnp_img/.

- Fogli 1-7: le 60 Persone, col potere scritto sulla carta (grafica/dati/poteri.json,
  assegnazione in grafica/poteri.py).
- Fogli 8-14: i 60 Ambiti, cioè due copie di ognuno dei 30.
- Foglio 15: 4 carte riassunto (da un lato il turno, dall'altro punti e poteri) e 4 token,
  stampati sui due lati.
- Fogli 16-18: il regolamento A5 (pitch/regolamento_a5.pdf), due pagine per facciata,
  da piegare a metà. Lo rifà ogni volta pitch/libretto.py (HTML stampato da Edge), dopo
  pitch/figure.py per le immagini.

Le carte sono quelle di grafica/carte_nuove.py nello stile scelto (STILE, la proposta B): un solo
colore di fondo, abbondanza compresa, così uno scarto del taglio non si vede. Se grafica/carte_v3/
manca, lo script le rifà.

Per il laser: ogni carta ha 2 mm di abbondanza per lato (anche i dorsi), le carte di un foglio
stanno a 4 mm l'una dall'altra e agli angoli del foglio ci sono quattro crocini di registro
(cerchio da 4 mm e croce da 6 mm), stampati su tutte e due le facciate. Crocini e
intestazioni stanno ad almeno 4,5 mm dal bordo del foglio, per le stampanti che non ci arrivano. Griglia e crocini sono
simmetrici, quindi il file di taglio delle carte vale col fronte o col retro in alto; quello
delle carte riassunto si usa col fronte in alto. I dorsi sono già specchiati per il lato lungo.

Il libretto: in ogni facciata due pagine A5 ruotate. Sul fronte ruotano in senso orario, sul
retro in senso antiorario: col fronte e retro sul lato lungo è come stampare un libretto sul
lato corto, e piegando i fogli a metà le pagine vanno in ordine.

Servono le illustrazioni in grafica/illustrazioni/, le carte dei designer in grafica/carte_v2/
(per i disegni degli Ambiti) e i dorsi in grafica/dorsi_proposte/, tutto da Drive; Pillow, NumPy,
OpenCV, PyMuPDF, pdflatex con TikZ e Microsoft Edge (per il libretto).
"""
import subprocess
import sys
from pathlib import Path

import fitz
import numpy as np
from PIL import Image

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent
sys.path.insert(0, str(QUI))
import carte_nuove  # noqa: E402

CARTE = QUI / "carte_v3"
STAMPA = QUI / "stampa"
IMG = STAMPA / "pnp_img"
TAGLIO = STAMPA / "taglio"
for d in (IMG, TAGLIO):
    d.mkdir(parents=True, exist_ok=True)
DORSI = "B"  # la proposta di dorsi scelta da Vittorio il 28/10/2026 (grafica/dorsi_proposte)
REGOLAMENTO = RADICE / "pitch" / "regolamento_a5.pdf"

# ---------------------------------------------------------------- la geometria del foglio, in mm
W, H = 63, 88  # una carta
ABB = 2  # abbondanza per lato
PASSO_X, PASSO_Y = W + 2 * ABB, H + 2 * ABB
X0 = (210 - (3 * W + 4 * ABB)) / 2  # 6.5: il bordo di taglio della prima colonna
Y0 = (297 - (3 * H + 4 * ABB)) / 2  # 12.5: il bordo di taglio della prima riga, dall'alto
R_ANGOLI = 3
CROCINI = [(14, 7.5), (196, 7.5), (14, 289.5), (196, 289.5)]  # (x, y dall'alto)
R_CROCINO, BRACCIO = 2, 3  # il cerchio e mezza croce: tutto tra 4,5 e 10,5 mm dal bordo, fuori dall'abbondanza
R_TOKEN = 14


def posto(k, specchio=False):
    """L'angolo in alto a sinistra (x, y dall'alto) della carta k di un foglio, sul fronte o sul retro."""
    riga, colonna = divmod(k, 3)
    if specchio:
        colonna = 2 - colonna
    return X0 + colonna * PASSO_X, Y0 + riga * PASSO_Y


# I token stanno al posto delle carte 4 e 5 del foglio delle carte riassunto.
TOKEN = [(X0 + PASSO_X + 32.5, Y0 + PASSO_Y + 22), (X0 + PASSO_X + 32.5 + 65, Y0 + PASSO_Y + 22),
         (X0 + PASSO_X + 32.5, Y0 + PASSO_Y + 66), (X0 + PASSO_X + 32.5 + 65, Y0 + PASSO_Y + 66)]
VALORI_TOKEN = [("5", r"TRE SET\\STESSA CATEGORIA"), ("3", r"TRE SET\\STESSA CATEGORIA"),
                ("5", r"QUATTRO\\CATEGORIE"), ("3", r"QUATTRO\\CATEGORIE")]


# ---------------------------------------------------------------- le immagini, con l'abbondanza
def con_abbondanza(img, modo):
    """Allarga l'immagine di ABB mm per lato: ripete il bordo (carte a tinta piatta) o lo specchia (dorsi disegnati)."""
    a = np.asarray(img.convert("RGB"))
    px = round(ABB * img.width / W)
    return Image.fromarray(np.pad(a, ((px, px), (px, px), (0, 0)), mode=modo))


def salva(img, nome):
    img.convert("RGB").save(IMG / f"{nome}.jpg", quality=88, optimize=True)
    return f"pnp_img/{nome}.jpg"


# le carte nuove, con l'abbondanza già dentro (67 x 92 mm): se mancano si rifanno
if not (CARTE / "riassunto_retro.png").exists():
    carte_nuove.mazzo(carte_nuove.STILE)
persone = sorted(carte_nuove.PERSONE)
ambiti = sorted(carte_nuove.AMBITI)
fronti_per = [salva(Image.open(CARTE / "persone" / f"{n}.png"), f"per_{n}") for n in persone]
fronti_amb = [salva(Image.open(CARTE / "ambiti" / f"{n}.png"), f"amb_{n}") for n in ambiti]
riassunto_fronte = salva(Image.open(CARTE / "riassunto_fronte.png"), "riassunto_fronte")
riassunto_retro = salva(Image.open(CARTE / "riassunto_retro.png"), "riassunto_retro")
dorso_per = salva(con_abbondanza(Image.open(QUI / "dorsi_proposte" / f"{DORSI}_persone.png"), "reflect"), "dorso_per")
dorso_amb = salva(con_abbondanza(Image.open(QUI / "dorsi_proposte" / f"{DORSI}_ambiti.png"), "reflect"), "dorso_amb")
for vecchia in IMG.glob("*.jpg"):  # le immagini delle versioni precedenti
    if f"pnp_img/{vecchia.name}" not in fronti_per + fronti_amb + [dorso_per, dorso_amb, riassunto_fronte, riassunto_retro]:
        vecchia.unlink()

# ---------------------------------------------------------------- il PDF
TESTA = r"""\documentclass[10pt]{article}
\usepackage[a4paper,margin=0mm]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[italian]{babel}
\usepackage{tgheros}
\renewcommand{\familydefault}{\sfdefault}
\usepackage{graphicx,xcolor,tikz}
\definecolor{petrolio}{HTML}{17474D}
\definecolor{carta}{HTML}{F3ECDD}
\definecolor{cartascura}{HTML}{E5DACA}
\definecolor{rosa}{HTML}{FF3D8B}
\definecolor{magenta}{HTML}{D53883}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\begin{document}
"""


def y(su):
    """Da "mm dall'alto" alle coordinate TikZ (mm dal basso)."""
    return 297 - su


def apri(intestazione=None):
    """Una facciata; l'intestazione sta tra i crocini, lontana dal bordo che la stampante può tagliare."""
    testo = r"\noindent\begin{tikzpicture}[remember picture,overlay,x=1mm,y=1mm,shift={(current page.south west)}]" + "\n"
    if intestazione:
        testo += rf"\node[font=\fontsize{{6}}{{7}}\selectfont,text=petrolio] at (105,{y(7.5)}) {{{intestazione}}};" + "\n"
    return testo


def crocini():
    righe = []
    for cx, cy in CROCINI:
        righe.append(rf"\draw[black,line width=.25mm] ({cx},{y(cy)}) circle ({R_CROCINO}) ({cx - BRACCIO},{y(cy)}) -- ({cx + BRACCIO},{y(cy)}) ({cx},{y(cy) - BRACCIO}) -- ({cx},{y(cy) + BRACCIO});")
    return "\n".join(righe) + "\n"


def chiudi():
    return "\\end{tikzpicture}\n\\newpage\n"


def immagine(file, x, su):
    """Una carta con l'abbondanza: x, su = l'angolo in alto a sinistra della linea di taglio."""
    return rf"\node[anchor=north west,inner sep=0] at ({x - ABB},{y(su - ABB)}) {{\includegraphics[width={W + 2 * ABB}mm,height={H + 2 * ABB}mm]{{{file}}}}};" + "\n"


def foglio_carte(nome, fronti, dorso, foglio, fogli):
    fronte = apri(rf"{nome} · FRONTE · FOGLIO {foglio} DI {fogli}") + crocini()
    retro = apri(rf"{nome} · RETRO · FOGLIO {foglio} DI {fogli}") + crocini()
    for k, f in enumerate(fronti):
        fronte += immagine(f, *posto(k))
        retro += immagine(dorso, *posto(k, specchio=True))
    return fronte + chiudi() + retro + chiudi()


# ---- le carte riassunto (immagini di carte_nuove.py) e i token
def token(cx, cy_su, valore, testo):
    """Un disco petrolio pieno, abbondanza compresa: niente anelli vicino al taglio, che si vedrebbero storti."""
    c = y(cy_su)
    return rf"""
  \fill[petrolio] ({cx},{c}) circle ({R_TOKEN + ABB});
  \node[text=carta,font=\fontsize{{22}}{{22}}\selectfont\bfseries] at ({cx},{c + 2.3}) {{{valore}}};
  \node[text=carta,font=\fontsize{{5.2}}{{6}}\selectfont\bfseries,align=center] at ({cx},{c - 6.4}) {{{testo}}};
"""


def foglio_riassunti():
    fronte = apri(r"CARTE RIASSUNTO E TOKEN · FRONTE") + crocini()
    retro = apri(r"CARTE RIASSUNTO E TOKEN · RETRO") + crocini()
    for k in range(4):
        fronte += immagine(riassunto_fronte, *posto(k))
        retro += immagine(riassunto_retro, *posto(k, specchio=True))
    for (cx, cy), (valore, testo) in zip(TOKEN, VALORI_TOKEN):
        fronte += token(cx, cy, valore, testo)
        retro += token(210 - cx, cy, valore, testo)
    return fronte + chiudi() + retro + chiudi()


# ---- il libretto: pagine A5 a due a due, ruotate
def fogli_libretto():
    n = len(fitz.open(REGOLAMENTO))
    if n % 4:
        raise SystemExit(f"il regolamento A5 ha {n} pagine: per il libretto servono multipli di 4")
    file = REGOLAMENTO.as_posix()
    testo = ""
    for s in range(n // 4):
        sinistra, destra = n - 2 * s, 2 * s + 1  # fronte, visto in orizzontale
        testo += apri()  # niente intestazione: finirebbe sul margine delle pagine del libretto
        testo += rf"\node[inner sep=0] at (105,{y(74.25)}) {{\includegraphics[page={sinistra},angle=-90]{{{file}}}}};" + "\n"
        testo += rf"\node[inner sep=0] at (105,{y(222.75)}) {{\includegraphics[page={destra},angle=-90]{{{file}}}}};" + "\n"
        testo += chiudi()
        sinistra, destra = 2 * s + 2, n - 2 * s - 1  # retro, visto in orizzontale
        testo += apri()
        testo += rf"\node[inner sep=0] at (105,{y(74.25)}) {{\includegraphics[page={destra},angle=90]{{{file}}}}};" + "\n"
        testo += rf"\node[inner sep=0] at (105,{y(222.75)}) {{\includegraphics[page={sinistra},angle=90]{{{file}}}}};" + "\n"
        testo += chiudi()
    return testo


# ---------------------------------------------------------------- il regolamento A5, sempre rifatto
subprocess.run([sys.executable, str(RADICE / "pitch" / "figure.py")], check=True)
sys.path.insert(0, str(RADICE / "pitch"))
import libretto  # noqa: E402

libretto.main()

testo = TESTA
for nome, fronti, dorso in (("PERSONE", fronti_per, dorso_per), ("AMBITI", fronti_amb + fronti_amb, dorso_amb)):
    fogli = (len(fronti) + 8) // 9
    for i in range(0, len(fronti), 9):
        testo += foglio_carte(nome, fronti[i:i + 9], dorso, i // 9 + 1, fogli)
testo += foglio_riassunti()
testo += fogli_libretto()
testo += "\\end{document}\n"

NOME = "collocamento_pnp"
(STAMPA / f"{NOME}.tex").write_text(testo, encoding="utf-8")
for _ in range(2):  # due passate: le pagine usano le coordinate della pagina
    esito = subprocess.run(["pdflatex", "-interaction=nonstopmode", "-halt-on-error", f"{NOME}.tex"],
                           cwd=STAMPA, capture_output=True, text=True, errors="replace")
    if esito.returncode:
        raise SystemExit(f"pdflatex non è riuscito:\n{esito.stdout[-2000:]}")
for avanzo in ("aux", "log"):
    (STAMPA / f"{NOME}.{avanzo}").unlink(missing_ok=True)
for vecchio in STAMPA.glob("collocamento_pnp_dorsi_*"):
    vecchio.unlink()
pdf = STAMPA / f"{NOME}.pdf"
print(f"grafica/stampa/{NOME}.pdf: {len(fitz.open(pdf))} pagine, {pdf.stat().st_size / 1e6:.0f} MB")


# ---------------------------------------------------------------- i file di taglio
# Convenzioni dell'archivio laser-designs: mm, viewBox = foglio A4 con l'origine in alto a sinistra,
# gruppo CUT = taglio (rosso), gruppo MARK = crocini (verde), da passare a tools/svg_to_lbrn2.py.
def rettangolo(x, su):
    r = R_ANGOLI
    return (f"M {x + r:.2f} {su:.2f} H {x + W - r:.2f} A {r} {r} 0 0 1 {x + W:.2f} {su + r:.2f} V {su + H - r:.2f} "
            f"A {r} {r} 0 0 1 {x + W - r:.2f} {su + H:.2f} H {x + r:.2f} A {r} {r} 0 0 1 {x:.2f} {su + H - r:.2f} "
            f"V {su + r:.2f} A {r} {r} 0 0 1 {x + r:.2f} {su:.2f} Z")


def cerchio(cx, cy, r):
    return f"M {cx - r:.2f} {cy:.2f} A {r} {r} 0 1 0 {cx + r:.2f} {cy:.2f} A {r} {r} 0 1 0 {cx - r:.2f} {cy:.2f} Z"


def svg(tagli):
    segni = [cerchio(cx, cy, R_CROCINO) for cx, cy in CROCINI]
    segni += [f"M {cx - BRACCIO} {cy} H {cx + BRACCIO} M {cx} {cy - BRACCIO} V {cy + BRACCIO}" for cx, cy in CROCINI]
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">\n'
            '  <rect id="A4_riferimento" x="0" y="0" width="210" height="297" fill="none" stroke="#00AA00" stroke-width="0.1" stroke-dasharray="2 2"/>\n'
            '  <g id="MARK" fill="none" stroke="#00AA00" stroke-width="0.2">\n'
            + "".join(f'    <path d="{d}"/>\n' for d in segni)
            + '  </g>\n  <g id="CUT" fill="none" stroke="#FF0000" stroke-width="0.2">\n'
            + "".join(f'    <path d="{d}"/>\n' for d in tagli)
            + '  </g>\n</svg>\n')


(TAGLIO / "collocamento_carte_taglio.svg").write_text(svg([rettangolo(*posto(k)) for k in range(9)]), encoding="utf-8")
(TAGLIO / "collocamento_riassunti_taglio.svg").write_text(
    svg([rettangolo(*posto(k)) for k in range(4)] + [cerchio(cx, cy, R_TOKEN) for cx, cy in TOKEN]), encoding="utf-8")
print("grafica/stampa/taglio: collocamento_carte_taglio.svg (fogli 1-14), collocamento_riassunti_taglio.svg (foglio 15)")
