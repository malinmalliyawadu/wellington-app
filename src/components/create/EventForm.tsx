import React from "react";
import { View, Text, TextInput, Image, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SFIcon } from "../SFIcon";
import { HapticPressable } from "../HapticPressable";
import { EventCategory } from "../../types";
import { colors } from "../../theme/colors";

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
  return (
    <>
      {/* Cover Image */}
      <HapticPressable
        style={[styles.coverImageButton, imageUri && styles.coverImageButtonFilled]}
        onPress={onPickImage}
      >
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.coverImagePreview} />
            <View style={styles.coverImageOverlay}>
              <SFIcon name="camera.fill" fallback="camera" size={20} color="#FFFFFF" />
              <Text style={styles.coverImageOverlayText}>Change cover</Text>
            </View>
          </>
        ) : (
          <>
            <SFIcon name="photo.fill" fallback="image" size={28} color={colors.gray400} />
            <Text style={styles.coverImageText}>Add a cover photo</Text>
          </>
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

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      <DateTimePicker
        value={date ?? new Date()}
        mode="date"
        display="inline"
        minimumDate={new Date()}
        onChange={(_event, d) => {
          if (d) onDateChange(d);
        }}
        accentColor={colors.primary}
        style={styles.datePicker}
      />

      {/* Start time */}
      <Text style={styles.label}>Start time</Text>
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

      {/* End time */}
      <Text style={styles.label}>End time (optional)</Text>
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

      {/* Price */}
      <Text style={styles.label}>Price (optional)</Text>
      <TextInput
        style={styles.priceInput}
        placeholder="Leave empty for free"
        placeholderTextColor={colors.gray400}
        value={price}
        onChangeText={onPriceChange}
        keyboardType="decimal-pad"
      />

      {/* Description */}
      <TextInput
        style={styles.eventDescriptionInput}
        placeholder="Tell people about this event..."
        placeholderTextColor={colors.gray400}
        multiline
        value={description}
        onChangeText={onDescriptionChange}
        textAlignVertical="top"
      />
    </>
  );
}

const styles = StyleSheet.create({
  coverImageButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 160,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    overflow: "hidden",
  },
  coverImageButtonFilled: {
    height: 180,
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
  coverImageText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray500,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  eventTitleInput: {
    fontSize: 20,
    color: colors.text,
    fontFamily: "PlusJakartaSans_600SemiBold",
    paddingTop: 4,
    paddingBottom: 12,
  },
  typePillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typePillActive: {
    backgroundColor: colors.primary + "12",
  },
  typePillLabel: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.gray500,
  },
  typePillLabelActive: {
    color: colors.primary,
  },
  label: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.text,
    marginBottom: 10,
    marginTop: 20,
  },
  datePicker: {
    alignSelf: "center",
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
    backgroundColor: colors.gray100,
  },
  eventDescriptionInput: {
    fontSize: 15,
    color: colors.text,
    fontFamily: "PlusJakartaSans_500Medium",
    minHeight: 100,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.gray100,
  },
});
