import { useNotifications } from '../../contexts/NotificationContext';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native'
import React from 'react'

const {width, height } = Dimensions.get('window')

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
    <TouchableOpacity
      style={[styles.searchButton, { backgroundColor: 'black' }]}
      onPress={handleSearch}
    >
      <Text style={styles.searchButtonText}>Search</Text>
    </TouchableOpacity>
  );
};

const WalkRequest = ({ walkData, onAccept, onDecline }) => {
  // Destructure values with defaults
  const {
    walkFrom = 'UJ APB Campus',
    walkTo = 'Res - Richmond 50 Rd',
    time = '5 mins',
    currentTime = '07:02',
    partnerName = 'Kevin Serakalala',
    partnerInitials = 'KS',
  } = walkData || {};

  return (
    <View style={styles.container}>
      {/* pop up small notification */}
      <View style={styles.popUpContainer}>
        <Text style={[styles.text, {
          color: '#FF6600',
          textAlign: 'center',
          marginTop: 30,
          fontSize: 14,
          fontWeight: '600'
        }]}>
          Walk Partner Request
        </Text>
        
        {/* Walk Details */}
        <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#333', marginRight: 15, alignItems: 'center', justifyContent: 'center' }} >
              <View style = {{width: 4, height: 4, borderRadius: 3, backgroundColor: 'white' }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, { color: '#FF6600', fontSize: 10, fontWeight: '500' }]}>
                Walk from
              </Text>
              <Text style={[styles.text, { color: '#333', fontSize: 14, fontWeight: '600' }]}>
                {walkFrom}
              </Text>
            </View>
            <Text style={[styles.text, { color: '#999', fontSize: 24, fontWeight: '300' }]}>
              {time}
            </Text>
          </View>
          
          <View style={{ width: 2, height: 25, backgroundColor: '#333', marginLeft: 5, marginBottom: 15 }} />
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25 }}>
            <View style={{ width: 12, height: 12, backgroundColor: '#333', marginRight: 15, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 4, height: 4, backgroundColor: 'white' }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, { color: '#FF6600', fontSize: 10, fontWeight: '500' }]}>
                Walk to
              </Text>
              <Text style={[styles.text, { color: '#333', fontSize: 14, fontWeight: '600' }]}>
                {walkTo}
              </Text>
            </View>
            <Text style={[styles.text, { color: '#333', fontSize: 32, fontWeight: '300' }]}>
              {currentTime}
            </Text>
          </View>
        </View>
        
        {/* Partner Info */}
        <View style={{ borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
            <Text style={[styles.text, { fontSize: 18, color: '#666', fontWeight: '600' }]}>{partnerInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.text, { fontSize: 14, color: '#999', fontWeight: '400' }]}>
              Partner
            </Text>
            <Text style={[styles.text, { fontSize: 18, color: '#333', fontWeight: '600' }]}>
              {partnerName}
            </Text>
          </View>
        </View>

        {/* Accept/Decline Buttons */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 25, gap: 12 }}>
          <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={onDecline}>
            <Text style={[styles.buttonText, styles.declineButtonText]}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
            <Text style={[styles.buttonText, styles.acceptButtonText]}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default WalkRequest

export { WalkStartPoint };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    paddingTop: 5,
    height: height,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  popUpContainer: {
    width: width * 0.96,
    height: 420,
    backgroundColor: 'white',
    alignSelf: 'center',
    borderRadius: 25,
    marginTop: 50
  },
  text: {
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderColor: '#ccc',
  },
  acceptButton: {
    backgroundColor: '#FF6600',
    borderColor: '#FF6600',
  },
  buttonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButtonText: {
    color: '#666',
  },
  acceptButtonText: {
    color: 'white',
  },
  searchButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  searchButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
})



