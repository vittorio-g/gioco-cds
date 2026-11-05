"""Il dorso degli Ambiti scelto da Vittorio il 5/11/2026: la Ruota, con le icone nell'ordine fisso.

    py -3 grafica/dorso_ruota.py

La Ruota (grafica/dorsi_proposte/ambiti_ruota.png, da genera_dorsi_ambiti.mjs) mette le sei icone
sugli spicchi; in senso orario dalla chiave inglese venivano Manualità, Digitale, Comunicazione,
Ricerca, Creatività, Organizzazione. Le carte le mostrano sempre nell'ordine MA DI CO OR CR RI
(carte_nuove.ORDINE_ICONE): qui si scambiano i disegni dei due riquadri in basso, Organizzazione e
Ricerca, che stanno in spicchi simmetrici con lo stesso fondo petrolio. Cornici e spicchi restano
quelli originali. Scrive grafica/dorsi_proposte/ambiti_ruota_ordinata.png, che usano pnp.py e
pitch/figure.py.
"""
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
ORIGINE = QUI / "dorsi_proposte" / "ambiti_ruota.png"
DESTINO = QUI / "dorsi_proposte" / "ambiti_ruota_ordinata.png"

# l'interno dei due riquadri, dentro la cornice chiara, con qualche pixel di margine
# perché le cornici disegnate a mano sono un po' storte (misurati sull'immagine 1008 x 1408)
SINISTRA = (178, 690, 323, 831)   # la lista di spunte, Organizzazione
DESTRA = (691, 691, 834, 833)     # la lente, Ricerca


def main():
    dorso = Image.open(ORIGINE).convert("RGB")
    sx, dx = dorso.crop(SINISTRA), dorso.crop(DESTRA)
    dorso.paste(sx.resize((DESTRA[2] - DESTRA[0], DESTRA[3] - DESTRA[1]), Image.LANCZOS), DESTRA[:2])
    dorso.paste(dx.resize((SINISTRA[2] - SINISTRA[0], SINISTRA[3] - SINISTRA[1]), Image.LANCZOS), SINISTRA[:2])
    dorso.save(DESTINO)
    print(DESTINO)


if __name__ == "__main__":
    main()
