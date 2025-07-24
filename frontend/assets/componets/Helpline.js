import { StyleSheet, Text, View , Dimensions} from 'react-native'
import { useTheme } from '../contexts/ColorContext';
import React, { useState } from 'react'




const Helpline = () => {

  // calling the colors 
  const  { colors } = useTheme()

  return (
    <View style={styles.container}>
      <Text style = {styles.title} > HELPLINE</Text>
      <Text style = {styles.subtitle} >Stay calm - you not alone , help is available.</Text>
      </View>

    
     
  );
}


export default Helpline

const styles = StyleSheet.create({
    container: {
      flex: 1 ,
      backgroundColor : "black",
      position: "absolute",
      bottom: 120,
      height: 200,
      width:350,
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


  }


  }
)
