import React, { createContext, useContext, useState } from 'react';

type EventCategory = 'music' | 'comedy' | 'art' | 'food' | 'market' | 'community' | 'quiz' | 'craft' | 'kids' | 'cultural';
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
}

const EventFilterContext = createContext<EventFilterContextType | null>(null);

export function EventFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const clearCategories = () => setSelectedCategories([]);

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
