"""
I poteri delle Persone: i nomi (grafica/dati/poteri.json) e chi ha quale potere.

Dieci Persone per potere, il più utile alle Persone più difficili da formare.
Difficile = poche coppie di ambiti coprono le sue tre ambizioni. È lo stesso conto
di strumenti/analisi.mjs (PER_DIFFICOLTA), che lo verificava con i quattro poteri di prima.
Con i sei poteri del playtest di novembre 2026 l'ordine è provvisorio: Passaparola resta
sulle più difficili (nelle simulazioni era il più forte), Corso intensivo sulle più facili
(era il più debole), i quattro nuovi in mezzo, da provare al tavolo.

Lo usano grafica/pnp.py e pitch/figure.py.
"""
import csv
import json
from collections import Counter
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
ORDINE = [1, 3, 5, 4, 6, 2]  # il potere delle 10 più difficili, poi delle 10 dopo, e così via
PER_POTERE = 60 // len(ORDINE)


def _csv(nome):
    with open(RADICE / "mazzi" / nome, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def nomi():
    """{1: {"nome", "breve", "effetto"}, ...}"""
    dati = json.loads((RADICE / "grafica" / "dati" / "poteri.json").read_text(encoding="utf-8"))
    return {int(k): v for k, v in dati.items() if not k.startswith("_")}


def assegnazione():
    """{"01": 4, "02": 4, ...}: il numero del potere di ogni Persona."""
    lavoratori = [(r["n"], [r["a1"], r["a2"], r["a3"]]) for r in _csv("lavoratori.csv")]
    ambiti = [[r["l1"], r["l2"], r["l3"]] for r in _csv("ambiti.csv")]

    def coppie(ambizioni):
        serve = Counter(ambizioni)
        n = 0
        for i in range(len(ambiti)):
            for j in range(i, len(ambiti)):
                c = Counter(ambiti[i]) + Counter(ambiti[j])
                if all(c[s] >= q for s, q in serve.items()):
                    n += 1
        return n

    dal_piu_difficile = sorted(range(len(lavoratori)), key=lambda i: coppie(lavoratori[i][1]))
    return {lavoratori[i][0]: ORDINE[k // PER_POTERE] for k, i in enumerate(dal_piu_difficile)}
