import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useRef, useState, useEffect } from 'react';
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SOSFirebaseService } from '../../backend/Firebase/SOSFirebaseService';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';

export default function SOS({ setIsSOS, setIsQrCode, setIsSafetyResources, sosSessionId, userData }) {
  const [activityLog, setActivityLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef(null);


  useEffect(() => {
    if (!sosSessionId) {
      setActivityLog([
        { time: 'Error', message: 'SOS session could not be started. Please try again.' }
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = SOSFirebaseService.listenToSOSActivity(sosSessionId, (data) => {
      if (data.error) {
        console.error("SOS Activity Listener Error:", data.error);
        setActivityLog([
          { id: 'error-1', time: 'Error', message: 'Could not load live activity. Please check your connection.' }
        ]);
        setIsLoading(false);
        return;
      }

      const formattedLogs = data.logs.map(log => ({
        id: log.id,
        time: log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: log.message,
      }));

      setActivityLog(formattedLogs);
      setIsLoading(false);

      // Auto-scroll to the bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [sosSessionId]);

  // Data for the QR code
  const qrCodeData = JSON.stringify({
    type: 'alertnet_sos', // Add a type to identify our QR codes
    userId: userData?.userId,
    sosSessionId: sosSessionId,
  });

  const handleSafePress = async () => {
    if (sosSessionId) {
      // Log "I'm Safe" to the session
      await SOSFirebaseService.addLogToSOSSession(sosSessionId, "You marked yourself as Safe", 'user_safe');
      
      // Send "All Safe" broadcast and end the session
      const result = await SOSFirebaseService.sendSafeBroadcast(sosSessionId);

      if (result.success) {
        alert(`Marked as Safe. Notified ${result.notifiedCount || 0} friends that the emergency is over.`);
      } else {
        // The session is still ended, but we inform the user about the notification failure.
        alert('Marked as Safe. There was an issue notifying your friends.');
        console.error("Safe broadcast error:", result.error);
      }
    } else {
      alert('Marked as Safe');
    }

    // Navigate back to home screen after a short delay
    setTimeout(() => {
      setIsSOS(false);
    }, 1500);
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../images/SOS-background.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        {/* StatusBar Fix */}
        <ExpoStatusBar style="light" translucent />

        {/* Top Header */}
        <View
          style={{
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: Constants.statusBarHeight + 10,
          }}
        >
          <TouchableOpacity
            onPress={() => setIsSOS(false)}
            style={{
              padding: 10,
              borderWidth: 0.4,
              borderColor: 'white',
              borderRadius: 10,
            }}
          >
            <Ionicons name="arrow-back" size={23} color="white" />
          </TouchableOpacity>

          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 20,
              textTransform: 'lowercase',
              fontVariant: ['small-caps'],
              flex: 1,
              textAlign: 'center',
            }}
          >
            sos
          </Text>

          <TouchableOpacity
            style={{ padding: 10 }}
            onPress={() => {
              console.log("SOS Menu Button Clicked")
              setIsSOS(false)
              setIsSafetyResources(true);
            }}
          >
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
          <Text
            style={{
              fontSize: 25,
              color: 'white',
              fontWeight: 'bold',
              marginTop: 40,
            }}
          >
            Emergency Calling...
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: 'white',
              marginTop: 20,
              textAlign: 'center',
            }}
          >
            Your Contacts, app users nearby, and your
          </Text>

          <Text
            style={{
              color: 'white',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            organisation will see your help
          </Text>

          <TouchableOpacity
            onPress={() => {
              setIsSOS(false);
              setIsQrCode(true);
            }}
          >
            {userData?.userId && sosSessionId ? (
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={qrCodeData}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>
            ) : (
              <Image source={require('../images/QR_Code_Updated.png')} style={{ width: 200, height: 200, marginTop: 50 }} />
            )}
          </TouchableOpacity>

          {/* Safe Button */}
          <TouchableOpacity
            onPress={handleSafePress}
            style={{
              backgroundColor: 'rgba(50, 49, 49, 0.2)',
              paddingVertical: 18,
              paddingHorizontal: 80,
              borderRadius: 100,
              alignItems: 'center',
              marginTop: 50,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.6,
              shadowRadius: 6,
              elevation: 2,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
              I'm Safe Now
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Notification Pane */}
        <View
          style={{
            backgroundColor: '#0C0B0E',
            width: '100%',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingVertical: 20,
            paddingHorizontal: 25,
            maxHeight: '35%',
          }}
        >
          <ScrollView
            ref={scrollViewRef}
            style={{ maxHeight: 130 }}
            showsVerticalScrollIndicator={true}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {isLoading ? (
              <ActivityIndicator color="#FF6600" style={{ marginTop: 20 }} />
            ) : (
              activityLog.map((entry, index) => (
                <Text
                  key={entry.id || index}
                  style={styles.logEntry}
                >
                  <Text style={styles.logTime}>{entry.time + ' '}</Text>
                  <Text style={styles.logMessage}>{entry.message}</Text>
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  qrCodeContainer: {
    marginTop: 50,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  logEntry: {
    color: 'white',
    marginTop: 15,
    fontSize: 11,
  },
  logTime: {
    color: 'white',
  },
  logMessage: {
    color: '#FF6600',
  },
});
