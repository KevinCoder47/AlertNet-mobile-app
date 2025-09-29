import React from 'react';
import { View, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ value, onChange }) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#333' : '#eee' }]}>
      <Ionicons name="search" size={18} color={isDark ? '#ccc' : '#444'} style={{ marginRight: 6 }} />
      <TextInput
        placeholder="Search"
        placeholderTextColor={isDark ? '#aaa' : '#666'}
        value={value}
        onChangeText={onChange}
        style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 8,
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
});

export default SearchBar;
