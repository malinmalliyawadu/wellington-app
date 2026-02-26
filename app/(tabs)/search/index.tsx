import { useState, useRef, useCallback } from "react";
import { Stack } from "expo-router";
import type { SearchBarCommands } from "react-native-screens";
import { SearchScreen } from "../../../src/screens/SearchScreen";

export default function SearchIndex() {
  const [searchQuery, setSearchQuery] = useState("");
  const searchBarRef = useRef<SearchBarCommands>(null) as React.RefObject<SearchBarCommands>;

  const handleQueryChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
    searchBarRef.current?.setText(newQuery);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          title: "",
          headerSearchBarOptions: {
            ref: searchBarRef,
            placement: "inline",
            placeholder: "Search places, people...",
            onChangeText: (event) => setSearchQuery(event.nativeEvent.text),
          },
        }}
      />
      <SearchScreen query={searchQuery} onQueryChange={handleQueryChange} />
    </>
  );
}
