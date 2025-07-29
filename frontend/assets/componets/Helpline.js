import { StyleSheet, Text, View , Dimensions, Button, TouchableOpacity, Image} from 'react-native'
import { useTheme } from '../contexts/ColorContext';
import React, { useState } from 'react'

const {width, height} = Dimensions.get('window')




const Helpline = () => {

  // calling the colors 
  const  { colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: '#121212', }]}>
      {/* helpline title and sub */}
      <View style = {{flexDirection: 'col', margin: 10}}>
      <Text style = {styles.title} > HELPLINE</Text>
      <Text style={[styles.subtitle,]} >Stay calm - you not alone , help is available.</Text>
      </View>

      {/* view for all the buttons */}
      <View>

        {/* police button  */}
        <TouchableOpacity style={[styles.button, {width: 140, height: 60, backgroundColor: '#2c2c2cff'}]}>
         
          {/* icon and police details */}
          <View style = {styles.iconAndDetails}>
            {/* image for icon  */}
            <Image source={require('../icons/siren.png')} style={styles.icon} />

            {/* details view */}
            <View style = {{}}>
              <Text style = {[styles.buttonText, {fontWeight: '700'}]}>POLICE</Text>
              <Text style = {[styles.buttonText, {fontWeight: '400'}]}>10111</Text>
            </View>
          </View>
        </TouchableOpacity>
        
      </View>
      </View>

    
     
  );
}


export default Helpline

const styles = StyleSheet.create({
    container: {
      flex: 1 ,
      position: "absolute",
      bottom: 60,
      height: height * 0.3,
      width:width * 0.95,
      alignSelf: "center",
      zIndex: 10,
      padding: 10,
    borderRadius: 10,
      

  },
  title: {
    fontSize:16,
    fontWeight: "bold",
    fontFamily: "Poppins",
    color: "#ffffff"
},
  subtitle: {
    fontFamily: "Poppins",
    fontSize: 12 ,
    fontWeight: "300",
    color:"lightgray"


  },
  button: {
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#717171",
    margin: 10,
  },
  icon: {
    width: 28,
    height: 28
  },
  iconAndDetails: {
    flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    gap: 15
  },
  buttonText: {
    color: 'white'
  }


  }
)
