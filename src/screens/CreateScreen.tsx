import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Place, PostType } from '../types';
import { colors } from '../theme/colors';
import { useQuery } from '../hooks/useQuery';
import { useAuth } from '../context/AuthContext';
import { getPlaces } from '../services/places';
import { createPost } from '../services/posts';
import { uploadMedia } from '../services/storage';

const POST_TYPES: { type: PostType; icon: string; label: string }[] = [
  { type: 'photo', icon: 'image', label: 'Photo' },
  { type: 'video', icon: 'videocam', label: 'Video' },
  { type: 'text', icon: 'document-text', label: 'Text' },
];

export function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [postType, setPostType] = useState<PostType>('photo');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [content, setContent] = useState('');
  const [showPlacePicker, setShowPlacePicker] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const { data: places } = useQuery(getPlaces);
  const allPlaces = places ?? [];

  const pickMedia = async () => {
    const mediaType =
      postType === 'video'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!profile) {
      Alert.alert('Not signed in', 'Please sign in to create a post');
      return;
    }
    if (!selectedPlace) {
      Alert.alert('Select a place', 'Please select a place for your post');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Add content', 'Please write something about this place');
      return;
    }

    setPosting(true);
    try {
      let mediaUrl: string | undefined;

      if (mediaUri && postType !== 'text') {
        const extension = postType === 'video' ? 'mp4' : 'jpg';
        const mimeType = postType === 'video' ? 'video/mp4' : 'image/jpeg';
        const fileName = `${profile.id}-${Date.now()}.${extension}`;
        mediaUrl = await uploadMedia(mediaUri, fileName, mimeType);
      }

      await createPost({
        userId: profile.id,
        placeId: selectedPlace.id,
        type: postType,
        content: content.trim(),
        mediaUrl,
      });

      Alert.alert('Posted!', `Your ${postType} post about ${selectedPlace.name} has been shared.`, [
        {
          text: 'OK',
          onPress: () => {
            setContent('');
            setSelectedPlace(null);
            setMediaUri(null);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          style={[styles.postButton, (!selectedPlace || !content.trim() || posting) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={posting}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Post Type</Text>
        <View style={styles.typeRow}>
          {POST_TYPES.map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[styles.typeButton, postType === item.type && styles.typeButtonActive]}
              onPress={() => {
                setPostType(item.type);
                setMediaUri(null);
              }}
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
          <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
            {mediaUri ? (
              <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
            ) : (
              <>
                <Ionicons name={postType === 'photo' ? 'camera' : 'videocam'} size={32} color={colors.gray400} />
                <Text style={styles.mediaButtonText}>
                  Tap to add {postType}
                </Text>
              </>
            )}
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
            {allPlaces.map((place) => (
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
    minWidth: 60,
    alignItems: 'center',
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
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
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
