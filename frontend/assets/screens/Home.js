import { StyleSheet, Text, View, Dimensions } from 'react-native'
import React, { useState } from 'react'
import Map from '../componets/Map'
import TopBar from '../componets/TopBar';
import BottomNav from '../componets/BottomNav';
import TopBarSearch from '../componets/TopBarSearch';

const { width, height } = Dimensions.get('window');
 
const Home = () => {
  const [isNotHome, setIsNotHome] = useState(false)
  return (
    <View style={styles.container}> 
      
      {/* map view */}
      <>
      <Map />
      </>
      
      {/* top bar */}
      <TopBar isNotHome={isNotHome} />

      {/* Bottom navigation */}
      <BottomNav isNotHome={isNotHome} setIsNotHome={setIsNotHome} />
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1
    
  },
  map: {
    zIndex: 1
  },

})