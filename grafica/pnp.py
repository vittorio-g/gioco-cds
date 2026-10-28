"""
Il print and play di Collocamento: un PDF solo, da stampare fronte e retro su A4.

    py -3 grafica/pnp.py

Scrive grafica/stampa/collocamento_pnp.tex e collocamento_pnp.pdf; le immagini
che servono le prepara in grafica/stampa/pnp_img/. Dentro ci sono:

- pagina 1: come stamparlo; pagina 2 (il suo retro): token e carte riassunto;
- i 60 Lavoratori, col potere scritto in basso a destra (l'assegnazione proposta
  nel documento del pitch: il più utile ai lavoratori più difficili da formare);
- i 60 Ambiti, cioè due copie di ognuno dei 30, col dorso corretto a "60 carte";
- in fondo le quattro pagine di regole di Collocamento prese da pitch/regolamenti.pdf.

Dopo ogni pagina di fronti viene quella dei dorsi, già specchiata per il fronte
e retro sul lato lungo. I dorsi hanno 1,5 mm di colore in più per lato, così un
piccolo disallineamento della stampante non lascia bordi bianchi.

I dorsi sono quelli della proposta B di grafica/dorsi_proposte/ (li fa genera_dorsi.mjs),
scelta da Vittorio. Con un argomento si provano gli altri: A o C per le altre proposte,
CARTE per i dorsi originali; il PDF si chiama allora collocamento_pnp_dorsi_<scelta>.pdf.

Servono le carte a piena misura in grafica/carte_v2/ (da Drive), Pillow, PyMuPDF
e pdflatex con TikZ e pdfpages.
"""
import csv
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent
CARTE = QUI / "carte_v2"
STAMPA = QUI / "stampa"
IMG = STAMPA / "pnp_img"
IMG.mkdir(parents=True, exist_ok=True)
REGOLE = RADICE / "pitch" / "regolamenti.pdf"
PAGINE_REGOLE = "5-8"  # le pagine di Collocamento nel documento del pitch, senza l'apertura

# I dorsi: quelli scelti da Vittorio il 28/10/2026 sono la proposta B. "CARTE" usa i dorsi
# originali delle carte dei designer, A e C le altre due proposte.
DORSI_SCELTI = "B"
PROPOSTA = sys.argv[1].upper() if len(sys.argv) > 1 else DORSI_SCELTI
if PROPOSTA == "CARTE":
    PROPOSTA = None
NOME_PDF = "collocamento_pnp" if PROPOSTA == DORSI_SCELTI else f"collocamento_pnp_dorsi_{PROPOSTA or 'carte'}"
PETROLIO = (23, 71, 77)
CARTA = (243, 236, 221)
NOMI_POTERI = {1: "PESCA", 2: "PRENOTA", 3: "FORMA", 4: "PIAZZA"}


def leggi_csv(nome):
    with open(RADICE / "mazzi" / nome, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def carattere(nome, punti):
    for f in (nome, f"C:/Windows/Fonts/{nome}", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(f, punti)
        except OSError:
            continue
    raise SystemExit(f"non trovo il carattere {nome}")


# ---------------------------------------------------------------------------
# I poteri: 15 per tipo, il più utile ai lavoratori più difficili da formare.
# Difficile = poche coppie di ambiti coprono le sue tre ambizioni. È lo stesso
# conto di strumenti/analisi.mjs (PER_DIFFICOLTA([1, 2, 4, 3])).
# ---------------------------------------------------------------------------
lavoratori = [(r["n"], [r["a1"], r["a2"], r["a3"]]) for r in leggi_csv("lavoratori.csv")]
ambiti = [(r["n"], [r["l1"], r["l2"], r["l3"]]) for r in leggi_csv("ambiti.csv")]


def coppie_che_lo_accolgono(ambizioni):
    serve = Counter(ambizioni)
    n = 0
    for i in range(len(ambiti)):
        for j in range(i, len(ambiti)):
            c = Counter(ambiti[i][1]) + Counter(ambiti[j][1])
            if all(c[s] >= q for s, q in serve.items()):
                n += 1
    return n


dal_piu_difficile = sorted(range(len(lavoratori)), key=lambda i: coppie_che_lo_accolgono(lavoratori[i][1]))
potere = {}
for k, i in enumerate(dal_piu_difficile):
    potere[lavoratori[i][0]] = [1, 2, 4, 3][k // 15]


# ---------------------------------------------------------------------------
# Le immagini
# ---------------------------------------------------------------------------
def salva(img, nome):
    img.convert("RGB").save(IMG / f"{nome}.jpg", quality=88, optimize=True)
    return f"pnp_img/{nome}.jpg"


scritta = carattere("arialbd.ttf", 18)
fronti_lav = []
for n, _ in lavoratori:
    img = Image.open(CARTE / "lavoratori" / f"{n}.png").convert("RGB")
    d = ImageDraw.Draw(img)
    # nel piede, a destra, alla stessa altezza di "COLLOCAMENTO"
    d.text((721, 1008), f"POTERE {potere[n]} · {NOMI_POTERI[potere[n]]}", font=scritta, fill=PETROLIO, anchor="rs")
    fronti_lav.append(salva(img, f"lav_{n}"))
dorso_lav = salva(Image.open(CARTE / "lavoratori" / "dorso.png"), "dorso_lav")

fronti_amb = [salva(Image.open(CARTE / "ambiti" / f"{n}.png"), f"amb_{n}") for n, _ in ambiti]
dorso = Image.open(CARTE / "ambiti" / "dorso.png").convert("RGB")
d = ImageDraw.Draw(dorso)
d.rectangle((150, 634, 606, 670), fill=dorso.getpixel((5, 5)))  # toglie "30 CARTE · 5 CATEGORIE"
testo = "60 CARTE · 5 CATEGORIE"
regolare = carattere("arial.ttf", 23)
larghezze = [regolare.getlength(c) + 0.25 for c in testo]  # lettere appena distanziate, come sull'originale
x = dorso.width / 2 - sum(larghezze) / 2
for lettera, larga in zip(testo, larghezze):
    d.text((x, 639), lettera, font=regolare, fill=CARTA)
    x += larga
dorso_amb = salva(dorso, "dorso_amb")


def senza_angoli_bianchi(img):
    """Alcuni dorsi generati hanno gli angoli arrotondati su fondo bianco: dopo il taglio si vedrebbero.
    Li riempie col colore più comune lungo il bordo."""
    img = img.convert("RGB")
    bordo = [img.getpixel((x, y)) for x in range(0, img.width, 7) for y in (12, img.height - 13)]
    bordo += [img.getpixel((x, y)) for y in range(0, img.height, 7) for x in (12, img.width - 13)]
    pieni = [p for p in bordo if sum(p) < 690]
    fondo = Counter((r // 8 * 8, g // 8 * 8, b // 8 * 8) for r, g, b in pieni).most_common(1)[0][0]
    for angolo in ((0, 0), (img.width - 1, 0), (0, img.height - 1), (img.width - 1, img.height - 1)):
        if sum(img.getpixel(angolo)) > 690:
            ImageDraw.floodfill(img, angolo, fondo, thresh=60)
    return img


if PROPOSTA:
    dorso_lav = salva(senza_angoli_bianchi(Image.open(QUI / "dorsi_proposte" / f"{PROPOSTA}_lavoratori.png")), f"dorso_lav_{PROPOSTA}")
    dorso_amb = salva(senza_angoli_bianchi(Image.open(QUI / "dorsi_proposte" / f"{PROPOSTA}_ambiti.png")), f"dorso_amb_{PROPOSTA}")

# ---------------------------------------------------------------------------
# Il PDF
# ---------------------------------------------------------------------------
LARGA, ALTA, SPAZIO, SINISTRA, SOPRA, ABBONDANZA = 63, 88, 3, 7.5, 13, 1.5

TESTA = r"""\documentclass[10pt]{article}
\usepackage[a4paper,margin=0mm]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[italian]{babel}
\usepackage{tgheros}
\renewcommand{\familydefault}{\sfdefault}
\usepackage{graphicx,xcolor,tikz,pdfpages,enumitem}
\definecolor{petrolio}{HTML}{17474D}
\definecolor{carta}{HTML}{F3ECDD}
\definecolor{rosa}{HTML}{FF3D8B}
\definecolor{dorsolav}{RGB}{%s}
\definecolor{dorsoamb}{RGB}{%s}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{1.6mm}
\setlength{\topskip}{0pt}
\setlength{\unitlength}{1mm}
\setlist{leftmargin=5mm,itemsep=.6mm,topsep=.4mm}
\begin{document}
\color{petrolio}
"""


def colore(img_file):
    r, g, b = Image.open(STAMPA / img_file).convert("RGB").getpixel((3, 3))
    return f"{r},{g},{b}"


def pagina_carte(intestazione, file, dorso=None, colore_dorso=None):
    """Una pagina di nove carte. Coi dorsi le colonne sono specchiate (fronte e retro sul lato lungo)."""
    righe = [r"\noindent\begin{picture}(0,0)", r"\linethickness{0.2pt}",
             rf"\put({SINISTRA},-7){{\fontsize{{7}}{{8}}\selectfont {intestazione}}}"]
    for k, f in enumerate(file):
        colonna, riga = k % 3, k // 3
        if dorso:
            colonna = 2 - colonna
        x = SINISTRA + colonna * (LARGA + SPAZIO)
        y = SOPRA + riga * (ALTA + SPAZIO)
        if dorso:
            righe.append(rf"\put({x - ABBONDANZA},{-(y + ALTA + ABBONDANZA)}){{\color{{{colore_dorso}}}\rule{{{LARGA + 2 * ABBONDANZA}mm}}{{{ALTA + 2 * ABBONDANZA}mm}}}}")
            righe.append(rf"\put({x},{-(y + ALTA)}){{\includegraphics[width={LARGA}mm,height={ALTA}mm]{{{dorso}}}}}")
            continue
        righe.append(rf"\put({x},{-(y + ALTA)}){{\includegraphics[width={LARGA}mm,height={ALTA}mm]{{{f}}}}}")
        for cx, verso_x in ((x, -1), (x + LARGA, 1)):  # segni di taglio ai quattro angoli
            for cy, verso_y in ((y, -1), (y + ALTA, 1)):
                righe.append(rf"\put({cx + 0.5 * verso_x},{-cy}){{\line({verso_x},0){{2}}}}")
                righe.append(rf"\put({cx},{-cy - 0.5 * verso_y}){{\line(0,{-verso_y}){{2}}}}")
    righe += [r"\end{picture}", r"\newpage", ""]
    return "\n".join(righe)


ISTRUZIONI = r"""
\vspace*{16mm}\hspace*{18mm}\begin{minipage}[t]{174mm}\fontsize{10.5}{14.2}\selectfont\setlength{\parskip}{2.4mm}
{\color{rosa}\rule{14mm}{2.8pt}}\par\vspace{1mm}
{\fontsize{24}{27}\selectfont\bfseries COLLOCAMENTO\par}
{\fontsize{12}{15}\selectfont Print and play: le carte, i token e le regole\par}
\vspace{5mm}
\textbf{Come stamparlo.} A4 verticale, a colori, \textbf{fronte e retro sul lato lungo}. Nella finestra di stampa scegliete \textbf{dimensioni effettive} o \textbf{100\%}: non "adatta alla pagina", altrimenti le carte escono più piccole. Le carte misurano 63 x 88 mm, come quelle da gioco.

\textbf{Prima fate una prova.} Stampate solo le pagine 3 e 4 su un foglio e guardatelo controluce: i dorsi rosa devono cadere dietro le carte. Se sono rovesciati sotto sopra, cambiate il lato di rilegatura (lato corto) e riprovate. I dorsi hanno un millimetro e mezzo di colore in più per lato, quindi un piccolo spostamento non si vede.

\textbf{Carta.} Il cartoncino da 160-200 g regge meglio, se la stampante lo prende. Con la carta normale da 80 g conviene infilare ogni carta in una bustina protettiva insieme a una vecchia carta da gioco.

\textbf{Taglio.} Tagliate lungo i segni agli angoli di ogni carta: tra una carta e l'altra ci sono 3 mm da buttare. Taglierina o cutter e righello.

\vspace{2mm}
{\fontsize{13}{16}\selectfont\bfseries Che cosa c'è\par}
\vspace{1mm}
\begin{tabular}{@{}p{30mm}p{140mm}@{}}
Pagine 1-2 & queste istruzioni; sul retro i 4 token obiettivo e 4 carte riassunto (due per tipo), da ritagliare. \\[1mm]
Pagine 3-16 & i 60 \textbf{Lavoratori}, sette fogli, con i dorsi rosa. \\[1mm]
Pagine 17-30 & i 60 \textbf{Ambiti}: due copie di ognuno dei 30, sette fogli, con i dorsi petrolio. \\[1mm]
Pagine 31-34 & le \textbf{regole} di Collocamento, due fogli. \\
\end{tabular}

\vspace{2mm}
In tutto sono 17 fogli.

\vspace{2mm}
{\fontsize{13}{16}\selectfont\bfseries Da sapere\par}
\begin{itemize}
  \item Le regole sono quelle riviste per il pitch: chiuso un set, le formazioni vanno negli scarti; il mercato scorre quando qualcuno pesca; il potere Pesca dà una carta sola.
  \item I poteri non sono stampati sulle carte dei designer: qui sono scritti in basso a destra su ogni Lavoratore (POTERE 1-4). È l'assegnazione proposta, il potere più utile ai lavoratori più difficili da formare.
  \item Sulle carte la fascia dei Lavoratori dice «attitudini»: nelle regole sono le ambizioni.
\end{itemize}
\end{minipage}
\newpage
"""


def carta_riassunto(x, y, titolo, corpo):
    """Una carta riassunto da 63 x 88 mm, in coordinate TikZ (mm, origine in basso a sinistra della pagina)."""
    return rf"""
  \fill[carta,rounded corners=2mm] ({x},{y}) rectangle ({x + 63},{y + 88});
  \fill[petrolio] ({x},{y}) [rounded corners=2mm] -- ({x},{y + 88}) -- ({x + 8},{y + 88}) [sharp corners] -- ({x + 8},{y}) [rounded corners=2mm] -- cycle;
  \draw[petrolio,line width=.4pt,rounded corners=2mm] ({x},{y}) rectangle ({x + 63},{y + 88});
  \node[rotate=90,text=carta,font=\fontsize{{5.5}}{{6}}\selectfont] at ({x + 4},{y + 44}) {{RIASSUNTO · COLLOCAMENTO}};
  \node[anchor=north west,inner sep=0,text width=50mm,font=\fontsize{{7.7}}{{10}}\selectfont,align=left] at ({x + 11},{y + 84}) {{{{\fontsize{{10}}{{11}}\selectfont\bfseries {titolo}}}\\[2mm]{corpo}}};"""


TURNO = r"""\textbf{Una sola azione per turno:}\\[.8mm]
\textbf{1 Apri} una formazione: un Ambito davanti a te.\\[.6mm]
\textbf{2 Migliora} una formazione: un Ambito sotto una tua pila.\\[.6mm]
\textbf{3 Inserisci} un lavoratore su una pila che copre le sue 3 ambizioni. Il mercato si ripristina in coda. \textbf{Attivi il suo potere.}\\[.6mm]
\textbf{4 Completa} un set: un Ambito come Lavoro su una pila con lavoratore; la pila copre le 3 icone del Lavoro. Punti, token, formazioni negli scarti.\\[.6mm]
\textbf{5 Pesca} 2 Ambiti; il lavoratore in fila da più tempo va in fondo al mazzo e ne entra uno nuovo.\\[1.2mm]
Fine turno: al massimo 6 carte in mano."""

PUNTI = r"""\textbf{Ambizioni che combaciano col Lavoro}\\
nessuna 5 · una 7 · due 10 · tre 16\\[1.4mm]
\textbf{Poteri}, quando inserisci il lavoratore:\\
\textbf{1 Pesca} 1 Ambito.\\
\textbf{2 Prenota} un lavoratore del mercato.\\
\textbf{3 Forma}: fino a 2 Ambiti come formazioni.\\
\textbf{4 Piazza} un altro lavoratore ignorando un'ambizione (senza potere).\\[1.4mm]
\textbf{Token}: 3 set della stessa categoria 5 / 3; 4 categorie diverse 5 / 3.\\[1.4mm]
\textbf{Fine}: al quinto set di qualcuno si chiude il giro, poi un giro in più."""


def token(x, y, valore, testo):
    return rf"""
  \fill[petrolio] ({x},{y}) circle (14);
  \draw[carta,line width=.8pt] ({x},{y}) circle (12.6);
  \node[text=carta,font=\fontsize{{20}}{{20}}\selectfont\bfseries] at ({x},{y + 2.5}) {{{valore}}};
  \node[text=carta,font=\fontsize{{4.6}}{{5.4}}\selectfont,align=center] at ({x},{y - 6.6}) {{{testo}}};
  \draw[black!40,line width=.2pt,dash pattern=on .8mm off .8mm] ({x},{y}) circle (14.8);"""


RETRO_ISTRUZIONI = (r"""\noindent\begin{tikzpicture}[remember picture,overlay,x=1mm,y=1mm,shift={(current page.south west)}]
  \node[anchor=north west,font=\fontsize{7}{8}\selectfont,text=petrolio] at (7.5,290) {TOKEN E CARTE RIASSUNTO / da ritagliare};"""
                    + carta_riassunto(7.5, 196, "IL TURNO", TURNO)
                    + carta_riassunto(73.5, 196, "PUNTI E POTERI", PUNTI)
                    + carta_riassunto(139.5, 196, "IL TURNO", TURNO)
                    + carta_riassunto(7.5, 105, "PUNTI E POTERI", PUNTI)
                    + token(95, 167, "5", r"TRE SET\\STESSA CATEGORIA")
                    + token(130, 167, "3", r"TRE SET\\STESSA CATEGORIA")
                    + token(95, 130, "5", r"QUATTRO\\CATEGORIE")
                    + token(130, 130, "3", r"QUATTRO\\CATEGORIE")
                    + r"""
\end{tikzpicture}
\newpage
""")

testo = TESTA % (colore(dorso_lav), colore(dorso_amb)) + ISTRUZIONI + RETRO_ISTRUZIONI
for nome, fronti, retro, colore_dorso in (("LAVORATORI", fronti_lav, dorso_lav, "dorsolav"),
                                         ("AMBITI", fronti_amb + fronti_amb, dorso_amb, "dorsoamb")):
    fogli = (len(fronti) + 8) // 9
    for i in range(0, len(fronti), 9):
        gruppo = fronti[i:i + 9]
        foglio = f"foglio {i // 9 + 1} di {fogli}"
        testo += pagina_carte(rf"{nome} / FRONTE / {foglio} / 63 x 88 mm, stampare al 100\%", gruppo)
        testo += pagina_carte(rf"{nome} / RETRO / {foglio}", gruppo, retro, colore_dorso)
if REGOLE.exists():
    testo += rf"\includepdf[pages={{{PAGINE_REGOLE}}}]{{{REGOLE.as_posix()}}}" + "\n"
else:
    print(f"attenzione: manca {REGOLE}, il PDF esce senza le regole (rifarlo con pdflatex in pitch/)")
testo += "\\end{document}\n"

if PROPOSTA and PROPOSTA != DORSI_SCELTI:
    testo = testo.replace("i dorsi rosa devono", f"i dorsi (proposta {PROPOSTA}) devono").replace("con i dorsi rosa", "col dorso dei Lavoratori").replace("con i dorsi petrolio", "col dorso degli Ambiti")
(STAMPA / f"{NOME_PDF}.tex").write_text(testo, encoding="utf-8")
for _ in range(2):  # due passate: la pagina dei token usa le coordinate della pagina
    esito = subprocess.run(["pdflatex", "-interaction=nonstopmode", "-halt-on-error", f"{NOME_PDF}.tex"],
                           cwd=STAMPA, capture_output=True, text=True, errors="replace")
    if esito.returncode:
        raise SystemExit(f"pdflatex non è riuscito:\n{esito.stdout[-2000:]}")
for avanzo in ("aux", "log"):
    (STAMPA / f"{NOME_PDF}.{avanzo}").unlink(missing_ok=True)
pdf = STAMPA / f"{NOME_PDF}.pdf"
print(f"grafica/stampa/{NOME_PDF}.pdf: {len(fitz.open(pdf))} pagine, {pdf.stat().st_size / 1e6:.0f} MB")
print("poteri:", {p: sorted(n for n, q in potere.items() if q == p) for p in (1, 2, 3, 4)})
