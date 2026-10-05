import lavoratori from '../../mazzi/lavoratori.csv';
import lavoriV2 from '../../mazzi/lavori_v2.csv';
import lavoriV3 from '../../mazzi/lavori_v3.csv';
import indice from '../public/carte/indice.json';

const righe = (csv) => csv.trim().split(/\r?\n/).slice(1).map((r) => r.split(',').map((x) => x.trim()));
// I nomi vengono dalle carte disegnate: ogni lavoratore ha il suo, ogni ambito
// quello della sua terna (gli ambiti tutti diversi del mazzo v2 non ne hanno).
const chiave = (terna) => [...terna].sort().join(' ');
const nomeAmbito = new Map(Object.values(indice.ambiti).map((a) => [chiave(a.terna), a.nome]));
const lav = righe(lavoratori).map(([n, ...att]) => ({ n, att, nome: indice.lavoratori[n]?.nome ?? null }));
const lavori = (csv) => righe(csv).map(([n, ...terna]) => ({ n, lav: terna, nome: nomeAmbito.get(chiave(terna)) ?? null }));

// Il mazzo dei lavoratori è sempre lo stesso; cambia quello dei lavori.
export const MAZZI = {
  v2: { lav, form: lavori(lavoriV2) },
  v3: { lav, form: lavori(lavoriV3) },
};
