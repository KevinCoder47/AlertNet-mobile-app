import { StyleSheet, Text, View, ImageBackground, Dimensions, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useFonts } from 'expo-font';

const {width, height} = Dimensions.get('window')

const LaunchScreen = () => {

    const [fontsLoaded] = useFonts({
        'Poppins SemiBold': require('../../fonts/Poppins/Poppins-SemiBold.ttf'),
    })

    return (
        <View style = {styles.container}>
    <Image source={require('../../images/launch-background.jpg')} style = {styles.backgroundImage}/>
        {/* logo */}
        <Image source={require('../../images/logo-v2.png')} style={styles.logo} />
    
        {/* app name and slogan */}
                <View style = {{justifyContent: 'center', alignItems: 'center', marginTop: 190,}}>
                    <Text style={[styles.appName, {
                        fontFamily: 'Poppins SemiBold',
                    }]}>Alertnet</Text>

                    {/* slogan */}
                    <View style = {{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}  >
                        <Text style = {[styles.slogan, {fontFamily: 'Poppins SemiBold'}]}>now you can be </Text>
                        <Text style = {[styles.slogan, {fontFamily: 'Poppins SemiBold', color: '#FF6600'}]}>safe.</Text>
                    </View>
            </View>
            
            {/* Continue button, terms and conditions  */}
            <View style={{ marginTop: 'auto' }}>
                {/* button */}
                <TouchableOpacity>
                    
                </TouchableOpacity>
            </View>
            
           
      </View>
  )
}

export default LaunchScreen

const styles = StyleSheet.create({
    backgroundImage: {
        width: width,
        height: height,
        opacity: 0.85,
        position: 'absolute',
    },
    container: {
        flex: 1,
        backgroundColor: 'black',

    },
    logo: {
        width: 80,
        height: 80,
        alignSelf: 'center',
        marginTop: height * 0.04,
    },
    appName: {
        fontSize: 35,
        color: 'white',
        textAlign: 'center',
    }, 
    slogan: {
        fontSize: 13,
        color: 'white',
    }
})