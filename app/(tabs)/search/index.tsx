import { useState } from 'react';
import { Stack } from 'expo-router';
import { SearchScreen } from '../../../src/screens/SearchScreen';

export default function SearchIndex() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Search',
          headerSearchBarOptions: {
            placement: 'automatic',
            placeholder: 'Search places, people, posts...',
            onChangeText: (event) => setSearchQuery(event.nativeEvent.text),
          },
        }}
      />
      <SearchScreen query={searchQuery} />
    </>
  );
}

