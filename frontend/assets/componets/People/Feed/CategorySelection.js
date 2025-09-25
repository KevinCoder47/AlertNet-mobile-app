// components/CategorySelection.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ColorContext'; // Add this import

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
  const { colors } = useTheme();

  const CategoryButton = ({ category }) => {
    const isSelected = selectedCategory === category.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          {
            backgroundColor: isSelected ? colors.surface : colors.card,
            borderColor: isSelected ? '#ff5621' : 'transparent',
          }
        ]}
        onPress={() => onCategorySelect(category.id)}
      >
        <Ionicons
          name={category.icon}
          size={24}
          color={isSelected ? '#ff5621' : colors.text}
        />
        <Text
          style={[
            styles.categoryText,
            {
              color: isSelected ? '#ff5621' : colors.text,
              fontWeight: isSelected ? '600' : '500',
            }
          ]}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Selection</Text>
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
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 2,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});

export default CategorySelection;
export { categories };