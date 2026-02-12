import { useState } from "react";
import { Stack } from "expo-router";
import { SearchScreen } from "../../../src/screens/SearchScreen";
import { gradientHeaderOptions } from "../../../src/components/GradientHeader";

export default function SearchIndex() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          ...gradientHeaderOptions,
          headerSearchBarOptions: {
            placement: "inline",
            placeholder: "Search places, people, posts...",
            onChangeText: (event) => setSearchQuery(event.nativeEvent.text),
          },
        }}
      />
      <SearchScreen query={searchQuery} />
    </>
  );
}
