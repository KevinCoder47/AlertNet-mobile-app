import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native'
import React from 'react'
import { useTheme } from '../contexts/ColorContext';
import { Ionicons } from '@expo/vector-icons';
import { TextInput } from 'react-native';

const { width, height } = Dimensions.get('window');

const AddScheduledWalk = ({setIsAddScheduledWalkVisible}) => {
    const { colors, isDark } = useTheme();

  return (
      <View style={[styles.container, { display: 'flex', alignItems: 'center', width, height,  zIndex: 100 }]}>
          <BlurView intensity={20} tint={'dark'} style={StyleSheet.absoluteFill} />
          {/* pop up box */}
          <View style={[styles.popUpBox, {
              backgroundColor: isDark ? "#323233ff" : "#FFFFFF",}]}>
            
              {/* drag indicator */}
                <View style={{
                    width: 40,
                    height: 3,
                    backgroundColor: isDark ? "#606061ff" : "#D6D6D6",
                    borderRadius: 10,
                    alignSelf: 'center',
                    marginTop: 10
              }} />
              
              {/* Schhedule walk text and calncel button */}
              <View style = {{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',}}>
                  <Text style={[styles.header, {color: colors.text}]}>Schedule Walk</Text>
                  {/* cancel button */}
                  <TouchableOpacity
                      style={{
                          width: 30,
                          height: 30,
                          backgroundColor: colors.primary,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 30,
                          borderRadius: 15,
                          backgroundColor: isDark ? "#606061ff" : "#EEEEEE",
                      }}
                      onPress={() => setIsAddScheduledWalkVisible(false)}
                  >
                                        <Ionicons 
                                          name="add" 
                                        size={20}
                                        color={isDark ? "#D6D6D6" : "#606061ff"} 
                                            
                                          style={{ }} 
                                        />
                  </TouchableOpacity>
              </View>
                
              {/* schedule title */}
              <TextInput
                placeholder="Schedule Title"
                placeholderTextColor="#8D8D8D"
                style={{
                  marginHorizontal: 30,
                  padding: 15,
                  borderWidth: 1,
                  borderColor: isDark ? "#444" : "#D1D1D1",
                  borderRadius: 10,
                  color: colors.text,
                  fontSize: 16,
                }}
              />

              {/* from and to time */}
              <View style={{
                    flexDirection: 'row',
                  marginHorizontal: 30,
                  marginTop: 20,
                  width: width * 0.75, height: 85,
                  borderWidth: 1,
                  borderColor: isDark ? "#444" : "#D1D1D1",
                  borderRadius: 10,
                     padding: 10
              }}>
        {/* direction design */}
              <View style = {{flexDirection: 'col',}}>
                  {/* from dot */}
                  <View style={{
                      width: 5,
                      height: 5,
                      borderRadius: 5,
                      backgroundColor: isDark ? "#606061ff" : "#D6D6D6",
                      alignSelf: 'flex-start',
                      marginTop: 13
                  }} />
                  {/* dotted line */}
                  <View style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 20,
                    paddingVertical: 2
                  }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <View
                        key={i}
                        style={{
                          width: 2,
                          height: 2,
                          borderRadius: 1,
                          backgroundColor: isDark ? "#606061ff" : "#D6D6D6",
                          marginVertical: 2,
                        }}
                      />
                    ))}
                  </View>
                      {/* to dot */}
                  <View style={{
                      width: 5,
                      height: 5,
                      borderRadius: 5,
                      backgroundColor: "transparent",
                      alignSelf: 'flex-start',
                          marginTop: 13,
                          borderWidth: 1.5,
                        borderColor: isDark ? "#606061ff" : "#D6D6D6",
                  }} />
                      
              </View>

                  <View style = {{flexDirection: 'col', flex: 1, justifyContent: 'space-between'}}>
                    <TextInput
                        placeholder="From"
                        placeholderTextColor="#8D8D8D"
                        style={{
                        flex: 1,
                        padding: 20,
                            paddingTop: 15,
                        paddingLeft: 5,
                        color: colors.text,
                        fontSize: 16,
                        marginRight: 10
                        }}
                  />
                  {/* divider line  */}
                  <View style={{
                      width: '90%',
                      height: 1,
                      backgroundColor: isDark ? "#444" : "#D1D1D1",
                      marginHorizontal: 5,
                  }} />
                    <TextInput
                        placeholder="To"
                        placeholderTextColor="#8D8D8D"
                        style={{
                        flex: 1,
                            padding: 20,
                            paddingTop: 15,
                        paddingLeft: 5,
                        color: colors.text,
                        fontSize: 16,
                        }}
                  />
                  </View>
              </View>
              
              {/* SELECT TIME */}
              <View style={{
                  marginHorizontal: 30,
                  marginTop: 20,
                  width: width * 0.75,
                  height: 50,
                  borderWidth: 1,
                  borderColor: isDark ? "#444" : "#D1D1D1",
                  borderRadius: 10,
              }}>
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            paddingLeft: 20,
                        }}
                        onPress={() => {}}
                    >
                      <Text style={{ color: "#8D8D8D", fontSize: 16 }}>Select Time</Text>
                      {/* chevron-down */}
                        <Ionicons 
                            name="chevron-down" 
                            size={20} 
                            color="#8D8D8D"
                            style={{ position: 'absolute', right: 20, top: 15 }} />
                    </TouchableOpacity>
              </View>
          </View>
      </View>
  )
}

export default AddScheduledWalk

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    popUpBox: {
        width: width * 0.9,
        height: height * 0.5,
        marginTop: height * 0.45,
        borderRadius: 20,
    },
    header: {
        fontSize: 20,
        margin: 30,
        fontWeight: '500'
    }
})