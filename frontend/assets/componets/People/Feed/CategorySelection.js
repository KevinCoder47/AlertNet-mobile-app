// components/CategorySelection.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const categories = [
  { id: 'fire', name: 'Fire Alert', icon: 'flame' },
  { id: 'safety', name: 'Safety & Crime', icon: 'shield-checkmark' },
  { id: 'utility', name: 'Utility Issues', icon: 'water' },
  { id: 'announcement', name: 'General Announcement', icon: 'megaphone' },
  { id: 'suspicious', name: 'Suspicious Activity', icon: 'person' },
  { id: 'road', name: 'Road / Access Block', icon: 'car' },
  { id: 'lost', name: 'Lost & Found', icon: 'paw' },
  { id: 'noise', name: 'Noise / Party', icon: 'musical-notes' },
];

const CategorySelection = ({ selectedCategory, onCategorySelect }) => {
  const CategoryButton = ({ category }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.selectedCategory,
      ]}
      onPress={() => onCategorySelect(category.id)}
    >
      <Ionicons
        name={category.icon}
        size={24}
        color={selectedCategory === category.id ? '#ff5621' : '#666'}
      />
      <Text
        style={[
          styles.categoryText,
          selectedCategory === category.id && styles.selectedCategoryText,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Category Selection</Text>
      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <CategoryButton key={category.id} category={category} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '47%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCategory: {
    backgroundColor: '#fff5f3',
    borderColor: '#ff5621',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#ff5621',
    fontWeight: '600',
  },
});

export default CategorySelection;
export { categories };