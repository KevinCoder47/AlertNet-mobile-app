import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import SOSBtn from './SOSBtn';
import { useMapContext } from '../contexts/MapContext';
import Helpline from './Helpline';
import PeopleBar from './People/PeopleBar';


const { width, height } = Dimensions.get('window');

const BottomNav = ({ isNotHome, setIsNotHome, isWalkPartner, setIsWalkPartner, setIsSOS, setIsPeopleActive, setIsTopBarManuallyExpanded, onOpenChat }) => {
  const [isHome, setIsHome] = useState(true);
  const [isPeople, setIsPeople] = useState(false);
  const [isHelpLine, setIsHelpLine] = useState(false);
  const { recenterToUserLocation } = useMapContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleHome = () => {
    setIsHome(true);
    setIsWalkPartner(false);
    setIsPeople(false);
    setIsHelpLine(false);
    setIsNotHome(false);
    setIsExpanded(false);
    setIsPeopleActive(false);
    setIsTopBarManuallyExpanded(false);
    recenterToUserLocation();
  };

  const toggleWalkPartner = () => {
    setIsWalkPartner(true);
    setIsHome(false);
    setIsPeople(false);
    setIsHelpLine(false);
    setIsNotHome(true);
    setIsExpanded(false);
    setIsPeopleActive(false);
    setIsTopBarManuallyExpanded(false);
  };

  const togglePeople = () => {
    setIsPeople(true);
    setIsHome(false);
    setIsWalkPartner(false);
    setIsHelpLine(false);
    setIsNotHome(true);
    setIsExpanded(false);
    setIsPeopleActive(true);
    setIsTopBarManuallyExpanded(false);
  };

  const toggleHelpLine = () => {
    setIsHelpLine(true);
    setIsHome(false);
    setIsWalkPartner(false);
    setIsPeople(false);
    setIsNotHome(true);
    setIsExpanded(false);
    setIsPeopleActive(false);
    setIsTopBarManuallyExpanded(false);
  };

  return (
    <View style={{ flex: 1, height: height }}>
      <View style={styles.container}>
        {/* Bottom Navigation Bar */}
        <View style={[styles.navContainer, { backgroundColor: "#1C1C1E" }]}>
          {/* Home */}
          <TouchableOpacity style={{ maxWidth: 45, marginLeft: 20 }} onPress={toggleHome}>
            <Image source={require('../icons/compass-2.png')} style={[styles.image, { opacity: isHome ? 1 : 0.5 }]} />
          </TouchableOpacity>

          {/* Walk Partner */}
          <TouchableOpacity style={{ maxWidth: 45 }} onPress={toggleWalkPartner}>
            <Image source={require('../icons/accompany.png')} style={[styles.image, { opacity: isWalkPartner ? 1 : 0.5 }]} />
          </TouchableOpacity>

          {/* People */}
          <TouchableOpacity style={{ maxWidth: 45 }} onPress={togglePeople}>
            <Image source={require('../icons/people2.png')} style={[styles.image, { opacity: isPeople ? 1 : 0.5 }]} />
          </TouchableOpacity>

          {/* Helpline */}
          <TouchableOpacity style={{ maxWidth: 45 }} onPress={toggleHelpLine}>
            <Image source={require('../icons/phone-2.png')} style={[styles.image, { opacity: isHelpLine ? 1 : 0.5 }]} />
          </TouchableOpacity>

          {/* People Panel */}
          {isPeople && (
            <View style={{ marginHorizontal: -45 }}>
              {isExpanded ? (
                <PeoplePanel onCollapse={() => setIsExpanded(false)} />
              ) : (
                <PeopleBar onExpand={() => setIsExpanded(true)} onOpenChat={onOpenChat} />
              )}
            </View>
          )}

          {/* Helpline Popup */}
          {isHelpLine && (
            <View style={{ marginHorizontal: -45 }}>
              <Helpline />
            </View>
          )}
        </View>

        {/* SOS Button */}
        <SOSBtn onPress={setIsSOS} />
      </View>
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  container: {
    zIndex: 5,
    flex: 1,
    width: width,
    height: 90,
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
    alignItems: "center",
    gap: width * 0.063
  },
  image: {
    width: 25,
    height: 25
  }
});