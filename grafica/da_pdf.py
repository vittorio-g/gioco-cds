"""Dai due PDF di stampa della grafica (lavoratori_A4.pdf e ambiti_A4.pdf)
ricava tutto quello che serve al progetto:

- grafica/carte_v2/lavoratori/  e  grafica/carte_v2/ambiti/
      le carte a piena misura (PNG 756 x 1056), una per file, più dorso.png
- webapp/public/carte/     le carte leggere per il tavolo online (WebP 378 x 528) e indice.json
- webapp/public/icone/     le dieci icone, ritagliate dalle carte, con lo sfondo trasparente
- webapp/public/tts/       i fogli di carte che Tabletop Simulator scarica
- tts/Collocamento.json    il salvataggio per Tabletop Simulator

Controlla anche che le icone stampate su ogni carta siano quelle di mazzi/*.csv:
se una carta non torna si ferma e dice quale.

Uso:    py -3 grafica/da_pdf.py [cartella con i due PDF]      (se manca: grafica/pdf)
Serve:  py -3 -m pip install pymupdf pillow
"""
import collections
import csv
import hashlib
import io
import json
import os
import shutil
import sys
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageDraw

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else QUI / "pdf"
CARTE = QUI / "carte_v2"
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


lavoratori = json.loads((QUI / "dati" / "lavoratori.json").read_text(encoding="utf-8"))
dati_ambiti = json.loads((QUI / "dati" / "ambiti_v4.json").read_text(encoding="utf-8"))
ambiti = dati_ambiti["ambiti"]
attitudini = {r["n"]: [r["a1"], r["a2"], r["a3"]] for r in leggi_csv("lavoratori.csv")}
mazzo_ambiti = {r["n"]: {"terna": [r["l1"], r["l2"], r["l3"]], "cat": r["cat"]} for r in leggi_csv("ambiti_v4.csv")}

immagini = {}
for nome, attese, simboli in (("lavoratori", lavoratori, attitudini), ("ambiti", ambiti, {n: a["terna"] for n, a in mazzo_ambiti.items()})):
    fronti, dorso = estrai(nome)
    if len(fronti) != len(attese) or dorso is None:
        raise SystemExit(f"{nome}_A4.pdf: {len(fronti)} carte, ne aspettavo {len(attese)}")
    cartella = CARTE / nome
    shutil.rmtree(cartella, ignore_errors=True)
    cartella.mkdir(parents=True)
    for carta, img in zip(attese, fronti):
        lette = icone_di(img)
        if lette != simboli[carta["n"]]:
            raise SystemExit(f"{nome} {carta['n']} ({carta['nome']}): sulla carta c'è {' '.join(lette)}, nel mazzo {' '.join(simboli[carta['n']])}")
        img.save(cartella / f"{carta['n']}.png", optimize=True)
    dorso.save(cartella / "dorso.png", optimize=True)
    immagini[nome] = (fronti, dorso)
print(f"carte_v2: {len(immagini['lavoratori'][0])} lavoratori e {len(immagini['ambiti'][0])} ambiti, icone uguali ai mazzi")

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
    "simboli": NOMI_SIMBOLI,
    "dorsi": {"lavoratori": "dorso_lavoratori.webp", "ambiti": "dorso_ambiti.webp"},
}
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


for sigla in COLORI:
    n, posto = next((l["n"], attitudini[l["n"]].index(sigla)) for l in lavoratori if sigla in attitudini[l["n"]])
    ritaglia_icona(immagini["lavoratori"][0][int(n) - 1], posto).save(ICONE / f"{sigla}.png", optimize=True)
print(f"webapp/public/icone: {len(COLORI)} icone")

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
