import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  UIManager,
  StyleSheet,
  Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const {width, height} = Dimensions.get('window')

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const peopleData = [
  {
    id: 1,
    name: 'Unathi Gumede',
    location: 'Helen Joseph Hospital',
    status: 'Online',
    distance: '5 km away',
    battery: '4%',
    avatar: require('../images/Unathi.jpg'),
  },
  {
    id: 2,
    name: 'Cheyenne Luthuli',
    location: 'Mayfair West',
    status: 'Offline',
    distance: '23 km away',
    battery: '85%',
    avatar: require('../images/Cheyenne.jpg'),
  },
];

const getBatteryIconName = (batteryPercentStr) => {
  const percent = parseInt(batteryPercentStr);
  if (isNaN(percent)) return 'battery-dead';
  if (percent >= 80) return 'battery-full';
  if (percent >= 60) return 'battery-three-quarters';
  if (percent >= 40) return 'battery-half';
  if (percent >= 20) return 'battery-quarter';
  return 'battery-dead';
};

const PeopleBar = () => {
  const [expanded, setExpanded] = useState(true);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <BlurView intensity={100} tint="dark" style={styles.container}>
      {/* Drag handle */}
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={styles.dragHandleContainer}
      >
        <View style={styles.dragHandle} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>People</Text>
        <TouchableOpacity onPress={() => console.log('Refresh pressed')}>
          <Ionicons name="refresh" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {expanded && (
        <>
          {/* List */}
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {peopleData.map((person) => {
              const batteryIcon = getBatteryIconName(person.battery);
              const batteryColor = parseInt(person.battery) < 20 ? '#ff6b6b' : '#51e651';
              const statusColor = person.status === 'Online' ? '#51e651' : '#a0a0a0';

              return (
                <TouchableOpacity
                  key={person.id}
                  style={styles.personContainer}
                >
                  {/* Avatar + Status */}
                  <View style={styles.avatarSection}>
                    <Image source={person.avatar} style={styles.avatar} />
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  </View>

                  {/* Info Section */}
                  <View style={styles.infoSection}>
                    <View style={styles.nameRow}>
                      <Text style={styles.personName}>{person.name}</Text>
                      <View style={styles.batteryContainer}>
                        <Ionicons name={batteryIcon} size={14} color={batteryColor} />
                        <Text style={[styles.batteryText, { color: batteryColor }]}>
                          {person.battery}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.personLocation}>{person.location}</Text>
                    
                    <View style={styles.statusRow}>
                      <Text style={[styles.personStatus, { color: statusColor }]}>
                        {person.status}
                      </Text>
                      <Text style={styles.divider}>•</Text>
                      <Text style={styles.personDistance}>{person.distance}</Text>
                    </View>
                  </View>

                  {/* Arrow */}
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#a0a0a0"
                    style={styles.profileArrow}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Add button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => console.log('Add button pressed')}
          >
            <Text style={styles.addButtonText}>+ add</Text>
          </TouchableOpacity>
        </>
      )}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 60,
    height: height * 0.3,
    width: width * 0.95,
    alignSelf: "center",
    backgroundColor: '#121212',
    zIndex: 20,
    padding: 10,
    borderRadius: 10,
    overflow: 'hidden',
    
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 30,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 5,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 5,
  },
  personContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#121212',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  personName: {
    fontWeight: '600',
    fontSize: 15,
    color: 'white'
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  batteryText: {
    fontSize: 11,
    marginLeft: 4,
  },
  personLocation: {
    fontSize: 12,
    color: '#b0b0b0',
    marginBottom: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    color: '#666',
    marginHorizontal: 5,
  },
  personDistance: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  profileArrow: {
    marginLeft: 10,
  },
  addButton: {
    marginTop: 5,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PeopleBar;