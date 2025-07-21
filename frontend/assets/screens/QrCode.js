import { ImageBackground, Text, View, Image, StatusBar, StyleSheet, TouchableOpacity } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { Feather } from '@expo/vector-icons';

function QrCode() {
  const contacts = [
    {
      id: 1,
      name: "Lebron James",
      distance: "5KM Away",
      phone: "067 878 9765",
      image: require("../assets/images/Lebron_James.jpg"),
    },
    {
      id: 2,
      name: "Josh Naidoo",
      distance: "30 km Away",
      phone: "072 654 2234",
      image: require("../assets/images/josh_Naidoo.jpg"),
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Emergency Contacts</Text>
      {contacts.map((contact) => (
        <View key={contact.id} style={styles.contactRow}>
          <Image source={contact.image} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.name}>{contact.name}</Text>
            <Text style={styles.subText}>{contact.distance}</Text>
            <Text style={styles.subText}>{contact.phone}</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Feather name="phone" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

export default function Index() {
  return (
    <ImageBackground
      source={require("../assets/images/SOS-background.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <AntDesign
          name="arrowleft"
          size={24}
          color="white"
          style={styles.backIcon}
        />
        <Text style={styles.title}>User Profile</Text>
        <Text style={styles.subtitle}>ID: 345679</Text>

        <Image
          source={require("../assets/images/My Pic 2.0.jpg")}
          style={styles.profileImage}
        />

        <View>
          <Text style={styles.nameText}>Kevin Serakalala</Text>
          <Text style={styles.subText}>Age: 20</Text>
          <Text style={styles.subText}>Gender: Male</Text>
        </View>

        {/* Emergency Contacts Component */}
        <EmergencyContactsCard />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backIcon: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  title: {
    color: "white",
    top: 40,
    position: 'absolute',
    fontWeight: 'bold',
  },
  subtitle: {
    top: 60,
    position: 'absolute',
    color: 'white',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 70,
    marginBottom: 20,
  },
  nameText: {
    color: 'white',
    fontWeight: 'bold',
    paddingTop: 20,
  },
  subText: {
    color: 'white',
    fontSize: 12,
  },
  card: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    padding: 20,
    marginTop: 30,
    width: "90%",
    alignSelf: "center",
  },
  header: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 15,
    fontSize: 16,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontWeight: "bold",
  },
  callButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 20,
  },
});
