import { 
  StyleSheet, 
  View, 
  TextInput, 
  Image, 
  Dimensions, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  Keyboard 
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ColorContext';
import { useFontSize } from '../contexts/FontSizeContext';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

const WalkPartnerSearchBar = ({
  isTapWhere, 
  setISTapWhere,
  locationName, 
  setIsDestinationDone,
  setIsStartPoint, 
  setIsStartPointDone,
  dropoffLocation, 
  setDropoffLocation,
  onDestinationSelect // Add this prop to receive coordinates
}) => {
  const { colors, isDark } = useTheme();
  const { getScaledFontSize } = useFontSize();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [activeInput, setActiveInput] = useState('pickup');

  const styles = getStyles(colors, isDark, getScaledFontSize);

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

  // Function to get place details including coordinates
const getPlaceDetails = async (placeId) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=geometry,name`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    const data = await response.json();
    
    if (data.result && data.result.geometry) {
      console.log('Place details response:', data.result);
      return {
        latitude: data.result.geometry.location.lat,
        longitude: data.result.geometry.location.lng,
        name: data.result.name || ''
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
};

const handlePlaceSelect = async (place) => {
  const selectedDescription = place.description;
  
  if (activeInput === 'pickup') {
    setPickupLocation(selectedDescription);
    setIsStartPointDone(true);
  } else {
    setDropoffLocation(selectedDescription);
    setIsDestinationDone(true);
    setIsStartPoint(true);
    
    // Get coordinates for the selected destination
    const placeDetails = await getPlaceDetails(place.place_id);
    if (placeDetails && onDestinationSelect) {
      console.log('Sending coordinates to parent:', placeDetails);
      onDestinationSelect({
        latitude: placeDetails.latitude,
        longitude: placeDetails.longitude
      });
    } else {
      console.error('Failed to get coordinates for place:', place);
    }
  }
  
  setQuery(selectedDescription);
  setSuggestions([]);
  Keyboard.dismiss();
};

  const handleInputFocus = (inputType) => {
    setActiveInput(inputType);
    if (inputType === 'pickup') {
      setQuery(pickupLocation || locationName);
    } else {
      setQuery(dropoffLocation);
    }
  };

  const handleQueryChange = (text) => {
    setQuery(text);
    if (activeInput === 'pickup') {
      setPickupLocation(text);
    } else {
      setDropoffLocation(text);
    }
  };

  const handleClose = () => {
    setISTapWhere(false);
    setQuery('');
    setSuggestions([]);
    Keyboard.dismiss();
  };

  if (isTapWhere) {
    return (
      <View style={[styles.expandedContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
        >
          <Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
        </TouchableOpacity>

        <View style={styles.locationContainer}>
          {/* Pickup Location */}
          <View style={styles.locationRow}>
            <View style={styles.dotContainer}>
              <View style={[styles.pickupOuter, { backgroundColor: colors.text }]}>
                <View style={[styles.pickupInner, { backgroundColor: colors.altText }]} />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.locationLabel, { color: "#cbcbcbff" }]}>START POINT</Text>
              <TextInput
                style={[styles.locationInput, { 
                  color: colors.text, 
                  borderBottomColor: colors.border 
                }]}
                placeholder="Horizon Heights Accomodation"
                placeholderTextColor={isDark ? "#454545ff" : "#757575"}
                value={activeInput === 'pickup' ? query : pickupLocation}
                onChangeText={handleQueryChange}
                onFocus={() => handleInputFocus('pickup')}
                autoFocus={true}
              />
            </View>
          </View>

          {/* Connecting line */}
          <View style={styles.connectingLineContainer}>
            <View style={[styles.connectingLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Drop off Location */}
          <View style={styles.locationRow}>
            <View style={styles.dotContainer}>
              <View style={[styles.dropoffDot, { backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.locationLabel, { color: "#cbcbcbff" }]}>DESTINATION</Text>
              <TextInput
                style={[styles.locationInput, { 
                  color: colors.text, 
                  borderBottomColor: colors.border 
                }]}
                placeholder="UJ Kingsway Campus"
                placeholderTextColor={isDark ? "#454545ff" : "#757575"}
                value={activeInput === 'dropoff' ? query : dropoffLocation}
                onChangeText={handleQueryChange}
                onFocus={() => handleInputFocus('dropoff')}
              />
            </View>
          </View>
        </View>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            style={[styles.suggestionsList, { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border
            }]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                onPress={() => handlePlaceSelect(item)}
              >
                <Ionicons 
                  name="location" 
                  size={10}
                  color={isDark ? "#D6D6D6" : "#606061ff"} 
                  style={{paddingRight: 10}}
                />
                <Text 
                  style={[styles.suggestionText, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // Original collapsed search bar style
  return (
    <View style={[styles.container, {
      height: height * 0.065,
      backgroundColor: colors.background,
      width: width,
      alignSelf: 'center',
      paddingTop: 10
    }]}>
      <TouchableOpacity 
        style={styles.searchContainer} 
        onPress={() => setISTapWhere(true)}
      >
        {/* Original dot-in-square indicator */}
        <View style={styles.collapsedIndicator}>
          <View style={[styles.collapsedIndicatorOuter, { backgroundColor: colors.text }]}>
            <View style={[styles.collapsedIndicatorInner, { backgroundColor: colors.altText }]} />
          </View>
        </View>
        
        <TextInput
          style={[styles.searchBar, { color: colors.text }]}
          placeholder="Where to?"
          placeholderTextColor={isDark ? "#BDBDBD" : "#757575"}
          value={query}
          onChangeText={setQuery}
          fontSize={getScaledFontSize(20)}
          fontFamily="Helvetica Bold"
          editable={false}
          onPress={() => setISTapWhere(true)}
        />
      </TouchableOpacity>
    </View>
  );
};

export default WalkPartnerSearchBar;

const getStyles = (colors, isDark, getScaledFontSize) => StyleSheet.create({
  expandedContainer: {
    width: width * 0.9,
    minHeight: height * 0.3,
    maxHeight: height * 0.6,
    alignSelf: 'center',
    borderRadius: 12,
    padding: 16,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    // position: 'absolute',
    // top: height * 0.53

  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  closeButtonText: {
    fontSize: getScaledFontSize(22),
    lineHeight: getScaledFontSize(24),
  },
  locationContainer: {
    marginTop: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dotContainer: {
    width: 24,
    alignItems: 'center',
  },
  pickupOuter: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupInner: {
    width: 4,
    height: 4,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectingLineContainer: {
    width: 24,
    alignItems: 'center',
    height: 20,
  },
  connectingLine: {
    width: 2,
    height: 20,
    opacity: 0.5,
  },
  inputContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: getScaledFontSize(8),
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationInput: {
    fontSize: getScaledFontSize(16),
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 10,
    marginLeft: width * 0.05,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C1C1C1',
    marginRight: width * 0.09,
  },
  collapsedIndicator: {
    marginLeft: 5
  },
  collapsedIndicatorOuter: {
    width: 10, 
    height: 10, 
    justifyContent: "center", 
    alignItems: "center", 
  },
  collapsedIndicatorInner: {
    width: 4, 
    height: 4, 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    flex: 1,
    fontSize: getScaledFontSize(20),
    fontFamily: 'Helvetica Bold',
    marginLeft: 5
  },
  suggestionsList: {
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: getScaledFontSize(16),
  },
});