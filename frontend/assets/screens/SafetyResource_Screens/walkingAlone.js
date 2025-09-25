import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // Using Feather for the arrow-left icon
import Constants from 'expo-constants';
import { useFontSize } from '../../contexts/FontSizeContext'; // Import font size context

const tipsData = [
  {
    title: 'Plan Your Route',
    points: [
      '1. Stick to well-lit, familiar streets.',
      '2. Avoid shortcuts through alleys or isolated areas.',
      '3. Share your route and estimated arrival time with someone you trust.',
    ],
    image: require('../../images/Alone.png'), // Replace with your actual image path
  },
  {
    title: 'Stay Aware of Your Surroundings',
    points: [
      '1. Keep music volume low or use only one earbud.',
      '2. Avoid being distracted by your phone.',
    ],
  },
  {
    title: 'Project Confidence',
    points: [
      '1. Walk purposefully and stand tall.',
      '2. Make brief eye contact with people around you.',
    ],
  },
  {
    title: 'Use Safety Apps',
    points: [
      '1. Enable location sharing with trusted contacts.',
      '2. Use features like "Plan a Walk" or "Check In" in the AlertNet app.',
    ],
  },
  {
    title: 'Know Safe Zones',
    points: [
      '1. Identify nearby shops, police stations, or 24/7 businesses you can enter if needed.',
    ],
  },
];

// 1. ACCEPT NAVIGATION PROPS
const WalkingAloneTips = ({ setIsWalkingAloneTips, setIsSafetyResources }) => {
  const { getScaledFontSize } = useFontSize(); // Use font size hook

  return (
    <View style={styles.safeArea}>
      {/* Header section is now outside the ScrollView for consistent positioning */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setIsWalkingAloneTips(false);
            setIsSafetyResources(true);
          }}
        >
          <Icon name="arrow-left" size={28} color="#000" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: getScaledFontSize(26) }]}>
            Tips for Walking Alone
          </Text>
          <Text style={[styles.subtitle, { fontSize: getScaledFontSize(18) }]}>
            Stay Alert. Stay Safe.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {tipsData.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: getScaledFontSize(16) }]}>
              {section.title}
            </Text>
            <View style={[styles.cardContainer, section.image && styles.cardContainerWithImage]}>
              {section.image && (
                <Image source={section.image} style={styles.inlineImage} />
              )}
              <View style={styles.card}>
                {section.points.map((point, pIndex) => (
                  <Text key={pIndex} style={[styles.pointText, { fontSize: getScaledFontSize(15) }]}>
                    {point}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        ))}
        
        <Image
          source={require('../../images/signMan.png')} // Replace with your actual image path
          style={styles.footerImage}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingTop: Constants.statusBarHeight,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    color: '#333',
    marginTop: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#D35400', // A reddish-orange color
    marginBottom: 10,
  },
  cardContainer: {
    // This container helps manage layout, especially with images
  },
  cardContainerWithImage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    flex: 1, // Allows card to take remaining space if there's an image
  },
  pointText: {
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  inlineImage: {
    width: 60,
    height: 120,
    resizeMode: 'contain',
    marginRight: 10,
    marginTop: 10,
  },
  footerImage: {
    width: 100,
    height: 150,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 20,
  },
});

export default WalkingAloneTips;