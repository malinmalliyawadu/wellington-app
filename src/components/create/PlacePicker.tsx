import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { SFIcon } from "../SFIcon";
import { HapticPressable } from "../HapticPressable";
import { Place } from "../../types";
import { useTheme, type Colors } from "../../theme/ThemeContext";

const glassEnabled = isLiquidGlassAvailable();

interface PlacePickerProps {
  selectedPlace: Place | null;
  onPress: () => void;
  onClear: () => void;
}

export function PlacePicker({
  selectedPlace,
  onPress,
  onClear,
}: PlacePickerProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  if (selectedPlace) {
    return (
      <>
        <View style={styles.placePillRow}>
          {glassEnabled ? (
            <HapticPressable onPress={onPress}>
              <GlassView style={styles.placePillGlass} glassEffectStyle="regular">
                <SFIcon name="mappin" fallback="location" size={14} color={colors.primary} />
                <Text style={styles.placePillText}>{selectedPlace.name}</Text>
                <HapticPressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <SFIcon name="xmark" fallback="close" size={12} color={colors.primary} />
                </HapticPressable>
              </GlassView>
            </HapticPressable>
          ) : (
            <HapticPressable style={styles.placePill} onPress={onPress}>
              <SFIcon name="mappin" fallback="location" size={14} color={colors.primary} />
              <Text style={styles.placePillText}>{selectedPlace.name}</Text>
              <HapticPressable
                onPress={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <SFIcon name="xmark" fallback="close" size={12} color={colors.primary} />
              </HapticPressable>
            </HapticPressable>
          )}
          <Text style={styles.placePillAddress}>{selectedPlace.address}</Text>
        </View>

        <View style={styles.mapPreview}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
              }}
              title={selectedPlace.name}
            />
          </MapView>
        </View>
      </>
    );
  }

  return (
    <HapticPressable style={styles.placeAddRow} onPress={onPress}>
      <View style={styles.placeAddIconWrap}>
        <SFIcon name="mappin" fallback="location" size={16} color={colors.primary} />
      </View>
      <Text style={styles.placeAddTitle}>Location</Text>
      <SFIcon name="chevron.right" fallback="chevron-forward" size={14} color={colors.gray300} />
    </HapticPressable>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  placePillRow: {
    marginBottom: 16,
  },
  placePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: colors.primary + "10",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  placePillGlass: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  placePillText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.primary,
  },
  placePillAddress: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginLeft: 4,
  },
  placeAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderStyle: "dashed",
  },
  placeAddIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  placeAddTitle: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  mapPreview: {
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 8,
  },
  map: {
    flex: 1,
  },
});
