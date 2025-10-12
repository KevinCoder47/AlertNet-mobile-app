import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert } from 'react-native'
import React, {useState} from 'react'
import { SOSService } from '../services/SOSService'
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        
        try {
          // MODIFIED: Get user data from storage before initiating SOS.
          // This ensures we have a valid user ID and other details.
          const userDataString = await AsyncStorage.getItem('userData');
          if (!userDataString) {
            throw new Error("You must be logged in to use SOS. Please sign in again.");
          }
          const userData = JSON.parse(userDataString);
          const userId = userData.uid || userData.id || userData.userId;

          if (!userId) {
            throw new Error("Your user session is invalid. Please sign in again.");
          }

          // This new function returns almost instantly with the session ID.
          // The heavy work of sending notifications happens in the background.
          const sessionId = await SOSService.initiateSOSSession('manual', userData);
          
          // Navigate to the SOS page immediately.
          // The SOSPage will show the real-time progress of alerts being sent.
          onPress(sessionId);

        } catch (error) {
          // This will only catch critical errors from creating the session or getting location.
          // Notification-related errors are handled in the background.
          Alert.alert(
            'SOS Activation Failed',
            `Could not initiate SOS mode: ${error.message}. Please check your connection and location permissions and try again.`,
            [{ text: 'OK' }]
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