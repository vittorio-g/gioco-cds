"""
Il print and play di Collocamento: un PDF solo, da stampare in una volta, A4 fronte e retro
sul lato lungo, e da tagliare al laser.

    py -3 grafica/pnp.py

Scrive grafica/stampa/collocamento_pnp.pdf (38 pagine, 19 fogli) e i file di taglio in
grafica/stampa/taglio/. Le immagini che servono le prepara in grafica/stampa/pnp_img/.

- Fogli 1-7: le 60 Persone, col potere scritto sulla carta (grafica/dati/poteri.json,
  assegnazione in grafica/poteri.py).
- Fogli 8-14: i 60 Ambiti, cioè due copie di ognuno dei 30.
- Foglio 15: le carte evento 1-9 (grafica/dati/eventi.json).
- Foglio 16: 4 carte riassunto (da un lato il turno, dall'altro punti e poteri) e le carte evento
  10-12; restano vuoti gli ultimi due posti, in basso al centro e a destra. I token obiettivo non ci
  sono più dal playtest di novembre 2026.
- Fogli 17-19: il regolamento A5 (pitch/regolamento_a5.pdf), due pagine per facciata,
  da piegare a metà. Lo rifà ogni volta pitch/libretto.py (HTML stampato da Edge), dopo
  pitch/figure.py per le immagini.

Le carte sono quelle di grafica/carte_nuove.py nello stile scelto (STILE, la proposta B): un solo
colore di fondo, abbondanza compresa, così uno scarto del taglio non si vede. Se grafica/carte_v3/
manca, lo script le rifà.

Per il laser (aira laser, sessione LASER, 5/11/2026): ogni carta ha 2 mm di abbondanza per lato (anche i
dorsi) e le carte di un foglio stanno a 4 mm l'una dall'altra. Il laser trova il foglio con la
telecamera leggendo tre marker ArUco da 5 mm, stampati solo sul FRONTE dei fogli di carte: i file
di laser-designs (designs/fogli-stampati/segni, commit 36d72a5) sono copiati in grafica/stampa/segni/,
lavoro 4 per i fogli da 9 carte e lavoro 5 per quello da 7. Sul retro niente segni: il taglio si
allinea al fronte, e un errore del fronte e retro cade sui dorsi, dove c'è l'abbondanza. I dorsi
sono già specchiati per il lato lungo.

Il libretto: in ogni facciata due pagine A5 ruotate. Sul fronte ruotano in senso orario, sul
retro in senso antiorario: col fronte e retro sul lato lungo è come stampare un libretto sul
lato corto, e piegando i fogli a metà le pagine vanno in ordine.

Servono le illustrazioni in grafica/illustrazioni/, le carte dei designer in grafica/carte_v2/
(per i disegni degli Ambiti) e i dorsi in grafica/dorsi_proposte/, tutto da Drive; Pillow, NumPy,
OpenCV, PyMuPDF, pdflatex con TikZ e Microsoft Edge (per il libretto).
"""
import re
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
SEGNI = STAMPA / "segni"  # le pagine coi marker di aira laser: lavoro_04_segni.svg, lavoro_05_segni.svg
LAVORO_9, LAVORO_7 = 4, 5  # i lavori di aira laser: fogli da 9 carte e foglio da 7 (riassunti ed eventi)


def posto(k, specchio=False):
    """L'angolo in alto a sinistra (x, y dall'alto) della carta k di un foglio, sul fronte o sul retro."""
    riga, colonna = divmod(k, 3)
    if specchio:
        colonna = 2 - colonna
    return X0 + colonna * PASSO_X, Y0 + riga * PASSO_Y


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
fronti_evt = [salva(Image.open(CARTE / "eventi" / f"{n}.png"), f"evt_{n}") for n in sorted(carte_nuove.EVENTI)]
# il dorso degli eventi: quello illustrato se c'è (grafica/genera_dorso_eventi.mjs), se no la prima pagina di
# giornale di grafica/dorso_eventi.py
DORSO_EVT = next((f for f in (QUI / "dorsi_proposte" / "eventi.png", QUI / "dorsi_proposte" / "eventi_giornale.png")
                  if f.exists()), None)
if DORSO_EVT is None:
    subprocess.run([sys.executable, str(QUI / "dorso_eventi.py")], check=True)
    DORSO_EVT = QUI / "dorsi_proposte" / "eventi_giornale.png"
dorso_evt = salva(con_abbondanza(Image.open(DORSO_EVT), "reflect"), "dorso_evt")
dorso_per = salva(con_abbondanza(Image.open(QUI / "dorsi_proposte" / f"{DORSI}_persone.png"), "reflect"), "dorso_per")
# il dorso degli Ambiti è la Ruota (scelta da Vittorio il 5/11/2026): giocata coperta, la carta vale un ambito
# a scelta; grafica/dorso_ruota.py ne mette le icone nell'ordine delle carte
if not (QUI / "dorsi_proposte" / "ambiti_ruota_ordinata.png").exists():
    subprocess.run([sys.executable, str(QUI / "dorso_ruota.py")], check=True)
dorso_amb = salva(con_abbondanza(Image.open(QUI / "dorsi_proposte" / "ambiti_ruota_ordinata.png"), "reflect"), "dorso_amb")
for vecchia in IMG.glob("*.jpg"):  # le immagini delle versioni precedenti
    if f"pnp_img/{vecchia.name}" not in (fronti_per + fronti_amb + fronti_evt
                                         + [dorso_per, dorso_amb, dorso_evt, riassunto_fronte, riassunto_retro]):
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


def segni(lavoro):
    """I tre marker ArUco del lavoro, dalla pagina SVG di aira laser: per ogni marker il riquadro bianco e i
    quadretti neri pieni, senza tratto, alle stesse coordinate in mm della pagina."""
    testo = (SEGNI / f"lavoro_{lavoro:02d}_segni.svg").read_text(encoding="utf-8")
    marker = re.findall(r'<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="[\d.]+" fill="#fff"/>'
                        r'<path d="([^"]+)" fill="#000"/>', testo)
    if len(marker) != 3:
        raise SystemExit(f"lavoro_{lavoro:02d}_segni.svg: mi aspettavo tre marker, ne ho trovati {len(marker)}")
    righe = []
    for x, su, lato, nero in marker:
        x, su, lato = float(x), float(su), float(lato)
        righe.append(rf"\fill[white] ({x:.4f},{y(su):.4f}) rectangle ({x + lato:.4f},{y(su + lato):.4f});")
        for qx, qy, qw, qh in re.findall(r"M([\d.]+) ([\d.]+)h([\d.]+)v([\d.]+)h-[\d.]+z", nero):
            qx, qy, qw, qh = map(float, (qx, qy, qw, qh))
            righe.append(rf"\fill[black] ({qx:.4f},{y(qy):.4f}) rectangle ({qx + qw:.4f},{y(qy + qh):.4f});")
    return "\n".join(righe) + "\n"


def chiudi():
    return "\\end{tikzpicture}\n\\newpage\n"


def immagine(file, x, su):
    """Una carta con l'abbondanza: x, su = l'angolo in alto a sinistra della linea di taglio."""
    return rf"\node[anchor=north west,inner sep=0] at ({x - ABB},{y(su - ABB)}) {{\includegraphics[width={W + 2 * ABB}mm,height={H + 2 * ABB}mm]{{{file}}}}};" + "\n"


def foglio_carte(nome, carte, lavoro):
    """Un foglio di carte, fronte e retro: carte = [(fronte, dorso), ...] nei posti da 0 a 8.
    I marker del laser vanno solo sul fronte, dopo le carte, così niente ci finisce sopra."""
    fronte = apri(rf"{nome} · FRONTE")
    retro = apri(rf"{nome} · RETRO")
    for k, (f, dorso) in enumerate(carte):
        fronte += immagine(f, *posto(k))
        retro += immagine(dorso, *posto(k, specchio=True))
    return fronte + segni(lavoro) + chiudi() + retro + chiudi()


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
        testo += foglio_carte(rf"{nome} · FOGLIO {i // 9 + 1} DI {fogli}", [(f, dorso) for f in fronti[i:i + 9]], LAVORO_9)
testo += foglio_carte("EVENTI 1-9", [(f, dorso_evt) for f in fronti_evt[:9]], LAVORO_9)
# il foglio da 7: le 4 carte riassunto (stampate sui due lati) e gli eventi 10-12; gli ultimi due posti restano vuoti
misto = [(riassunto_fronte, riassunto_retro)] * 4 + [(f, dorso_evt) for f in fronti_evt[9:]]
testo += foglio_carte("CARTE RIASSUNTO ED EVENTI 10-12", misto, LAVORO_7)
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

# il solo regolamento, da stampare a parte: sono gli ultimi fogli del print and play, già imposti
tutto = fitz.open(pdf)
facciate = len(fitz.open(REGOLAMENTO)) // 2
solo = fitz.open()
solo.insert_pdf(tutto, from_page=len(tutto) - facciate, to_page=len(tutto) - 1)
solo.set_metadata({"title": "Collocamento - Regolamento, libretto A5 su A4 fronte e retro"})
solo.save(STAMPA / "collocamento_regolamento_a4.pdf", garbage=3, deflate=True)
print(f"grafica/stampa/collocamento_regolamento_a4.pdf: {facciate} pagine, {facciate // 2} fogli")


# ---------------------------------------------------------------- i file di taglio
# Come vuole aira laser (laser-designs, designs/fogli-stampati/README.md): A4 210 x 297 in mm, coordinate del
# fronte stampato, solo il gruppo CUT coi contorni (rosso #c62828, 0,2). Niente gruppo MARK: per il laser vuol
# dire incisione. La sessione LASER li copia in fogli-stampati come lavoro_04_taglio.svg e lavoro_05_taglio.svg.
def svg_taglio(lavoro, posti, cosa):
    righe = [f'<rect x="{x:.3f}" y="{su:.3f}" width="{W:.3f}" height="{H:.3f}" rx="{R_ANGOLI:.3f}" fill="none" '
             f'stroke="#c62828" stroke-width="0.2"/>' for x, su in (posto(k) for k in posti)]
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">\n'
            f'<!-- lavoro {lavoro}: Collocamento, {cosa}. Coordinate del foglio A4 (fronte); aira laser lo porta '
            'sulla macchina dai marker. Scritto da gioco-cds/grafica/pnp.py. -->\n'
            '<g id="CUT">\n' + "\n".join(righe) + "\n</g>\n</svg>\n")


(TAGLIO / "collocamento_riassunti_taglio.svg").unlink(missing_ok=True)  # il foglio di prima, coi token
(TAGLIO / "collocamento_carte_taglio.svg").write_text(
    svg_taglio(LAVORO_9, range(9), "fogli da 9 carte 63 x 88 (Persone, Ambiti, eventi 1-9)"), encoding="utf-8")
(TAGLIO / "collocamento_riassunti_eventi_taglio.svg").write_text(
    svg_taglio(LAVORO_7, range(7), "foglio da 7 carte, 4 riassunto ed eventi 10-12; vuoti gli ultimi due posti"),
    encoding="utf-8")
print("grafica/stampa/taglio: collocamento_carte_taglio.svg (lavoro 4, fogli 1-15), "
      "collocamento_riassunti_eventi_taglio.svg (lavoro 5, foglio 16)")
