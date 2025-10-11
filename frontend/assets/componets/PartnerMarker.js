import { StyleSheet, View, Image, Text } from 'react-native'
import React from 'react'

const PartnerMarker = ({ partner }) => {
  // Use partner data if provided, otherwise use defaults
  const partnerName = partner?.name || 'Walk Partner';
  const eta = partner?.eta || '5'; // Default ETA in minutes
  const distance = partner?.distance || '0.8'; // Default distance in miles
  const avatarSource = partner?.avatarSource || require('../images/profile-pictures/default.jpg');

  return (
    <View style={styles.container}>
      {/* Avatar Circle */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarBorder}>
          <Image 
            source={avatarSource} 
            style={styles.avatar}
          />
        </View>
      </View>

      {/* Floating Info View */}
      <View style={styles.infoContainer}>
        <Text style={styles.locationText}>{partnerName}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>
            <Text style={styles.numberText}>{eta}</Text>
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.detailText}>
            <Text style={styles.numberText}>{distance}</Text> 
          </Text>
        </View>
      </View>
    </View>
  )
}

export default PartnerMarker

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    zIndex: 2,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  infoContainer: {
    marginLeft: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
  },
  numberText: {
    color: '#FF6B35',
  },
  dot: {
    fontSize: 12,
    color: '#666666',
    marginHorizontal: 4,
  },
})