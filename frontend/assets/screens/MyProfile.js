import React, {useState} from 'react';
import { View, Text, StyleSheet,TouchableOpacity, Image,TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'; 
import { useTheme } from '../contexts/ColorContext';

//testing 

const MyProfile = ({setIsUserProfile}) => {

  const navigation = useNavigation();
  const [isLocationOn, setIsLocationOn] = useState(false);
  const [userFullName,setUserFullName] = useState('Musa Buthelezi')
  const { colors } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const dark = false


  return (
    <View style={styles.container}>
    
    <TouchableOpacity onPress={() => setIsUserProfile(false)} style = {{marginTop: 40}}>
    <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
    </TouchableOpacity>

    <View style={styles.topSection}>
    
        <Text style={styles.headerText}>My Profile</Text>
 
    <View style={styles.imageWrapper}>
    <Image
      source={{ uri: 'https://via.placeholder.com/100' }} 
      style={styles.profileImage}
    />
  </View>

  <TouchableOpacity onPress={() => {}}>
    <Text style={styles.addPhotoText}>+ Add Profile Picture</Text>
  </TouchableOpacity>

  </View>

      <View style={styles.infoCard}>
      <View style={styles.row}>
          <Text style={styles.label}>FullName</Text>
          
          {/* user Full name */}
          <TextInput
            value={userFullName}
            onChangeText={setUserFullName}
            editable = {isEditing}
            style={[styles.value, { color: colors.text, }]} />

        </View>


      <View style={styles.row}>
        <Text style={styles.label}>UserName</Text>
        <Text style={styles.value}>Mpilo</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>PhoneNumber</Text>
        <Text style={styles.value}>+27639180406</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>mpilo@gmail.com</Text>
      </View>

       <View style={styles.row}>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>37Bunting Rd,Cotteloe</Text>
      </View>

      <View style={styles.row}>
       <Text style={styles.label}>Terms and Conditions</Text>
          <TouchableOpacity style={styles.value}>
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Privacy & Policy</Text>
          <TouchableOpacity style={styles.value}>
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Permission</Text>
        <TouchableOpacity style={styles.value}> <Text style={styles.buttonText}>Change</Text></TouchableOpacity>
      </View>
       
      

      <View style={styles.row}>
      <View style={styles.leftSide}>
      <Ionicons name="location-outline" size={20} color="#FFFFFF" />
      <Text style={[styles.label, { marginLeft: 8 }]}>Share Live Location</Text>
      </View>


        </View>
        
        {/* edit button */}
     <TouchableOpacity style={styles.editButton} onPress={() => {setIsEditing(!isEditing)}}>  initially isEditing = false, new = true, new-new = fasle
          {/* <Text style={styles.editButtonText}>Edit</Text> */}
          {/* <Text style={styles.editButtonText}>Save</Text> */}
          {isEditing ? <Text style={styles.editButtonText}>Save</Text> : <Text style={styles.editButtonText}>Edit</Text>}

     </TouchableOpacity></View>
    </View>
  );
};

export default MyProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,

  },
  topSection: {
  alignItems: 'center',
  marginBottom: 30,
},

imageWrapper: {
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: '#555',
  overflow: 'hidden',
  marginBottom: 10,
},

profileImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},

addPhotoText: {
  color: '#AAAAAA',
  fontSize: 14,
  marginBottom: 10,
  textDecorationLine: 'underline',
},

headerText: {
  color: '#FFFFFF',
  fontSize: 20,
  fontWeight: 'bold',
  marginTop: 5,
  marginBottom: 20,
},

  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  label: {
    color: '#AAAAAA',
    fontSize: 14,
  },


  value: {
     color: '#FFFFFF',
   fontSize: 13,
   fontWeight: 'bold',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
  
  },
  editButton: {
  backgroundColor: '#333333',
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: 'center',
  marginTop: 20,
},

editButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: 'bold',
}
});