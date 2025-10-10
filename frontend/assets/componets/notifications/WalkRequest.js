import { useNotifications } from '../../contexts/NotificationContext';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import MapWithDetails from '../../screens/MapWithDetails';
import { getUserDocument, getRequesterAvatar } from '../../../services/firestore';

const { width, height } = Dimensions.get('window');

const WalkStartPoint = ({ setIsDestinationDone, setIsSearchPartner, setIsStartPoint, onStartPointSelect }) => {
  const { sendWalkRequest } = useNotifications();

  const handleSearch = () => {
    console.log("Search button pressed");
    const walkData = {
      walkFrom: 'UJ APB Campus',
      walkTo: 'Res - Richmond 50 Rd', 
      time: '5 mins',
      partnerName: 'Kevin Serakalala',
      partnerInitials: 'KS'
    };
    sendWalkRequest(walkData);
    setIsSearchPartner(true);
    setIsStartPoint(false);
  };

  return (
    <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
      <Text style={styles.searchButtonText}>Search</Text>
    </TouchableOpacity>
  );
};

const WalkRequest = ({ walkData, onAccept, onDecline }) => {
  const {
    walkFrom = 'UJ APB Campus',
    walkTo = 'Res - Richmond 50 Rd',
    time = '5 mins',
    currentTime = '07:02',
    partnerName = 'Kevin Serakalala',
    partnerInitials = 'KS',
    rating = 4.8,
    isVerified = true,
  } = walkData || {};

  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        console.log('Fetching avatar for requesterId:', walkData?.requesterId);
        
        if (walkData?.requesterId) {
          const user = await getUserDocument(walkData.requesterId);
          console.log('Fetched user data:', user);
          console.log('User image URL:', user?.imageUrl);
          
          if (user?.imageUrl) {
            setAvatarUrl(user.imageUrl);
          } else {
            console.log('No image URL found for user');
          }
        } else {
          console.log('No requesterId found in walkData');
        }
      } catch (error) {
        console.error('Error fetching requester avatar:', error);
      }
    };
    fetchAvatar();
  }, [walkData?.requesterId]);

  return (
    <View style={styles.container}>
      <MapWithDetails />
      <View style={styles.pushBottom}>
        {/* Main popup card */}
        <View style={styles.popUpContainer}>
          <View style={styles.header}>
            <View style={styles.headerHandle} />
            <Text style={styles.headerTitle}>Walk Partner Request</Text>
          </View>
          
          {/* Partner info section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                {avatarUrl ? (
                  <Image
                    style={styles.avatarPlaceholder}
                    source={{ uri: avatarUrl }}
                  />
                ) : (
                  <Text style={styles.avatarText}>{partnerInitials}</Text>
                )}
              </View>
              {isVerified && (
                <Image source = {require('../../icons/checkmark.png')} style={styles.verifiedBadge}/>
              )}
            </View>
            
            <Text style={styles.partnerName}>{partnerName}</Text>
            
            {/* Rating with black stars */}
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.floor(rating) ? "star" : "star-outline"}
                    size={20}
                    color="black"
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          </View>

          {/* Action buttons - only accept is orange */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={onDecline}>
              <Text style={[styles.buttonText, styles.declineButtonText]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
              <Text style={[styles.buttonText, styles.acceptButtonText]}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Walk details - unchanged shapes */}
        <View style={styles.walkDetails}>
          <View style={styles.walkDetailsContent}>
            <View style={styles.locationRow}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF', marginRight: 15, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 4, height: 4, borderRadius: 3, backgroundColor: '#1C1C1C' }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.text, { color: '#FF6600', fontSize: 10, fontWeight: '500' }]}>
                  Walk from
                </Text>
                <Text style={[styles.text, { color: '#FFFFFF', fontSize: 14, fontWeight: '600' }]}>
                  {walkFrom}
                </Text>
              </View>
              <Text style={[styles.text, { color: '#CECECE', fontSize: 24, fontWeight: '300' }]}>
                {time}
              </Text>
            </View>
            
            <View style={{ width: 2, height: 25, backgroundColor: '#FFFFFF', marginLeft: 5, marginBottom: 15 }} />
            
            <View style={styles.locationRow}>
              <View style={{ width: 12, height: 12, backgroundColor: '#FFFFFF', marginRight: 15, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 4, height: 4, backgroundColor: '#1C1C1C' }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.text, { color: '#FF6600', fontSize: 10, fontWeight: '500' }]}>
                  Walk to
                </Text>
                <Text style={[styles.text, { color: '#FFFFFF', fontSize: 14, fontWeight: '600' }]}>
                  {walkTo}
                </Text>
              </View>
              <Text style={[styles.text, { color: '#CECECE', fontSize: 24, fontWeight: '300' }]}>
                {currentTime}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default WalkRequest;
export { WalkStartPoint };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: 'transparent',
  },
 pushBottom: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  popUpContainer: {
    width: width,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 47,
    borderBottomRightRadius: 47,
    paddingBottom: 30,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: -45,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerHandle: {
    width: 35,
    height: 3,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6600',
    textAlign: 'center',
    fontFamily: 'Poppins',
    letterSpacing: -0.5,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 28,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  partnerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'Poppins',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Poppins',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  buttonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderColor: '#E5E5EA',
  },
  declineButtonText: {
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#FF6600',
    borderColor: '#FF6600',
  },
  acceptButtonText: {
    color: 'white',
  },
  walkDetails: {
    width: width,
    backgroundColor: '#1C1C1C',
    paddingBottom: 20,
    height: 220
  },
  walkDetailsContent: {
    marginTop: 70,
    paddingHorizontal: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  text: {
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  searchButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#000',
  },
  searchButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});