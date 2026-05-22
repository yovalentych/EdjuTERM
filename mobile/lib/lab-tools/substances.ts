import { Substance } from './types';

export const substances: Substance[] = [
  {
    id: 'nacl',
    name: 'Sodium chloride',
    aliases: ['NaCl', 'Кухонна сіль'],
    formula: 'NaCl',
    mw: 58.44,
    category: 'salt',
    notes: 'Основний компонент PBS та фізрозчину.'
  },
  {
    id: 'tris',
    name: 'Tris base',
    aliases: ['Tris', 'Tris(hydroxymethyl)aminomethane'],
    formula: 'C4H11NO3',
    mw: 121.14,
    category: 'buffer'
  },
  {
    id: 'edta',
    name: 'EDTA disodium salt',
    aliases: ['EDTA', 'Na2EDTA'],
    mw: 372.24,
    category: 'buffer',
    notes: 'Хелатор. Краще розчиняється при pH 8.0.'
  },
  {
    id: 'hepes',
    name: 'HEPES',
    mw: 238.30,
    category: 'buffer'
  },
  {
    id: 'ampicillin',
    name: 'Ampicillin sodium',
    mw: 371.39,
    category: 'antibiotic',
    notes: 'Сток зазвичай 100 мг/мл у воді.'
  },
  {
    id: 'kanamycin',
    name: 'Kanamycin sulfate',
    mw: 582.58,
    category: 'antibiotic'
  },
  {
    id: 'bsa',
    name: 'Bovine serum albumin',
    mw: 66.5,
    mwUnit: 'kDa',
    category: 'protein'
  },
  {
    id: 'dtt',
    name: 'DTT',
    mw: 154.25,
    category: 'other',
    notes: 'Відновник. Зберігати при -20C.'
  }
];
