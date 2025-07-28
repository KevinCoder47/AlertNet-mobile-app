import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useTheme } from '../contexts/ColorContext'

const ScheduledWalkRectangle = ({ slot, progress = 0 }) => {
  const { colors, isDark } = useTheme();

  if (!slot) {
      return (
          <View>
          <Text>Slot empty</Text>
          </View>
      );
  }

  // Test profile pictures
  const prof_pic = [
    require('../images/profile-pictures/14.jpg'),
    require('../images/profile-pictures/cheyenne.jpeg'),
    require('../images/profile-pictures/siphe.jpeg'),
  ];
  
  // Get invited friends count (default to 0 if undefined)
  const invitedFriendsCount = slot.invitedFriendsCount || 0;

  // Calculate how many profile pictures to show (max 3)
  const visibleFriendsCount = Math.min(invitedFriendsCount, 3);

        // for testing!!!!!!
    const clearAllData = async () => {
  // try {
  //   await AsyncStorage.clear();
  //   console.log('✅ AsyncStorage cleared');
  // } catch (e) {
  //   console.error('❌ Failed to clear AsyncStorage:', e);
  // }
};

  return (
    <View>
      {/* main rectangle */}
      <TouchableOpacity 
        style={[styles.container, {
          backgroundColor: isDark ? "#313131" : "#F6F6F6",
          borderWidth: 0.3,
          borderColor: "#717171",
          borderRadius: 10,
          overflow: 'hidden' 
        }]}
      >
        {/* small circle and name */}
        <View style={{ flexDirection: 'row', gap: 5 }}>
          <View style={{
            backgroundColor: slot.themeColor,
            width: 7,
            height: 7,
            borderRadius: 7,
            borderWidth: 1,
            borderColor: slot.themeColor,
            marginTop: 5
          }} />
          <Text style={{
            fontWeight: '500',
            fontSize: 13,
            color: colors.text,
            zIndex: 100
          }}>{slot.scheduleName}</Text>
        </View>

        {/* to location */}
        <Text style={{
          fontWeight: '700',
          fontSize: 11,
          color: isDark ? "#e7e7e7ff" : "#7d7d7dff",
          marginLeft: 15,
          marginTop: 5,
          zIndex: 100
        }}>{slot.to}</Text>

        {/* OVERLAY RECTANGLE */}
        <View style={[{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${progress * 60}`, 
          backgroundColor: slot.themeColor,
          opacity: 0.5,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0
        }]} />
      </TouchableOpacity>

      {/* Render friends only if there are any */}
      {invitedFriendsCount > 0 && (
        <View style={{
          flexDirection: 'row',
          marginTop: 5,
          alignItems: 'center',
          marginLeft: 30
        }}>
          {/* Render profile pictures - show 1, 2, or 3 based on count */}
          {Array.from({ length: visibleFriendsCount }).map((_, index) => (
            <Image
              key={index}
              source={prof_pic[index]}
              style={{
                width: 25,
                height: 25,
                borderRadius: 12.5,
                marginLeft: index === 0 ? 0 : -10,
                borderWidth: 1,
                borderColor: '#fff'
              }}
            />
          ))}
          
          {/* Show +count only when more than 3 friends */}
          {invitedFriendsCount > 3 && (
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              marginLeft: 5,
              color: colors.secondary
            }}>
              + {invitedFriendsCount - 3}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default ScheduledWalkRectangle

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 60,
        padding: 15,
        justifyContent: 'center'
    }
})