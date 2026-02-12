import React, { createContext, useContext, useState } from 'react';
import { PlaceCategory } from '../types';

interface MapFilterContextType {
  selectedCategories: PlaceCategory[];
  toggleCategory: (category: PlaceCategory) => void;
  clearCategories: () => void;
  showFollowingOnly: boolean;
  setShowFollowingOnly: (show: boolean) => void;
}

const MapFilterContext = createContext<MapFilterContextType | null>(null);

export function MapFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>([]);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);

  const toggleCategory = (category: PlaceCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const clearCategories = () => setSelectedCategories([]);

  return (
    <MapFilterContext.Provider
      value={{
        selectedCategories,
        toggleCategory,
        clearCategories,
        showFollowingOnly,
        setShowFollowingOnly,
      }}
    >
      {children}
    </MapFilterContext.Provider>
  );
}

export function useMapFilters() {
  const ctx = useContext(MapFilterContext);
  if (!ctx) throw new Error('useMapFilters must be used within MapFilterProvider');
  return ctx;
}
