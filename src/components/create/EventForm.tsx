import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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
];

interface EventFormProps {
  title: string;
  onTitleChange: (text: string) => void;
  category: EventCategory;
  onCategoryChange: (cat: EventCategory) => void;
  date: Date | null;
  onDateChange: (date: Date) => void;
  startTime: Date | null;
  onStartTimeChange: (date: Date) => void;
  endTime: Date | null;
  onEndTimeChange: (date: Date) => void;
  description: string;
  onDescriptionChange: (text: string) => void;
}

export function EventForm({
  title,
  onTitleChange,
  category,
  onCategoryChange,
  date,
  onDateChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  description,
  onDescriptionChange,
}: EventFormProps) {
  return (
    <>
      {/* Event Title */}
      <TextInput
        style={styles.eventTitleInput}
        placeholder="Event title..."
        placeholderTextColor={colors.gray400}
        value={title}
        onChangeText={onTitleChange}
      />

      {/* Category pills */}
      <View style={styles.typePillRow}>
        {EVENT_CATEGORIES.slice(0, 3).map((item) => (
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
      <View style={[styles.typePillRow, { marginTop: 8 }]}>
        {EVENT_CATEGORIES.slice(3).map((item) => (
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
  eventTitleInput: {
    fontSize: 20,
    color: colors.text,
    fontFamily: "PlusJakartaSans_600SemiBold",
    paddingTop: 4,
    paddingBottom: 12,
  },
  typePillRow: {
    flexDirection: "row",
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
