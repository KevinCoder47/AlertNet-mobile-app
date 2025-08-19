import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function QrCode({ setIsQrCode, setIsSOS }) {
  const contacts = [
    {
      id: 1,
      name: "Lebron James",
      distance: "5km Away",
      phone: "067 878 976",
      image: require("../images/Lebron_James.jpg"),
    },
    {
      id: 2,
      name: "Josh Naidoo",
      distance: "30 km Away",
      phone: "072 654 2234",
      image: require("../images/josh_Naidoo.jpg"),
    },
  ];

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
            <Image
              source={require("../images/My Pic 2.0.jpg")}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.nameText}>Kevin Serakalala</Text>
          <Text style={styles.ageText}>Age : 20</Text>
          <Text style={styles.genderText}>Gender : Male</Text>
        </View>

        <View style={styles.emergencySection}>
          <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
          
          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <Image
                source={contact.image}
                style={styles.contactImage}
              />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactDistance}>{contact.distance}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => handleCall(contact.phone)}
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
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ageText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 4,
  },
  genderText: {
    color: '#AAAAAA',
    fontSize: 14,
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
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
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
  contactDistance: {
    color: '#AAAAAA',
    fontSize: 12,
    marginBottom: 2,
  },
  contactPhone: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  callButton: {
    padding: 10,
  },
});