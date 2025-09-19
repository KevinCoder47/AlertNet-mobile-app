import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
export default function QrCode({ setIsQrCode, setIsSOS, emergencyContacts = [], userData = {}, userImage }) {
  const handleCall = (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    let dialerURL;

    if (Platform.OS === 'android') {
      dialerURL = `tel:${cleanPhone}`;
    } else {
      dialerURL = `telprompt:${cleanPhone}`;
    }

    Linking.canOpenURL(dialerURL)
      .then(supported => {
        if (!supported) {
          console.error("Phone number is not available");
        } else {
          return Linking.openURL(dialerURL);
        }
      })
      .catch(err => console.error(err));
  };

  return (
    <ImageBackground
      source={require("../images/SOS-background.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={() => {
            setIsQrCode(false);
            setIsSOS(true);
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.headerText}>User Profile</Text>
          <Text style={styles.idText}>ID: 345679</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.imageWrapper}>
            {userImage ? (
              <Image
                source={{ uri: userImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.contactImagePlaceholder}>
                <Text style={styles.contactInitial}>
                  {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.nameText}>{userData.fullName || `${userData.name || ''} ${userData.surname || ''}`.trim()}</Text>
          {userData.gender && <Text style={styles.genderText}>Gender : {userData.gender}</Text>}
        </View>

        <View style={styles.emergencySection}>
          <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
          
          {emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactImagePlaceholder}>
                <Text style={styles.contactInitial}>{contact.name ? contact.name.charAt(0).toUpperCase() : '?'}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
              </View>
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => handleCall(contact.phoneNumber)}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(26, 35, 50, 0.85)',
    padding: 20,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  idText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 20,
  },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  nameText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  genderText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 4,
  },
  emergencySection: {
    flex: 1,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: '#2a3441',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactPhone: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  callButton: {
    padding: 10,
  },
  contactImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#4A5568',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#718096',
  },
  contactInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});