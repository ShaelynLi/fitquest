/**
 * Digital Pet Collection Data
 *
 * Comprehensive database of collectible digital pets across different series.
 * Each pet has rarity levels that affect drop rates from blind boxes.
 */

export const PET_SERIES = {
  POKEMON: 'pokemon',
  MINECRAFT: 'minecraft',
  LABUBU: 'labubu',
  CATS: 'cats',
  DOGS: 'dogs'
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
  // Pokemon Series
  {
    id: 'pokemon_001',
    name: 'Pikachu',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.COMMON,
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    description: 'An electric mouse Pokémon with shocking abilities.',
    element: 'Electric',
    unlocked: false
  },
  {
    id: 'pokemon_002',
    name: 'Charizard',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.EPIC,
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    description: 'A fire dragon that soars through the skies.',
    element: 'Fire/Flying',
    unlocked: false
  },
  {
    id: 'pokemon_003',
    name: 'Mewtwo',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.LEGENDARY,
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    description: 'A legendary psychic Pokémon of immense power.',
    element: 'Psychic',
    unlocked: false
  },
  {
    id: 'pokemon_004',
    name: 'Eevee',
    series: PET_SERIES.POKEMON,
    rarity: PET_RARITY.RARE,
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png',
    description: 'An evolution Pokémon with endless possibilities.',
    element: 'Normal',
    unlocked: false
  },

  // Minecraft Series
  {
    id: 'minecraft_001',
    name: 'Creeper',
    series: PET_SERIES.MINECRAFT,
    rarity: PET_RARITY.COMMON,
    image: 'https://minecraft.wiki/images/f/f4/Creeper_JE2_BE1.png',
    description: 'A mysterious green creature that explodes.',
    element: 'Explosive',
    unlocked: false
  },
  {
    id: 'minecraft_002',
    name: 'Ender Dragon',
    series: PET_SERIES.MINECRAFT,
    rarity: PET_RARITY.LEGENDARY,
    image: 'https://minecraft.wiki/images/d/d3/Ender_Dragon.png',
    description: 'The ultimate boss of the End dimension.',
    element: 'Ender',
    unlocked: false
  },
  {
    id: 'minecraft_003',
    name: 'Wolf',
    series: PET_SERIES.MINECRAFT,
    rarity: PET_RARITY.RARE,
    image: 'https://minecraft.wiki/images/5/50/Wolf_JE2_BE2.png',
    description: 'A loyal companion that can be tamed.',
    element: 'Neutral',
    unlocked: false
  },

  // Labubu Series (Popular collectible characters)
  {
    id: 'labubu_001',
    name: 'Classic Labubu',
    series: PET_SERIES.LABUBU,
    rarity: PET_RARITY.COMMON,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    description: 'The original mischievous little monster.',
    element: 'Mischief',
    unlocked: false
  },
  {
    id: 'labubu_002',
    name: 'Golden Labubu',
    series: PET_SERIES.LABUBU,
    rarity: PET_RARITY.LEGENDARY,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    description: 'A rare golden variant with special powers.',
    element: 'Light',
    unlocked: false
  },

  // Cat Series
  {
    id: 'cats_001',
    name: 'Tabby Cat',
    series: PET_SERIES.CATS,
    rarity: PET_RARITY.COMMON,
    image: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400&h=400&fit=crop',
    description: 'A friendly striped cat.',
    element: 'Comfort',
    unlocked: false
  },
  {
    id: 'cats_002',
    name: 'Rainbow Cat',
    series: PET_SERIES.CATS,
    rarity: PET_RARITY.EPIC,
    image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&h=400&fit=crop',
    description: 'A magical cat with rainbow powers.',
    element: 'Magic',
    unlocked: false
  },

  // Dog Series
  {
    id: 'dogs_001',
    name: 'Golden Retriever',
    series: PET_SERIES.DOGS,
    rarity: PET_RARITY.COMMON,
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
    description: 'A loyal and friendly companion.',
    element: 'Loyalty',
    unlocked: false
  },
  {
    id: 'dogs_002',
    name: 'Space Corgi',
    series: PET_SERIES.DOGS,
    rarity: PET_RARITY.EPIC,
    image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop',
    description: 'A corgi from outer space with cosmic powers.',
    element: 'Cosmic',
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