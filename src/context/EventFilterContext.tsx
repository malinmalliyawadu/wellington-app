import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type EventCategory = 'music' | 'comedy' | 'art' | 'food' | 'market' | 'community' | 'quiz' | 'craft' | 'kids' | 'cultural' | 'volunteering';
type DateRange = 'today' | 'tomorrow' | 'weekend' | 'month';

interface EventFilterContextType {
  selectedDateRange: DateRange | null;
  setSelectedDateRange: (range: DateRange | null) => void;
  selectedCategories: EventCategory[];
  toggleCategory: (category: EventCategory) => void;
  clearCategories: () => void;
  showFollowingOnly: boolean;
  setShowFollowingOnly: (show: boolean) => void;
  showFreeOnly: boolean;
  setShowFreeOnly: (show: boolean) => void;
  openDrawer: () => void;
  registerOpenDrawer: (fn: () => void) => void;
}

const EventFilterContext = createContext<EventFilterContextType | null>(null);

export function EventFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const openDrawerRef = useRef<() => void>(() => {});

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const clearCategories = () => setSelectedCategories([]);

  const openDrawer = useCallback(() => {
    openDrawerRef.current();
  }, []);

  const registerOpenDrawer = useCallback((fn: () => void) => {
    openDrawerRef.current = fn;
  }, []);

  return (
    <EventFilterContext.Provider
      value={{
        selectedDateRange,
        setSelectedDateRange,
        selectedCategories,
        toggleCategory,
        clearCategories,
        showFollowingOnly,
        setShowFollowingOnly,
        showFreeOnly,
        setShowFreeOnly,
        openDrawer,
        registerOpenDrawer,
      }}
    >
      {children}
    </EventFilterContext.Provider>
  );
}

export function useEventFilters() {
  const ctx = useContext(EventFilterContext);
  if (!ctx) throw new Error('useEventFilters must be used within EventFilterProvider');
  return ctx;
}
