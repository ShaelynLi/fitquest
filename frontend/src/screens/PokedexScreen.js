import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  FlatList,
} from 'react-native';
import { typography, spacing, colors, globalStyles } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function PokedexScreen({ navigation }) {
  // Mock data - in real app this would come from user's collection data
  const [pokemonCollection, setPokemonCollection] = useState([
    { id: 1, name: 'Bulbasaur', unlocked: true },
    { id: 2, name: 'Ivysaur', unlocked: true },
    { id: 3, name: 'Venusaur', unlocked: false },
    { id: 4, name: 'Charmander', unlocked: true },
    { id: 5, name: 'Charmeleon', unlocked: false },
    { id: 6, name: 'Charizard', unlocked: false },
    { id: 7, name: 'Squirtle', unlocked: true },
    { id: 8, name: 'Wartortle', unlocked: false },
    { id: 9, name: 'Blastoise', unlocked: false },
    { id: 10, name: 'Caterpie', unlocked: true },
    { id: 11, name: 'Metapod', unlocked: false },
    { id: 12, name: 'Butterfree', unlocked: false },
    { id: 13, name: 'Weedle', unlocked: false },
    { id: 14, name: 'Kakuna', unlocked: false },
    { id: 15, name: 'Beedrill', unlocked: false },
    { id: 16, name: 'Pidgey', unlocked: false },
    { id: 17, name: 'Pidgeotto', unlocked: false },
    { id: 18, name: 'Pidgeot', unlocked: false },
    { id: 19, name: 'Rattata', unlocked: false },
    { id: 20, name: 'Raticate', unlocked: false },
    { id: 21, name: 'Spearow', unlocked: false },
    { id: 22, name: 'Fearow', unlocked: false },
    { id: 23, name: 'Ekans', unlocked: false },
    { id: 24, name: 'Arbok', unlocked: false },
    { id: 25, name: 'Pikachu', unlocked: true },
  ]);

  const getPokemonSprite = (pokemon) => {
    const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

    if (pokemon.unlocked) {
      // Show animated GIF for unlocked Pokemon
      return { uri: `${base}/other/showdown/${pokemon.id}.gif?unlocked=true` };
    } else {
      // Show static PNG for locked Pokemon (will be tinted)
      return { uri: `${base}/other/official-artwork/${pokemon.id}.png?locked=true` };
    }
  };

  const renderPokemonItem = ({ item }) => (
    <TouchableOpacity style={styles.pokemonCard} activeOpacity={0.8}>
      <View style={styles.pokemonImageContainer}>
        <View style={styles.spriteWrapper}>
          {item.unlocked ? (
            <Image
              key={`unlocked-${item.id}`}
              source={getPokemonSprite(item)}
              style={styles.pokemonImage}
              resizeMode="contain"
            />
          ) : (
            <Image
              key={`locked-${item.id}`}
              source={getPokemonSprite(item)}
              style={[styles.pokemonImage, { tintColor: colors.gray[800] }]}
              resizeMode="contain"
            />
          )}
        </View>
      </View>
      <View style={styles.pokemonInfo}>
        <Text style={styles.pokemonNumber}>#{String(item.id).padStart(3, '0')}</Text>
        <Text style={[styles.pokemonName, !item.unlocked && styles.lockedText]}>
          {item.unlocked ? item.name.toUpperCase() : '???'}
        </Text>
      </View>
      {!item.unlocked && (
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={16} color={colors.gray[400]} />
        </View>
      )}
    </TouchableOpacity>
  );

  const unlockedCount = pokemonCollection.filter(p => p.unlocked).length;
  const totalCount = pokemonCollection.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pokédex</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Collection Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Collected: {unlockedCount}/{totalCount}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(unlockedCount / totalCount) * 100}%` }
            ]}
          />
        </View>
      </View>

      {/* Pokemon Grid */}
      <FlatList
        data={pokemonCollection}
        renderItem={renderPokemonItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.black,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  statsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  statsText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.black,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.black,
    borderRadius: 4,
  },
  gridContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120, // Space for tab bar
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pokemonCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.black,
    padding: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  pokemonImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  spriteWrapper: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pokemonImage: {
    height: 48,
    aspectRatio: 1,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 48,
    backgroundColor: colors.gray[800],
    opacity: 0.7,
    borderRadius: 6,
    mixBlendMode: 'multiply',
  },
  pokemonInfo: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  pokemonNumber: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  pokemonName: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  lockedText: {
    color: colors.gray[400],
  },
  lockIcon: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
});