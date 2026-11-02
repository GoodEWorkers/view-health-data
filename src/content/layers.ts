const SHEET_HINT = 'Cliquez un câble ou un équipement';
const WINDOWS_HINT = 'Cliquez une fenêtre, survolez un fil';

export const LAYERS = [
  {
    id: 'salles',
    label: 'Salles',
    title: 'Plan de l\'hôpital',
    hint: 'Cliquez une salle ou utilisez les flèches',
    overview: 'Huit services sur un même étage : chaque salle garde sa couleur sur toutes les couches.',
  },
  {
    id: 'logiciels',
    label: 'Logiciels',
    title: 'Logiciels',
    hint: WINDOWS_HINT,
    overview: 'Chaque service a son logiciel : les écrans s\'ouvrent au-dessus du plan, reliés par des fils qui sont autant d\'échanges de messages.',
  },
  {
    id: 'donnees',
    label: 'Données',
    title: 'Données',
    hint: WINDOWS_HINT,
    overview: 'Chaque fenêtre montre le message ou le document qu\'un service garde sur le même patient fictif ; cliquez-la pour lire le fichier en entier.',
  },
  {
    id: 'reseau',
    label: 'Réseau',
    title: 'Réseau',
    hint: SHEET_HINT,
    overview: 'Les mêmes échanges vus du réseau : zones, familles de protocoles et pare-feu. Survolez un câble pour suivre son trajet.',
  },
] as const;

export type LayerId = (typeof LAYERS)[number]['id'];

export const DEFAULT_LAYER = 'salles';

export type SheetLayerId = Exclude<LayerId, typeof DEFAULT_LAYER>;

export const SHEET_LAYERS: readonly SheetLayerId[] = LAYERS.flatMap(({ id }) => (id === DEFAULT_LAYER ? [] : [id]));

const HASH_PREFIX = '#';
const LAYER_COUNT = LAYERS.length;

export const layerById = (id: LayerId) => LAYERS.find((layer) => layer.id === id) ?? LAYERS[0];

export const layerFromHash = (hash: string): LayerId => {
  const wanted = hash.startsWith(HASH_PREFIX) ? hash.slice(HASH_PREFIX.length) : hash;
  return LAYERS.find(({ id }) => id === wanted)?.id ?? DEFAULT_LAYER;
};

export const hashOfLayer = (layer: LayerId): string => (layer === DEFAULT_LAYER ? '' : `${HASH_PREFIX}${layer}`);

export const nextLayer = (current: LayerId, step: number): LayerId => {
  const position = LAYERS.findIndex(({ id }) => id === current);
  return LAYERS[(((position + step) % LAYER_COUNT) + LAYER_COUNT) % LAYER_COUNT]?.id ?? DEFAULT_LAYER;
};

export const layerOfKey = (key: string): LayerId | undefined => LAYERS.find((_, index) => String(index + 1) === key)?.id;

export const panelVisibility = (roomIndex: number, layer: LayerId, count: number): readonly (LayerId | null)[] =>
  Array.from({ length: count }, (_, index) => (index === roomIndex ? layer : null));
