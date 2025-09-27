import React, { useState } from 'react';
import { StyleSheet, Text, View, Dimensions, Image, TouchableOpacity, Modal, FlatList, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';
import { useNotifications } from '../contexts/NotificationContext';


const { width, height } = Dimensions.get('window');

// Replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const WalkStartPoint = ({ setIsDestinationDone, setIsSearchPartner, setIsStartPoint, onStartPointSelect }) => {
  console.log("WalkStartPoint component rendered");
  const [isSending, setIsSending] = useState(false); // Add loading state
  const [isDark] = useState(false);
  const [showMeetUpDropdown, setShowMeetUpDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [selectedMeetUpPoint, setSelectedMeetUpPoint] = useState('APB Campus West Entrance');
  const [selectedGender, setSelectedGender] = useState('Any');
  const [showStreetViewModal, setShowStreetViewModal] = useState(false);
  const { sendWalkRequest } = useNotifications();
  const handleSearch = async () => {
    console.log("Search button pressed");
    
    if (isSending) {
      console.log("Already sending a request, please wait...");
      return;
    }
    setIsSearchPartner(true);
    setIsStartPoint(false);
    setIsSending(true);

    const walkData = {
      walkFrom: 'UJ APB Campus',
      walkTo: 'Res - Richmond 50 Rd',
      time: '5 mins',
      partnerName: 'Kevin Serakalala',
      partnerInitials: 'KS',
      currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      requestId: Math.random().toString(36).substring(7),
    };

    try {
      // Send the walk request via FCM
      await sendWalkRequest(walkData);
      
      // Show searching UI
      setIsSearchPartner(true);
      setIsStartPoint(false);
      
    } catch (error) {
      console.error("💥 Error in handleSearch:", error);
      alert("Failed to send walk request. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const colors = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
  };

  const meetupPoints = [
    'APB Campus West Entrance',
    'APB Campus East Entrance',
    'APK Campus Main Entrance',
    'APK Campus North Entrance',
    'DFC Campus South Entrance',
    'DFC Campus Student Center',
    'SWC Campus Main Gate',
    'SWC Campus Library Entrance',
    'Horizon Heights Residence',
    'Campus Square Main Entrance'
  ];

  const genderOptions = [
    'Any',
    'Male',
    'Female',
    // 'Non-binary'
  ];

  // Coordinates for each meet-up point (example coordinates for Johannesburg universities)
const meetupPointCoordinates = {
  'APB Campus West Entrance': { latitude: -26.1872365, longitude: 28.0124719 },
  'APB Campus East Entrance': { latitude: -26.1897725, longitude: 28.0180352 },
  'APK Campus Main Entrance': { latitude: -26.1825926, longitude: 27.9991477 },
  'APK Campus North Entrance': { latitude: -26.18547, longitude: 27.99802 },
  'DFC Campus South Entrance': { latitude: -26.1969, longitude: 28.0436 },
  'DFC Campus Student Center': { latitude: -26.1965, longitude: 28.0441 },
  'SWC Campus Main Gate': { latitude: -26.2625, longitude: 27.8767 },
  'SWC Campus Library Entrance': { latitude: -26.2621, longitude: 27.8775 },
  'Horizon Heights Residence': { latitude: -26.1852, longitude: 28.0102 },
  'Campus Square Main Entrance': { latitude: -26.1802, longitude: 28.0054 },
};


const handleMeetUpSelect = (point) => {
  console.log("Meet-up point selected:", point);
  setSelectedMeetUpPoint(point);
  setShowMeetUpDropdown(false);
  
  // Pass the coordinates back to parent
  if (onStartPointSelect) {
    onStartPointSelect(meetupPointCoordinates[point]);
  }
};

  const handleGenderSelect = (gender) => {
    console.log("Gender selected:", gender);
    setSelectedGender(gender);
    setShowGenderDropdown(false);
  };

  const renderMeetUpItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dropdownItem, { backgroundColor: isDark ? '#454545' : '#F8F8F8' }]}
      onPress={() => handleMeetUpSelect(item)}
    >
      <Text style={[styles.dropdownItemText, { color: colors.text }]}>{item}</Text>
    </TouchableOpacity>
  );

  const renderGenderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dropdownItem, { backgroundColor: isDark ? '#454545' : '#F8F8F8' }]}
      onPress={() => handleGenderSelect(item)}
    >
      <Text style={[styles.dropdownItemText, { color: colors.text }]}>{item}</Text>
    </TouchableOpacity>
  );

  // Generate Street View Static API URL for thumbnail
  const getStaticStreetViewUrl = (point) => {
    const coordinate = meetupPointCoordinates[point] || 
                      { latitude: -26.1885, longitude: 28.0025 };
    
    const url = `https://maps.googleapis.com/maps/api/streetview?size=200x200&location=${coordinate.latitude},${coordinate.longitude}&fov=80&heading=70&pitch=0&key=${GOOGLE_MAPS_API_KEY}`;
    console.log("Static StreetView URL:", url);
    return url;
  };

  // Generate Maps Embed API URL for interactive Street View - FIXED: Added const declaration
  const getEmbedStreetViewUrl = (point) => {
    const coordinate = meetupPointCoordinates[point] || 
                      { latitude: -26.1885, longitude: 28.0025 };
    
    const url = `https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_API_KEY}&location=${coordinate.latitude},${coordinate.longitude}&heading=210&pitch=10&fov=100`;
    console.log("Embed StreetView URL:", url);
    return url;
  };

  // Static Street View Thumbnail Component
  const StaticStreetViewThumbnail = ({ point }) => {
    const imageUrl = getStaticStreetViewUrl(point);
    
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.staticStreetViewImage}
        onError={(e) => console.log('Failed to load Street View image', e.nativeEvent.error)}
        resizeMode="cover"
      />
    );
  };

// Interactive Street View in WebView Component
const InteractiveStreetView = ({ point }) => {
  const [isLoading, setIsLoading] = useState(true);
  const coordinate = meetupPointCoordinates[point] || 
                    { latitude: -26.1885, longitude: 28.0025 };
  
  // Create HTML content with proper iframe
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
          iframe { width: 100%; height: 100%; border: 0; }
        </style>
      </head>
      <body>
        <iframe
          src="https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_API_KEY}&location=${coordinate.latitude},${coordinate.longitude}&heading=210&pitch=10&fov=100"
          width="100%"
          height="100%"
          style="border:0"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </body>
    </html>
  `;
  
  return (
    <View style={styles.fullScreenContainer}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.fullScreenWebView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onLoadStart={() => {
          console.log("WebView started loading");
          setIsLoading(true);
        }}
        onLoadEnd={() => {
          console.log("WebView finished loading");
          setIsLoading(false);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('WebView error: ', nativeEvent);
          setIsLoading(false);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('WebView HTTP error: ', nativeEvent);
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text>Loading Street View...</Text>
          </View>
        )}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text>Loading Street View...</Text>
        </View>
      )}
    </View>
  );
};

  return (
    <View style={[styles.container, {
      backgroundColor: colors.background,
      borderWidth: isDark ? 0 : 0.4,
      borderColor: isDark ? '#D6D6D6' : '#E0E0E0',
      shadowColor: '#000',
      shadowOffset: { width: 1, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 5
    }]}>
      {/* Back chevron and text */}
      <TouchableOpacity style={[
        styles.backButton,
        { backgroundColor: isDark ? '#212121' : '#eeeeeeff' }
      ]}
        onPress={() => {
          console.log("Back button pressed");
          setIsDestinationDone(false);
        }}>
        <Ionicons
          name="chevron-back-outline"
          size={20}
          color={isDark ? "#D6D6D6" : "#606061ff"}
        />
      </TouchableOpacity>

      {/* Meet up point 3d, name, and time */}
      <View style={styles.contentRow}>
        {/* 3d view - Replaced with Static Street View */}
        <TouchableOpacity 
          style={[
            styles.placeHolder,
            { backgroundColor: isDark ? '#454545' : '#F1F1F1' }
          ]}
          onPress={() => {
            console.log("Street View thumbnail pressed");
            setShowStreetViewModal(true);
          }}
        >
          <StaticStreetViewThumbnail point={selectedMeetUpPoint} />
        </TouchableOpacity>

        {/* Name and change button */}
        <View style={styles.meetupInfo}>
          <Text style={[styles.label, { color: colors.text }]}>MEET UP POINT</Text>
          <Text style={[styles.meetupName, { color: colors.text }]}>{selectedMeetUpPoint}</Text>

          {/* Change button with dropdown */}
          <View>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => {
                console.log("Change meet-up point button pressed");
                setShowMeetUpDropdown(true);
              }}
            >
              <Text style={styles.buttonText}>change</Text>
            </TouchableOpacity>

            <Modal
              visible={showMeetUpDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => {
                console.log("Meet-up dropdown closed");
                setShowMeetUpDropdown(false);
              }}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPressOut={() => {
                  console.log("Meet-up dropdown overlay pressed");
                  setShowMeetUpDropdown(false);
                }}
              >
                <View style={[styles.dropdown, { backgroundColor: isDark ? '#2a2a2a' : '#FFFFFF' }]}>
                  <FlatList
                    data={meetupPoints}
                    renderItem={renderMeetUpItem}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>

        {/* Time and gender button */}
        <View style={styles.timeGenderContainer}>
          {/* Time - kept in original position */}
          <Text style={[styles.timeText, { color: colors.text }]}>5 min</Text>
          
          {/* Gender button with dropdown - shows selected gender */}
          <View>
            <TouchableOpacity
              style={styles.genderButton}
              onPress={() => {
                console.log("Gender dropdown button pressed");
                setShowGenderDropdown(true);
              }}
            >
              <Text style={styles.buttonText}>
                {selectedGender === 'Any' ? 'Preferred Gender' : selectedGender}
              </Text>
            </TouchableOpacity>

            <Modal
              visible={showGenderDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => {
                console.log("Gender dropdown closed");
                setShowGenderDropdown(false);
              }}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPressOut={() => {
                  console.log("Gender dropdown overlay pressed");
                  setShowGenderDropdown(false);
                }}
              >
                <View style={[styles.dropdown, styles.genderDropdown, { backgroundColor: isDark ? '#2a2a2a' : '#FFFFFF' }]}>
                  <FlatList
                    data={genderOptions}
                    renderItem={renderGenderItem}
                    keyExtractor={(item, index) => index.toString()}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>
      </View>

      {/* Search button */}
      <TouchableOpacity
        style={[styles.searchButton, { backgroundColor: isDark ? '#212121' : 'black' }]}
        onPress={handleSearch}
      >
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      

      {/* Interactive Street View Full Screen Modal */}
      <Modal
        visible={showStreetViewModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          console.log("Street View modal closed");
          setShowStreetViewModal(false);
        }}
      >
        <View style={styles.fullScreenModalContainer}>
          <InteractiveStreetView point={selectedMeetUpPoint} />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log("Close Street View button pressed");
              setShowStreetViewModal(false);
            }}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width * 0.98,
    height: height * 0.3,
    borderRadius: 47,
  },
  backButton: {
    flexDirection: 'row',
    margin: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  contentRow: {
    flexDirection: 'row',
  },
  placeHolder: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginLeft: 20,
    overflow: 'hidden',
  },
  staticStreetViewImage: {
    width: 95,
    height: 95,
    borderRadius: 5,
  },
  meetupInfo: {
    marginLeft: 10,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  label: {
    fontSize: 8,
    fontWeight: '300',
    marginBottom: 3,
  },
  meetupName: {
    fontSize: 18,
    maxWidth: 150,
    fontWeight: '700',
  },
  changeButton: {
    width: 70,
    height: 25,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    marginTop: 15,
  },
  timeGenderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 'auto',
    marginBottom: 10,
  },
  genderButton: {
    width: 95,
    height: 25,
    backgroundColor: '#7CA3DA',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    marginBottom: 5,
    marginRight: 40,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  searchButton: {
    width: 130,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    width: width * 0.7,
    maxHeight: height * 0.5,
    borderRadius: 10,
    padding: 10,
  },
  genderDropdown: {
    width: width * 0.5,
    maxHeight: height * 0.3,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullScreenWebView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 5,
  },
});

export default WalkStartPoint;