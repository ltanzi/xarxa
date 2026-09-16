/**
 * Barcelona's 73 official barris, grouped under their district.
 *
 * Free text was the alternative and it would have been useless within a
 * month: "Gracia", "Gràcia", "vila de gracia" and "GRACIA" are four values
 * nothing can group or filter. A fixed list keeps the field cheap to read
 * and leaves the door open to filtering the board by barri later.
 *
 * The field exists to give a poster a bit of geography without giving away
 * an address — close enough to judge "could I get there?", far from a
 * street. So it only appears when the post's location is Barcelona; every
 * other city keeps the plain location field it has always had.
 *
 * Source: Ajuntament de Barcelona's district/barri division. Names are in
 * Catalan in all three locales on purpose — they are place names, and a
 * half-translated "the Gothic Quarter / el Barri Gòtic" mix helps nobody.
 */
export const BARCELONA_DISTRICTS: { district: string; barris: string[] }[] = [
  {
    district: "Ciutat Vella",
    barris: ["el Raval", "el Barri Gòtic", "la Barceloneta", "Sant Pere, Santa Caterina i la Ribera"],
  },
  {
    district: "Eixample",
    barris: [
      "el Fort Pienc",
      "la Sagrada Família",
      "la Dreta de l'Eixample",
      "l'Antiga Esquerra de l'Eixample",
      "la Nova Esquerra de l'Eixample",
      "Sant Antoni",
    ],
  },
  {
    district: "Sants-Montjuïc",
    barris: [
      "el Poble-sec",
      "la Marina del Prat Vermell",
      "la Marina de Port",
      "la Font de la Guatlla",
      "Hostafrancs",
      "la Bordeta",
      "Sants-Badal",
      "Sants",
    ],
  },
  {
    district: "Les Corts",
    barris: ["les Corts", "la Maternitat i Sant Ramon", "Pedralbes"],
  },
  {
    district: "Sarrià-Sant Gervasi",
    barris: [
      "Vallvidrera, el Tibidabo i les Planes",
      "Sarrià",
      "les Tres Torres",
      "Sant Gervasi-la Bonanova",
      "Sant Gervasi-Galvany",
      "el Putxet i el Farró",
    ],
  },
  {
    district: "Gràcia",
    barris: [
      "Vallcarca i els Penitents",
      "el Coll",
      "la Salut",
      "la Vila de Gràcia",
      "el Camp d'en Grassot i Gràcia Nova",
    ],
  },
  {
    district: "Horta-Guinardó",
    barris: [
      "el Baix Guinardó",
      "Can Baró",
      "el Guinardó",
      "la Font d'en Fargues",
      "el Carmel",
      "la Teixonera",
      "Sant Genís dels Agudells",
      "Montbau",
      "la Vall d'Hebron",
      "la Clota",
      "Horta",
    ],
  },
  {
    district: "Nou Barris",
    barris: [
      "Vilapicina i la Torre Llobeta",
      "Porta",
      "el Turó de la Peira",
      "Can Peguera",
      "la Guineueta",
      "Canyelles",
      "les Roquetes",
      "Verdun",
      "la Prosperitat",
      "la Trinitat Nova",
      "Torre Baró",
      "Ciutat Meridiana",
      "Vallbona",
    ],
  },
  {
    district: "Sant Andreu",
    barris: [
      "la Trinitat Vella",
      "Baró de Viver",
      "el Bon Pastor",
      "Sant Andreu",
      "la Sagrera",
      "el Congrés i els Indians",
      "Navas",
    ],
  },
  {
    district: "Sant Martí",
    barris: [
      "el Camp de l'Arpa del Clot",
      "el Clot",
      "el Parc i la Llacuna del Poblenou",
      "la Vila Olímpica del Poblenou",
      "el Poblenou",
      "Diagonal Mar i el Front Marítim del Poblenou",
      "el Besòs i el Maresme",
      "Provençals del Poblenou",
      "Sant Martí de Provençals",
      "la Verneda i la Pau",
    ],
  },
];

/** Flat {barri, district} pairs, in district order — what the picker lists. */
export const BARCELONA_BARRIS: { name: string; district: string }[] =
  BARCELONA_DISTRICTS.flatMap(({ district, barris }) =>
    barris.map((name) => ({ name, district })),
  );

export function isBarcelonaBarri(value: string): boolean {
  return BARCELONA_BARRIS.some((b) => b.name === value);
}

/**
 * Does this post's location sit in Barcelona?
 *
 * LocationInput stores what Photon returned — "Barcelona, Catalonia, Spain"
 * for a pick, but anything at all if the author typed and never picked a
 * suggestion. So this matches the city name as a whole word rather than
 * requiring an exact string, and stays deliberately loose: the only cost of
 * a false positive is an extra optional field nobody has to fill in.
 */
export function isInBarcelona(location: string | null | undefined): boolean {
  if (!location) return false;
  return /(^|[\s,])barcelona([\s,]|$)/i.test(location.trim());
}
