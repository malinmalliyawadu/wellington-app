import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mockPlaces } from '../data/mockPlaces';
import { Place, PostType } from '../types';
import { colors } from '../theme/colors';

const POST_TYPES: { type: PostType; icon: string; label: string }[] = [
  { type: 'photo', icon: 'image', label: 'Photo' },
  { type: 'video', icon: 'videocam', label: 'Video' },
  { type: 'text', icon: 'document-text', label: 'Text' },
];

export function CreateScreen() {
  const insets = useSafeAreaInsets();
  const [postType, setPostType] = useState<PostType>('photo');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [content, setContent] = useState('');
  const [showPlacePicker, setShowPlacePicker] = useState(false);

  const handlePost = () => {
    if (!selectedPlace) {
      Alert.alert('Select a place', 'Please select a place for your post');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Add content', 'Please write something about this place');
      return;
    }
    Alert.alert('Posted!', `Your ${postType} post about ${selectedPlace.name} has been shared.`, [
      { text: 'OK', onPress: () => {
        setContent('');
        setSelectedPlace(null);
      }}
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          style={[styles.postButton, (!selectedPlace || !content.trim()) && styles.postButtonDisabled]}
          onPress={handlePost}
        >
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Post Type</Text>
        <View style={styles.typeRow}>
          {POST_TYPES.map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[styles.typeButton, postType === item.type && styles.typeButtonActive]}
              onPress={() => setPostType(item.type)}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={postType === item.type ? colors.primary : colors.gray400}
              />
              <Text style={[styles.typeLabel, postType === item.type && styles.typeLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {postType !== 'text' && (
          <TouchableOpacity style={styles.mediaButton}>
            <Ionicons name={postType === 'photo' ? 'camera' : 'videocam'} size={32} color={colors.gray400} />
            <Text style={styles.mediaButtonText}>
              Tap to add {postType}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Place</Text>
        <TouchableOpacity
          style={styles.placeSelector}
          onPress={() => setShowPlacePicker(!showPlacePicker)}
        >
          {selectedPlace ? (
            <View style={styles.selectedPlace}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.selectedPlaceText}>{selectedPlace.name}</Text>
            </View>
          ) : (
            <View style={styles.selectedPlace}>
              <Ionicons name="location-outline" size={20} color={colors.gray400} />
              <Text style={styles.placeholderText}>Select a place</Text>
            </View>
          )}
          <Ionicons
            name={showPlacePicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.gray400}
          />
        </TouchableOpacity>

        {showPlacePicker && (
          <View style={styles.placeList}>
            {mockPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={[
                  styles.placeItem,
                  selectedPlace?.id === place.id && styles.placeItemSelected,
                ]}
                onPress={() => {
                  setSelectedPlace(place);
                  setShowPlacePicker(false);
                }}
              >
                <View style={[styles.categoryDot, { backgroundColor: colors.category[place.category] }]} />
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeAddress}>{place.address}</Text>
                </View>
                {selectedPlace?.id === place.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>What do you want to share?</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Write about this place..."
          placeholderTextColor={colors.gray400}
          multiline
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
        />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  postButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    marginTop: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray500,
  },
  typeLabelActive: {
    color: colors.primary,
  },
  mediaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    backgroundColor: colors.gray100,
  },
  mediaButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray500,
  },
  placeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
  },
  selectedPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedPlaceText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.gray400,
  },
  placeList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.background,
    maxHeight: 250,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  placeItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  placeAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  textInput: {
    height: 120,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
    fontSize: 15,
    color: colors.text,
  },
});
