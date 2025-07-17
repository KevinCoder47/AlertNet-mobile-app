import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const TimeView = () => {
  const hours = Array.from({ length: 18 }, (_, i) => `${String(i + 5).padStart(2, '0')}:00`);

  return (
      <View style={styles.container}>
          {/* each time slot */}
          <View style = {{padding: 10}}>
        {hours.map((time, index) => (
            <View style = {{flexDirection: "row"}} key={index}> 
            <Text key={index} style={styles.timeText}>{time}</Text>
            <View style = {{ width: 8, height: 1, backgroundColor: "#6b6b6bff", marginTop: 8, marginLeft: 2}}></View>
            </View>
        ))}
    
          </View>
    </View>
  );
}

export default TimeView

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
    paddingVertical: 20,
  },
  timeText: {
    fontSize: 14,
    marginBottom: 24,
    color: '#6b6b6bff',
    paddingBottom: 60,
  },
});