// Singapore estates for location selection and proximity matching

export const ESTATES = [
  'Ang Mo Kio',
  'Bedok',
  'Bishan',
  'Bukit Batok',
  'Bukit Merah',
  'Bukit Panjang',
  'Bukit Timah',
  'Choa Chu Kang',
  'Clementi',
  'Geylang',
  'Hougang',
  'Jurong East',
  'Jurong West',
  'Kallang',
  'Marine Parade',
  'Pasir Ris',
  'Punggol',
  'Queenstown',
  'Sembawang',
  'Sengkang',
  'Serangoon',
  'Tampines',
  'Toa Payoh',
  'Woodlands',
  'Yishun',
] as const;

export type Estate = (typeof ESTATES)[number];

// Adjacency map: estate -> list of neighboring estates
const ADJACENCY: Record<string, string[]> = {
  'Ang Mo Kio': ['Bishan', 'Hougang', 'Serangoon', 'Toa Payoh', 'Yishun'],
  'Bedok': ['Geylang', 'Marine Parade', 'Pasir Ris', 'Tampines'],
  'Bishan': ['Ang Mo Kio', 'Serangoon', 'Toa Payoh'],
  'Bukit Batok': ['Bukit Panjang', 'Choa Chu Kang', 'Clementi', 'Jurong East'],
  'Bukit Merah': ['Kallang', 'Queenstown', 'Toa Payoh'],
  'Bukit Panjang': ['Bukit Batok', 'Bukit Timah', 'Choa Chu Kang'],
  'Bukit Timah': ['Bishan', 'Bukit Panjang', 'Clementi', 'Queenstown'],
  'Choa Chu Kang': ['Bukit Batok', 'Bukit Panjang', 'Jurong West'],
  'Clementi': ['Bukit Batok', 'Bukit Timah', 'Jurong East', 'Queenstown'],
  'Geylang': ['Bedok', 'Kallang', 'Marine Parade'],
  'Hougang': ['Ang Mo Kio', 'Punggol', 'Sengkang', 'Serangoon'],
  'Jurong East': ['Bukit Batok', 'Clementi', 'Jurong West'],
  'Jurong West': ['Choa Chu Kang', 'Jurong East'],
  'Kallang': ['Bukit Merah', 'Geylang', 'Toa Payoh'],
  'Marine Parade': ['Bedok', 'Geylang', 'Kallang'],
  'Pasir Ris': ['Bedok', 'Punggol', 'Tampines'],
  'Punggol': ['Hougang', 'Pasir Ris', 'Sengkang'],
  'Queenstown': ['Bukit Merah', 'Bukit Timah', 'Clementi'],
  'Sembawang': ['Woodlands', 'Yishun'],
  'Sengkang': ['Hougang', 'Punggol', 'Serangoon'],
  'Serangoon': ['Ang Mo Kio', 'Bishan', 'Hougang', 'Sengkang'],
  'Tampines': ['Bedok', 'Pasir Ris'],
  'Toa Payoh': ['Ang Mo Kio', 'Bishan', 'Bukit Merah', 'Kallang'],
  'Woodlands': ['Sembawang', 'Yishun'],
  'Yishun': ['Ang Mo Kio', 'Sembawang', 'Woodlands'],
};

/** Returns 1.0 for same estate, 0.5 for neighbor, 0.0 otherwise */
export function getLocationScore(estate1: string, estate2: string): number {
  if (estate1 === estate2) return 1.0;
  if (ADJACENCY[estate1]?.includes(estate2)) return 0.5;
  return 0.0;
}
