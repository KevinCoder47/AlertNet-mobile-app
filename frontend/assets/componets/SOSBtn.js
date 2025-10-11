import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert } from 'react-native'
import React, {useState} from 'react'
import { SOSService } from '../services/SOSService'

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
        // console.log($&);
        
        if (isSOSPreview) {
          setIsTest(true);
          return;
        }
        
        try {
          // This new function returns almost instantly with the session ID.
          // The heavy work of sending notifications happens in the background.
          const sessionId = await SOSService.initiateSOSSession();
          
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