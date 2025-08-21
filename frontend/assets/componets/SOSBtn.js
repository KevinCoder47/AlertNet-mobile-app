import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert, Linking } from 'react-native'
import React, {useState} from 'react'
import SOSService from '../services/SOSService'

const { width, height } = Dimensions.get('window');
const SOSBtn = ({ onPress, isSOSPreview, setIsSOSPreview }) => {
    const [isTest, setIsTest] = useState(false);
    const POLICE_NUMBER = '0638184478';
    
    // only for onboarding display
    const previewTest = () => {
        if (isSOSPreview) {
           setIsTest(true)
        }
        else {
            onPress();
        }
    }

    const callPolice = async () => {
        try {
            const phoneUrl = `tel:${POLICE_NUMBER}`;
            const canOpen = await Linking.canOpenURL(phoneUrl);
            if (canOpen) {
                await Linking.openURL(phoneUrl);
                return true;
            } else {
                Alert.alert('Error', 'Unable to make phone calls on this device');
                return false;
            }
        } catch (error) {
            console.error('Error making phone call:', error);
            Alert.alert('Error', 'Failed to initiate phone call');
            return false;
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
        
        // First, call police
        const callSuccess = await callPolice();
        
        // Then send emergency notifications
        const result = await SOSService.sendEmergencyNotifications();
        
        if (result.success) {
          Alert.alert(
            'Emergency Alert Sent',
            `Called Police (${POLICE_NUMBER}) and notified ${result.contactsNotified} emergency contacts`,
            [{ text: 'OK', onPress: () => onPress() }]
          );
        } else {
          Alert.alert(
            'Emergency Alert',
            `Called Police (${POLICE_NUMBER}). ${result.error || 'Failed to send notifications to contacts'}`,
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