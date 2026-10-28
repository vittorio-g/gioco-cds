"""
Il print and play di Collocamento: un PDF solo, da stampare in una volta, A4 fronte e retro
sul lato lungo, e da tagliare al laser.

    py -3 grafica/pnp.py

Scrive grafica/stampa/collocamento_pnp.pdf (36 pagine, 18 fogli) e i file di taglio in
grafica/stampa/taglio/. Le immagini che servono le prepara in grafica/stampa/pnp_img/.

- Fogli 1-7: i 60 Lavoratori, col nome del potere nel piede (grafica/dati/poteri.json,
  assegnazione in grafica/poteri.py).
- Fogli 8-14: i 60 Ambiti, cioè due copie di ognuno dei 30.
- Foglio 15: 4 carte riassunto (da un lato il turno, dall'altro punti e poteri) e 4 token,
  stampati sui due lati.
- Fogli 16-18: il regolamento A5 (pitch/regolamento_a5.pdf), due pagine per facciata,
  da piegare a metà.

Per il laser: ogni carta ha 2 mm di abbondanza per lato (anche i dorsi), le carte di un foglio
stanno a 4 mm l'una dall'altra e agli angoli del foglio ci sono quattro crocini di registro
(cerchio da 5 mm e croce), stampati su tutte e due le facciate. Griglia e crocini sono
simmetrici, quindi il file di taglio delle carte vale col fronte o col retro in alto; quello
delle carte riassunto si usa col fronte in alto. I dorsi sono già specchiati per il lato lungo.

Il libretto: in ogni facciata due pagine A5 ruotate. Sul fronte ruotano in senso orario, sul
retro in senso antiorario: col fronte e retro sul lato lungo è come stampare un libretto sul
lato corto, e piegando i fogli a metà le pagine vanno in ordine.

Servono le carte a piena misura in grafica/carte_v2/ e i dorsi in grafica/dorsi_proposte/
(da Drive), Pillow, NumPy, PyMuPDF e pdflatex con TikZ.
"""
import subprocess
import sys
from pathlib import Path

import fitz
import numpy as np
from PIL import Image, ImageDraw, ImageFont

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent
sys.path.insert(0, str(QUI))
import poteri  # noqa: E402

CARTE = QUI / "carte_v2"
STAMPA = QUI / "stampa"
IMG = STAMPA / "pnp_img"
TAGLIO = STAMPA / "taglio"
for d in (IMG, TAGLIO):
    d.mkdir(parents=True, exist_ok=True)
DORSI = "B"  # la proposta di dorsi scelta da Vittorio il 28/10/2026 (grafica/dorsi_proposte)
REGOLAMENTO = RADICE / "pitch" / "regolamento_a5.pdf"

PETROLIO = (23, 71, 77)
MAGENTA = (213, 56, 131)

# ---------------------------------------------------------------- la geometria del foglio, in mm
W, H = 63, 88  # una carta
ABB = 2  # abbondanza per lato
PASSO_X, PASSO_Y = W + 2 * ABB, H + 2 * ABB
X0 = (210 - (3 * W + 4 * ABB)) / 2  # 6.5: il bordo di taglio della prima colonna
Y0 = (297 - (3 * H + 4 * ABB)) / 2  # 12.5: il bordo di taglio della prima riga, dall'alto
R_ANGOLI = 3
CROCINI = [(14, 6.5), (196, 6.5), (14, 290.5), (196, 290.5)]  # (x, y dall'alto)
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


def carattere(nome, punti):
    for f in (nome, f"C:/Windows/Fonts/{nome}", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(f, punti)
        except OSError:
            continue
    raise SystemExit(f"non trovo il carattere {nome}")


NOMI, CHI = poteri.nomi(), poteri.assegnazione()
lavoratori = sorted(CHI)
ambiti = [f"{i:02d}" for i in range(1, 31)]
scritta = carattere("arialbd.ttf", 18)

fronti_lav = []
for n in lavoratori:
    img = Image.open(CARTE / "lavoratori" / f"{n}.png").convert("RGB")
    # il potere nel piede, a destra, alla stessa altezza di "COLLOCAMENTO"
    ImageDraw.Draw(img).text((721, 1008), NOMI[CHI[n]]["nome"].upper(), font=scritta, fill=MAGENTA, anchor="rs")
    fronti_lav.append(salva(con_abbondanza(img, "edge"), f"lav_{n}"))
fronti_amb = [salva(con_abbondanza(Image.open(CARTE / "ambiti" / f"{n}.png"), "edge"), f"amb_{n}") for n in ambiti]
dorso_lav = salva(con_abbondanza(Image.open(QUI / "dorsi_proposte" / f"{DORSI}_persone.png"), "reflect"), "dorso_lav")
dorso_amb = salva(con_abbondanza(Image.open(QUI / "dorsi_proposte" / f"{DORSI}_ambiti.png"), "reflect"), "dorso_amb")
for vecchia in IMG.glob("*.jpg"):  # le immagini delle versioni precedenti
    if f"pnp_img/{vecchia.name}" not in fronti_lav + fronti_amb + [dorso_lav, dorso_amb]:
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


def apri(intestazione):
    return (r"\noindent\begin{tikzpicture}[remember picture,overlay,x=1mm,y=1mm,shift={(current page.south west)}]" + "\n"
            + rf"\node[font=\fontsize{{6}}{{7}}\selectfont,text=petrolio] at (105,{y(4)}) {{{intestazione}}};" + "\n")


def crocini():
    righe = []
    for cx, cy in CROCINI:
        righe.append(rf"\draw[black,line width=.25mm] ({cx},{y(cy)}) circle (2.5) ({cx - 3.5},{y(cy)}) -- ({cx + 3.5},{y(cy)}) ({cx},{y(cy) - 3.5}) -- ({cx},{y(cy) + 3.5});")
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


# ---- le carte riassunto e i token
def riassunto(x, su, titolo, corpo):
    """Una carta riassunto disegnata, con l'abbondanza: fascia petrolio a sinistra."""
    x0, y0 = x - ABB, y(su + H + ABB)
    return rf"""
  \fill[carta] ({x0},{y0}) rectangle ({x0 + W + 2 * ABB},{y0 + H + 2 * ABB});
  \fill[petrolio] ({x0},{y0}) rectangle ({x + 8},{y0 + H + 2 * ABB});
  \fill[rosa] ({x + 8},{y0}) rectangle ({x + 8.5},{y0 + H + 2 * ABB});
  \node[rotate=90,text=carta,font=\fontsize{{5.5}}{{6}}\selectfont] at ({x + 4},{y(su) - H / 2}) {{RIASSUNTO · COLLOCAMENTO}};
  \node[anchor=north west,inner sep=0,text width=48mm,font=\fontsize{{8.2}}{{10.6}}\selectfont,align=left,text=petrolio] at ({x + 11.5},{y(su) - 5}) {{{{\fontsize{{11}}{{12}}\selectfont\bfseries {titolo}}}\\[2.4mm]{corpo}}};
"""


def token(cx, cy_su, valore, testo):
    c = y(cy_su)
    return rf"""
  \fill[petrolio] ({cx},{c}) circle ({R_TOKEN + ABB});
  \draw[carta,line width=.8pt] ({cx},{c}) circle ({R_TOKEN - 1.6});
  \node[text=carta,font=\fontsize{{20}}{{20}}\selectfont\bfseries] at ({cx},{c + 2.5}) {{{valore}}};
  \node[text=carta,font=\fontsize{{4.6}}{{5.4}}\selectfont,align=center] at ({cx},{c - 6.6}) {{{testo}}};
"""


TURNO = r"""\textbf{Una sola azione per turno:}\\[1mm]
\textbf{1 Apri} una formazione: un Ambito davanti a te.\\[.7mm]
\textbf{2 Migliora} una formazione: un Ambito sotto una tua pila.\\[.7mm]
\textbf{3 Inserisci} una Persona su una pila che copre le sue 3 ambizioni. Il mercato si ripristina in coda. \textbf{Attivi il suo potere.}\\[.7mm]
\textbf{4 Completa} un set: un Ambito come Lavoro su una pila con una Persona; la pila copre le 3 icone del Lavoro. Punti, token, formazioni negli scarti.\\[.7mm]
\textbf{5 Pesca} 2 Ambiti; la Persona in fila da più tempo va in fondo al mazzo e ne entra una nuova.\\[1.4mm]
Fine turno: al massimo 6 carte in mano."""

PUNTI = (r"""\textbf{Ambizioni che combaciano col Lavoro}\\
nessuna 5 · una 7 · due 10 · tre 16\\[1.6mm]
\textbf{Poteri}, quando inserisci la Persona:\\[.4mm]
""" + "\\\\[.4mm]\n".join(rf"\textbf{{{p['nome']}}}: {p['breve']}" for _, p in sorted(NOMI.items())) + r"""\\[1.6mm]
\textbf{Token}: 3 set della stessa categoria 5 / 3; 4 categorie diverse 5 / 3.\\[1.6mm]
\textbf{Fine}: al primo quinto set si chiude il giro, poi un giro in più.""")


def foglio_riassunti():
    fronte = apri(r"CARTE RIASSUNTO E TOKEN · FRONTE") + crocini()
    retro = apri(r"CARTE RIASSUNTO E TOKEN · RETRO") + crocini()
    for k in range(4):
        fronte += riassunto(*posto(k), "IL TURNO", TURNO)
        retro += riassunto(*posto(k, specchio=True), "PUNTI E POTERI", PUNTI)
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
        testo += apri(rf"REGOLAMENTO · FOGLIO {s + 1} DI {n // 4} · FRONTE")
        testo += rf"\node[inner sep=0] at (105,{y(74.25)}) {{\includegraphics[page={sinistra},angle=-90]{{{file}}}}};" + "\n"
        testo += rf"\node[inner sep=0] at (105,{y(222.75)}) {{\includegraphics[page={destra},angle=-90]{{{file}}}}};" + "\n"
        testo += rf"\draw[black!50,line width=.2mm] (0,{y(148.5)}) -- (3,{y(148.5)}) (207,{y(148.5)}) -- (210,{y(148.5)});" + "\n"
        testo += chiudi()
        sinistra, destra = 2 * s + 2, n - 2 * s - 1  # retro, visto in orizzontale
        testo += apri(rf"REGOLAMENTO · FOGLIO {s + 1} DI {n // 4} · RETRO")
        testo += rf"\node[inner sep=0] at (105,{y(74.25)}) {{\includegraphics[page={destra},angle=90]{{{file}}}}};" + "\n"
        testo += rf"\node[inner sep=0] at (105,{y(222.75)}) {{\includegraphics[page={sinistra},angle=90]{{{file}}}}};" + "\n"
        testo += chiudi()
    return testo


# ---------------------------------------------------------------- il regolamento A5, se manca o è vecchio
sorgente = RADICE / "pitch" / "regolamento_a5.tex"
if not REGOLAMENTO.exists() or REGOLAMENTO.stat().st_mtime < sorgente.stat().st_mtime:
    for _ in range(2):
        esito = subprocess.run(["pdflatex", "-interaction=nonstopmode", "-halt-on-error", "regolamento_a5.tex"],
                               cwd=RADICE / "pitch", capture_output=True, text=True, errors="replace")
        if esito.returncode:
            raise SystemExit(f"pdflatex non è riuscito sul regolamento A5:\n{esito.stdout[-2000:]}")

testo = TESTA
for nome, fronti, dorso in (("LAVORATORI", fronti_lav, dorso_lav), ("AMBITI", fronti_amb + fronti_amb, dorso_amb)):
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
    segni = [cerchio(cx, cy, 2.5) for cx, cy in CROCINI]
    segni += [f"M {cx - 3.5} {cy} H {cx + 3.5} M {cx} {cy - 3.5} V {cy + 3.5}" for cx, cy in CROCINI]
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
