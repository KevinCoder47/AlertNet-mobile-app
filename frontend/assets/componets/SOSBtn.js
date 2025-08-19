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
        
        // Send emergency notifications
        const result = await SOSService.sendEmergencyNotifications();
        
        if (result.success) {
          Alert.alert(
            'Emergency Alert Sent',
            `Notified ${result.contactsNotified} emergency contacts`,
            [{ text: 'OK', onPress: () => onPress() }]
          );
        } else {
          Alert.alert(
            'Emergency Alert Failed',
            result.error || 'Failed to send notifications',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue to SOS', onPress: () => onPress() }
            ]
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