import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFontSize } from '../../contexts/FontSizeContext';
import { useTheme } from '../../contexts/ColorContext'; // ✅ theme

const PreviousWalks = ({ setIsPreviousWalks, setIsSafetyResources }) => {
  const { getScaledFontSize } = useFontSize();
  const { colors } = useTheme(); // ✅ theme

  const walks = [
    {
      id: 1,
      name: 'Kevin Serakalala',
      avatar: require('../../images/profile-pictures/junior.jpeg'),
      rating: 0,
      status: null,
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
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            onPress={() => {
              setIsPreviousWalks(false);
              setIsSafetyResources(true);
            }}
          >
            <Icon name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: getScaledFontSize(20), color: colors.text }]}>
            Previous walks
          </Text>
          <TouchableOpacity>
            <Icon name="calendar" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <View style={[styles.dateSelector, { backgroundColor: colors.card }]}>
          {['Mon 18','Tue 19','Wed 20','Thu 21','Fri 22','Sat 23','Sun 24'].map((day) => (
            <Text
              key={day}
              style={[
                styles.date,
                { fontSize: getScaledFontSize(16), color: colors.text },
                day === 'Thu 21' && { color: '#FFA500', fontWeight: 'bold' },
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* Trips Header */}
        <View style={styles.tripsHeader}>
          <Text style={[styles.tripsCount, { fontSize: getScaledFontSize(16), color: colors.text }]}>
            {walks.length} trips
          </Text>
          <TouchableOpacity>
            <Icon name="filter" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Walk Cards */}
        <ScrollView>
          {walks.map((walk) => (
            <View key={walk.id} style={[styles.walkCard, { backgroundColor: colors.card }]}>
              <View style={styles.userInfo}>
                <Image source={walk.avatar} style={styles.avatar} />
                <View>
                  <Text style={[styles.name, { fontSize: getScaledFontSize(18), color: colors.text }]}>{walk.name}</Text>
                  <View style={styles.ratingContainer}>
                    {walk.status ? (
                      <Text style={[styles.requestSent, { fontSize: getScaledFontSize(12) }]}>
                        {walk.status}
                      </Text>
                    ) : (
                      <>
                        <TouchableOpacity style={[styles.rateButton, { borderColor: colors.border }]}>
                          <Text style={{ fontSize: getScaledFontSize(12), color: colors.text }}>Rate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.reportButton, { borderColor: colors.border }]}>
                          <Text style={{ fontSize: getScaledFontSize(12), color: colors.text }}>Report</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                  {walk.rating > 0 && <View style={styles.stars}>{renderStars(walk.rating)}</View>}
                </View>
              </View>
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
                <View style={[styles.walkDetails, { backgroundColor: colors.surface }]}>
                  <Text style={{ fontSize: getScaledFontSize(14), color: colors.text }}>{walk.start}</Text>
                  <Icon name="arrow-right" size={16} color={colors.text} />
                  <Text style={{ fontSize: getScaledFontSize(14), color: colors.text }}>{walk.end}</Text>
                </View>
                <View style={[styles.walkStats, { backgroundColor: colors.surface }]}>
                  <Text style={{ fontSize: getScaledFontSize(14), color: colors.text }}>{walk.duration}</Text>
                  <Text style={{ fontSize: getScaledFontSize(14), color: colors.text }}>{walk.distance}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 8 },
  headerTitle: { fontWeight: 'bold' },
  dateSelector: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderRadius: 8 },
  date: {},
  tripsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  tripsCount: { fontWeight: 'bold' },
  walkCard: { borderRadius: 10, margin: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  name: { fontWeight: 'bold' },
  ratingContainer: { flexDirection: 'row', marginTop: 4 },
  requestSent: { backgroundColor: '#FFA500', color: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  rateButton: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, marginRight: 10 },
  reportButton: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  stars: { flexDirection: 'row', marginTop: 4 },
  mapContainer: { marginTop: 16, borderRadius: 10, overflow: 'hidden' },
  map: { height: 150 },
  walkDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  walkStats: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
});

export default PreviousWalks;
