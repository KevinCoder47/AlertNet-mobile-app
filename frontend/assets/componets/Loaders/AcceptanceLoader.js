import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ColorContext';

const AcceptanceLoader = ({ partnerName, meetupPoint }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.loaderCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)' }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={[styles.title, { color: colors.text }]}>
          Waiting for {partnerName} to confirm...
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          You'll be walking together from {meetupPoint}
        </Text>
        <Text style={[styles.hint, { color: colors.text }]}>
          This may take a few moments
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    minWidth: 280,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default AcceptanceLoader;