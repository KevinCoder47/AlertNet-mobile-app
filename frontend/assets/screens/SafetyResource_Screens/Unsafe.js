import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFontSize } from '../../contexts/FontSizeContext';
import { useTheme } from '../../contexts/ColorContext';

export default function Unsafe({ setIsUnsafePage, setIsSafetyResources, setIsHelplinePage = null }) {
  const { getScaledFontSize } = useFontSize();
  const { colors } = useTheme();

  const handleHelplinePress = () => {
    if (setIsHelplinePage && typeof setIsHelplinePage === 'function') {
      setIsUnsafePage(false);
      setIsHelplinePage(true);
    } else {
      // Fallback if setIsHelplinePage is not provided
      Alert.alert(
        'Emergency Helplines',
        'Please navigate to Safety Resources > Helplines to view emergency contact numbers.',
        [{ text: 'OK' }]
      );
    }
  };

  const quickActions = [
    {
      id: 'sos',
      icon: 'alert-circle',
      title: 'Trigger SOS',
      description: 'Discreetly alert emergency contacts',
      color: '#DC2626',
      bgColor: '#FECACA',
    },
    {
      id: 'location',
      icon: 'map-pin',
      title: 'Share Location',
      description: 'Send live location to trusted contacts',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
    },
    {
      id: 'call',
      icon: 'phone',
      title: 'Emergency Call',
      description: 'Quick dial emergency services',
      color: '#10B981',
      bgColor: '#D1FAE5',
    },
  ];

  const safetyTips = [
    {
      icon: 'shield',
      title: 'Trust Your Instincts',
      description: 'If something feels off, it probably is. Change your route or location immediately.',
      color: '#8B5CF6',
    },
    {
      icon: 'phone-call',
      title: 'Call Someone',
      description: 'Stay on the line with a friend or use the in-app emergency call feature.',
      color: '#F59E0B',
    },
    {
      icon: 'navigation',
      title: 'Head to Safety',
      description: 'Move towards well-lit, populated areas or designated safe zones nearby.',
      color: '#06B6D4',
    },
    {
      icon: 'users',
      title: 'Ask for Help',
      description: 'Enter a shop, approach security, or ask nearby people for assistance.',
      color: '#EC4899',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          onPress={() => {
            setIsUnsafePage(false);
            setIsSafetyResources(true);
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Feather name="alert-triangle" size={24} color="#EF4444" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { fontSize: getScaledFontSize(20), color: colors.text }]}>
              Feeling Unsafe?
            </Text>
            <Text style={[styles.headerSubtitle, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
              Immediate actions you can take
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert Banner */}
        <View style={[styles.alertBanner, { backgroundColor: '#FEF3C7' }]}>
          <Feather name="zap" size={20} color="#F59E0B" />
          <Text style={[styles.alertText, { fontSize: getScaledFontSize(13), color: '#92400E' }]}>
            Your safety is our <Text style={styles.alertBold}>top priority</Text>. Take action now.
          </Text>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumber}>
            <Text style={[styles.sectionNumberText, { fontSize: getScaledFontSize(14) }]}>1</Text>
          </View>
          <Text style={[styles.sectionTitle, { fontSize: getScaledFontSize(18), color: colors.text }]}>
            Quick Actions
          </Text>
        </View>

        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
              onPress={action.action}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: action.bgColor }]}>
                <Feather name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { fontSize: getScaledFontSize(14), color: colors.text }]}>
                {action.title}
              </Text>
              <Text style={[styles.actionDescription, { fontSize: getScaledFontSize(12), color: colors.textSecondary || colors.text }]}>
                {action.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Tips Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumber}>
            <Text style={[styles.sectionNumberText, { fontSize: getScaledFontSize(14) }]}>2</Text>
          </View>
          <Text style={[styles.sectionTitle, { fontSize: getScaledFontSize(18), color: colors.text }]}>
            Safety Tips
          </Text>
        </View>

        {safetyTips.map((tip, index) => (
          <View
            key={index}
            style={[styles.tipCard, { backgroundColor: colors.card }]}
          >
            <View style={[styles.tipIconContainer, { backgroundColor: tip.color + '20' }]}>
              <Feather name={tip.icon} size={20} color={tip.color} />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { fontSize: getScaledFontSize(15), color: colors.text }]}>
                {tip.title}
              </Text>
              <Text style={[styles.tipDescription, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
                {tip.description}
              </Text>
            </View>
          </View>
        ))}

        {/* Emergency Numbers */}
        <View style={[styles.emergencyCard, { backgroundColor: '#DC2626' }]}>
          <View style={styles.emergencyHeader}>
            <Feather name="phone" size={24} color="white" />
            <View style={styles.emergencyTextContainer}>
              <Text style={[styles.emergencyTitle, { fontSize: getScaledFontSize(16) }]}>
                Emergency Services
              </Text>
              <Text style={[styles.emergencySubtitle, { fontSize: getScaledFontSize(13) }]}>
                Available 24/7
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={handleHelplinePress}
          >
            <Text style={[styles.emergencyButtonText, { fontSize: getScaledFontSize(16) }]}>
              View Helplines
            </Text>
            <Feather name="arrow-right" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* Bottom CTA */}
        <TouchableOpacity
          style={[styles.backButtonContainer, { backgroundColor: colors.card }]}
          onPress={() => {
            setIsUnsafePage(false);
            setIsSafetyResources(true);
          }}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
          <Text style={[styles.backButtonText, { fontSize: getScaledFontSize(15), color: colors.text }]}>
            Back to Safety Resources
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

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
    backgroundColor: '#FEE2E2',
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 28,
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
  alertBold: {
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionNumberText: {
    color: 'white',
    fontWeight: '700',
  },
  sectionTitle: {
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: 160,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  actionDescription: {
    opacity: 0.7,
    lineHeight: 18,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 'auto',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    opacity: 0.7,
    lineHeight: 20,
  },
  emergencyCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  emergencyTitle: {
    color: 'white',
    fontWeight: '700',
    marginBottom: 2,
  },
  emergencySubtitle: {
    color: 'white',
    opacity: 0.9,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  emergencyButtonText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButtonText: {
    fontWeight: '600',
  },
});