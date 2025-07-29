import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
} from 'react-native';

export default function SOS({ setIsSOS, setIsQrCode, setIsSafetyResources }) {
  const [activityLog, setActivityLog] = useState([
    { time: '21:45', message: 'Your friends have been notified' },
    { time: '21:47', message: 'Mpilo is on the way to you' },
    { time: '21:48', message: 'APB Security is on the way to you.' },
  ]);

  const scrollViewRef = useRef(null);

  const handleSafePress = () => {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setActivityLog((prevLog) => {
      const updatedLog = [...prevLog, { time, message: 'You marked yourself as Safe' }];
      return updatedLog.slice(-10); // Keep last 10 entries
    });

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    alert('Marked as Safe');
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
        <View style={{ height: StatusBar.currentHeight, backgroundColor: '#0C0B0E' }} />

        {/* Top Header */}
        <View
          style={{
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 50
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
              setIsSOS(false);
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
            <Image
              source={require('../images/QR_Code_Updated.png')}
              style={{ width: 200, height: 200, marginTop: 50 }}
            />
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
          >
            {activityLog.map((entry, index) => (
              <Text
                key={index}
                style={{
                  color: 'white',
                  marginTop: index === 0 ? 0 : 15,
                  fontSize: 11,
                }}
              >
                <Text style={{ color: 'white' }}>{entry.time + ' '}</Text>
                <Text style={{ color: '#FF6600' }}>{entry.message}</Text>
              </Text>
            ))}
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}
