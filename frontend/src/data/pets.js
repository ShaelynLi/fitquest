/**
 * Digital Pet Collection Data
 *
 * Comprehensive database of collectible digital pets across different series.
 * Each pet has rarity levels that affect drop rates from blind boxes.
 */

export const PET_SERIES = {
  POKEMON: 'pokemon'
};

export const PET_RARITY = {
  COMMON: 'common',      // 60% drop rate
  RARE: 'rare',          // 25% drop rate
  EPIC: 'epic',          // 12% drop rate
  LEGENDARY: 'legendary'  // 3% drop rate
};

export const RARITY_CONFIG = {
  [PET_RARITY.COMMON]: {
    name: 'Common',
    color: '#9CA3AF',
    dropRate: 0.60,
    sparkles: 1
  },
  [PET_RARITY.RARE]: {
    name: 'Rare',
    color: '#3B82F6',
    dropRate: 0.25,
    sparkles: 2
  },
  [PET_RARITY.EPIC]: {
    name: 'Epic',
    color: '#8B5CF6',
    dropRate: 0.12,
    sparkles: 3
  },
  [PET_RARITY.LEGENDARY]: {
    name: 'Legendary',
    color: '#F59E0B',
    dropRate: 0.03,
    sparkles: 4
  }
};

export const PET_COLLECTION = [
  // Generation I Pokemon (Common)
  {
    id: 'pokemon_001',
    name: 'Bulbasaur',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '1',
    pokemonVariant: 'showdown', // Use animated GIF
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif',
    description: 'A grass-type Pokémon with a plant bulb on its back.',
    element: 'Grass/Poison',
    unlocked: false
  },
  {
    id: 'pokemon_002',
    name: 'Charmander',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '4',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/4.gif',
    description: 'A fire-type Pokémon with a flame on its tail.',
    element: 'Fire',
    unlocked: false
  },
  {
    id: 'pokemon_003',
    name: 'Squirtle',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '7',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/7.gif',
    description: 'A water-type Pokémon with a shell on its back.',
    element: 'Water',
    unlocked: false
  },
  {
    id: 'pokemon_004',
    name: 'Pikachu',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '25',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif',
    description: 'An electric mouse Pokémon with shocking abilities.',
    element: 'Electric',
    unlocked: false
  },
  {
    id: 'pokemon_005',
    name: 'Jigglypuff',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '39',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/39.gif',
    description: 'A fairy-type Pokémon known for its lullaby.',
    element: 'Normal/Fairy',
    unlocked: false
  },

  // Generation I Pokemon (Rare)
  {
    id: 'pokemon_006',
    name: 'Ivysaur',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '2',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/2.gif',
    description: 'The evolved form of Bulbasaur with a blooming flower.',
    element: 'Grass/Poison',
    unlocked: false
  },
  {
    id: 'pokemon_007',
    name: 'Charmeleon',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '5',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/5.gif',
    description: 'The evolved form of Charmander with stronger flames.',
    element: 'Fire',
    unlocked: false
  },
  {
    id: 'pokemon_008',
    name: 'Wartortle',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '8',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/8.gif',
    description: 'The evolved form of Squirtle with a furry tail.',
    element: 'Water',
    unlocked: false
  },
  {
    id: 'pokemon_009',
    name: 'Raichu',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '26',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/26.gif',
    description: 'The evolved form of Pikachu with powerful electric attacks.',
    element: 'Electric',
    unlocked: false
  },

  // Generation I Pokemon (Epic)
  {
    id: 'pokemon_010',
    name: 'Venusaur',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '3',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/3.gif',
    description: 'The final evolution of Bulbasaur with a massive flower.',
    element: 'Grass/Poison',
    unlocked: false
  },
  {
    id: 'pokemon_011',
    name: 'Charizard',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '6',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/6.gif',
    description: 'The final evolution of Charmander, a fire dragon.',
    element: 'Fire/Flying',
    unlocked: false
  },
  {
    id: 'pokemon_012',
    name: 'Blastoise',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '9',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/9.gif',
    description: 'The final evolution of Squirtle with powerful water cannons.',
    element: 'Water',
    unlocked: false
  },
  {
    id: 'pokemon_013',
    name: 'Alakazam',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '65',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/65.gif',
    description: 'A psychic-type Pokémon with incredible mental powers.',
    element: 'Psychic',
    unlocked: false
  },

  // Generation I Pokemon (Legendary)
  {
    id: 'pokemon_014',
    name: 'Mewtwo',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '150',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/150.gif',
    description: 'A legendary psychic Pokémon of immense power.',
    element: 'Psychic',
    unlocked: false
  },
  {
    id: 'pokemon_015',
    name: 'Mew',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '151',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/151.gif',
    description: 'The mythical ancestor of all Pokémon.',
    element: 'Psychic',
    unlocked: false
  },
  {
    id: 'pokemon_016',
    name: 'Articuno',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '144',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/144.gif',
    description: 'The legendary ice bird Pokémon.',
    element: 'Ice/Flying',
    unlocked: false
  },
  {
    id: 'pokemon_017',
    name: 'Zapdos',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '145',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/145.gif',
    description: 'The legendary electric bird Pokémon.',
    element: 'Electric/Flying',
    unlocked: false
  },
  {
    id: 'pokemon_018',
    name: 'Moltres',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '146',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/146.gif',
    description: 'The legendary fire bird Pokémon.',
    element: 'Fire/Flying',
    unlocked: false
  },

  // Generation II Pokemon (Common)
  {
    id: 'pokemon_019',
    name: 'Chikorita',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '152',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/152.gif',
    description: 'A grass-type Pokémon with a leaf on its head.',
    element: 'Grass',
    unlocked: false
  },
  {
    id: 'pokemon_020',
    name: 'Cyndaquil',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '155',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/155.gif',
    description: 'A fire-type Pokémon with flames on its back.',
    element: 'Fire',
    unlocked: false
  },
  {
    id: 'pokemon_021',
    name: 'Totodile',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '158',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/158.gif',
    description: 'A water-type Pokémon with strong jaws.',
    element: 'Water',
    unlocked: false
  },
  {
    id: 'pokemon_022',
    name: 'Mareep',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '179',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/179.gif',
    description: 'A sheep Pokémon that stores electricity in its wool.',
    element: 'Electric',
    unlocked: false
  },
  {
    id: 'pokemon_023',
    name: 'Hoothoot',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '163',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/163.gif',
    description: 'An owl Pokémon that can tell time.',
    element: 'Normal/Flying',
    unlocked: false
  },

  // Generation II Pokemon (Rare)
  {
    id: 'pokemon_024',
    name: 'Bayleef',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '153',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/153.gif',
    description: 'The evolved form of Chikorita with a bay leaf.',
    element: 'Grass',
    unlocked: false
  },
  {
    id: 'pokemon_025',
    name: 'Quilava',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '156',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/156.gif',
    description: 'The evolved form of Cyndaquil with stronger flames.',
    element: 'Fire',
    unlocked: false
  },
  {
    id: 'pokemon_026',
    name: 'Croconaw',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '159',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/159.gif',
    description: 'The evolved form of Totodile with sharp teeth.',
    element: 'Water',
    unlocked: false
  },
  {
    id: 'pokemon_027',
    name: 'Flaaffy',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '180',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/180.gif',
    description: 'The evolved form of Mareep with less wool.',
    element: 'Electric',
    unlocked: false
  },
  {
    id: 'pokemon_028',
    name: 'Noctowl',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '164',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/164.gif',
    description: 'The evolved form of Hoothoot with keen eyesight.',
    element: 'Normal/Flying',
    unlocked: false
  },

  // Generation II Pokemon (Epic)
  {
    id: 'pokemon_029',
    name: 'Meganium',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '154',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/154.gif',
    description: 'The final evolution of Chikorita with healing powers.',
    element: 'Grass',
    unlocked: false
  },
  {
    id: 'pokemon_030',
    name: 'Typhlosion',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '157',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/157.gif',
    description: 'The final evolution of Cyndaquil with explosive power.',
    element: 'Fire',
    unlocked: false
  },
  {
    id: 'pokemon_031',
    name: 'Feraligatr',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '160',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/160.gif',
    description: 'The final evolution of Totodile with massive jaws.',
    element: 'Water',
    unlocked: false
  },
  {
    id: 'pokemon_032',
    name: 'Ampharos',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '181',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/181.gif',
    description: 'The final evolution of Mareep with a bright tail.',
    element: 'Electric',
    unlocked: false
  },

  // Generation II Pokemon (Legendary)
  {
    id: 'pokemon_033',
    name: 'Lugia',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '249',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/249.gif',
    description: 'The legendary guardian of the seas.',
    element: 'Psychic/Flying',
    unlocked: false
  },
  {
    id: 'pokemon_034',
    name: 'Ho-Oh',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '250',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/250.gif',
    description: 'The legendary rainbow bird Pokémon.',
    element: 'Fire/Flying',
    unlocked: false
  },
  {
    id: 'pokemon_035',
    name: 'Celebi',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '251',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/251.gif',
    description: 'The mythical time-traveling Pokémon.',
    element: 'Psychic/Grass',
    unlocked: false
  },

  // Generation III Pokemon (Common)
  {
    id: 'pokemon_036',
    name: 'Treecko',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '252',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/252.gif',
    description: 'A grass-type Pokémon with a gecko-like appearance.',
    element: 'Grass',
    unlocked: false
  },
  {
    id: 'pokemon_037',
    name: 'Torchic',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '255',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/255.gif',
    description: 'A fire-type chick Pokémon with a flame on its head.',
    element: 'Fire',
    unlocked: false
  },
  {
    id: 'pokemon_038',
    name: 'Mudkip',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '258',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/258.gif',
    description: 'A water-type Pokémon that lives in mud.',
    element: 'Water',
    unlocked: false
  },
  {
    id: 'pokemon_039',
    name: 'Ralts',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '280',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/280.gif',
    description: 'A psychic-type Pokémon that can sense emotions.',
    element: 'Psychic/Fairy',
    unlocked: false
  },
  {
    id: 'pokemon_040',
    name: 'Aron',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    pokemonId: '304',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/304.gif',
    description: 'A steel-type Pokémon with an iron body.',
    element: 'Steel/Rock',
    unlocked: false
  },

  // Generation III Pokemon (Rare)
  {
    id: 'pokemon_041',
    name: 'Grovyle',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '253',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/253.gif',
    description: 'The evolved form of Treecko with leaf blades.',
    element: 'Grass',
    unlocked: false
  },
  {
    id: 'pokemon_042',
    name: 'Combusken',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '256',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/256.gif',
    description: 'The evolved form of Torchic with fighting abilities.',
    element: 'Fire/Fighting',
    unlocked: false
  },
  {
    id: 'pokemon_043',
    name: 'Marshtomp',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '259',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/259.gif',
    description: 'The evolved form of Mudkip with mud powers.',
    element: 'Water/Ground',
    unlocked: false
  },
  {
    id: 'pokemon_044',
    name: 'Kirlia',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '281',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/281.gif',
    description: 'The evolved form of Ralts with dancing abilities.',
    element: 'Psychic/Fairy',
    unlocked: false
  },
  {
    id: 'pokemon_045',
    name: 'Lairon',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    pokemonId: '305',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/305.gif',
    description: 'The evolved form of Aron with stronger armor.',
    element: 'Steel/Rock',
    unlocked: false
  },

  // Generation III Pokemon (Epic)
  {
    id: 'pokemon_046',
    name: 'Sceptile',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '254',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/254.gif',
    description: 'The final evolution of Treecko with leaf blades.',
    element: 'Grass',
    unlocked: false
  },
  {
    id: 'pokemon_047',
    name: 'Blaziken',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '257',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/257.gif',
    description: 'The final evolution of Torchic with blazing kicks.',
    element: 'Fire/Fighting',
    unlocked: false
  },
  {
    id: 'pokemon_048',
    name: 'Swampert',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '260',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/260.gif',
    description: 'The final evolution of Mudkip with mud power.',
    element: 'Water/Ground',
    unlocked: false
  },
  {
    id: 'pokemon_049',
    name: 'Gardevoir',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '282',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/282.gif',
    description: 'The final evolution of Ralts with psychic powers.',
    element: 'Psychic/Fairy',
    unlocked: false
  },
  {
    id: 'pokemon_050',
    name: 'Aggron',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    pokemonId: '306',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/306.gif',
    description: 'The final evolution of Aron with massive armor.',
    element: 'Steel/Rock',
    unlocked: false
  },

  // Generation III Pokemon (Legendary)
  {
    id: 'pokemon_051',
    name: 'Rayquaza',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '384',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/384.gif',
    description: 'The legendary sky dragon Pokémon.',
    element: 'Dragon/Flying',
    unlocked: false
  },
  {
    id: 'pokemon_052',
    name: 'Groudon',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '383',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/383.gif',
    description: 'The legendary continent Pokémon.',
    element: 'Ground',
    unlocked: false
  },
  {
    id: 'pokemon_053',
    name: 'Kyogre',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '382',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/382.gif',
    description: 'The legendary sea basin Pokémon.',
    element: 'Water',
    unlocked: false
  },
  {
    id: 'pokemon_054',
    name: 'Jirachi',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    pokemonId: '385',
    pokemonVariant: 'showdown',
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/385.gif',
    description: 'The mythical wish-granting Pokémon.',
    element: 'Steel/Psychic',
    unlocked: false
  }
];

// Helper function to get pets by series
export const getPetsBySeries = (series) => {
  return PET_COLLECTION.filter(pet => pet.series === series);
};

// Helper function to get pets by rarity
export const getPetsByRarity = (rarity) => {
  return PET_COLLECTION.filter(pet => pet.rarity === rarity);
};

// Helper function to get unlocked pets
export const getUnlockedPets = (userPets = []) => {
  return PET_COLLECTION.filter(pet => userPets.includes(pet.id));
};

// Helper function for blind box drops
export const getRandomPetDrop = () => {
  const random = Math.random();
  let cumulativeRate = 0;

  // Sort rarities by drop rate (highest first)
  const sortedRarities = Object.entries(RARITY_CONFIG)
    .sort(([,a], [,b]) => b.dropRate - a.dropRate);

  for (const [rarity, config] of sortedRarities) {
    cumulativeRate += config.dropRate;
    if (random <= cumulativeRate) {
      const petsOfRarity = getPetsByRarity(rarity);
      const randomIndex = Math.floor(Math.random() * petsOfRarity.length);
      return petsOfRarity[randomIndex];
    }
  }

  // Fallback to common pet
  const commonPets = getPetsByRarity(PET_RARITY.COMMON);
  return commonPets[Math.floor(Math.random() * commonPets.length)];
};