import lavoratori from '../../mazzi/lavoratori.csv';
import ambiti from '../../mazzi/ambiti_v4.csv';
import indice from '../public/carte/indice.json';

const righe = (csv) => csv.trim().split(/\r?\n/).slice(1).map((r) => r.split(',').map((x) => x.trim()));
// I nomi vengono dalle carte disegnate (webapp/public/carte/indice.json).
const lav = righe(lavoratori).map(([n, ...att]) => ({ n, att, nome: indice.lavoratori[n]?.nome ?? null }));
const form = righe(ambiti).map(([n, cat, ...terna]) => ({ n, cat, lav: terna, nome: indice.ambiti[n]?.nome ?? null }));

// Il mazzo in uso: 60 lavoratori e 30 ambiti, quelli della grafica.
export const MAZZO = { lav, form };
