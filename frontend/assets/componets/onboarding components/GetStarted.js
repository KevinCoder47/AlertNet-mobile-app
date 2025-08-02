import { StyleSheet, Text, View, Image, Dimensions,TouchableOpacity } from 'react-native'
import React from 'react'
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';



const { width, height } = Dimensions.get('window');

const GetStarted = ({onComplete}) => {

      const [fontsLoaded] = useFonts({
        'Poppins Bold': require('../../fonts/Poppins/Poppins-Bold.ttf'),
          'Poppins Medium': require('../../fonts/Poppins/Poppins-Medium.ttf'),
          'Poppins SemiBold': require('../../fonts/Poppins/Poppins-SemiBold.ttf'),
        'Poppins Regular': require('../../fonts/Poppins/Poppins-Regular.ttf'),
      });
  return (
      <View style={styles.container}>
          {/* background image */}
      <Image
        source={require('../../images/launch-background.jpg')}
        style={styles.backgroundImage}
              resizeMode="cover" />
          
          {/* logo */}
          <Image
              source={require('../../images/logo-v2.png')}
              style = {{ width: 120, height: 120, alignSelf: 'flex-start', marginTop: height * 0.05}}
          />

          {/* bottom view */}
          <View style={{
              marginTop: 'auto', flexDirection: 'column-reverse',
              marginBottom: 30, marginLeft: 20,
          }}>
              {/* get started button */}
              <TouchableOpacity
                  onPress={onComplete}
                  style={{
              width: width * 0.9,
              height: 80,
            backgroundColor: 'white',
            borderRadius: 25,
            alignItems: 'center',
              flexDirection: 'row'
              }}
              >
                  <Text
                      style={{
                          marginHorizontal: 20,
                          fontSize: 20, 
                          color: 'black', 
                          fontFamily: 'Poppins SemiBold',
                      }}
                  >
                      Get started.
                  </Text>

                  {/* Arrow */}
                  <Ionicons
                      name="arrow-forward-outline"
                      size={25}   
                      style={{
                          marginLeft: 'auto',
                          marginRight: 25,
                          transform: [{ rotate: '-45deg' }],
                      }}
                      color="black"   />
              </TouchableOpacity>

              {/* descriptive paragraph */}
              <Text style={{
                  fontFamily: 'Poppins Regular',
                  fontSize: 16,
                  marginBottom: 10,
                  color: 'white',
                    marginTop: 10,
                    width: width * 0.8,
              }}>
                  Only verified students. Trusted walk partners. Powerful safety tools — all in one place.
              </Text>


              {/* bold text */}
              <View>
                  
                  {/* backgrou rectangle */}
                  <View
                      style={{
                          width: 155,
                          height: 55,
                          backgroundColor: 'white',
                          zIndex: 1,
                          position: 'absolute',
                          borderRadius: 10,
                          transform: [{ rotate: '-5deg' }],
                          top: -5,
                         left: -5
                  }}
                  />
                      

                <Text style={{
                    fontFamily: 'Poppins SemiBold',
                    width: width * 0.8,
                    fontSize: 37,
                    color: 'white',
                      lineHeight: 50,
                    zIndex: 2
                }}>
                      <Text style={{
                        color: '#FE5235',
                          
                      }}>
                        AlertNet
                    </Text>
                    <Text> makes student safety personal, fast, and effortless!</Text>
                </Text>
            </View>
          </View>
    </View>
  )
}

export default GetStarted

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        opacity: 0.8
    }
})