import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFontSize } from '../../contexts/FontSizeContext';
import { useTheme } from '../../contexts/ColorContext';

const PreviousWalks = ({ setIsPreviousWalks, setIsSafetyResources }) => {
  const { getScaledFontSize } = useFontSize();
  const { colors } = useTheme();

  const walks = [
    {
      id: 1,
      name: 'Mpilonhle Radebe',
      avatar: require('../../images/profile-pictures/junior.jpeg'),
      rating: 0,
      status: null,
      hasRequestToConnect: true,
      start: '43 Pomeroy Avenue',
      end: '43 Pomeroy Avenue',
      duration: '10 min',
      distance: '800 m',
      coords: [
        { latitude: -26.2041, longitude: 28.0473 },
        { latitude: -26.2052, longitude: 28.0465 },
        { latitude: -26.2058, longitude: 28.0489 },
        { latitude: -26.2045, longitude: 28.0497 },
      ],
    },
    {
      id: 2,
      name: 'Sphephile Mtshali',
      avatar: require('../../images/Cheyenne.jpg'),
      rating: 4,
      status: 'Request Sent',
      hasRequestToConnect: false,
      hasReport: true,
      start: 'UJ APK',
      end: 'Langlaagte North',
      duration: '25 min',
      distance: '1.5 km',
      coords: [
        { latitude: -26.183, longitude: 28.001 },
        { latitude: -26.184, longitude: 28.005 },
        { latitude: -26.186, longitude: 28.003 },
        { latitude: -26.187, longitude: 28.009 },
      ],
    },
  ];

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon
          key={i}
          name={i <= rating ? 'star' : 'star-o'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <TouchableOpacity
            onPress={() => {
              setIsPreviousWalks(false);
              setIsSafetyResources(true);
            }}
          >
            <Icon name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: getScaledFontSize(20), color: colors.text }]}>
            Previous Walks
          </Text>
          <TouchableOpacity>
            <Icon name="calendar" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* DATE SELECTOR */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {[
            { day: 'Mon', date: '18' },
            { day: 'Tue', date: '19' },
            { day: 'Wed', date: '20' },
            { day: 'Thu', date: '21' },
            { day: 'Fri', date: '22' },
            { day: 'Sat', date: '23' },
            { day: 'Sun', date: '24' },
          ].map((item) => (
            <TouchableOpacity
              key={item.day + item.date}
              style={[
                styles.dateItem,
                item.day === 'Thu' && styles.dateItemActive,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  { fontSize: getScaledFontSize(12), color: colors.text },
                  item.day === 'Thu' && styles.dayTextActive,
                ]}
              >
                {item.day}
              </Text>
              <Text
                style={[
                  styles.dateText,
                  { fontSize: getScaledFontSize(16), color: colors.text },
                  item.day === 'Thu' && styles.dateTextActive,
                ]}
              >
                {item.date}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TRIPS HEADER */}
        <View style={styles.tripsHeader}>
          <Text
            style={[
              styles.tripsCount,
              { fontSize: getScaledFontSize(16), color: colors.text },
            ]}
          >
            {walks.length} trips
          </Text>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* WALK CARDS */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {walks.map((walk) => (
            <View
              key={walk.id}
              style={[styles.walkCard, { backgroundColor: colors.card }]}
            >
              {/* USER INFO */}
              <View style={styles.userInfo}>
                <Image source={walk.avatar} style={styles.avatar} />
                <View style={styles.userDetails}>
                  <Text
                    style={[
                      styles.name,
                      { fontSize: getScaledFontSize(16), color: colors.text },
                    ]}
                  >
                    {walk.name}
                  </Text>

                  <View style={styles.actionRow}>
                    {walk.rating > 0 && (
                      <View style={styles.stars}>{renderStars(walk.rating)}</View>
                    )}
                    {walk.hasReport && (
                      <TouchableOpacity style={styles.reportTag}>
                        <Text
                          style={[
                            styles.reportTagText,
                            { fontSize: getScaledFontSize(12) },
                          ]}
                        >
                          Report
                        </Text>
                      </TouchableOpacity>
                    )}
                    {!walk.status && !walk.rating && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.rateButton,
                            { borderColor: colors.border },
                          ]}
                        >
                          <Icon
                            name="star-o"
                            size={12}
                            color={colors.text}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={{
                              fontSize: getScaledFontSize(12),
                              color: colors.text,
                            }}
                          >
                            Rate
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.reportButton,
                            { borderColor: colors.border },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: getScaledFontSize(12),
                              color: colors.text,
                            }}
                          >
                            Report
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  {walk.hasRequestToConnect && (
                    <TouchableOpacity style={styles.requestToConnectButton}>
                      <Text
                        style={[
                          styles.requestToConnectText,
                          { fontSize: getScaledFontSize(11) },
                        ]}
                      >
                        Request to Connect
                      </Text>
                    </TouchableOpacity>
                  )}

                  {walk.status && (
                    <TouchableOpacity style={styles.requestSentButton}>
                      <Text
                        style={[
                          styles.requestSentText,
                          { fontSize: getScaledFontSize(11) },
                        ]}
                      >
                        {walk.status}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* MAP SECTION */}
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: walk.coords[0].latitude,
                    longitude: walk.coords[0].longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                >
                  <Polyline
                    coordinates={walk.coords}
                    strokeColor="#FFA500"
                    strokeWidth={3}
                  />
                </MapView>

                <View
                  style={[styles.walkDetails, { backgroundColor: colors.surface }]}
                >
                  <Text
                    style={{
                      fontSize: getScaledFontSize(14),
                      color: colors.text,
                    }}
                  >
                    {walk.start}
                  </Text>
                  <Icon name="arrow-right" size={16} color={colors.text} />
                  <Text
                    style={{
                      fontSize: getScaledFontSize(14),
                      color: colors.text,
                    }}
                  >
                    {walk.end}
                  </Text>
                </View>

                <View
                  style={[styles.walkStats, { backgroundColor: colors.surface }]}
                >
                  <Text
                    style={{
                      fontSize: getScaledFontSize(14),
                      color: colors.text,
                    }}
                  >
                    {walk.duration}
                  </Text>
                  <Text
                    style={{
                      fontSize: getScaledFontSize(14),
                      color: colors.text,
                    }}
                  >
                    {walk.distance}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 10,
    marginTop: 10,
    ...Platform.select({
      ios: { shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  headerTitle: { fontWeight: '700' },

  dateItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 10,
  },
  dateItemActive: {
    backgroundColor: '#FFA500',
    shadowColor: '#FFA500',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  dayText: { opacity: 0.7 },
  dayTextActive: { color: '#fff', fontWeight: '600', opacity: 1 },
  dateText: { fontWeight: 'bold' },
  dateTextActive: { color: '#fff' },

  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tripsCount: { fontWeight: 'bold' },
  filterButton: { padding: 6 },

  walkCard: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 6 },
    }),
  },

  userInfo: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  avatar: { width: 55, height: 55, borderRadius: 28, marginRight: 12 },
  userDetails: { flex: 1 },
  name: { fontWeight: '600', marginBottom: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  stars: { flexDirection: 'row', marginRight: 8 },
  reportTag: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  reportTagText: { color: '#fff', fontWeight: '600' },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  reportButton: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestToConnectButton: {
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  requestToConnectText: { color: '#000', fontWeight: '500' },
  requestSentButton: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  requestSentText: { color: '#fff', fontWeight: '600' },

  mapContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  map: { height: 160 },
  walkDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  walkStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});

export default PreviousWalks;

