import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Image } from "expo-image";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SFIcon } from "../SFIcon";
import { HapticPressable } from "../HapticPressable";
import { EventCategory } from "../../types";
import { useTheme, type Colors } from "../../theme/ThemeContext";

const EVENT_CATEGORIES: { type: EventCategory; label: string }[] = [
  { type: "music", label: "Music" },
  { type: "comedy", label: "Comedy" },
  { type: "art", label: "Art" },
  { type: "food", label: "Food" },
  { type: "market", label: "Market" },
  { type: "community", label: "Community" },
  { type: "quiz", label: "Quiz" },
  { type: "craft", label: "Craft" },
  { type: "kids", label: "Kids" },
  { type: "cultural", label: "Cultural" },
  { type: "volunteering", label: "Volunteering" },
];

interface EventFormProps {
  title: string;
  onTitleChange: (text: string) => void;
  category: EventCategory;
  onCategoryChange: (cat: EventCategory) => void;
  imageUri: string | null;
  onPickImage: () => void;
  date: Date | null;
  onDateChange: (date: Date) => void;
  startTime: Date | null;
  onStartTimeChange: (date: Date) => void;
  endTime: Date | null;
  onEndTimeChange: (date: Date) => void;
  description: string;
  onDescriptionChange: (text: string) => void;
  price: string;
  onPriceChange: (text: string) => void;
}

export function EventForm({
  title,
  onTitleChange,
  category,
  onCategoryChange,
  imageUri,
  onPickImage,
  date,
  onDateChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  description,
  onDescriptionChange,
  price,
  onPriceChange,
}: EventFormProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <>
      {/* Cover Image */}
      <HapticPressable
        style={[styles.coverImageButton, imageUri && styles.coverImageButtonFilled]}
        onPress={onPickImage}
      >
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.coverImagePreview} contentFit="cover" transition={200} />
            <View style={styles.coverImageOverlay}>
              <SFIcon name="camera.fill" fallback="camera" size={20} color="#FFFFFF" />
              <Text style={styles.coverImageOverlayText}>Change cover</Text>
            </View>
          </>
        ) : (
          <View style={styles.coverImageEmpty}>
            <View style={styles.coverImageIconWrap}>
              <SFIcon name="photo.fill" fallback="image" size={24} color={colors.primary} />
            </View>
            <Text style={styles.coverImageTitle}>Add a cover photo</Text>
            <Text style={styles.coverImageSubtitle}>16:9 recommended</Text>
          </View>
        )}
      </HapticPressable>

      {/* Event Title */}
      <TextInput
        style={styles.eventTitleInput}
        placeholder="Event title..."
        placeholderTextColor={colors.gray400}
        value={title}
        onChangeText={onTitleChange}
      />

      {/* Category pills */}
      <View style={styles.typePillWrap}>
        {EVENT_CATEGORIES.map((item) => (
          <HapticPressable
            key={item.type}
            style={[
              styles.typePill,
              category === item.type && styles.typePillActive,
            ]}
            onPress={() => onCategoryChange(item.type)}
          >
            <Text
              style={[
                styles.typePillLabel,
                category === item.type && styles.typePillLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </HapticPressable>
        ))}
      </View>

      {/* Date & Time */}
      <Text style={[styles.label, styles.sectionLabel]}>Date & Time</Text>
      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={styles.fieldLabel}>Date</Text>
          <DateTimePicker
            value={date ?? new Date()}
            mode="date"
            display="compact"
            minimumDate={new Date()}
            onChange={(_event, d) => {
              if (d) onDateChange(d);
            }}
            accentColor={colors.primary}
            style={styles.timePicker}
          />
        </View>
        <View style={styles.timeField}>
          <Text style={styles.fieldLabel}>Start</Text>
          <DateTimePicker
            value={startTime ?? new Date()}
            mode="time"
            display="compact"
            minuteInterval={5}
            onChange={(_event, d) => {
              if (d) onStartTimeChange(d);
            }}
            accentColor={colors.primary}
            style={styles.timePicker}
          />
        </View>
        <View style={styles.timeField}>
          <Text style={styles.fieldLabel}>End</Text>
          <DateTimePicker
            value={endTime ?? startTime ?? new Date()}
            mode="time"
            display="compact"
            minuteInterval={5}
            onChange={(_event, d) => {
              if (d) onEndTimeChange(d);
            }}
            accentColor={colors.primary}
            style={styles.timePicker}
          />
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.label}>Price (optional)</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="Leave empty for free"
          placeholderTextColor={colors.gray400}
          value={price}
          onChangeText={onPriceChange}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
        <TextInput
          style={styles.eventDescriptionInput}
          placeholder="Tell people about this event..."
          placeholderTextColor={colors.gray400}
          multiline
          value={description}
          onChangeText={onDescriptionChange}
          textAlignVertical="top"
        />
      </View>
    </>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  coverImageButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 170,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderStyle: "dashed",
  },
  coverImageButtonFilled: {
    height: 190,
    borderWidth: 0,
    borderStyle: "solid",
  },
  coverImagePreview: {
    width: "100%",
    height: "100%",
  },
  coverImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  coverImageOverlayText: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#FFFFFF",
  },
  coverImageEmpty: {
    alignItems: "center",
  },
  coverImageIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  coverImageTitle: {
    fontSize: 15,
    color: colors.text,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  coverImageSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "PlusJakartaSans_500Medium",
    marginTop: 2,
  },
  eventTitleInput: {
    fontSize: 22,
    color: colors.text,
    fontFamily: "PlusJakartaSans_700Bold",
    paddingTop: 16,
    paddingBottom: 8,
  },
  typePillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
  },
  typePillActive: {
    backgroundColor: colors.primary + "18",
  },
  typePillLabel: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.gray500,
  },
  typePillLabelActive: {
    color: colors.primary,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  sectionCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.gray100,
  },
  label: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 0,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionLabel: {
    marginTop: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.textMuted,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  timeField: {
    flex: 1,
  },
  timePicker: {
    alignSelf: "flex-start",
    marginLeft: -10,
  },
  priceInput: {
    fontSize: 15,
    color: colors.text,
    fontFamily: "PlusJakartaSans_500Medium",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  eventDescriptionInput: {
    fontSize: 15,
    color: colors.text,
    fontFamily: "PlusJakartaSans_500Medium",
    minHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
});
