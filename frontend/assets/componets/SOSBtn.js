import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert } from 'react-native'
import React, {useState} from 'react'
import SOSService from '../services/SOSService'

const { width, height } = Dimensions.get('window');
const SOSBtn = ({ onPress, isSOSPreview, setIsSOSPreview }) => {
    const [isTest, setIsTest] = useState(false);
    
    // only for onboarding display
    const previewTest = () => {
        if (isSOSPreview) {
           setIsTest(true)
        }
        else {
            onPress();
        }
    }

  return (
      <TouchableOpacity
      style={styles.container}
      onPress={async () => {
        console.log('SOS Button Pressed');
        
        if (isSOSPreview) {
          setIsTest(true);
          return;
        }
        
        // The service now handles the entire SOS sequence, including the police call
        const result = await SOSService.sendEmergencyNotifications();
        
        // Navigate to the SOS page, passing the session ID from the result.
        // The result contains the sosSessionId even on partial failure.
        onPress(result.sosSessionId);
        
        // Show a non-blocking confirmation alert about the notification status
        if (result.success) {
          Alert.alert(
            'Alerts Sent',
            `Notified ${result.contactsNotified} emergency contacts. You are now in SOS mode.`
          );
        } else {
          Alert.alert(
            'Notification Error',
            `SOS mode is active, but we failed to notify contacts: ${result.error || 'Unknown error'}. Please add contacts in Safety Resources.`
          );
        }
      }}
    >
          <View style={styles.innerCircle1}>
              <View style={styles.InnerCircle2}>
                  <Text style = {styles.text}>SOS</Text>
              </View>
          </View>
    </TouchableOpacity>
  )
}

export default SOSBtn

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFBDC2",
        width: height * 0.11,
        height: height * 0.11,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center"
    },
    innerCircle1: {
        backgroundColor: "#DE2B38",
        width: height * 0.10,
        height: height * 0.10,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center"
    },
    InnerCircle2: {
        backgroundColor: "#C80110",
        width: height * 0.09,
        height: height * 0.09,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center"
    },
    text: {
        color: "#FFFFFF",
        fontFamily: "Helvetica",
        fontWeight: 900,
        fontSize: 20
    }
})