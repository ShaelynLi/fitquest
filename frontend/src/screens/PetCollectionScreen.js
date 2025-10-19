import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, globalStyles } from '../theme';
import { useGamification } from '../context/GamificationContext';
import { PET_SERIES, RARITY_CONFIG } from '../data/pets';

/**
 * PetCollectionScreen Component
 *
 * Displays user's complete pet collection with filtering options.
 * Shows locked pets as silhouettes to encourage collection.
 */
export default function PetCollectionScreen({ navigation }) {
  const {
    allPets,
    userPets,
    activeCompanion,
    setActiveCompanionPet,
    getCollectionStats
  } = useGamification();

  const [filterSeries, setFilterSeries] = useState('all');
  const [filterRarity, setFilterRarity] = useState('all');

  const stats = getCollectionStats();

  // Filter pets based on selected filters
  const getFilteredPets = () => {
    let filtered = allPets;

    if (filterSeries !== 'all') {
      filtered = filtered.filter(pet => pet.series === filterSeries);
    }

    if (filterRarity !== 'all') {
      filtered = filtered.filter(pet => pet.rarity === filterRarity);
    }

    return filtered;
  };

  const filteredPets = getFilteredPets();

  const handlePetSelect = async (pet) => {
    const isOwned = userPets.includes(pet.id);

    if (!isOwned) {
      Alert.alert(
        'Pet Locked',
        `You haven't unlocked ${pet.name} yet. Keep opening blind boxes to collect more pets!`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await setActiveCompanionPet(pet);
      Alert.alert(
        'Companion Changed',
        `${pet.name} is now your active companion!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to set companion. Please try again.');
    }
  };

  const renderPetCard = ({ item: pet }) => {
    const isOwned = userPets.includes(pet.id);
    const isActive = activeCompanion?.id === pet.id;
    const rarityConfig = RARITY_CONFIG[pet.rarity];

    return (
      <TouchableOpacity
        style={[
          styles.petCard,
          isActive && styles.activePetCard,
          { borderColor: rarityConfig.color }
        ]}
        onPress={() => handlePetSelect(pet)}
      >
        {/* Rarity Indicator */}
        <View style={[styles.rarityIndicator, { backgroundColor: rarityConfig.color }]}>
          <Text style={styles.rarityText}>{rarityConfig.name[0]}</Text>
        </View>

        {/* Pet Image */}
        <View style={styles.petImageContainer}>
          <Image
            source={{ uri: pet.image }}
            style={[
              styles.petImage,
              !isOwned && styles.lockedPetImage
            ]}
            defaultSource={require('../../assets/icon.png')}
            onError={(e) => {
              console.log('Failed to load pet image:', pet.name, pet.image);
            }}
          />
          {!isOwned && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={24} color={colors.white} />
            </View>
          )}
          {isActive && (
            <View style={styles.activeIndicator}>
              <Ionicons name="star" size={16} color={colors.yellow[500]} />
            </View>
          )}
        </View>

        {/* Pet Info */}
        <View style={styles.petCardInfo}>
          <Text style={[styles.petCardName, !isOwned && styles.lockedText]}>
            {isOwned ? pet.name : '???'}
          </Text>
          <Text style={[styles.petCardSeries, !isOwned && styles.lockedText]}>
            {isOwned ? pet.series.toUpperCase() : 'LOCKED'}
          </Text>
          {isOwned && (
            <Text style={styles.petCardElement}>{pet.element}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeriesFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterSeries === item.value && styles.activeFilterButton
      ]}
      onPress={() => setFilterSeries(item.value)}
    >
      <Text style={[
        styles.filterText,
        filterSeries === item.value && styles.activeFilterText
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderRarityFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        styles.rarityFilterButton,
        { borderColor: item.color },
        filterRarity === item.value && { backgroundColor: item.color }
      ]}
      onPress={() => setFilterRarity(item.value)}
    >
      <Text style={[
        styles.filterText,
        filterRarity === item.value && styles.activeFilterText
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const seriesFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pokémon', value: PET_SERIES.POKEMON },
    { label: 'Minecraft', value: PET_SERIES.MINECRAFT },
    { label: 'Labubu', value: PET_SERIES.LABUBU },
    { label: 'Cats', value: PET_SERIES.CATS },
    { label: 'Dogs', value: PET_SERIES.DOGS },
  ];

  const rarityFilters = [
    { label: 'All', value: 'all', color: colors.gray[400] },
    ...Object.entries(RARITY_CONFIG).map(([key, config]) => ({
      label: config.name,
      value: key,
      color: config.color
    }))
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pet Collection</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Section */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.ownedPets}</Text>
          <Text style={styles.statLabel}>Collected</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalPets}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
      </View>

      {/* Series Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Series</Text>
        <FlatList
          data={seriesFilters}
          renderItem={renderSeriesFilter}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={item => item.value}
        />
      </View>

      {/* Rarity Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Rarity</Text>
        <FlatList
          data={rarityFilters}
          renderItem={renderRarityFilter}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={item => item.value}
        />
      </View>

      {/* Pet Grid */}
      <FlatList
        data={filteredPets}
        renderItem={renderPetCard}
        numColumns={2}
        contentContainerStyle={styles.petGrid}
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No pets found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },

  headerSpacer: {
    width: 40,
  },

  // Stats
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    margin: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statNumber: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  statLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },

  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // Filters
  filterSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  filterTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  filterList: {
    gap: spacing.sm,
  },

  filterButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  rarityFilterButton: {
    borderWidth: 2,
  },

  activeFilterButton: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },

  filterText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },

  activeFilterText: {
    color: colors.white,
  },

  // Pet Grid
  petGrid: {
    padding: spacing.md,
    gap: spacing.md,
  },

  petCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    margin: spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },

  activePetCard: {
    borderColor: colors.yellow[500],
    backgroundColor: colors.yellow[50],
  },

  rarityIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  rarityText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  petImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },

  petImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },

  lockedPetImage: {
    opacity: 0.3,
  },

  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 2,
  },

  petCardInfo: {
    alignItems: 'center',
  },

  petCardName: {
    fontSize: typography.sizes.md,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  petCardSeries: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  petCardElement: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  lockedText: {
    color: colors.textSecondary,
    opacity: 0.6,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    width: '100%',
  },

  emptyStateText: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  emptyStateSubtext: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
});