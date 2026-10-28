"""
I poteri dei Lavoratori: i nomi (grafica/dati/poteri.json) e chi ha quale potere.

Quindici lavoratori per potere, il più utile ai lavoratori più difficili da formare.
Difficile = poche coppie di ambiti coprono le sue tre ambizioni. È lo stesso conto
di strumenti/analisi.mjs (PER_DIFFICOLTA([1, 2, 4, 3])), verificato con le simulazioni.

Lo usano grafica/pnp.py e pitch/figure.py.
"""
import csv
import json
from collections import Counter
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
ORDINE = [1, 2, 4, 3]  # il potere dei 15 più difficili, poi dei 15 dopo, e così via


def _csv(nome):
    with open(RADICE / "mazzi" / nome, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def nomi():
    """{1: {"nome", "breve", "effetto"}, ...}"""
    dati = json.loads((RADICE / "grafica" / "dati" / "poteri.json").read_text(encoding="utf-8"))
    return {int(k): v for k, v in dati.items() if not k.startswith("_")}


def assegnazione():
    """{"01": 4, "02": 4, ...}: il numero del potere di ogni lavoratore."""
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
    return {lavoratori[i][0]: ORDINE[k // 15] for k, i in enumerate(dal_piu_difficile)}
