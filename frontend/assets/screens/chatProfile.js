import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  Linking,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const ChatProfile = ({ onClose, profileData }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleCall = async () => {
    if (profileData?.phone) {
      const phoneNumber = `tel:${profileData.phone}`;
      const supported = await Linking.canOpenURL(phoneNumber);
      if (supported) {
        await Linking.openURL(phoneNumber);
      } else {
        Alert.alert('Call Failed', 'Unable to make calls on this device.');
      }
    } else Alert.alert('No Phone Number', 'This user has not provided a phone number.');
  };

  const getMemberSince = (timestamp) => {
    if (!timestamp) return 'N/A';
    const joinDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return joinDate.getFullYear();
  };

  const handleBlockUser = () => {
    setIsMenuVisible(false);
    Alert.alert(
      `Block ${profileData?.name}?`,
      "Blocked users will no longer be able to send you messages or find your profile. This action cannot be undone.",
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Block', style: 'destructive', onPress: () => console.log(`User ${profileData?.id} blocked.`) }]
    );
  };

  const handleReportUser = () => {
    setIsMenuVisible(false);
    // In a real app, this would navigate to a report screen
    Alert.alert('Report User', 'Thank you for your report. We will review this user\'s activity.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Image */}
      <ImageBackground
        source={{
          uri: profileData?.profilePicture || profileData?.imageUrl || profileData?.avatar?.uri || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face'
        }}
        style={styles.profileImageBackground}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradientOverlay}
        />
      </ImageBackground>

      {/* Header with Back Button */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentSpacer} />
        <View style={styles.content}>
          <View style={styles.profileInfoContainer}>
            <Text style={styles.profileName} numberOfLines={2}>{profileData?.name || 'Sarah Johnson'}</Text>
            <View style={styles.profileHandleContainer}>
              <Ionicons name="call-outline" size={14} color="#AAAAAA" />
              <Text style={styles.profileHandle}>{profileData?.phone || 'No phone number'}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={20} color="#AAAAAA" style={styles.statIcon} />
              <Text style={styles.statValue}>{getMemberSince(profileData?.createdAt)}</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="walk-outline" size={20} color="#AAAAAA" style={styles.statIcon} />
              <Text style={styles.statValue}>128</Text>
              <Text style={styles.statLabel}>Walks</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star-outline" size={20} color="#AAAAAA" style={styles.statIcon} />
              <Text style={styles.statValue}>4.6</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.messageButton]} onPress={onClose}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
              <Ionicons name="call-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.videoButton]} onPress={() => Alert.alert('Video Call', 'This feature is coming soon!')}>
              <Ionicons name="videocam-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>About</Text>
            <Text style={styles.detailsText}>
              {profileData?.bio || 'This user has not set a bio yet. This section can be expanded to show more details about their interests, safety preferences, or a short introduction.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Options Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isMenuVisible}
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
          <BlurView intensity={50} tint="dark" style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.optionsMenu}>
                <TouchableOpacity style={styles.optionsMenuItem} onPress={handleBlockUser}>
                  <Ionicons name="hand-left-outline" size={22} color="#FF4444" />
                  <Text style={[styles.optionsMenuText, { color: '#FF4444' }]}>Block User</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.optionsMenuItem} onPress={handleReportUser}>
                  <Ionicons name="flag-outline" size={22} color="#FFCC00" />
                  <Text style={[styles.optionsMenuText, { color: '#FFCC00' }]}>Report User</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </BlurView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  profileImageBackground: {
    width: '100%',
    height: height * 0.55,
    position: 'absolute',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 16,
  },
  menuButton: {
    padding: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  contentSpacer: {
    height: height * 0.4,
  },
  content: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: height * 0.6,
  },
  profileInfoContainer: {
    alignItems: 'center',
    marginTop: -70, // Pulls the content up over the image
  },
  profileName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileHandleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileHandle: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 20,
    marginVertical: 24,
  },
  statItem: {
    alignItems: 'center',
    width: width / 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    width: 52,
    backgroundColor: '#333333',
  },
  videoButton: {
    width: 52,
    backgroundColor: '#333333',
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    width: width * 0.9,
    marginBottom: 40,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionsMenuText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#3A3A3C',
    marginHorizontal: 16,
  },
});

export default ChatProfile;