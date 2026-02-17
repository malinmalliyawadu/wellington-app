import { useState } from "react";
import { Stack } from "expo-router";
import { SearchScreen } from "../../../src/screens/SearchScreen";

export default function SearchIndex() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          title: "",
          headerSearchBarOptions: {
            placement: "inline",
            placeholder: "Search places, people...",
            onChangeText: (event) => setSearchQuery(event.nativeEvent.text),
          },
        }}
      />
      <SearchScreen query={searchQuery} onQueryChange={setSearchQuery} />
    </>
  );
}
