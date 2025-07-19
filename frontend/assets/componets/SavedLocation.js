import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import React from 'react'
import { useTheme } from '../contexts/ColorContext'

const {width, height} = Dimensions.get("window")
const SavedLocation = ({LocationType,LocationName,address}) => {
    const { colors, isDark } = useTheme();


  return (
      <TouchableOpacity style={[styles.container, { borderColor: isDark ? "#4F4F4F" : "#E2DFDF" }]}>
    {/* Horizon view */}
          <View style = {{marginTop: "auto", marginBottom: "auto",marginLeft: width * 0.02, flexDirection: "row"}}>
              
              {/* Clock view */}
              <View style = {[styles.smallRec, {backgroundColor: isDark ? "#313131" : "#F2F2F2"}]}>
                  <Image source={isDark ? require('../icons/clock-dark.png') : require('../icons/clock-light.png')}
                      style = {{width: 25, height: 25}}
                  />
              </View>

              {/* Location name, and Address */}
            <View style = {{marginLeft: 10}}>
                {/* name */}
                <Text style = {{fontFamily: "Helvetica", fontSize: 15, fontWeight: "900", color: colors.text}}>{LocationType} - {LocationName}</Text>
                
                  {/* Address  */}
                  <Text style={{
                    fontFamily: "Helvetica",
                    fontSize: width * 0.037,
                    fontWeight: "400",
                    color: colors.text,
                      marginTop: 5,
                    width: "92%"
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
                  >{address}</Text>
              </View>
              
                {/* Arrow */}
                  <ChevronRight
                    color={colors.text}
                    size={20}
                    style={{
                      marginTop: 'auto',
                      marginBottom: 'auto',
                      marginHorizontal: 20,
                      marginLeft: 'auto'
                    }}
                  />
            </View>
    </TouchableOpacity >
  )
}

export default SavedLocation

const styles = StyleSheet.create({
    container: {
        width: width * 0.86,
        height: 80,
        borderRadius: 10,
        borderWidth: 1,
        
    },
    smallRec: {
        width: 45,
        height: 45,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center"
    }
})