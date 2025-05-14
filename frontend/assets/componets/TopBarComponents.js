import { StyleSheet, Text, View, Image, ImageBackground, TouchableOpacity, TextInput, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { View as SafeView } from 'react-native'
import TopBarSearch from './TopBarSearch'

const TopBarComponents = ({isNotHome}) => {
  const [userName, setUserName] = useState("Mpilo");
  const [location, setLocation] = useState("School, AuklandPark, Johannesburg");
  
  // Create animated value for search bar height
  const searchBarHeight = useRef(new Animated.Value(isNotHome ? 0 : 60)).current;
  
  // Update the animation when isNotHome changes
  useEffect(() => {
    Animated.timing(searchBarHeight, {
      toValue: isNotHome ? 0 : 60, 
      duration: 350, // Animation duration in ms
      useNativeDriver: false 
    }).start();
  }, [isNotHome]);
  
  return (
    <SafeView style={styles.container}>
      <View style={styles.horizontalView}>
        {/* user profile pic */}
        <TouchableOpacity>
          <ImageBackground
            source={require('../images/user-profile.jpg')}
            style={styles.profilePic}
            imageStyle={styles.profilePicImage}
          >
          </ImageBackground>
        </TouchableOpacity>
        
        {/* User name and location */}
        <View style={{ gap: 4, marginTop: 0, marginLeft: 10 }}>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.text, { fontFamily: "Helvetica Light" }]}>Hello, </Text>
            <Text style={[styles.text, { fontFamily: "Helvetica Bold" }]}>{userName}</Text>
          </View>
          
          {/* location */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={require('../icons/near-me.png')} style={{ width: 15, height: 15, marginRight: 5 }} />
            <Text style={{ fontSize: 10, fontFamily: "Helvetica Light" }}>{location}</Text>
          </View>
        </View>
        
        {/* Notification bell */}
        <View style = {{marginLeft: "auto", marginHorizontal: 5, flexDirection: "row"}}>
          <TouchableOpacity style = {{width: 20, height: 20, marginRight: 20}}>
            <Image source={require('../icons/notification-light.png')} style = {{width: 20, height: 20}} />
          </TouchableOpacity>
          
          {/* More menu */}
          <TouchableOpacity>
            <Image source={require('../icons/menu-light.png')} style = {{width: 20, height: 20}} />
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
    fontSize: 16,
    fontWeight: '500'
  },
  text: {
    fontSize: 20,
  }
})