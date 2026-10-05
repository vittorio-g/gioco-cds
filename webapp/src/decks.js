import lavoratori from '../../mazzi/lavoratori.csv';
import lavoriV2 from '../../mazzi/lavori_v2.csv';
import lavoriV3 from '../../mazzi/lavori_v3.csv';

const righe = (csv) => csv.trim().split(/\r?\n/).slice(1).map((r) => r.split(',').map((x) => x.trim()));
const lav = righe(lavoratori).map(([n, ...att]) => ({ n, att }));
const lavori = (csv) => righe(csv).map(([n, ...terna]) => ({ n, lav: terna }));

// Il mazzo dei lavoratori è sempre lo stesso; cambia quello dei lavori.
export const MAZZI = {
  v2: { lav, form: lavori(lavoriV2) },
  v3: { lav, form: lavori(lavoriV3) },
};
