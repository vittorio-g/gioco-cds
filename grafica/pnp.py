"""
Il print and play di Collocamento: un PDF solo, da stampare in una volta, A4 fronte e retro
sul lato lungo, e da tagliare al laser.

    py -3 grafica/pnp.py          # le due versioni
    py -3 grafica/pnp.py B        # una sola

Per il playtest a confronto di novembre 2026 ci sono due versioni: A con le carte evento, B senza.
Scrive grafica/stampa/collocamento_pnp_A_con_eventi.pdf (38 pagine, 19 fogli) e
collocamento_pnp_B_senza_eventi.pdf (36 pagine, 18 fogli), e i file di taglio in grafica/stampa/taglio/.
Le immagini che servono le prepara in grafica/stampa/pnp_img/.

- Fogli 1-7: le 60 Persone, col potere scritto sulla carta (grafica/dati/poteri.json,
  assegnazione in grafica/poteri.py). Uguali nelle due versioni.
- Fogli 8-14: i 60 Ambiti, cioè due copie di ognuno dei 30. Uguali nelle due versioni.
- Versione A, foglio 15: le carte evento 1-9 (grafica/dati/eventi.json). Foglio 16: 4 carte
  riassunto (da un lato il turno, dall'altro punti e poteri) e le carte evento 10-12; restano vuoti
  gli ultimi due posti, in basso al centro e a destra.
- Versione B, foglio 15: le 4 carte riassunto della B, negli stessi posti; il resto del foglio è bianco.
- Poi due fogli: il regolamento della versione in libretto formato carta (pitch/regolamento_carta_A.pdf o
  _B.pdf, pagine 63 x 88 mm), per metterlo nella scatola (dal 10/11/2026; prima un foglio A4 da piegare a
  fisarmonica, prima ancora un libretto A5). Su ogni facciata quattro coppie di pagine affiancate, ruotate,
  con 2 mm di abbondanza e i crocini sul fronte: tagliate, piegate a metà e infilate una nell'altra fanno il
  libretto, da pinzare nel dorso. Non si plastifica. Lo rifà ogni volta pitch/libretto.py (HTML stampato da
  Edge), dopo pitch/figure.py per le immagini. Fuori dal print and play rifà anche il libretto A5 di 12
  pagine, più comodo da consultare (Vittorio, 10/11/2026): grafica/stampa/collocamento_regolamento_a5_A.pdf
  e _B.pdf, con lo stesso testo.
- Ultimo foglio: la scatola della versione (grafica/scatola.py), A4 orizzontale, solo fronte, col retro
  bianco. Non si plastifica: si incolla su due cartoncini e si taglia al laser (lavoro 11).

Carte riassunto, regolamento e intestazioni dei fogli che cambiano dicono la versione, perché i
materiali dei due tavoli non si mescolino. I token obiettivo non ci sono più dal playtest di novembre.

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

Il libretto: ogni coppia di pagine (un foglio del libretto, 126 x 88 mm) sta in verticale, con la piega
in orizzontale; sul fronte le pagine ruotano in senso orario, sul retro in senso antiorario, nella colonna
specchiata: col fronte e retro sul lato lungo dietro ogni pagina c'è quella che la segue nel libretto.

Servono le illustrazioni in grafica/illustrazioni/, le carte dei designer in grafica/carte_v2/
(per i disegni degli Ambiti) e i dorsi in grafica/dorsi_proposte/, tutto da Drive; Pillow, NumPy,
OpenCV, PyMuPDF, pdflatex con TikZ e Microsoft Edge (per il regolamento).
"""
import io
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
import scatola  # noqa: E402
import segni_laser  # noqa: E402

CARTE = QUI / "carte_v3"
STAMPA = QUI / "stampa"
IMG = STAMPA / "pnp_img"
TAGLIO = STAMPA / "taglio"
for d in (IMG, TAGLIO):
    d.mkdir(parents=True, exist_ok=True)
DORSI = "B"  # la proposta di dorsi scelta da Vittorio il 28/10/2026 (grafica/dorsi_proposte)

# ---------------------------------------------------------------- la geometria del foglio, in mm
W, H = 63, 88  # una carta
ABB = 2  # abbondanza per lato
PASSO_X, PASSO_Y = W + 2 * ABB, H + 2 * ABB
X0 = (210 - (3 * W + 4 * ABB)) / 2  # 6.5: il bordo di taglio della prima colonna
Y0 = (297 - (3 * H + 4 * ABB)) / 2  # 12.5: il bordo di taglio della prima riga, dall'alto
R_ANGOLI = 3
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
VERSIONI = carte_nuove.VERSIONI  # le due versioni del playtest a confronto: A con eventi, B senza
if not (CARTE / "riassunto_retro_B.png").exists():
    carte_nuove.mazzo(carte_nuove.STILE)
persone = sorted(carte_nuove.PERSONE)
ambiti = sorted(carte_nuove.AMBITI)
fronti_per = [salva(Image.open(CARTE / "persone" / f"{n}.png"), f"per_{n}") for n in persone]
fronti_amb = [salva(Image.open(CARTE / "ambiti" / f"{n}.png"), f"amb_{n}") for n in ambiti]
riassunti = {v: tuple(salva(Image.open(CARTE / f"riassunto_{lato}_{v}.png"), f"riassunto_{lato}_{v}")
                      for lato in ("fronte", "retro")) for v in VERSIONI}
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
# il dorso degli Ambiti sono i Timbri (scelti da Vittorio il 10/11/2026): la fascia come Persone ed Eventi e le sei
# icone come timbri d'ufficio, nell'ordine delle carte (grafica/genera_dorsi_ambiti.mjs, proposta grafica_timbri)
dorso_amb = salva(con_abbondanza(Image.open(QUI / "dorsi_proposte" / "ambiti_grafica_timbri.png"), "reflect"), "dorso_amb")
for vecchia in IMG.glob("*.jpg"):  # le immagini delle versioni precedenti
    if f"pnp_img/{vecchia.name}" not in (fronti_per + fronti_amb + fronti_evt + [dorso_per, dorso_amb, dorso_evt]
                                         + [f for coppia in riassunti.values() for f in coppia]):
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
\definecolor{cartalibretto}{HTML}{F5EFE3}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\begin{document}
"""


def y(su):
    """Da "mm dall'alto" alle coordinate TikZ (mm dal basso)."""
    return 297 - su


def apri(intestazione=None):
    """Una facciata; l'intestazione sta tra i marker, lontana dal bordo che la stampante può tagliare."""
    testo = r"\noindent\begin{tikzpicture}[remember picture,overlay,x=1mm,y=1mm,shift={(current page.south west)}]" + "\n"
    if intestazione:
        testo += rf"\node[font=\fontsize{{6}}{{7}}\selectfont,text=petrolio] at (105,{y(7.5)}) {{{intestazione}}};" + "\n"
    return testo


def segni(lavoro):
    """I tre marker ArUco del lavoro, dalla pagina SVG di aira laser: per ogni marker il riquadro bianco e i
    quadretti neri pieni, senza tratto, alle stesse coordinate in mm della pagina."""
    righe = []
    for (x, su, lw, lh), quadretti in segni_laser.marker(lavoro):
        righe.append(rf"\fill[white] ({x:.4f},{y(su):.4f}) rectangle ({x + lw:.4f},{y(su + lh):.4f});")
        for qx, qy, qw, qh in quadretti:
            righe.append(rf"\fill[black] ({qx:.4f},{y(qy):.4f}) rectangle ({qx + qw:.4f},{y(qy + qh):.4f});")
    return "\n".join(righe) + "\n"


def chiudi():
    return "\\end{tikzpicture}\n\\newpage\n"


def immagine(file, x, su):
    """Una carta con l'abbondanza: x, su = l'angolo in alto a sinistra della linea di taglio."""
    return rf"\node[anchor=north west,inner sep=0] at ({x - ABB},{y(su - ABB)}) {{\includegraphics[width={W + 2 * ABB}mm,height={H + 2 * ABB}mm]{{{file}}}}};" + "\n"


def pdf_semplice(sorgente, destino, dpi=400):
    """Lo stesso PDF con ogni pagina fatta di una sola immagine JPEG semplice (RGB, baseline, senza profilo):
    i PDF di Edge hanno caratteri Type3, trasparenze e JPEG progressivi, che la stampante di Vittorio non legge
    («dati non supportati», 10/11/2026)."""
    src, out = fitz.open(sorgente), fitz.open()
    for p in src:
        pix = p.get_pixmap(dpi=dpi, alpha=False)
        buf = io.BytesIO()
        Image.frombytes("RGB", (pix.width, pix.height), pix.samples).save(buf, "JPEG", quality=92, optimize=True)
        nuova = out.new_page(width=p.rect.width, height=p.rect.height)
        xref = nuova.insert_image(nuova.rect, stream=buf.getvalue())
        out.xref_set_key(xref, "ColorSpace", "/DeviceRGB")
    out.set_metadata(src.metadata)
    out.save(destino, garbage=3, deflate=True)


def foglio_carte(nome, carte, lavoro):
    """Un foglio di carte, fronte e retro: carte = [(fronte, dorso), ...] nei posti da 0 a 8.
    I marker del laser vanno solo sul fronte, dopo le carte, così niente ci finisce sopra."""
    fronte = apri(rf"{nome} · FRONTE")
    retro = apri(rf"{nome} · RETRO")
    for k, (f, dorso) in enumerate(carte):
        fronte += immagine(f, *posto(k))
        retro += immagine(dorso, *posto(k, specchio=True))
    return fronte + segni(lavoro) + chiudi() + retro + chiudi()


# ---- il regolamento: libretto formato carta, quattro fogli del libretto (coppie di pagine) per facciata A4
PAG_W, PAG_H = 63, 88   # una pagina del libretto, come una carta
LIB_X0 = (210 - 2 * (PAG_H + 2 * ABB)) / 2   # 13: il bordo dell'abbondanza della prima colonna
LIB_Y0 = (297 - 2 * (2 * PAG_W + 2 * ABB)) / 2   # 18.5: il bordo dell'abbondanza della prima riga


def posto_libretto(k, specchio=False):
    """Il rettangolo di taglio (x, su, larghezza, altezza) del k-esimo foglio del libretto sulla facciata:
    in verticale, 88 x 126 mm, con la piega in orizzontale a metà. Sul retro la colonna è specchiata."""
    c, r = k % 2, k // 2
    if specchio:
        c = 1 - c
    x = LIB_X0 + ABB + c * (PAG_H + 2 * ABB)
    su = LIB_Y0 + ABB + r * (2 * PAG_W + 2 * ABB)
    return x, su, PAG_H, 2 * PAG_W


def fogli_libretto(regolamento):
    """Il libretto pinzato: n pagine (multiplo di 4) in n/4 fogli piegati, il primo è il più esterno.
    Foglio k: sul fronte le pagine n-2k (sopra) e 2k+1 (sotto), ruotate in senso orario; sul retro, nella colonna
    specchiata, n-2k-1 (sopra) e 2k+2 (sotto), ruotate in senso antiorario. Copertina e retro sono petrolio:
    l'abbondanza del foglio esterno, sul fronte, è petrolio anche lei."""
    doc = fitz.open(regolamento)
    n = len(doc)
    if n % 4:
        raise SystemExit(f"il libretto ha {n} pagine: servono multipli di 4")
    fogli = n // 4

    def immagine_pagina(pagina, angolo):
        """La pagina del libretto come JPEG semplice (RGB, baseline, a 500 dpi), già ruotata. Il PDF di Edge ha
        caratteri Type3, trasparenze e JPEG progressivi: la stampante di Vittorio si è fermata lì (10/11/2026)."""
        pix = doc[pagina - 1].get_pixmap(dpi=500, alpha=False)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples).rotate(angolo, expand=True)
        nome = f"pnp_img/{regolamento.stem}_{pagina:02d}.jpg"
        img.save(STAMPA / nome, quality=92, optimize=True)
        return nome
    testo = ""
    for facciata in range((fogli + 3) // 4):
        da = range(facciata * 4, min(fogli, facciata * 4 + 4))
        for lato in ("fronte", "retro"):
            testo += apri()  # niente intestazione: finirebbe sul margine del foglio
            for k in da:
                x, su, w, h = posto_libretto(k % 4, specchio=lato == "retro")
                colore = "petrolio" if (k == 0 and lato == "fronte") else "cartalibretto"
                testo += (rf"\fill[{colore}] ({x - ABB},{y(su - ABB)}) rectangle ({x + w + ABB},{y(su + h + ABB)});"
                          + "\n")
                if lato == "fronte":
                    sopra, sotto, angolo = n - 2 * k, 2 * k + 1, -90
                else:
                    sopra, sotto, angolo = n - 2 * k - 1, 2 * k + 2, 90
                for pagina, centro in ((sopra, su + PAG_W / 2), (sotto, su + PAG_W * 1.5)):
                    testo += (rf"\node[inner sep=0] at ({x + w / 2},{y(centro)}) "
                              rf"{{\includegraphics[width={PAG_H}mm,height={PAG_W}mm]{{{immagine_pagina(pagina, angolo)}}}}};"
                              + "\n")
            if lato == "fronte":  # i crocini, fuori dall'abbondanza, solo sul fronte
                xs = sorted({v for k in da for v in (posto_libretto(k % 4)[0], posto_libretto(k % 4)[0] + PAG_H)})
                ys = sorted({v for k in da for v in (posto_libretto(k % 4)[1], posto_libretto(k % 4)[1] + 2 * PAG_W)})
                for v in xs:
                    testo += rf"\draw[black,line width=0.15mm] ({v},{y(ys[0] - ABB - 7)}) -- ({v},{y(ys[0] - ABB - 1.5)});" + "\n"
                    testo += rf"\draw[black,line width=0.15mm] ({v},{y(ys[-1] + ABB + 1.5)}) -- ({v},{y(ys[-1] + ABB + 7)});" + "\n"
                for v in ys:
                    testo += rf"\draw[black,line width=0.15mm] ({xs[0] - ABB - 7},{y(v)}) -- ({xs[0] - ABB - 1.5},{y(v)});" + "\n"
                    testo += rf"\draw[black,line width=0.15mm] ({xs[-1] + ABB + 1.5},{y(v)}) -- ({xs[-1] + ABB + 7},{y(v)});" + "\n"
            testo += chiudi()
    return testo


# ---------------------------------------------------------------- le due versioni, col regolamento sempre rifatto
subprocess.run([sys.executable, str(RADICE / "pitch" / "figure.py")], check=True)
sys.path.insert(0, str(RADICE / "pitch"))
import libretto  # noqa: E402

# i file di prima delle due versioni
for vecchio in [STAMPA / f"collocamento_pnp.{e}" for e in ("pdf", "tex")] + [STAMPA / "collocamento_regolamento_a4.pdf",
                                                                             RADICE / "pitch" / "regolamento_a5.pdf"]:
    vecchio.unlink(missing_ok=True)

for versione in [v.upper() for v in sys.argv[1:]] or list(VERSIONI):
    regolamento = libretto.main(versione)
    # il libretto A5, da consultare: si tiene allineato al libretto formato carta (stesse regole, stessi segnaposto)
    pdf_semplice(libretto.main(versione, formato="a5"), STAMPA / f"collocamento_regolamento_a5_{versione}.pdf")
    testo = TESTA
    for nome, fronti, dorso in (("PERSONE", fronti_per, dorso_per), ("AMBITI", fronti_amb + fronti_amb, dorso_amb)):
        fogli = (len(fronti) + 8) // 9
        for i in range(0, len(fronti), 9):
            testo += foglio_carte(rf"{nome} · FOGLIO {i // 9 + 1} DI {fogli}", [(f, dorso) for f in fronti[i:i + 9]],
                                  LAVORO_9)
    fronte, retro = riassunti[versione]
    if versione == "A":
        testo += foglio_carte("EVENTI 1-9 · VERSIONE A", [(f, dorso_evt) for f in fronti_evt[:9]], LAVORO_9)
        # il foglio da 7: le 4 carte riassunto (stampate sui due lati) e gli eventi 10-12; gli ultimi due posti vuoti
        misto = [(fronte, retro)] * 4 + [(f, dorso_evt) for f in fronti_evt[9:]]
        testo += foglio_carte("CARTE RIASSUNTO ED EVENTI 10-12 · VERSIONE A", misto, LAVORO_7)
    else:
        # senza eventi restano le 4 carte riassunto, negli stessi posti del foglio da 7 (lavoro 5): il laser taglia
        # anche i tre posti degli eventi, che restano bianchi
        testo += foglio_carte("CARTE RIASSUNTO · VERSIONE B", [(fronte, retro)] * 4, LAVORO_7)
    testo += fogli_libretto(regolamento)
    testo += "\\end{document}\n"

    NOME = f"collocamento_pnp_{versione}_{VERSIONI[versione].replace(' ', '_')}"
    (STAMPA / f"{NOME}.tex").write_text(testo, encoding="utf-8")
    for _ in range(2):  # due passate: le pagine usano le coordinate della pagina
        esito = subprocess.run(["pdflatex", "-interaction=nonstopmode", "-halt-on-error", f"{NOME}.tex"],
                               cwd=STAMPA, capture_output=True, text=True, errors="replace")
        if esito.returncode:
            raise SystemExit(f"pdflatex non è riuscito:\n{esito.stdout[-2000:]}")
    for avanzo in ("aux", "log"):
        (STAMPA / f"{NOME}.{avanzo}").unlink(missing_ok=True)
    pdf = STAMPA / f"{NOME}.pdf"
    print(f"grafica/stampa/{NOME}.pdf: {len(fitz.open(pdf))} pagine, {pdf.stat().st_size / 1e6:.0f} MB")

    # il solo regolamento, da stampare a parte: sono gli ultimi fogli del print and play, già imposti
    tutto = fitz.open(pdf)
    facciate = 2 * ((len(fitz.open(regolamento)) // 4 + 3) // 4)  # i fogli A4 del libretto, fronte e retro
    solo = fitz.open()
    solo.insert_pdf(tutto, from_page=len(tutto) - facciate, to_page=len(tutto) - 1)
    solo.set_metadata({"title": f"Collocamento - Regolamento, versione {versione}, libretto formato carta su A4"})
    solo.save(STAMPA / f"collocamento_regolamento_a4_{versione}.pdf", garbage=3, deflate=True)
    print(f"grafica/stampa/collocamento_regolamento_a4_{versione}.pdf: {facciate} pagine, {facciate // 2} fogli")

    # in fondo la scatola della versione (grafica/scatola.py): A4 orizzontale, solo fronte, lavoro 11 del laser.
    # Dietro una pagina bianca, perché nella stampa fronte e retro non si sfasi niente
    scatola_pdf = STAMPA / f"collocamento_scatola_{versione}.pdf"
    scatola.pdf(scatola.grafica(versione), scatola_pdf)
    tutto.insert_pdf(fitz.open(scatola_pdf))
    tutto.new_page(width=tutto[-1].rect.width, height=tutto[-1].rect.height)
    completo = pdf.with_suffix(".tmp.pdf")
    tutto.save(completo, garbage=3, deflate=True)
    tutto.close()
    completo.replace(pdf)
    print(f"  + la scatola in fondo: {len(fitz.open(pdf))} pagine, {len(fitz.open(pdf)) // 2} fogli")
for vecchio in STAMPA.glob("collocamento_pnp_dorsi_*"):
    vecchio.unlink()


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
