import { StyleSheet, Text, View, Image, ImageBackground, TouchableOpacity, TextInput, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { View as SafeView } from 'react-native'
import TopBarSearch from './TopBarSearch'
import { useTheme } from '../contexts/ColorContext'
import { useFontSize } from '../contexts/FontSizeContext' // Import font size context
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'

const TopBarComponents = ({
  isNotHome, setIsUserProfile,
  setIsSafetyResources, userImage,
  setIsNotification, renderProfileImage, unreadCount,
  userLocation
}) => {
  const [userName, setUserName] = useState("Guest");
  const [location, setLocation] = useState("School, AuklandPark, Johannesburg");
  const { colors, isDark } = useTheme();
  const { getScaledFontSize } = useFontSize(); // Use font size hook
  
const [userData, setUserData] = useState(null);

useEffect(() => {
  const loadUserData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('userData');
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        setUserData(data);
        setUserName(data.name);
      }
    } catch (e) {
      console.error('Failed to load user data', e);
    }
  };

  loadUserData();
}, []);
  
  // Create animated value for search bar height
  const searchBarHeight = useRef(new Animated.Value(isNotHome ? 0 : 60)).current;
  
  // Update the animation when isNotHome changes
  useEffect(() => {
    Animated.timing(searchBarHeight, {
      toValue: isNotHome ? 0 : 60, 
      duration: 350, 
      useNativeDriver: false 
    }).start();
  }, [isNotHome]);
  
  return (
    <SafeView style={styles.container}>
      <View style={styles.horizontalView}>

        {/* user profile pic */}
        <TouchableOpacity
                    onPress={() => {
              setIsUserProfile(true)
              // console.log($&);
            }}>
          <ImageBackground
            source={{uri: userImage }} 
            style={styles.profilePic}
            imageStyle={styles.profilePicImage}

          >
          </ImageBackground>
        </TouchableOpacity>
        
        {/* User name and location */}
        <View style={{ gap: 4, marginTop: 0, marginLeft: 10 }}>
          <View style={{ flexDirection: "row" }}>
            <Text style={[
              styles.text, 
              { 
                fontFamily: "Helvetica Light",
                color: colors.text,
                fontSize: getScaledFontSize(16)
              }
            ]}>
              Hello, 
            </Text>
            <Text style={[
              styles.text, 
              { 
                fontFamily: "Helvetica Bold", 
                color: colors.text,
                fontSize: getScaledFontSize(16)
              }
            ]}>
              {userName}
            </Text>
          </View>
          
          {/* location */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={require('../icons/near-me.png')} style={{ width: 15, height: 15, marginRight: 5 }} />
            <Text style={{ 
              fontSize: getScaledFontSize(10), 
              fontFamily: "Helvetica Light",
              color: colors.text  
            }}>
              {location}
            </Text>
          </View>
        </View>
        
        {/* Notification bell */}
        <View style = {{marginLeft: "auto", marginHorizontal: 5, flexDirection: "row"}}>
          <TouchableOpacity onPress={() => setIsNotification(true)} style={styles.notificationButton}>
            <Image source={isDark ? require('../icons/notification-dark.png') : require('../icons/notification-light.png')} style = {{width: 20, height: 20}} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={[styles.badgeText, { fontSize: getScaledFontSize(10) }]}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* More menu */}
          <TouchableOpacity onPress={() => setIsSafetyResources(true)}>
            <Image source={isDark ? require('../icons/menu-dark.png'): require('../icons/menu-light.png')} style = {{width: 20, height: 20}} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search bar with animated height */}
      <Animated.View style={{
        height: searchBarHeight,
        overflow: 'hidden'
      }}>
        <TopBarSearch />
      </Animated.View>
    </SafeView>
  )
}

export default TopBarComponents

const styles = StyleSheet.create({
  container: {
    zIndex: 3,
    paddingTop: 50,
  },
  profilePic: {
    width: 50,
    height: 50,
  },
  profilePicImage: {
    borderRadius: 25
  },
  horizontalView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 10
  },
  userName: {
    marginLeft: 10,
    fontWeight: '500'
  },
  text: {
    // fontSize removed - now handled inline with getScaledFontSize
  },
  notificationButton: {
    width: 24,
    height: 24,
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
  },
})