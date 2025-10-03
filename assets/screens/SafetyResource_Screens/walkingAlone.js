import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFontSize } from '../../contexts/FontSizeContext';
import { useTheme } from '../../contexts/ColorContext';

const tipsData = [
  {
    id: 'route',
    icon: 'map',
    title: 'Plan Your Route',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    points: [
      'Stick to well-lit, familiar streets',
      'Avoid shortcuts through alleys or isolated areas',
      'Share your route and estimated arrival time with someone you trust',
    ],
    image: require('../../images/Alone.png'),
  },
  {
    id: 'awareness',
    icon: 'eye',
    title: 'Stay Aware of Your Surroundings',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    points: [
      'Keep music volume low or use only one earbud',
      'Avoid being distracted by your phone',
      'Stay alert to people and vehicles around you',
    ],
  },
  {
    id: 'confidence',
    icon: 'user-check',
    title: 'Project Confidence',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    points: [
      'Walk purposefully and stand tall',
      'Make brief eye contact with people around you',
      'Trust your instincts if something feels wrong',
    ],
  },
  {
    id: 'apps',
    icon: 'smartphone',
    title: 'Use Safety Apps',
    color: '#10B981',
    bgColor: '#D1FAE5',
    points: [
      'Enable location sharing with trusted contacts',
      'Use features like "Plan a Walk" or "Check In" in the AlertNet app',
      'Keep emergency contacts readily accessible',
    ],
  },
  {
    id: 'zones',
    icon: 'shield',
    title: 'Know Safe Zones',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    points: [
      'Identify nearby shops, police stations, or 24/7 businesses you can enter if needed',
      'Memorize locations of well-lit public areas',
    ],
  },
];

const WalkingAloneTips = ({ setIsWalkingAloneTips, setIsSafetyResources }) => {
  const { getScaledFontSize } = useFontSize();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          onPress={() => {
            setIsWalkingAloneTips(false);
            setIsSafetyResources(true);
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: '#DBEAFE' }]}>
            <Feather name="navigation" size={24} color="#3B82F6" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { fontSize: getScaledFontSize(20), color: colors.text }]}>
              Walking Alone Safely
            </Text>
            <Text style={[styles.headerSubtitle, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
              Essential tips for your safety
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: '#3B82F6' }]}>
          <View style={styles.heroBannerContent}>
            <Feather name="alert-circle" size={32} color="white" />
            <View style={styles.heroBannerText}>
              <Text style={[styles.heroBannerTitle, { fontSize: getScaledFontSize(18) }]}>
                Stay Alert. Stay Safe.
              </Text>
              <Text style={[styles.heroBannerSubtitle, { fontSize: getScaledFontSize(13) }]}>
                Follow these guidelines to walk confidently
              </Text>
            </View>
          </View>
        </View>

        {/* Tips Cards */}
        {tipsData.map((tip, index) => (
          <View key={tip.id} style={[styles.tipCard, { backgroundColor: colors.card }]}>
            {/* Card Header */}
            <View style={styles.tipHeader}>
              <View style={[styles.tipIconContainer, { backgroundColor: tip.bgColor }]}>
                <Feather name={tip.icon} size={24} color={tip.color} />
              </View>
              <View style={styles.tipHeaderText}>
                <View style={styles.tipNumberBadge}>
                  <Text style={[styles.tipNumber, { fontSize: getScaledFontSize(11) }]}>
                    TIP {index + 1}
                  </Text>
                </View>
                <Text style={[styles.tipTitle, { fontSize: getScaledFontSize(16), color: colors.text }]}>
                  {tip.title}
                </Text>
              </View>
            </View>

            {/* Card Content */}
            <View style={styles.tipContent}>
              {tip.image && (
                <View style={styles.imageContainer}>
                  <Image source={tip.image} style={styles.tipImage} />
                </View>
              )}
              <View style={styles.pointsContainer}>
                {tip.points.map((point, pIndex) => (
                  <View key={pIndex} style={styles.pointRow}>
                    <View style={[styles.pointDot, { backgroundColor: tip.color }]} />
                    <Text style={[styles.pointText, { fontSize: getScaledFontSize(14), color: colors.text }]}>
                      {point}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* Bottom CTA Card */}
        <View style={[styles.ctaCard, { backgroundColor: colors.card }]}>
          <Image
            source={require('../../images/signMan.png')}
            style={styles.ctaImage}
          />
          <Text style={[styles.ctaTitle, { fontSize: getScaledFontSize(16), color: colors.text }]}>
            Remember: Trust Your Instincts
          </Text>
          <Text style={[styles.ctaDescription, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
            If something doesn't feel right, it probably isn't. Find a safe place or contact someone immediately.
          </Text>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => {
              setIsWalkingAloneTips(false);
              setIsSafetyResources(true);
            }}
          >
            <Text style={[styles.ctaButtonText, { fontSize: getScaledFontSize(15) }]}>
              Back to Safety Resources
            </Text>
            <Feather name="arrow-right" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Constants.statusBarHeight + 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    marginBottom: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  heroBanner: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  heroBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBannerText: {
    marginLeft: 16,
    flex: 1,
  },
  heroBannerTitle: {
    color: 'white',
    fontWeight: '700',
    marginBottom: 4,
  },
  heroBannerSubtitle: {
    color: 'white',
    opacity: 0.9,
  },
  tipCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipHeaderText: {
    flex: 1,
  },
  tipNumberBadge: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  tipNumber: {
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tipTitle: {
    fontWeight: '700',
  },
  tipContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  tipImage: {
    width: 70,
    height: 140,
    resizeMode: 'contain',
  },
  pointsContainer: {
    flex: 1,
    gap: 12,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 12,
  },
  pointText: {
    flex: 1,
    lineHeight: 22,
  },
  ctaCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  ctaImage: {
    width: 100,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  ctaTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaDescription: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.7,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  ctaButtonText: {
    color: 'white',
    fontWeight: '700',
  },
});

export default WalkingAloneTips;