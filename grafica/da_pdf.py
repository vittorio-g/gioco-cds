"""Dai due PDF della grafica (lavoratori_A4.pdf e ambiti_A4.pdf) ricava tutto
quello che serve al progetto:

- grafica/carte_v2/lavoratori/  e  grafica/carte_v2/ambiti/
      le carte a piena misura (PNG 756 x 1056), una per file, più dorso.png
- grafica/stampa/          i PDF da stampare, 9 carte per pagina, fronte e retro
- webapp/public/carte/     le carte leggere per il tavolo online (WebP 378 x 528) e indice.json
- webapp/public/icone/     le icone, ritagliate dalle carte, con lo sfondo trasparente
- webapp/public/tts/       i fogli di carte che Tabletop Simulator scarica
- tts/Collocamento.json    il salvataggio per Tabletop Simulator

Le icone di ogni carta devono essere quelle di mazzi/lavoratori.csv e
mazzi/ambiti.csv. Dove sulla carta del PDF ce n'è un'altra, la ridisegna:
copia icona e sigla da una carta dello stesso mazzo che ha già quel simbolo.
Così i simboli si cambiano dai mazzi, senza rifare i PDF.

Uso:    py -3 grafica/da_pdf.py [cartella con i due PDF]      (se manca: grafica/pdf)
Serve:  py -3 -m pip install pymupdf pillow, e pdflatex per i PDF da stampare
"""
import collections
import csv
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else QUI / "pdf"
CARTE = QUI / "carte_v2"
STAMPA = QUI / "stampa"
PUBBLICA = RADICE / "webapp" / "public"
# Tabletop Simulator scarica i fogli da qui: è il tavolo online, che li serve come file qualsiasi.
SITO = os.environ.get("COLLOCAMENTO_SITO", "https://collocamento.cortivo81.workers.dev")

# Il colore di fondo di ogni icona, così come esce dai PDF.
COLORI = {
    "MA": (216, 90, 36), "DI": (40, 120, 200), "CO": (213, 56, 131), "OR": (210, 165, 27), "CL": (50, 147, 77),
    "AN": (109, 86, 179), "CR": (190, 61, 54), "CD": (21, 159, 163), "RI": (117, 81, 62), "ST": (48, 59, 112),
}
NOMI_SIMBOLI = {
    "MA": "Manualità", "DI": "Digitale", "CO": "Comunicazione", "OR": "Organizzazione", "CL": "Collaborazione",
    "AN": "Analisi", "CR": "Creatività", "CD": "Coordinamento", "RI": "Ricerca", "ST": "Strategia",
}
# Dove stanno le tre icone su una carta da 756 x 1056: una ogni 150 punti, dall'alto.
PASSO = 150


def leggi_csv(nome):
    with open(RADICE / "mazzi" / nome, encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ---------------------------------------------------------------------------
# 1. Dalle pagine alle carte
# ---------------------------------------------------------------------------
def estrai(nome):
    """Le immagini delle carte, nell'ordine in cui sono stampate, e il dorso."""
    doc = fitz.open(PDF / f"{nome}_A4.pdf")
    fronti, dorso = [], None
    for pagina in doc:
        fronte = "FRONTE" in pagina.get_text()
        pezzi = []
        for im in pagina.get_images(full=True):
            for r in pagina.get_image_rects(im[0]):
                pezzi.append((round(r.y0 / 20), r.x0, im[0]))  # per righe, da sinistra
        for _, _, xref in sorted(pezzi):
            img = Image.open(io.BytesIO(doc.extract_image(xref)["image"])).convert("RGB")
            if fronte:
                fronti.append(img)
            elif dorso is None:
                dorso = img
    return fronti, dorso


def colore_icona(img, posto):
    """Il colore più diffuso nel riquadro dell'icona, tolti il bianco del disegno e i grigi."""
    dati = img.crop((35, 50 + PASSO * posto, 105, 125 + PASSO * posto)).tobytes()
    pixel = [tuple(dati[i:i + 3]) for i in range(0, len(dati), 3)]
    vivi = [p for p in pixel if max(p) - min(p) > 40]
    gruppo = collections.Counter((r // 16, g // 16, b // 16) for r, g, b in vivi).most_common(1)[0][0]
    scelti = [p for p in vivi if (p[0] // 16, p[1] // 16, p[2] // 16) == gruppo]
    return tuple(sum(c) / len(scelti) for c in zip(*scelti))


def icone_di(img):
    sigle = []
    for posto in range(3):
        c = colore_icona(img, posto)
        distanza, sigla = min((sum((a - b) ** 2 for a, b in zip(c, v)) ** 0.5, k) for k, v in COLORI.items())
        if distanza > 25:
            raise SystemExit(f"icona di colore sconosciuto {tuple(round(x) for x in c)}: i PDF hanno cambiato colori?")
        sigle.append(sigla)
    return sigle


# Un'icona con la sua sigla sta in una fascia alta 150 punti della colonna di
# sinistra, su fondo piatto: si può copiare tale e quale da una carta all'altra.
def fascia(posto):
    return (0, 22 + PASSO * posto, 138, 172 + PASSO * posto)


def scrivi_attitudini(dorso, quante):
    """Sul dorso dei lavoratori c'è scritto quante sono le attitudini: riscrive quella riga."""
    for nome in ("arial.ttf", "Arial.ttf", "LiberationSans-Regular.ttf", "DejaVuSans.ttf"):
        try:
            carattere = ImageFont.truetype(nome, 23)
            break
        except OSError:
            continue
    else:
        raise SystemExit("non trovo un carattere senza grazie per riscrivere il dorso dei lavoratori")
    disegno = ImageDraw.Draw(dorso)
    disegno.rectangle((150, 634, 606, 670), fill=dorso.getpixel((5, 5)))
    testo = f"60 CARTE · {quante} ATTITUDINI"
    larghezze = [carattere.getlength(c) + 0.25 for c in testo]  # lettere appena distanziate, come nell'originale
    x = dorso.width / 2 - sum(larghezze) / 2
    for lettera, larga in zip(testo, larghezze):
        disegno.text((x, 639), lettera, font=carattere, fill=(243, 236, 221))
        x += larga


lavoratori = json.loads((QUI / "dati" / "lavoratori.json").read_text(encoding="utf-8"))
dati_ambiti = json.loads((QUI / "dati" / "ambiti_v4.json").read_text(encoding="utf-8"))
ambiti = dati_ambiti["ambiti"]
attitudini = {r["n"]: [r["a1"], r["a2"], r["a3"]] for r in leggi_csv("lavoratori.csv")}
mazzo_ambiti = {r["n"]: {"terna": [r["l1"], r["l2"], r["l3"]], "cat": r["cat"]} for r in leggi_csv("ambiti.csv")}
# I simboli in uso, nell'ordine di COLORI.
IN_USO = [s for s in COLORI if any(s in t for t in attitudini.values()) or any(s in a["terna"] for a in mazzo_ambiti.values())]

immagini = {}
ridisegnate = 0
for nome, attese, simboli in (("lavoratori", lavoratori, attitudini), ("ambiti", ambiti, {n: a["terna"] for n, a in mazzo_ambiti.items()})):
    fronti, dorso = estrai(nome)
    if len(fronti) != len(attese) or dorso is None:
        raise SystemExit(f"{nome}_A4.pdf: {len(fronti)} carte, ne aspettavo {len(attese)}")
    stampate = [icone_di(img) for img in fronti]
    # per ogni simbolo, una fascia da cui copiarlo: presa prima di toccare le carte
    modelli = {}
    for img, lette in zip(fronti, stampate):
        for posto, sigla in enumerate(lette):
            modelli.setdefault(sigla, img.crop(fascia(posto)))
    cartella = CARTE / nome
    shutil.rmtree(cartella, ignore_errors=True)
    cartella.mkdir(parents=True)
    for carta, img, lette in zip(attese, fronti, stampate):
        volute = simboli[carta["n"]]
        for posto, (stampata, voluta) in enumerate(zip(lette, volute)):
            if stampata == voluta:
                continue
            if voluta not in modelli:
                raise SystemExit(f"{nome}: nei PDF nessuna carta ha il simbolo {voluta}, non so come disegnarlo")
            img.paste(modelli[voluta], fascia(posto)[:2])
        if lette != volute:
            ridisegnate += 1
            if icone_di(img) != volute:
                raise SystemExit(f"{nome} {carta['n']} ({carta['nome']}): le icone ridisegnate non sono {' '.join(volute)}")
        img.save(cartella / f"{carta['n']}.png", optimize=True)
    # Il dorso: se in grafica/dati ce n'è uno già pronto si usa quello, altrimenti
    # quello del PDF, con il numero delle attitudini corretto.
    pronto = QUI / "dati" / f"dorso_{nome}.png"
    if pronto.exists():
        dorso = Image.open(pronto).convert("RGB")
    elif nome == "lavoratori":
        scrivi_attitudini(dorso, len(IN_USO))
    dorso.save(cartella / "dorso.png", optimize=True)
    immagini[nome] = (fronti, dorso)
print(f"carte_v2: {len(immagini['lavoratori'][0])} lavoratori e {len(immagini['ambiti'][0])} ambiti;",
      f"{ridisegnate} carte con le icone ridisegnate secondo i mazzi ({' '.join(IN_USO)})")

# ---------------------------------------------------------------------------
# 2. Carte leggere e indice per il tavolo online
# ---------------------------------------------------------------------------
WEB = PUBBLICA / "carte"
shutil.rmtree(WEB, ignore_errors=True)


def leggera(img, dove):
    dove.parent.mkdir(parents=True, exist_ok=True)
    img.resize((378, 528), Image.LANCZOS).save(dove, quality=84, method=6)


for nome, attese in (("lavoratori", lavoratori), ("ambiti", ambiti)):
    fronti, dorso = immagini[nome]
    for carta, img in zip(attese, fronti):
        leggera(img, WEB / nome / f"{carta['n']}.webp")
    leggera(dorso, WEB / f"dorso_{nome}.webp")

indice = {
    "lavoratori": {l["n"]: {"file": f"lavoratori/{l['n']}.webp", "nome": l["nome"], "battuta": l["battuta"],
                            "attitudini": attitudini[l["n"]]} for l in lavoratori},
    "ambiti": {a["n"]: {"file": f"ambiti/{a['n']}.webp", "nome": a["nome"], "battuta": a["battuta"],
                        "terna": mazzo_ambiti[a["n"]]["terna"], "categoria": mazzo_ambiti[a["n"]]["cat"]} for a in ambiti},
    "categorie": dati_ambiti["categorie"],
    "simboli": {s: NOMI_SIMBOLI[s] for s in IN_USO},
    "dorsi": {"lavoratori": "dorso_lavoratori.webp", "ambiti": "dorso_ambiti.webp"},
}
# La legenda disegnata dei simboli, se c'è: il tavolo la mostra nell'aiuto.
if (QUI / "dati" / "legenda.png").exists():
    Image.open(QUI / "dati" / "legenda.png").convert("RGB").save(WEB / "legenda.webp", quality=88, method=6)
    indice["legenda"] = "legenda.webp"
(WEB / "indice.json").write_text(json.dumps(indice, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
peso = sum(p.stat().st_size for p in WEB.glob("**/*.webp")) / 1e6
print(f"webapp/public/carte: {len(list(WEB.glob('**/*.webp')))} immagini leggere ({peso:.1f} MB) e indice.json")

# ---------------------------------------------------------------------------
# 3. Le dieci icone, ritagliate da una carta dei lavoratori
# ---------------------------------------------------------------------------
ICONE = PUBBLICA / "icone"
shutil.rmtree(ICONE, ignore_errors=True)
ICONE.mkdir(parents=True)
SEGNO = (1, 254, 3)  # un colore che sulle carte non c'è: marca lo sfondo da togliere


def ritaglia_icona(img, posto):
    pezzo = img.crop((10, 26 + PASSO * posto, 130, 144 + PASSO * posto))
    fondo = pezzo.getpixel((0, 0))
    marcata = pezzo.copy()
    for angolo in ((0, 0), (pezzo.width - 1, 0), (0, pezzo.height - 1), (pezzo.width - 1, pezzo.height - 1)):
        ImageDraw.floodfill(marcata, angolo, SEGNO, thresh=28)
    esito = pezzo.convert("RGBA")
    px, segni = esito.load(), marcata.load()
    for y in range(pezzo.height):
        for x in range(pezzo.width):
            if segni[x, y] == SEGNO:
                px[x, y] = (0, 0, 0, 0)
                continue
            # il bordo dell'icona sfuma nello sfondo: più somiglia allo sfondo, più è trasparente
            sul_bordo = any(0 <= x + dx < pezzo.width and 0 <= y + dy < pezzo.height and segni[x + dx, y + dy] == SEGNO
                            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if sul_bordo:
                r, g, b, _ = px[x, y]
                lontano = sum((a - f) ** 2 for a, f in zip((r, g, b), fondo)) ** 0.5
                px[x, y] = (r, g, b, round(255 * min(1, lontano / 90)))
    # quadrata, con l'icona al centro
    esito = esito.crop(esito.getbbox())
    lato = max(esito.size) + 4
    tela = Image.new("RGBA", (lato, lato), (0, 0, 0, 0))
    tela.paste(esito, ((lato - esito.width) // 2, (lato - esito.height) // 2))
    return tela


for sigla in IN_USO:
    n, posto = next((l["n"], attitudini[l["n"]].index(sigla)) for l in lavoratori if sigla in attitudini[l["n"]])
    ritaglia_icona(immagini["lavoratori"][0][int(n) - 1], posto).save(ICONE / f"{sigla}.png", optimize=True)
print(f"webapp/public/icone: {len(IN_USO)} icone")

# ---------------------------------------------------------------------------
# 4. Tabletop Simulator: fogli di carte e salvataggio
# ---------------------------------------------------------------------------
# Un foglio è una griglia di carte in un'immagine sola. 5 x 3 carte a piena
# misura fanno 3780 x 3168 punti: sotto i 4096 che ogni scheda video regge.
COLONNE, RIGHE = 5, 3
FOGLI = PUBBLICA / "tts"
shutil.rmtree(FOGLI, ignore_errors=True)
FOGLI.mkdir(parents=True)


def pubblica(img, nome):
    """Salva l'immagine col suo riassunto nel nome: se la grafica cambia, cambia
    l'indirizzo, e Tabletop Simulator non ripesca la versione vecchia dalla sua memoria."""
    dati = io.BytesIO()
    img.save(dati, "JPEG", quality=86, optimize=True)
    file = f"{nome}.{hashlib.sha1(dati.getvalue()).hexdigest()[:8]}.jpg"
    (FOGLI / file).write_bytes(dati.getvalue())
    return f"{SITO}/tts/{file}"


def fogli(nome):
    fronti, dorso = immagini[nome]
    retro = pubblica(dorso, f"{nome}_dorso")
    per_foglio = COLONNE * RIGHE
    esito = []
    for i in range(0, len(fronti), per_foglio):
        tela = Image.new("RGB", (COLONNE * 756, RIGHE * 1056), (243, 236, 221))
        for k, img in enumerate(fronti[i:i + per_foglio]):
            tela.paste(img, ((k % COLONNE) * 756, (k // COLONNE) * 1056))
        esito.append({"FaceURL": pubblica(tela, f"{nome}_{i // per_foglio + 1}"), "BackURL": retro,
                      "NumWidth": COLONNE, "NumHeight": RIGHE, "BackIsHidden": True, "UniqueBack": False, "Type": 0})
    return esito


def posa(x, y, z, ry=180.0, rz=0.0, scala=(1.0, 1.0, 1.0)):
    return {"posX": x, "posY": y, "posZ": z, "rotX": 0.0, "rotY": ry, "rotZ": rz,
            "scaleX": scala[0], "scaleY": scala[1], "scaleZ": scala[2]}


def oggetto(tipo, dove, guid, **altro):
    return {
        "GUID": guid, "Name": tipo, "Transform": dove, "Nickname": "", "Description": "", "GMNotes": "",
        "ColorDiffuse": {"r": 0.713235259, "g": 0.713235259, "b": 0.713235259},
        "Locked": False, "Grid": True, "Snap": True, "IgnoreFoW": False, "MeasureMovement": False,
        "DragSelectable": True, "Autoraise": True, "Sticky": True, "Tooltip": True, "GridProjection": False,
        "HideWhenFaceDown": True, "Hands": False, "LuaScript": "", "LuaScriptState": "", "XmlUI": "",
        **altro,
    }


guid = (f"{n:06x}" for n in range(0xC0110C, 0xFFFFFF))


def mazzo_tts(titolo, nota, x, chiave0, fogli_mazzo, carte):
    """Un mazzo coperto. carte = [(nome, descrizione, appunti)] nell'ordine dei fogli."""
    custom = {str(chiave0 + i): f for i, f in enumerate(fogli_mazzo)}
    dove = posa(x, 2.0, 0.0, rz=180.0)
    dentro, numeri = [], []
    for k, (nome, descrizione, appunti) in enumerate(carte):
        chiave = chiave0 + k // (COLONNE * RIGHE)
        numero = chiave * 100 + k % (COLONNE * RIGHE)
        numeri.append(numero)
        dentro.append(oggetto("Card", dove, next(guid), Nickname=nome, Description=descrizione, GMNotes=appunti,
                              Hands=True, CardID=numero, SidewaysCard=False, CustomDeck={str(chiave): custom[str(chiave)]}))
    return oggetto("Deck", dove, next(guid), Nickname=titolo, Description=nota, SidewaysCard=False,
                   DeckIDs=numeri, CustomDeck=custom, ContainedObjects=dentro)


# Le mani attorno al tavolo: i posti di serie del tavolo "RPG" di Tabletop Simulator.
MANI = {
    "White": (15.2, -20.14, 0), "Red": (-15.11, -20.11, 0), "Green": (-15.19, 19.79, 180), "Blue": (15.47, 19.84, 180),
    "Yellow": (-30.22, 10.18, 90), "Orange": (-30.25, -8.82, 90), "Purple": (30.25, 9.59, 270), "Pink": (30.1, -8.45, 270),
}
mani = [oggetto("HandTrigger", posa(x, 4.845371, z, ry=float(ry), scala=(11.77, 9.174497, 4.87)), next(guid),
                Locked=True, Grid=False, HideWhenFaceDown=False, FogColor=colore,
                ColorDiffuse={"r": 1.0, "g": 1.0, "b": 1.0, "a": 0.0})
        for colore, (x, z, ry) in MANI.items()]

categorie = dati_ambiti["categorie"]
carte_lav = [(l["nome"], f"{' '.join(attitudini[l['n']])}\n{l['battuta']}", f"lavoratore {l['n']}") for l in lavoratori]
carte_amb = [(a["nome"], f"{' '.join(mazzo_ambiti[a['n']]['terna'])}\n{categorie[mazzo_ambiti[a['n']]['cat']]}\n{a['battuta']}",
              f"ambito {a['n']}") for a in ambiti]

salvataggio = {
    "SaveName": "Collocamento",
    "GameMode": "Collocamento",
    "Date": "",
    "VersionNumber": "v13.2.2",
    "Gravity": 0.5,
    "PlayArea": 0.5,
    "GameType": "Game",
    "GameComplexity": "",
    "PlayerCounts": [2, 5],
    "Tags": [],
    "Table": "Table_RPG",
    "Sky": "Sky_Museum",
    "Note": "",
    "Rules": "",
    "TabStates": {"0": {"title": "Collocamento", "color": "Grey", "visibleColor": {"r": 0.5, "g": 0.5, "b": 0.5}, "id": 0,
                        "body": "Due mazzi: 60 lavoratori (dorso rosa) e 30 ambiti (dorso petrolio). Mescolali prima di cominciare.\n"
                                "Regole: https://github.com/vittorio-g/gioco-cds/blob/main/REGOLAMENTO.md"}},
    "Grid": {"Type": 0, "Lines": False, "Color": {"r": 0.0, "g": 0.0, "b": 0.0}, "Opacity": 0.75, "ThickLines": False,
             "Snapping": False, "Offset": False, "BothSnapping": False, "xSize": 2.0, "ySize": 2.0,
             "PosOffset": {"x": 0.0, "y": 1.0, "z": 0.0}},
    "Lighting": {"LightIntensity": 0.54, "LightColor": {"r": 1.0, "g": 0.9804, "b": 0.8902}, "AmbientIntensity": 1.3,
                 "AmbientType": 0, "AmbientSkyColor": {"r": 0.5, "g": 0.5, "b": 0.5},
                 "AmbientEquatorColor": {"r": 0.5, "g": 0.5, "b": 0.5}, "AmbientGroundColor": {"r": 0.5, "g": 0.5, "b": 0.5},
                 "ReflectionIntensity": 1.0, "LutIndex": 0, "LutContribution": 1.0},
    "Hands": {"Enable": True, "DisableUnused": False, "Hiding": 0},
    "Turns": {"Enable": False, "Type": 0, "TurnOrder": [], "Reverse": False, "SkipEmpty": False,
              "DisableInteractions": False, "PassTurns": True, "TurnColor": ""},
    "DecalPallet": [],
    "LuaScript": "",
    "LuaScriptState": "",
    "XmlUI": "",
    "ObjectStates": [
        *mani,
        mazzo_tts("Lavoratori", "60 carte", -3.0, 11, fogli("lavoratori"), carte_lav),
        mazzo_tts("Ambiti", "30 carte, 5 categorie", 3.0, 21, fogli("ambiti"), carte_amb),
    ],
}
(RADICE / "tts").mkdir(exist_ok=True)
(RADICE / "tts" / "Collocamento.json").write_text(json.dumps(salvataggio, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
peso = sum(p.stat().st_size for p in FOGLI.glob("*.jpg")) / 1e6
print(f"webapp/public/tts: {len(list(FOGLI.glob('*.jpg')))} immagini ({peso:.1f} MB); tts/Collocamento.json scritto")

# ---------------------------------------------------------------------------
# 5. I PDF da stampare
# ---------------------------------------------------------------------------
# A4, nove carte da 63 x 88 mm per pagina con 3 mm tra una e l'altra e i segni
# di taglio. Dopo ogni pagina di fronti viene quella dei dorsi: stampando
# fronte e retro (lato lungo) i dorsi cadono dietro le carte.
LARGA, ALTA, SPAZIO, SINISTRA, SOPRA = 63, 88, 3, 7.5, 13

TESTA = r"""\documentclass{article}
\usepackage[a4paper,margin=0mm]{geometry}
\usepackage{graphicx}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\topskip}{0pt}
\setlength{\unitlength}{1mm}
\begin{document}
"""


def pagina(intestazione, file):
    """Una pagina: le carte in griglia, da sinistra a destra e dall'alto in basso."""
    righe = [r"\noindent\begin{picture}(0,0)", r"\linethickness{0.2pt}",
             rf"\put({SINISTRA},-7){{\sffamily\fontsize{{7}}{{8}}\selectfont {intestazione}}}"]
    for k, f in enumerate(file):
        x = SINISTRA + (k % 3) * (LARGA + SPAZIO)
        y = SOPRA + (k // 3) * (ALTA + SPAZIO)
        righe.append(rf"\put({x},{-(y + ALTA)}){{\includegraphics[width={LARGA}mm,height={ALTA}mm]{{{f}}}}}")
        for cx, verso_x in ((x, -1), (x + LARGA, 1)):  # segni di taglio ai quattro angoli
            for cy, verso_y in ((y, -1), (y + ALTA, 1)):
                righe.append(rf"\put({cx + 0.5 * verso_x},{-cy}){{\line({verso_x},0){{2}}}}")
                righe.append(rf"\put({cx},{-cy - 0.5 * verso_y}){{\line(0,{-verso_y}){{2}}}}")
    righe += [r"\end{picture}", r"\newpage", ""]
    return "\n".join(righe)


STAMPA.mkdir(exist_ok=True)
for nome, attese in (("lavoratori", lavoratori), ("ambiti", ambiti)):
    testo = TESTA
    for i in range(0, len(attese), 9):
        fronti = [f"../carte_v2/{nome}/{c['n']}.png" for c in attese[i:i + 9]]
        testo += pagina(rf"{nome.upper()} / FRONTE / {LARGA} x {ALTA} mm / stampare al 100\%", fronti)
        testo += pagina(rf"{nome.upper()} / RETRO / {LARGA} x {ALTA} mm / stampare al 100\%", [f"../carte_v2/{nome}/dorso.png"] * len(fronti))
    testo += "\\end{document}\n"
    (STAMPA / f"{nome}_A4.tex").write_text(testo, encoding="utf-8")
    esito = subprocess.run(["pdflatex", "-interaction=nonstopmode", "-halt-on-error", f"{nome}_A4.tex"],
                           cwd=STAMPA, capture_output=True, text=True, errors="replace")
    if esito.returncode:
        raise SystemExit(f"pdflatex non è riuscito su {nome}_A4.tex:\n{esito.stdout[-1500:]}")
    for avanzo in ("aux", "log"):
        (STAMPA / f"{nome}_A4.{avanzo}").unlink(missing_ok=True)
    pagine = len(fitz.open(STAMPA / f"{nome}_A4.pdf"))
    print(f"grafica/stampa/{nome}_A4.pdf: {pagine} pagine ({(STAMPA / f'{nome}_A4.pdf').stat().st_size / 1e6:.0f} MB)")
