// Disegna le 10 icone dei simboli in stile fanzine a due colori e le scrive
// in grafica/icone/XX.svg. Ogni icona è un ritaglio di carta con il segno
// dentro e una seconda passata di inchiostro fuori registro.
//
// Il colore dice quanto il simbolo è diffuso nel mazzo:
//   comune   ritaglio rosa, segno petrolio      (MA DI CO OR CL)
//   medio    ritaglio petrolio, segno carta     (AN CR CD)
//   raro     ritaglio petrolio, segno rosa      (RI ST)
//
// Uso:  node grafica/icone.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const ROSA = '#ff3d8b';
export const PETROLIO = '#17474d';
export const CARTA = '#f1ebdd';

export const SIMBOLI = {
  MA: { nome: 'Manualità', tipo: 'comune' },
  DI: { nome: 'Digitale', tipo: 'comune' },
  CO: { nome: 'Comunicazione', tipo: 'comune' },
  OR: { nome: 'Organizzazione', tipo: 'comune' },
  CL: { nome: 'Collaborazione', tipo: 'comune' },
  AN: { nome: 'Analisi', tipo: 'medio' },
  CR: { nome: 'Creatività', tipo: 'medio' },
  CD: { nome: 'Coordinamento', tipo: 'medio' },
  RI: { nome: 'Ricerca', tipo: 'raro' },
  ST: { nome: 'Strategia', tipo: 'raro' },
};

const COLORI = {
  comune: { fondo: ROSA, segno: PETROLIO, ombra: PETROLIO },
  medio: { fondo: PETROLIO, segno: CARTA, ombra: ROSA },
  raro: { fondo: PETROLIO, segno: ROSA, ombra: ROSA },
};

// Ritagli a mano: quadrati storti, uno diverso per simbolo.
const RITAGLI = {
  MA: '9,13 88,7 93,86 14,92',
  DI: '11,8 91,12 88,91 8,88',
  CO: '8,11 86,6 93,84 51,93 11,89',
  OR: '12,7 90,10 92,90 9,93',
  CL: '7,14 49,6 91,11 90,89 10,92',
  AN: '10,9 92,8 89,92 8,87',
  CR: '13,8 89,12 93,88 10,91',
  CD: '8,10 90,7 92,91 48,94 9,90',
  RI: '11,12 87,7 92,87 12,93',
  ST: '9,8 91,11 88,92 11,88',
};

// I segni, in un riquadro 100x100. S = colore del segno, F = colore del fondo.
const SEGNI = {
  MA: (S, F) => `
    <path d="M30 73 L57 46" stroke="${S}" stroke-width="11" stroke-linecap="round"/>
    <circle cx="66" cy="37" r="15.5" fill="${S}"/>
    <path d="M65 38 L77 17 L87 28 Z" fill="${F}"/>
    <circle cx="30" cy="73" r="3.2" fill="${F}"/>`,
  DI: (S) => `
    <rect x="21" y="23" width="58" height="41" rx="5" fill="none" stroke="${S}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M50 66 L50 77 M35 80 L65 80" stroke="${S}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <circle cx="40" cy="39" r="3.8" fill="${S}"/><circle cx="60" cy="38" r="3.8" fill="${S}"/>
    <path d="M40 50 Q51 58 61 49" stroke="${S}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  CO: (S) => `
    <path d="M22 29 Q22 20 31 20 L70 21 Q79 21 79 30 L78 54 Q78 62 69 62 L49 62 L32 79 L35 62 L30 62 Q22 62 22 54 Z"
      fill="none" stroke="${S}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M35 35 L66 36 M35 48 L55 48" stroke="${S}" stroke-width="6" stroke-linecap="round"/>`,
  OR: (S) => `
    <path d="M24 29 l6 6 l10 -12 M24 51 l6 6 l10 -12 M24 73 l6 6 l10 -12"
      fill="none" stroke="${S}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M52 30 L77 29 M52 52 L77 52 M52 74 L69 74" stroke="${S}" stroke-width="8" stroke-linecap="round"/>`,
  CL: (S, F) => `
    <circle cx="66" cy="37" r="10.5" fill="${S}"/>
    <path d="M49 80 Q50 55 67 55 Q85 55 86 80 Z" fill="${S}"/>
    <circle cx="37" cy="36" r="12" fill="${S}" stroke="${F}" stroke-width="4"/>
    <path d="M15 80 Q16 55 37 55 Q58 55 59 80 Z" fill="${S}" stroke="${F}" stroke-width="4" stroke-linejoin="round"/>`,
  AN: (S) => `
    <path d="M21 81 L80 80" stroke="${S}" stroke-width="7" stroke-linecap="round"/>
    <path d="M26 75 L27 56 L39 56 L39 75 Z M45 75 L45 42 L57 43 L57 75 Z M63 75 L64 23 L76 24 L75 75 Z" fill="${S}"/>`,
  CR: (S) => `
    <path d="M45 19 Q49 48 80 54 Q49 60 45 89 Q41 60 11 54 Q41 48 45 19 Z" fill="${S}"/>
    <path d="M75 12 Q77 23 88 25 Q77 27 75 38 Q73 27 62 25 Q73 23 75 12 Z" fill="${S}"/>`,
  CD: (S) => `
    <path d="M50 34 L50 51 M26 66 L26 51 L74 50 L74 66 M50 51 L50 66"
      fill="none" stroke="${S}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="50" cy="26" r="10.5" fill="${S}"/>
    <circle cx="26" cy="75" r="8.5" fill="${S}"/><circle cx="50" cy="75" r="8.5" fill="${S}"/><circle cx="74" cy="75" r="8.5" fill="${S}"/>`,
  RI: (S) => `
    <circle cx="43" cy="42" r="19" fill="none" stroke="${S}" stroke-width="9"/>
    <path d="M58 58 L78 79" stroke="${S}" stroke-width="12" stroke-linecap="round"/>
    <path d="M33 39 Q35 31 43 30" stroke="${S}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  ST: (S) => `
    <path d="M30 18 L31 84" stroke="${S}" stroke-width="8" stroke-linecap="round"/>
    <path d="M35 22 Q48 14 58 24 Q68 34 81 26 L79 56 Q66 64 56 54 Q46 44 35 52 Z" fill="${S}"/>`,
};

// Bordi mossi e granelli di inchiostro mancante, come una stampa a due passate.
export const FILTRO = `
  <filter id="stampa" x="-8%" y="-8%" width="116%" height="116%">
    <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="onda"/>
    <feDisplacementMap in="SourceGraphic" in2="onda" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="mosso"/>
    <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="1" seed="9" result="grana"/>
    <feColorMatrix in="grana" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 14 -10" result="buchi"/>
    <feComposite in="mosso" in2="buchi" operator="out"/>
  </filter>`;

export function icona(sigla) {
  const { tipo, nome } = SIMBOLI[sigla];
  const c = COLORI[tipo];
  const stella = tipo === 'raro'
    ? `<path d="M84 4 L87 12 L96 13 L89 19 L91 28 L84 23 L76 28 L79 19 L72 13 L81 12 Z" fill="${ROSA}" stroke="${PETROLIO}" stroke-width="2.5" stroke-linejoin="round"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${nome}">
  <title>${nome}</title>
  <defs>${FILTRO}
  </defs>
  <g filter="url(#stampa)">
    <polygon points="${RITAGLI[sigla]}" fill="${c.ombra}" transform="translate(3.5 3.5)" opacity="${c.ombra === c.fondo ? 0 : 0.9}"/>
    <polygon points="${RITAGLI[sigla]}" fill="${c.fondo}"/>
    <g fill="none">${SEGNI[sigla](c.segno, c.fondo)}
    </g>
    ${stella}
  </g>
</svg>
`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cartella = new URL('./icone/', import.meta.url);
  mkdirSync(cartella, { recursive: true });
  for (const sigla of Object.keys(SIMBOLI)) writeFileSync(new URL(`${sigla}.svg`, cartella), icona(sigla));
  console.log('scritte', Object.keys(SIMBOLI).length, 'icone in grafica/icone/');
}
