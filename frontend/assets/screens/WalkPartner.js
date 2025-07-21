import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Image, Animated, Easing } from 'react-native'
import React, { useRef, useEffect, useState } from 'react'
import { useTheme } from '../contexts/ColorContext'
import WalkPartnerSearchBar from '../componets/WalkPartnerSearchBar'
import SavedLocation from '../componets/SavedLocation'
import WeekdaySlotView from '../componets/WeekdaySlotView'
import TimeSlots from './TimeSlots'
import AddScheduledWalk from '../componets/AddScheduledWalk'; 


const { width, height } = Dimensions.get('window')

const WalkPartner = ({ setIsWalkPartner }) => {
  const { colors, isDark } = useTheme();
  const [isAddScheduledWalkVisible, setIsAddScheduledWalkVisible] = useState(false);


  //location shortcut variables
  const savedLocations = {
    locationType: ["school", "Res"],
    locationName: ["APB Campus", "Horizon Heights"],
    address: ["53 Bunting Road Johannesburg", "39 Twickenham Avenue Johannesburg"]
  }

  
  // const dateObj = getDateParts(new Date());

  
  // Animation values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1.02)).current;
  
  // Handle going back to home screen with animation
  const goBackHome = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start(() => {
      // After animation completes, update the state
      setIsWalkPartner(false);
    });
  }
  
  // Entry animation when component mounts 
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 280, 
        delay: 30,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 280,
        delay: 30,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor: colors.background
        }
      ]}
    >
      {/* Title and back button */}
      <View style={styles.titleBack}>
        <Text style={[{ color: colors.text, fontSize: 25 }, styles.textBold]}>Plan your walk</Text>
        
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={goBackHome}
          activeOpacity={0.8}
        >
          <Image 
            source={require('../icons/back-light.png')} 
            style={styles.backIcon} 
          />
        </TouchableOpacity>
      </View>

      {/* Search button */}
      <View style = {{marginTop: 20}}>
        <WalkPartnerSearchBar />
      </View>

      {/* Saved location shortcuts */}
      <View style = {{marginLeft: width * 0.05, marginTop: height * 0.02, gap: 20}}>
        <SavedLocation LocationType={savedLocations.locationType[0]} LocationName={savedLocations.locationName[0]} address={savedLocations.address[0]} />
        <SavedLocation LocationType={savedLocations.locationType[1]} LocationName={savedLocations.locationName[1]} address={savedLocations.address[1]} />
      </View>

      {/* Time slots */}
      <Text style={[styles.h1, { marginLeft: width * 0.05,marginTop: height * 0.04,fontSize: 25,color: colors.text }]}>
        Time slots
      </Text>
      <TimeSlots setIsAddScheduledWalkVisible={setIsAddScheduledWalkVisible} />

      {/* New walk schedule component */}
      {isAddScheduledWalkVisible && (
        <View style = {{position: 'absolute', zIndex: 100, width, height}}>
        <AddScheduledWalk 
            onClose={() => setIsAddScheduledWalkVisible(false)} 
            setIsAddScheduledWalkVisible={setIsAddScheduledWalkVisible}
        />
        </View>
      )}


    </Animated.View>
  )
}

export default WalkPartner

const styles = StyleSheet.create({
  container: {
    flex: 1
    // backgroundColor: 'transparent'
  },
  titleBack: {
    marginTop: height * 0.08,
    marginLeft: width * 0.05,
    flexDirection: "row",
    justifyContent: "center"
  },
  textBold: {
    fontFamily: "Helvetica",
    fontWeight: "900"
  },
  backIcon: {
    width: 25,
    height: 25,
    transform: [{ rotate: '-90deg' }]
  },
  backBtn: {
    width: 29,
    height: 28,
    borderWidth: 1,
    borderColor: "#DADADA",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginLeft: "auto",
    marginHorizontal: 30
  },
  h1: {
    fontFamily: "Helvetica",
    fontWeight: 900,
  },
  h2: {
    fontFamily: "Helvetica",
    fontWeight: 700
  }
})