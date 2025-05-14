import { StyleSheet, View, TextInput, Image } from 'react-native';
import React from 'react';

const TopBarSearch = () => {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Image 
          source={require('../icons/search-light.png')} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search something..."
          placeholderTextColor="#757575"
        />
      </View>
    </View>
  );
};

export default TopBarSearch;

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
        marginBottom: 10,
    backgroundColor: "transparent"
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 46,
    borderBottomWidth: 1,
      borderBottomColor: '#000000',
    backgroundColor: "transparent"
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    // tintColor: '#757575',
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 14,
    fontFamily: 'Helvetica Light',
    color: '#333',
    marginTop: 5
  },
});