import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Linking,
  Platform,
  useColorScheme,
  Dimensions,
  StatusBar,
  PixelRatio,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../../../backend/Firebase/FirebaseService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLACE_COORDS = {
  'Helen Joseph Hospital': { latitude: -26.1913, longitude: 28.0103 },
  'Mayfair West': { latitude: -26.1974, longitude: 28.0091 },
  'Soweto': { latitude: -26.267, longitude: 27.8585 },
  'Braamfontein': { latitude: -26.1932, longitude: 28.0349 },
  'Campus Square': { latitude: -26.1765, longitude: 28.006 },
  'Gold Reef City': { latitude: -26.2345, longitude: 28.0111 },
  Unknown: { latitude: -26.2041, longitude: 28.0473 },
};

const getBatteryIconName = (batteryPercentStr) => {
  const percent = parseInt(batteryPercentStr || '', 10);
  if (Number.isNaN(percent)) return 'battery-dead';
  if (percent >= 80) return 'battery-full';
  if (percent >= 50) return 'battery-half';
  if (percent >= 20) return 'battery-low';
  return 'battery-dead';
};

const scaleFont = (size) => size * PixelRatio.getFontScale();

export default function Profile(props) {
  const navigation = useNavigation();
  const { params } = useRoute();

  const { person } = params || {};

  const [isEmergency, setIsEmergency] = useState(false);
  const [isLiveLoc, setIsLiveLoc] = useState(true);

  const statusOnline = (person.status || '').toLowerCase() === 'online';
  const batteryIcon = getBatteryIconName(person.battery);
  const statusColor = statusOnline ? '#51e651' : '#9AA0A6';

  // Get coordinates from person's actual location data or fallback to place names
  const coords = useMemo(() => {
    // Priority 1: Use actual coordinates if available
    if (person.coordinates?.latitude && person.coordinates?.longitude) {
      return {
        latitude: person.coordinates.latitude,
        longitude: person.coordinates.longitude,
      };
    }
    
    // Priority 2: Use rawData coordinates if available
    if (person.rawData?.CurrentLocation?.latitude && person.rawData?.CurrentLocation?.longitude) {
      return {
        latitude: person.rawData.CurrentLocation.latitude,
        longitude: person.rawData.CurrentLocation.longitude,
      };
    }
    
    // Fallback: Use place name lookup
    const loc =
      person.location && PLACE_COORDS[person.location]
        ? person.location
        : 'Unknown';
    return PLACE_COORDS[loc];
  }, [person.location, person.coordinates, person.rawData]);

  const region = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  const mapRef = useRef(null);
  const viewShotRef = useRef(null);

  const recenterMap = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const downloadMap = async () => {
    if (viewShotRef.current) {
      try {
        const uri = await viewShotRef.current.capture();
        const fileUri = FileSystem.cacheDirectory + 'map.png';
        await FileSystem.copyAsync({ from: uri, to: fileUri });
        await Sharing.shareAsync(fileUri);
      } catch (err) {
        console.error('Error capturing map:', err);
      }
    }
  };

  const navigateToLocation = () => {
    const lat = coords.latitude;
    const lng = coords.longitude;
    const label = person.name || 'Destination';

    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${label}@${lat},${lng}`
        : `geo:0,0?q=${lat},${lng}(${label})`;

    Linking.openURL(url).catch(err =>
      console.error('Error opening map:', err)
    );
  };

  const handlePhoneCall = () => {
    const phoneNumber = person.phone || person.phoneNumber;
    
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This contact does not have a phone number saved.');
      return;
    }

    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${cleanedNumber}`;

    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((err) => {
        console.error('Error making phone call:', err);
        Alert.alert('Error', 'Failed to initiate phone call');
      });
  };

  const handleVideoCall = () => {
    const phoneNumber = person.phone || person.phoneNumber;
    const email = person.email;
    
    if (!phoneNumber && !email) {
      Alert.alert('No Contact Info', 'This contact does not have phone number or email saved.');
      return;
    }

    Alert.alert(
      'Video Call',
      'Choose video calling app:',
      [
        {
          text: 'FaceTime (iOS)',
          onPress: () => {
            if (Platform.OS === 'ios') {
              const facetimeUrl = `facetime:${phoneNumber || email}`;
              Linking.canOpenURL(facetimeUrl)
                .then((supported) => {
                  if (supported) {
                    return Linking.openURL(facetimeUrl);
                  } else {
                    Alert.alert('Error', 'FaceTime is not available');
                  }
                })
                .catch((err) => console.error('FaceTime error:', err));
            } else {
              Alert.alert('Not Available', 'FaceTime is only available on iOS devices');
            }
          },
        },
        {
          text: 'WhatsApp',
          onPress: () => {
            if (phoneNumber) {
              const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
              const whatsappUrl = `https://wa.me/${cleanedNumber}?text=Hi, let's video call!`;
              Linking.openURL(whatsappUrl).catch((err) => {
                console.error('WhatsApp error:', err);
                Alert.alert('Error', 'WhatsApp is not installed or failed to open');
              });
            } else {
              Alert.alert('No Phone Number', 'WhatsApp requires a phone number');
            }
          },
        },
        {
          text: 'Google Meet',
          onPress: () => {
            const meetUrl = 'https://meet.google.com/new';
            Linking.openURL(meetUrl).catch((err) => {
              console.error('Google Meet error:', err);
              Alert.alert('Error', 'Failed to open Google Meet');
            });
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${person.name || 'this person'} from your friends list? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const jsonValue = await AsyncStorage.getItem('userData');
              if (!jsonValue) {
                Alert.alert('Error', 'User data not found. Please log in again.');
                return;
              }
              
              const currentUserData = JSON.parse(jsonValue);
              const currentUserId = currentUserData.userId || currentUserData.id;
              const currentUserPhone = currentUserData.phone || currentUserData.phoneNumber;
              
              const friendUserId = person.friendId || person.id || person.uid;
              const friendPhone = person.phone || person.phoneNumber;
              
              if (!currentUserId || !friendUserId) {
                Alert.alert('Error', 'Invalid user information');
                return;
              }
              
              console.log('Removing friend:', {
                currentUserId,
                friendUserId,
                currentUserPhone,
                friendPhone
              });
              
              const result = await FirebaseService.removeFriend(
                currentUserId,
                friendUserId,
                currentUserPhone,
                friendPhone
              );
              
              if (result.success) {
                Alert.alert(
                  'Success',
                  `${person.name || 'Friend'} has been removed from your friends list.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to remove friend');
              }
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const colors = {
    background: isDark ? '#0a0b0e' : '#e6e6e6',
    header: isDark ? '#15171c' : '#f0f0f0',
    card: isDark ? '#1b1f26' : '#ffffff',
    textPrimary: isDark ? '#fff' : '#1a1a1a',
    textSecondary: isDark ? '#cfd3da' : '#555',
    bullet: isDark ? '#6b7078' : '#888',
    divider: isDark ? '#22252b' : '#d0d0d0',
    switchActive: '#35d07f',
    remove: '#ff6b6b',
    iconColor: isDark ? '#cfcfcf' : '#444',
    mapOverlay: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.1)',
  };

  const formatLastSeen = () => {
    if (statusOnline) return 'Online now';
    
    if (person.lastSeen || person.lastLogin) {
      const lastSeenTime = person.lastSeen || person.lastLogin;
      const lastSeen = lastSeenTime.toDate ? lastSeenTime.toDate() : new Date(lastSeenTime);
      const now = new Date();
      const minutesAgo = (now - lastSeen) / (1000 * 60);
      
      if (minutesAgo < 60) {
        return `${Math.round(minutesAgo)}m ago`;
      } else if (minutesAgo < 1440) {
        return `${Math.round(minutesAgo / 60)}h ago`;
      } else {
        return `${Math.round(minutesAgo / 1440)}d ago`;
      }
    }
    
    return 'Offline';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.headerWrap, { backgroundColor: colors.header }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.avatarWrap}>
            {person.avatar ? (
              <Image source={{ uri: person.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.defaultAvatar, { backgroundColor: colors.card }]}>
                <Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>
                  {person.name ? person.name.charAt(0).toUpperCase() : 'F'}
                </Text>
              </View>
            )}
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={[styles.batteryPill, { backgroundColor: colors.mapOverlay }]}>
              <Ionicons name={batteryIcon} size={11} color={colors.textPrimary} />
              <Text style={[styles.batteryPillText, { color: colors.textPrimary }]}>
                {person.battery || '100%'}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {person.name || 'Unknown User'}
              </Text>
              {person.isCloseFriend && (
                <MaterialIcons
                  name="verified"
                  size={16}
                  color="#ffb74d"
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>

            <View style={[styles.subRow]}>
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                {person.location || 'Unknown location'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 32 }}
        indicatorStyle={isDark ? 'white' : 'black'}
      >
        {/* ACTION ROW */}
        <View style={styles.actionsRow}>
          <View style={[styles.checkInCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.checkInBtn, { backgroundColor: colors.switchActive }]}
              onPress={() => Alert.alert('Check-In', 'Check-in sent')}
            >
              <Text style={[styles.checkInText, { color: isDark ? '#0a0b0e' : '#fff' }]}>Check-In</Text>
            </TouchableOpacity>
            <View style={styles.checkInSmallBtns}>
              <TouchableOpacity
                style={[styles.smallCircleOk, { backgroundColor: colors.switchActive }]}
                onPress={() => Alert.alert('Confirmed', 'OK pressed')}
              >
                <Ionicons name="checkmark" size={20} color={isDark ? '#0a0b0e' : '#fff'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallCircleCancel, { backgroundColor: isDark ? '#2b2f36' : '#ccc' }]}
                onPress={() => Alert.alert('Cancelled', 'Cancel pressed')}
              >
                <Ionicons name="close" size={16} color={isDark ? '#e0e0e0' : '#333'} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.safetyCard, { backgroundColor: colors.card }]}
            onPress={() => Alert.alert('Safety Request', 'Request sent')}
          >
            <Text style={[styles.safetyText, { color: colors.textPrimary }]}>Safety Request</Text>
            <MaterialCommunityIcons name="shield-check" size={18} color={colors.switchActive} />
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

        {/* COMMUNICATIONS */}
        <View style={styles.commsRow}>
          <TouchableOpacity 
            style={[styles.viewChatsBox, { backgroundColor: colors.card }]}
            onPress={() => {
              const personId = person.friendId || person.id;
              
              if (!personId) {
                Alert.alert('Error', 'Cannot open chat: Invalid user ID');
                return;
              }

              navigation.navigate('Home', {
                navigation: navigation, // Pass navigation object
                from: 'Profile', // Tell Home where we came from
                openChatWith: {
                    id: personId,
                    friendId: personId,
                    name: person.name || 'Unknown User',
                    phone: person.phone,
                    email: person.email,
                    avatar: person.avatar,
                    status: person.status,
                } 
              });
            }}
          >
            <Text style={[styles.viewChatsText, { color: colors.textSecondary }]}>View Chats</Text>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.iconColor} />
          </TouchableOpacity>

          <View style={styles.callVideoRow}>
            <TouchableOpacity 
              style={[styles.circleIcon, { backgroundColor: colors.card, marginRight: 6 }]}
              onPress={() => handlePhoneCall()}
            >
              <Ionicons name="call" size={20} color={colors.iconColor} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.circleIcon, { backgroundColor: colors.card }]}
              onPress={() => handleVideoCall()}
            >
              <Feather name="video" size={20} color={colors.iconColor} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 20 }} />

        {/* OPTIONS */}
        <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.optionRow}>
            <MaterialCommunityIcons name="shield-outline" size={18} color={colors.switchActive} />
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Set as Emergency Contact</Text>
            <Switch
              value={isEmergency}
              onValueChange={setIsEmergency}
              trackColor={{ false: '#767577', true: colors.switchActive }}
              thumbColor={isEmergency ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={[styles.optionDivider, { backgroundColor: colors.divider }]} />

          <View style={[styles.optionRow, styles.optionRowLast]}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={18} color={colors.switchActive} />
            <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Share Live Location</Text>
            <Switch
              value={isLiveLoc}
              onValueChange={setIsLiveLoc}
              trackColor={{ false: '#767577', true: colors.switchActive }}
              thumbColor={isLiveLoc ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

        {/* MAP + ROUTE CARD */}
        <View style={[styles.routeCard, { backgroundColor: colors.card }]}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={region}
              showsUserLocation={true}
              loadingEnabled={true}
              provider={Platform.OS === 'android' ? 'google' : undefined}
            >
              <Marker
                coordinate={coords}
                title={person.name || 'Unknown'}
                description={person.location || 'Unknown Location'}
              />
            </MapView>
          </ViewShot>

          <TouchableOpacity
            style={[styles.recenterBtn, { backgroundColor: colors.switchActive }]}
            onPress={recenterMap}
          >
            <Ionicons name="locate" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.routeSide}>
            <Text style={[styles.routeEta, { color: colors.textPrimary }]}>
              {person.location || 'Unknown location'}
            </Text>
            <Text style={[styles.routeKm, { color: colors.textSecondary }]}>
              Tap Navigate to get directions
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <TouchableOpacity style={styles.navigateBtn} onPress={navigateToLocation}>
                <Text style={styles.navigateBtnText}>Navigate</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.navigateBtn, { backgroundColor: '#1e90ff' }]} onPress={downloadMap}>
                <Text style={styles.navigateBtnText}>Download Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

        {/* REMOVE CONTACT */}
        <TouchableOpacity 
          style={styles.removeRow} 
          onPress={handleRemoveFriend}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={20}
            color={colors.remove}
          />
          <Text style={[styles.removeText, { color: colors.remove }]}>Remove Contact</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContent: { flex: 1, marginTop: Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 130 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarWrap: { width: 48, height: 48, marginRight: 12 },
  avatar: { width: '100%', height: '100%', borderRadius: 24 },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  batteryPill: { position: 'absolute', bottom: -6, left: '45%', transform: [{ translateX: -20 }], borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' },
  batteryPillText: { fontSize: 10, marginLeft: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: scaleFont(15), fontWeight: '700', marginLeft: -5 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText: { fontSize: scaleFont(13), marginLeft: -5 },
  bullet: { marginHorizontal: 6 },
  distanceText: { fontSize: scaleFont(13) },
  sectionDivider: { height: 1, marginVertical: 16, marginHorizontal: 16 },
  
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 8 },
  checkInCard: { flex: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkInBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12 },
  checkInText: { fontWeight: '700', marginLeft: 4 },
  checkInSmallBtns: { flexDirection: 'row', marginLeft: 12, gap: 6 },
  smallCircleOk: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  smallCircleCancel: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  safetyCard: { flex: 0, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  safetyText: { fontWeight: '700', marginLeft: -1 },
  commsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  callVideoRow: { flexDirection: 'row', marginLeft: 12, gap: 8 },
  viewChatsBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24 },
  viewChatsText: { fontWeight: '600', marginRight: 8 },
  circleIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  optionsContainer: { borderRadius: 16, padding: 12, marginHorizontal: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  optionRowLast: {},
  optionLabel: { flex: 1, marginLeft: 12, fontSize: scaleFont(14) },
  optionDivider: { height: 1, marginVertical: -1 },
  routeCard: { marginHorizontal: 16, borderRadius: 16, padding: 12, overflow: 'hidden' },
  map: { 
    width: SCREEN_WIDTH - 55,
    height: SCREEN_HEIGHT * 0.22,
    borderRadius: 12,
  },
  routeSide: { marginTop: 12 },
  routeEta: { fontSize: scaleFont(14), fontWeight: '600' },
  routeKm: { fontSize: scaleFont(12), marginTop: 4 },
  navigateBtn: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#35d07f', alignItems: 'center', width: '48%' },
  navigateBtnText: { color: '#fff', fontWeight: '600' },
  recenterBtn: { position: 'absolute', right: 20, bottom: 110, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  removeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, marginLeft: 20 },
  removeText: { marginLeft: 6, fontWeight: '700' },
});