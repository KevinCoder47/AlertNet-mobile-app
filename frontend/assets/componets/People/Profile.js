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
  Dimensions,
  StatusBar,
  PixelRatio,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../../assets/contexts/ColorContext';

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

export default function Profile() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const person = params?.person || {};
  const themeContext = useTheme();
  const colors = themeContext.colors;

  const [isEmergency, setIsEmergency] = useState(false);
  const [isLiveLoc, setIsLiveLoc] = useState(true);

  const statusOnline = (person.status || '').toLowerCase() === 'online';
  const batteryIcon = getBatteryIconName(person.battery);
  const statusColor = statusOnline ? '#51e651' : '#9AA0A6';

  const coords = useMemo(() => {
    const loc =
      person.location && PLACE_COORDS[person.location]
        ? person.location
        : 'Unknown';
    return PLACE_COORDS[loc];
  }, [person.location]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.headerWrap, { backgroundColor: colors.surface }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.avatarWrap}>
            {!!person.avatar && (
              <Image source={person.avatar} style={styles.avatar} />
            )}
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={[styles.batteryPill, { backgroundColor: colors.overlay }]}>
              <Ionicons name={batteryIcon} size={11} color={colors.text} />
              <Text style={[styles.batteryPillText, { color: colors.text }]}>
                {person.battery || '--%'}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>
                {person.name || 'Unknown User'}
              </Text>
              <MaterialIcons
                name="verified"
                size={16}
                color="#ffb74d"
                style={{ marginLeft: 6 }}
              />
            </View>

            <View style={[styles.subRow]}>
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>{person.location}</Text>
              <Text style={[styles.bullet, { color: colors.textTertiary }]}> • </Text>
              <Text style={[styles.distanceText, { color: colors.textSecondary }]}>{person.distance || '— km away'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 32 }}
        indicatorStyle={colors.isDark ? 'white' : 'black'}
      >
        {/* ACTION ROW */}
        <View style={styles.actionsRow}>
          <View style={[styles.checkInCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.checkInBtn, { backgroundColor: colors.success }]}
              onPress={() => Alert.alert('Check-In', 'Check-in sent')}
            >
              <Text style={[styles.checkInText, { color: colors.isDark ? colors.background : '#fff' }]}>Check-In</Text>
            </TouchableOpacity>
            <View style={styles.checkInSmallBtns}>
              <TouchableOpacity
                style={[styles.smallCircleOk, { backgroundColor: colors.success }]}
                onPress={() => Alert.alert('Confirmed', 'OK pressed')}
              >
                <Ionicons name="checkmark" size={20} color={colors.isDark ? colors.background : '#fff'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallCircleCancel, { backgroundColor: colors.iconBackground }]}
                onPress={() => Alert.alert('Cancelled', 'Cancel pressed')}
              >
                <Ionicons name="close" size={16} color={colors.iconSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.safetyCard, { backgroundColor: colors.card }]}
            onPress={() => Alert.alert('Safety Request', 'Request sent')}
          >
            <Text style={[styles.safetyText, { color: colors.text }]}>Safety Request</Text>
            <MaterialCommunityIcons name="shield-check" size={18} color={colors.success} />
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.separator }]} />

        {/* COMMUNICATIONS */}
        <View style={styles.commsRow}>
          <TouchableOpacity 
            style={[styles.viewChatsBox, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('ChatScreen', { person })}
          >
            <Text style={[styles.viewChatsText, { color: colors.textSecondary }]}>View Chats</Text>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.iconPrimary} />
          </TouchableOpacity>

          <View style={styles.callVideoRow}>
            <TouchableOpacity style={[styles.circleIcon, { backgroundColor: colors.card, marginRight: 6 }]}>
              <Ionicons name="call" size={20} color={colors.iconPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleIcon, { backgroundColor: colors.card }]}>
              <Feather name="video" size={20} color={colors.iconPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 20 }} />

        {/* OPTIONS */}
        <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.optionRow}>
            <MaterialCommunityIcons name="shield-outline" size={18} color={colors.success} />
            <Text style={[styles.optionLabel, { color: colors.text }]}>Set as Emergency Contact</Text>
            <Switch
              value={isEmergency}
              onValueChange={setIsEmergency}
              trackColor={{ false: '#767577', true: colors.success }}
              thumbColor={isEmergency ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={[styles.optionDivider, { backgroundColor: colors.separator }]} />

          <View style={[styles.optionRow, styles.optionRowLast]}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={18} color={colors.success} />
            <Text style={[styles.optionLabel, { color: colors.text }]}>Share Live Location</Text>
            <Switch
              value={isLiveLoc}
              onValueChange={setIsLiveLoc}
              trackColor={{ false: '#767577', true: colors.success }}
              thumbColor={isLiveLoc ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.separator }]} />

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
            style={[styles.recenterBtn, { backgroundColor: colors.success }]}
            onPress={recenterMap}
          >
            <Ionicons name="locate" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.routeSide}>
            <Text style={[styles.routeEta, { color: colors.text }]}>
              <Text style={{ fontWeight: '700' }}>{person.eta || '35 min'}</Text> Away
            </Text>
            <Text style={[styles.routeKm, { color: colors.textSecondary }]}>{person.distance || '5 km'}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <TouchableOpacity style={[styles.navigateBtn, { backgroundColor: colors.success }]} onPress={navigateToLocation}>
                <Text style={styles.navigateBtnText}>Navigate</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.navigateBtn, { backgroundColor: '#1e90ff' }]} onPress={downloadMap}>
                <Text style={styles.navigateBtnText}>Download Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.separator }]} />

        {/* REMOVE CONTACT */}
        <TouchableOpacity style={styles.removeRow} onPress={() => Alert.alert('Removed', 'Contact removed')}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={20}
            color={colors.danger}
          />
          <Text style={[styles.removeText, { color: colors.danger }]}>Remove Contact</Text>
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
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
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
  routeEta: { fontSize: scaleFont(14) },
  routeKm: { fontSize: scaleFont(12) },
  navigateBtn: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', width: '48%' },
  navigateBtnText: { color: '#fff', fontWeight: '600' },
  recenterBtn: { position: 'absolute', right: 20, bottom: 110, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  removeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, marginLeft: 20 },
  removeText: { marginLeft: 6, fontWeight: '700' },
});