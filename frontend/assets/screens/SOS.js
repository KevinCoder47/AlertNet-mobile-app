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
} from 'react-native';

export default function SOS({ setIsSOS }) {
  console.log("SOS component rendered");

  const [activityLog, setActivityLog] = useState([
    { time: '21:45', message: 'Your friends have been notified' },
    { time: '21:47', message: 'Mpilo is on the way to you' },
    { time: '21:48', message: 'APB Security is on the way to you.' },
  ]);

  const scrollViewRef = useRef(null); // For auto-scroll

  const handleSafePress = () => {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setActivityLog((prevLog) => {
      const updatedLog = [...prevLog, { time, message: 'You marked yourself as Safe' }];
      return updatedLog.slice(-10); // Keep only latest 10 entries
    });

    // Scroll after update has rendered
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
        <ExpoStatusBar style='auto' translucent backgroundColor="transparent" />

        {/* Top Content */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => setIsSOS(false)}
            style={{
              position: 'absolute',
              top: 48,
              left: 30,
              padding: 10,
              zIndex: 1,
            }}
          >
            <Ionicons name="arrow-back" size={30} color="white" />
          </TouchableOpacity>

          {/* Menu Button */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 50,
              right: 30,
              padding: 10,
              zIndex: 1,
            }}
          >
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>

          <Text style={{ fontSize: 20, color: 'white', fontWeight: 'bold', marginTop: 40, top: 15 }}>
            SOS
          </Text>

          <Text style={{ fontSize: 25, color: 'white', fontWeight: 'bold', marginTop: 40 }}>
            Emergency Calling...
          </Text>

          <Text style={{ fontSize: 12, color: 'white', marginTop: 20 }}>
            Your Contacts, app users nearby, and your
          </Text>

          <Text style={{ color: 'white', fontSize: 12 }}>
            organisation will see your help
          </Text>
          
          <TouchableOpacity>
            <Image
              source={require('../images/QR_Code_Updated.png')}
              style={{ width: 200, height: 200, marginTop: 50 }}
            />
          </TouchableOpacity>

          {/* Safe Button - Not inside log pane */}
          <TouchableOpacity
            onPress={handleSafePress}
            style={{
              backgroundColor: 'rgba(50, 49, 49, 0.2)',
              paddingVertical: 18,
              paddingHorizontal: 80,
              borderRadius: 50,
              alignItems: 'center',
              marginTop: 50,
              elevation: 1.5,
              shadowOpacity: 0.6,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 4 }
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>
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
