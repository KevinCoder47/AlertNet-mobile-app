import { StyleSheet, View, TextInput, Image, Dimensions, FlatList, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ColorContext';
import { GOOGLE_MAPS_API_KEY } from '@env'

const {width, height} = Dimensions.get("window")

const WalkPartnerSearchBar = ({isTapWhere, setISTapWhere}) => {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (query.length > 2) {
      searchPlaces(query);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const searchPlaces = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}&components=country:za&language=en`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      
      const data = await response.json();
      if (data.predictions) {
        setSuggestions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (place) => {
    setQuery(place.description);
    setSuggestions([]);
    // Handle place selection here
  };

  return (
    <View style={[styles.container, {
      height: isTapWhere ? height * 0.3 : height * 0.065,
      backgroundColor: colors.background,
      width: width ,
      alignSelf: 'center',
      paddingTop: 10
      
    }]}>
      <TouchableOpacity style={styles.searchContainer} onPress={() => {setISTapWhere(!isTapWhere)}}>
        

        {/* 'where to' square */}
        <View style={{ width: 10, height: 10, backgroundColor: colors.text, justifyContent: "center", alignItems: "center", marginLeft: 5 }}>
          <View style={{ width: 4, height: 4, backgroundColor: colors.altText }}>
           
          </View>
        </View>
        <TextInput
          style={[styles.searchBar, { color: colors.text }]}
          placeholder="Where to?"
          placeholderTextColor={isDark ? "#BDBDBD" : "#757575"}
          value={query}
          onChangeText={setQuery}
          fontSize={20}
          fontFamily="Helvetica Bold"
          onPress={() => {setISTapWhere(true)}}
        />
      </TouchableOpacity>
      
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          style={[styles.suggestionsList, { backgroundColor: colors.background }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handlePlaceSelect(item)}
            >
              <Text style={[styles.suggestionText, { color: colors.text }]}>
                {item.description}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}


    </View>
  );
};

export default WalkPartnerSearchBar;

const styles = StyleSheet.create({
  container: {
    // position: 'relative',
  },
  searchContainer: {
    marginTop: 0,
    marginBottom: 10,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: width * 0.05,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C1C1C1',
    backgroundColor: "transparent",
    marginRight: width * 0.09,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 30,
    height: 46,
    flex: 1,
    fontSize: 20,
    fontFamily: 'Helvetica Bold',
    marginLeft: 5
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  suggestionsList: {
    position: 'absolute',
    top: 60,
    left: width * 0.05,
    right: width * 0.09,
    backgroundColor: colors => colors.background,
    zIndex: 10,
    maxHeight: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
  },
});