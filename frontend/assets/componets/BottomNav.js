import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SOSBtn from './SOSBtn';
import { useMapContext } from '../contexts/MapContext';
import Helpline from './Helpline';

const { width, height } = Dimensions.get('window');
const BottomNav = ({ isNotHome, setIsNotHome }) => {
    const [isHome, setIsHome] = useState(true)
    const [isWalkPartner, setIsWalkPartner] = useState(false)
    const [isPeople, setIsPeople] = useState(false)
    const [isHelpLine, setIsHelpLine] = useState(false)
    const { recenterToUserLocation } = useMapContext();

    const toggleHome = () => {
        setIsHome(true);
        setIsWalkPartner(false);
        setIsPeople(false);
        setIsHelpLine(false);
        setIsNotHome(false);
        recenterToUserLocation();
    };
    
    const toggleWalkPartner = () => {
        setIsWalkPartner(true);
        setIsHome(false);
        setIsPeople(false);
        setIsHelpLine(false);
        setIsNotHome(true);
    }

    const togglePeople = () => {
        setIsPeople(true);
        setIsHome(false);
        setIsWalkPartner(false);
        setIsHelpLine(false);
        setIsNotHome(true);
    }

    const toggleHelpLine = () => {
        setIsHelpLine(true);
        setIsHome(false);
        setIsWalkPartner(false);
        setIsPeople(false);
        setIsNotHome(true);
    }


    return (
        <View style = {{flex: 1, height: height}}>
                  <View style={styles.container}>
          
          {/* Navigation tabs */}
          <View style={[styles.navContainer, { backgroundColor: "#1C1C1E" }]}>
              
              {/* Home button or full map default */}
              <TouchableOpacity style = {{maxWidth: 45, marginLeft: 20}} onPress={toggleHome}>
                  <Image source={require('../icons/compass-2.png')} style={[styles.image, {opacity: isHome ? 1:0.5}]} />
              </TouchableOpacity>

              {/* walk partner button */}
              <TouchableOpacity style = {{maxWidth: 45}} onPress={toggleWalkPartner}>
                  <Image source={require('../icons/accompany.png')} style={[styles.image, {opacity: isWalkPartner ? 1:0.5}]} />
              </TouchableOpacity>

              {/* People button */}
              <TouchableOpacity style = {{maxWidth: 45}} onPress={togglePeople}>
                  <Image source={require('../icons/people2.png')} style={[styles.image, {opacity: isPeople ? 1:0.5}]} />
              </TouchableOpacity>

              {/* Help line button */}
              <TouchableOpacity style = {{maxWidth: 45}} onPress={toggleHelpLine}>
                  <Image source={require('../icons/phone-2.png')} style={[styles.image, {opacity: isHelpLine ? 1:0.5}]} />
                    </TouchableOpacity>
                    
                    {/* HelpLine popup modal  */}
                    {/* if isHelpLine == true: */}
                    {isHelpLine ? <Helpline /> : <></> }

          </View>

          {/* SOS Button */}
          <SOSBtn />
          

    </View>
      </View>
  )
}

export default BottomNav

const styles = StyleSheet.create({
    container: {
        zIndex: 5,
        flex: 1,
        width: width,
        height: 90,
        // backgroundColor: "green",
        position: "absolute",
        top: height * 0.85,
        flexDirection: "row"
    },
    navContainer: {
        width: width * 0.6,
        height: height * 0.11,
        marginHorizontal: 20,
        borderRadius: 50,
        flexDirection: "row",
        // justifyContent: "space-between", 
        alignItems: "center",
        gap: width * 0.063
      },
    image: {
        width: 25,
        height: 25
    }
})