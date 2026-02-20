import React, { createContext, useContext, useState, useCallback, useRef } from "react";

interface MapPlaceSelectionContextType {
  selectedPlaceId: string | null;
  selectPlace: (placeId: string) => void;
  sheetOpenRef: React.MutableRefObject<boolean>;
}

const MapPlaceSelectionContext = createContext<MapPlaceSelectionContextType | null>(null);

export function MapPlaceSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const sheetOpenRef = useRef(false);

  const selectPlace = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId);
  }, []);

  return (
    <MapPlaceSelectionContext.Provider value={{ selectedPlaceId, selectPlace, sheetOpenRef }}>
      {children}
    </MapPlaceSelectionContext.Provider>
  );
}

export function useMapPlaceSelection() {
  const ctx = useContext(MapPlaceSelectionContext);
  if (!ctx) throw new Error("useMapPlaceSelection must be used within MapPlaceSelectionProvider");
  return ctx;
}
