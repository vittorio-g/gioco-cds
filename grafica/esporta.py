"""Dalle carte montate in grafica/carte/ ricava:

- carte/web/...           le stesse carte in formato leggero (WebP, 378 x 528)
- carte/web/indice.json   quale file corrisponde a ogni lavoratore, a ogni
                          ambito e a ognuna delle 60 carte del mazzo degli ambiti
- tavole/*.jpg            le carte affiancate, da guardare tutte insieme

Uso:  py -3 grafica/esporta.py
"""
import csv
import json
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
CARTE = QUI / "carte"
WEB = CARTE / "web"
TAVOLE = QUI / "tavole"

lavoratori = json.loads((QUI / "dati" / "lavoratori.json").read_text(encoding="utf-8"))
ambiti = json.loads((QUI / "dati" / "ambiti.json").read_text(encoding="utf-8"))
with open(QUI.parent / "mazzi" / "lavoratori.csv", encoding="utf-8") as f:
    attitudini = {r["n"]: [r["a1"], r["a2"], r["a3"]] for r in csv.DictReader(f)}
with open(QUI.parent / "mazzi" / "lavori_v3.csv", encoding="utf-8") as f:
    mazzo_ambiti = {r["n"]: [r["l1"], r["l2"], r["l3"]] for r in csv.DictReader(f)}

# 1. Versioni leggere
for png in sorted(CARTE.glob("**/*.png")):
    if WEB in png.parents:
        continue
    uscita = WEB / png.relative_to(CARTE).with_suffix(".webp")
    uscita.parent.mkdir(parents=True, exist_ok=True)
    Image.open(png).convert("RGB").resize((378, 528), Image.LANCZOS).save(uscita, quality=84, method=6)

# 2. Indice
per_terna = {" ".join(a["terna"]): a["id"] for a in ambiti}
indice = {
    "lavoratori": {l["n"]: {"file": f"lavoratori/{l['n']}.webp", "nome": l["nome"], "battuta": l["battuta"],
                            "attitudini": attitudini[l["n"]]} for l in lavoratori},
    "ambiti": {a["id"]: {"file": f"ambiti/{a['id']}.webp", "nome": a["nome"], "battuta": a["battuta"],
                         "terna": a["terna"], "copie": sum(t == a["terna"] for t in mazzo_ambiti.values())} for a in ambiti},
    "carteAmbito": {n: per_terna[" ".join(t)] for n, t in mazzo_ambiti.items()},
    "dorsi": {"lavoratori": "dorso_lavoratori.webp", "ambiti": "dorso_ambiti.webp"},
    "legenda": "legenda.webp",
}
(WEB / "indice.json").write_text(json.dumps(indice, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


# 3. Tavole
def tavola(nome, carte, colonne):
    lato, margine = 300, 12
    alto = round(lato * 880 / 630)
    righe = -(-len(carte) // colonne)
    tela = Image.new("RGB", (margine + colonne * (lato + margine), margine + righe * (alto + margine)), (52, 52, 52))
    for i, c in enumerate(carte):
        img = Image.open(CARTE / c).convert("RGB").resize((lato, alto), Image.LANCZOS)
        tela.paste(img, (margine + (i % colonne) * (lato + margine), margine + (i // colonne) * (alto + margine)))
    TAVOLE.mkdir(exist_ok=True)
    tela.save(TAVOLE / nome, quality=86)


numeri = [l["n"] for l in lavoratori]
tavola("lavoratori_01-30.jpg", [f"lavoratori/{n}.png" for n in numeri[:30]], 10)
tavola("lavoratori_31-60.jpg", [f"lavoratori/{n}.png" for n in numeri[30:]], 10)
tavola("ambiti.jpg", [f"ambiti/{a['id']}.png" for a in ambiti], 8)
tavola("dorsi_e_legenda.jpg", ["dorso_lavoratori.png", "dorso_ambiti.png", "legenda.png"], 3)

peso = sum(p.stat().st_size for p in WEB.glob("**/*.webp")) / 1e6
print(f"{len(list(WEB.glob('**/*.webp')))} carte leggere ({peso:.1f} MB), indice e {len(list(TAVOLE.glob('*.jpg')))} tavole")
