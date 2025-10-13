import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons';

const PartnerEstimatedDetails = ({ setShowPartnerUpdate, setFindPartnerView, partnerData }) => {
  
  const avatarSource = partnerData?.avatarSource || require('../../images/profile-pictures/default.jpg');

  return (
    <View style={styles.container}>
      <View style={styles.closeAndHelpContainer}>
        <TouchableOpacity
          onPress={() => setShowPartnerUpdate(false)}
          style={{ padding: 5 }}>
                   <Ionicons name="close" size={20} color="black" />
       </TouchableOpacity >
              <TouchableOpacity style={{padding: 5}}>
                  <Text style = {{fontSize: 12, color: '#F57527', fontWeight: '600'}}>Help</Text>
        </TouchableOpacity>
          </View>
          
          <Text style={{ fontSize: 13, color: 'black', fontWeight: '600', paddingLeft: 20, paddingTop: 10 }}>ESTIMATED TIME OF ARRIVAL</Text>
          <Text style={{ fontSize: 13, color: 'black', fontWeight: '700', paddingLeft: 20, paddingTop: 5 }}>12:55 <Text style={{ fontWeight: '400' }}>pm</Text></Text>
          
          {/* partner bar visualizer */}
          <View>
            <View style={{height: 6, width: '100%', backgroundColor: '#F1F1F1', marginTop: 20}}>
                  <View style={{ height: 6, width: '30%', backgroundColor: '#12A858' }}></View>
                  <Image source={require('../../icons/man-icon.png')} style={{ width: 25, height: 25, position: 'absolute', top: -12, left: '30%', transform: [{ rotate: '90deg' }] }} />
            </View>
          </View>


          {/* partner details and message icon */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 25 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={() => {
                // setShowPartnerUpdate(false);
                setFindPartnerView(true);
              }}>
                  <Image source={avatarSource} style={{ width: 50, height: 50, borderRadius: 25 }} />
              </TouchableOpacity>
              <View>
                      <Text style={{ fontSize: 10, color: 'black', fontWeight: '400', paddingTop: 5 }}>YOUR PARTNER</Text>
            <Text style={{ fontSize: 14, color: 'black', fontWeight: '700', paddingTop: 5 }}>{partnerData.partnerName}</Text> 
                  </View>
              </View>
              <TouchableOpacity style={{padding: 5}}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#12A858" />
              </TouchableOpacity>
              </View>
    </View>
  )
}

export default PartnerEstimatedDetails

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    width: '100%',
        height: '30%',
        backgroundColor: 'white',
        paddingTop: 70,
        borderWidth: 0.2,
        borderColor: '#E0E0E0',
        shadowColor: '#2d2d2dff',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 4,
    
    },
    closeAndHelpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        }
})