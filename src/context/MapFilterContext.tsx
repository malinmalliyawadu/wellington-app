import React, { createContext, useCallback, useContext, useState } from 'react';
import { PlaceCategory, TrailDifficulty } from '../types';

interface MapFilterContextType {
  selectedCategories: PlaceCategory[];
  toggleCategory: (category: PlaceCategory) => void;
  clearCategories: () => void;
  showFollowingOnly: boolean;
  setShowFollowingOnly: (show: boolean) => void;
  hideVisited: boolean;
  setHideVisited: (hide: boolean) => void;
  showTrails: boolean;
  setShowTrails: (show: boolean) => void;
  showEvents: boolean;
  setShowEvents: (show: boolean) => void;
  selectedTrailDifficulties: TrailDifficulty[];
  toggleTrailDifficulty: (d: TrailDifficulty) => void;
  clearTrailDifficulties: () => void;
}

const MapFilterContext = createContext<MapFilterContextType | null>(null);

export function MapFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>([]);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [hideVisited, setHideVisited] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [selectedTrailDifficulties, setSelectedTrailDifficulties] = useState<TrailDifficulty[]>(['easy', 'moderate', 'hard']);

  const toggleCategory = (category: PlaceCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const clearCategories = () => setSelectedCategories([]);

  const toggleTrailDifficulty = (d: TrailDifficulty) => {
    setSelectedTrailDifficulties((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  const clearTrailDifficulties = () => setSelectedTrailDifficulties(['easy', 'moderate', 'hard']);

  return (
    <MapFilterContext.Provider
      value={{
        selectedCategories,
        toggleCategory,
        clearCategories,
        showFollowingOnly,
        setShowFollowingOnly,
        hideVisited,
        setHideVisited,
        showTrails,
        setShowTrails: useCallback((show: boolean) => {
          setShowTrails(show);
          if (!show) setSelectedTrailDifficulties([]);
          else setSelectedTrailDifficulties(['easy', 'moderate', 'hard']);
        }, []),
        showEvents,
        setShowEvents,
        selectedTrailDifficulties,
        toggleTrailDifficulty,
        clearTrailDifficulties,
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
