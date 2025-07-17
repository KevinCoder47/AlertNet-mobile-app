import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useMemo } from 'react'
import { useTheme } from '../contexts/ColorContext'

const WeekDayTab = ({ day, date, isActive, onPress, dotColors = [], slots }) => {
    const { colors, isDark } = useTheme();
    const pastelColors = [
        '#378D4E', // green
        '#FF6600', // orange
        '#2A2A2A', // dark gray
        '#FFBDC2', // light pink
        '#7CA3DA', // light blue
        '#FFFFFF', // white
        '#FFD700', // gold
        '#9B59B6'  // purple
        ];

  const dotCount = slots >= 3 ? 3 : slots;
  const dotColorsMemo = useMemo(() => {
    return Array.from({ length: dotCount }).map(() => {
      return pastelColors[Math.floor(Math.random() * pastelColors.length)];
    });
  }, [dotCount]);

  const dots = dotColorsMemo.map((color, index) => (
    <View
      key={index}
      style={{
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: color,
        marginHorizontal: 0.8,
        marginTop: 1.5
      }}
    />
  ));

  return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.container,
            {
                backgroundColor: isActive ? (isDark ? '#FFFFFF' : '#FFFFFF') : (isDark ? '#3A3A3A' : '#D7D7D7'),
                borderWidth: 0.17,
                borderColor: isActive ? "#CCCCCC" : "transparent",
                shadowColor: isActive ? "#000000" : "transparent",
                shadowOpacity: isActive ? 0.25 : 0, shadowOffset: { width: isActive ? 0.3 : 0, height: isActive ? 0.5 : 0 },
                shadowRadius: isActive ? 0.5 : 0, elevation: isActive ? 0.5 : 0
           }
        ]}>
          <Text style={[styles.text, {marginTop: 4, color: isActive ? "#000000" : colors.text}]}>{day}</Text>
          <Text style={{ marginTop: 4, color: isActive ? "#378D4E" : colors.text }}>{date}</Text>
          
          {/* //dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            {dots}
          </View>
    </TouchableOpacity>
  )
}

export default WeekDayTab

const styles = StyleSheet.create({
    container: {
        width: 45,
        height: 50,
        marginLeft: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    text: {
        fontFamily: "Helvetica",
        fontWeight: "500",
    }
})