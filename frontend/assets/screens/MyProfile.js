import React, {useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Dimensions, SafeAreaView, Switch, ImageBackground, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; 
import { useTheme } from '../contexts/ColorContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");

const MyProfile = ({setIsUserProfile, userImage,userData}) => {
  const navigation = useNavigation();
  const [isLocationOn, setIsLocationOn] = useState(true);
  const [userFullName, setUserFullName] = useState(`${userData.name} ${userData.surname}`);
  const [userCampus, setUserCampus] = useState(userData.campus || '');
  const [userPhoneNumber, setUserPhoneNumber] = useState(userData.phone);
  const [userEmail, setUserEmail] = useState(userData.email);
  const [userAddress, setUserAddress] = useState(userData.address || 'Not set');
  const [showCampusPicker, setShowCampusPicker] = useState(false);

  const { colors, isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const campuses = ['APK', 'APB', 'DFC', 'SWC'];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Profile Image with Gradient Overlay */}
      <TouchableOpacity style={styles.profilePicture} onPress={() => {}}>
        <ImageBackground style={styles.profilePicture} source={{ uri: userImage }}>
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.overlay}
          />
        </ImageBackground>
      </TouchableOpacity>
      
      {/* Back Button */}
      <TouchableOpacity onPress={() => setIsUserProfile(false)} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="white" />
      </TouchableOpacity>
      
      <View style={styles.contentWrapper}>
        {/* Header with Name */}
        <View style={styles.headerContainer}>
          <Text style={[styles.artistName, {fontSize: 40}]} numberOfLines={2}>
            {userFullName}
          </Text>
          <Ionicons name="person-outline" size={20} color="white" style={styles.personIcon} />
        </View>

        {/* Info Card */}
        <View style={[styles.infoView, {backgroundColor: colors.background, paddingTop: 20}]}>
          {/* Full Name */}
          <View style={styles.titleAndInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={16} color={colors.secondary} />
              <Text style={[styles.title, { color: colors.secondary, marginLeft: 8, fontSize: 11 }]}>FULL NAME</Text>
            </View>
            <TextInput
              value={userFullName}
              onChangeText={setUserFullName}
              editable={isEditing}
              style={[styles.textInput, { color: colors.text, fontSize: 13 }]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.secondary}
            />
          </View>

          <View style={styles.divider} />

          {/* Campus Selection */}
          <View style={styles.titleAndInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="business-outline" size={16} color={colors.secondary} />
              <Text style={[styles.title, { color: colors.secondary, marginLeft: 8, fontSize: 11 }]}>CAMPUS</Text>
            </View>
            {isEditing ? (
              <TouchableOpacity onPress={() => setShowCampusPicker(true)}>
                <Text style={[styles.textInput, { color: colors.text, fontSize: 13 }]}>{userCampus || 'Select Campus'}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.textInput, { color: colors.text, fontSize: 13 }]}>{userCampus || 'Not selected'}</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Phone Number */}
          <View style={styles.titleAndInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="call-outline" size={16} color={colors.secondary} />
              <Text style={[styles.title, { color: colors.secondary, marginLeft: 8, fontSize: 11 }]}>PHONE NUMBER</Text>
            </View>
            <TextInput
              value={userPhoneNumber}
              onChangeText={setUserPhoneNumber}
              editable={isEditing}
              style={[styles.textInput, { color: colors.text, fontSize: 13 }]}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.secondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.titleAndInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={16} color={colors.secondary} />
              <Text style={[styles.title, { color: colors.secondary, marginLeft: 8, fontSize: 11 }]}>EMAIL</Text>
            </View>
            <TextInput
              value={userEmail}
              onChangeText={setUserEmail}
              editable={isEditing}
              style={[styles.textInput, { color: colors.text, fontSize: 13 }]}
              placeholder="Enter your email"
              placeholderTextColor={colors.secondary}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.divider} />

          {/* Address */}
          <View style={styles.titleAndInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={16} color={colors.secondary} />
              <Text style={[styles.title, { color: colors.secondary, marginLeft: 8, fontSize: 11 }]}>RES ADDRESS</Text>
            </View>
            <TextInput
              value={userAddress}
              onChangeText={setUserAddress}
              editable={isEditing}
              style={[styles.textInput, { color: colors.text, fontSize: 13 }]}
              placeholder="Enter your address"
              placeholderTextColor={colors.secondary}
            />
          </View>

          <View style={styles.divider} />

          {/* Terms and Conditions */}
          <View style={styles.titleAndInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text-outline" size={16} color={colors.secondary} />
              <Text style={[styles.title, { color: colors.secondary, marginLeft: 8, fontSize: 11 }]}>TERMS & CONDITIONS</Text>
            </View>
            <TouchableOpacity>
              <Text style={[styles.buttonText, { color: colors.text, fontSize: 13 }]}>View</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Privacy Policy */}
          <View style={styles.titleAndInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.secondary} />
              <Text style={[styles.title, { color: colors.secondary, marginLeft: 8, fontSize: 11 }]}>PRIVACY POLICY</Text>
            </View>
            <TouchableOpacity>
              <Text style={[styles.buttonText, { color: colors.text, fontSize: 13 }]}>View</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Permission */}
          <View style={styles.titleAndInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="key-outline" size={16} color={colors.secondary} />
              <Text style={[styles.title, { color: colors.secondary, marginLeft: 8, fontSize: 11 }]}>PERMISSIONS</Text>
            </View>
            <TouchableOpacity>
              <Text style={[styles.buttonText, { color: colors.text, fontSize: 13 }]}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Share Live Location with Toggle */}
          <View style={styles.titleAndInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={16} color={colors.secondary} />
              <Text style={[styles.title, { color: colors.secondary, marginLeft: 8, fontSize: 11 }]}>SHARE LIVE LOCATION</Text>
            </View>
            <Switch
              value={isLocationOn}
              onValueChange={setIsLocationOn}
              trackColor={{ false: "#767577", true: "#34C759" }}
              thumbColor={isLocationOn ? "#fff" : "#f4f3f4"}
            />
          </View>

          {/* Edit/Save Button */}
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: isEditing ? '#FF7E30' : '#333333' }]} 
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={[styles.editButtonText, {fontSize: 13}]}>
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Campus Selection Modal */}
      <Modal
        visible={showCampusPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCampusPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, {backgroundColor: colors.background}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Select Campus</Text>
            {campuses.map((campus) => (
              <TouchableOpacity
                key={campus}
                style={styles.campusOption}
                onPress={() => {
                  setUserCampus(campus);
                  setShowCampusPicker(false);
                }}
              >
                <Text style={[styles.campusText, {color: colors.text}]}>{campus}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCampusPicker(false)}
            >
              <Text style={[styles.cancelText, {color: colors.text}]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyProfile;

const styles = StyleSheet.create({
 container: {
    flex: 1,
    width: width,
    height: height,
  },
  profilePicture: {
    width: width,
    height: width * 0.9,
    position: "absolute",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 100,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 100,
    padding: 10
  },
  headerContainer: {
    marginLeft: 20,
    height: width * 0.4,
    justifyContent: 'flex-end',
    top: 0,
  },
  artistName: {
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: -1,
    lineHeight: 40,
  },
  personIcon: {
    position: 'absolute',
    right: 20,
    bottom: 5,
  },
  infoView: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  titleAndInfo: {
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontWeight: "400",
  },
  textInput: {
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingVertical: 0,
    includeFontPadding: false,
    minHeight: 0,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
    fontWeight: "600",
  },
  buttonText: {
    textDecorationLine: 'underline',
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 24,
    opacity: 0.5,
  },
  editButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 24,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  campusOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  campusText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#FF7E30',
  },
});

// testing tesing