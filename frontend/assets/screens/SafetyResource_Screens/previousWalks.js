import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';

const PreviousWalks = ({ setIsPreviousWalks, setIsSafetyResources }) => { // 1. Accept navigation props
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      <View style={styles.header}>
        {/* 2. Add onPress handler to the back button */}
        <TouchableOpacity
            onPress={() => {
                setIsPreviousWalks(false);
                setIsSafetyResources(true);
            }}
        >
          <Icon name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Previous walks</Text>
        <TouchableOpacity>
          <Icon name="calendar" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.dateSelector}>
        <Text style={styles.date}>Mon 18</Text>
        <Text style={styles.date}>Tue 19</Text>
        <Text style={styles.date}>Wed 20</Text>
        <Text style={[styles.date, styles.activeDate]}>Thu 21</Text>
        <Text style={styles.date}>Fri 22</Text>
        <Text style={styles.date}>Sat 23</Text>
        <Text style={styles.date}>Sun 24</Text>
      </View>

      <View style={styles.tripsHeader}>
        <Text style={styles.tripsCount}>2 trips</Text>
        <TouchableOpacity>
          <Icon name="filter" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {walks.map((walk) => (
          <View key={walk.id} style={styles.walkCard}>
            <View style={styles.userInfo}>
              <Image source={walk.avatar} style={styles.avatar} />
              <View>
                <Text style={styles.name}>{walk.name}</Text>
                <View style={styles.ratingContainer}>
                  {walk.status ? (
                    <Text style={styles.requestSent}>{walk.status}</Text>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.rateButton}>
                        <Text>Rate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.reportButton}>
                        <Text>Report</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                 {walk.rating > 0 &&
                  <View style={styles.stars}>
                      {renderStars(walk.rating)}
                  </View>
                }
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
              <View style={styles.walkDetails}>
                <Text>{walk.start}</Text>
                <Icon name="arrow-right" size={16} color="#000" />
                <Text>{walk.end}</Text>
              </View>
              <View style={styles.walkStats}>
                <Text>{walk.duration}</Text>
                <Text>{walk.distance}</Text>
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
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    dateSelector: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    date: {
        fontSize: 16,
    },
    activeDate: {
        color: '#FFA500',
        fontWeight: 'bold',
    },
    tripsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    tripsCount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    walkCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        margin: 16,
        padding: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 16,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    ratingContainer: {
        flexDirection: 'row',
        marginTop: 4,
    },
    requestSent: {
        backgroundColor: '#FFA500',
        color: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
    },
    rateButton: {
        borderColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
        marginRight: 10,
    },
    reportButton: {
        borderColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
    },
    stars: {
        flexDirection: 'row',
        marginTop: 4,
    },
    mapContainer: {
        marginTop: 16,
        borderRadius: 10,
        overflow: 'hidden',
    },
    map: {
        height: 150,
    },
    walkDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f0f0f0',
    },
    walkStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
});

export default PreviousWalks;