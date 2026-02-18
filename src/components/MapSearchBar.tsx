import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SFSymbol } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlusJakartaSans_600SemiBold, useFonts } from "@expo-google-fonts/plus-jakarta-sans";
import { Place, PlaceCategory } from '../types';
import { SFIcon } from './SFIcon';
import { colors } from '../theme/colors';
import { HapticPressable } from './HapticPressable';

const CATEGORY_ICONS: Record<PlaceCategory, { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }> = {
  cafe: { sf: 'cup.and.saucer.fill', fallback: 'cafe' },
  restaurant: { sf: 'fork.knife', fallback: 'restaurant' },
  bar: { sf: 'wineglass.fill', fallback: 'wine' },
  attraction: { sf: 'safari', fallback: 'compass' },
  park: { sf: 'leaf.fill', fallback: 'leaf' },
  venue: { sf: 'music.note.list', fallback: 'musical-notes' },
};

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  bar: 'Bar',
  attraction: 'Attraction',
  park: 'Park',
  venue: 'Venue',
};

const ALL_CATEGORIES: PlaceCategory[] = [
  'cafe',
  'restaurant',
  'bar',
  'attraction',
  'park',
  'venue',
];

interface MapSearchBarProps {
  places: Place[];
  selectedCategories: PlaceCategory[];
  showFollowingOnly: boolean;
  onSelectPlace: (place: Place) => void;
  onCategoriesChange: (categories: PlaceCategory[]) => void;
  onFollowingToggle: (value: boolean) => void;
}

export function MapSearchBar({
  places,
  selectedCategories,
  showFollowingOnly,
  onSelectPlace,
  onCategoriesChange,
  onFollowingToggle,
}: MapSearchBarProps) {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_600SemiBold });
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const results =
    query.length > 0
      ? places.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
      : [];

  const handleSelectPlace = (place: Place) => {
    setQuery('');
    inputRef.current?.blur();
    onSelectPlace(place);
  };

  const toggleCategory = (category: PlaceCategory) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  return (
    <View style={[styles.wrapper, { top: insets.top + 8 }]}>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <SFIcon
          name="magnifyingglass"
          fallback="search"
          size={18}
          color={colors.gray400}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search places..."
          placeholderTextColor={colors.gray400}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <HapticPressable onPress={() => setQuery('')} style={styles.clearButton}>
            <SFIcon name="xmark.circle.fill" fallback="close-circle" size={18} color={colors.gray400} />
          </HapticPressable>
        )}
      </View>

      {/* Results dropdown */}
      {results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
            renderItem={({ item }) => (
              <HapticPressable
                style={styles.resultRow}
                onPress={() => handleSelectPlace(item)}
              >
                <View
                  style={[
                    styles.resultIcon,
                    { backgroundColor: colors.category[item.category] },
                  ]}
                >
                  <SFIcon
                    name={CATEGORY_ICONS[item.category].sf}
                    fallback={CATEGORY_ICONS[item.category].fallback}
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.resultText}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.resultAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </HapticPressable>
            )}
          />
        </View>
      )}

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}
      >
        {/* Following chip */}
        <HapticPressable
          style={[
            styles.chip,
            showFollowingOnly ? styles.chipActive : styles.chipInactive,
          ]}
          onPress={() => onFollowingToggle(!showFollowingOnly)}
        >
          <SFIcon
            name="person.2"
            fallback="people"
            size={14}
            color={showFollowingOnly ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[
              styles.chipLabel,
              showFollowingOnly
                ? styles.chipLabelActive
                : styles.chipLabelInactive,
            ]}
          >
            Following
          </Text>
        </HapticPressable>

        {/* Category chips */}
        {ALL_CATEGORIES.map((cat) => {
          const active = selectedCategories.includes(cat);
          const catColor = colors.category[cat];
          return (
            <HapticPressable
              key={cat}
              style={[
                styles.chip,
                active
                  ? [styles.chipActive, { backgroundColor: catColor }]
                  : styles.chipInactive,
              ]}
              onPress={() => toggleCategory(cat)}
            >
              <SFIcon
                name={CATEGORY_ICONS[cat].sf}
                fallback={CATEGORY_ICONS[cat].fallback}
                size={14}
                color={active ? '#FFFFFF' : catColor}
              />
              <Text
                style={[
                  styles.chipLabel,
                  active ? styles.chipLabelActive : [styles.chipLabelInactive, { color: colors.text }],
                ]}
              >
                {CATEGORY_LABELS[cat]}
              </Text>
            </HapticPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  dropdown: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  resultsList: {
    paddingVertical: 4,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resultIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.text,
  },
  resultAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  chipsRow: {
    marginTop: 8,
    flexGrow: 0,
  },
  chipsContent: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  chipLabelInactive: {
    color: colors.text,
  },
});
