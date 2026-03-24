import { BlurView } from 'expo-blur';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  TouchableOpacity, 
  Animated, 
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ColorContext';
import { Ionicons } from '@expo/vector-icons';
import { TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScheduledSlots } from '../contexts/ScheduledSlotsContext';
import { useFontSize } from '../contexts/FontSizeContext';

const saveSlot = async (slot) => {
  try {
    const existing = await AsyncStorage.getItem('scheduledSlots');
    const slots = existing ? JSON.parse(existing) : [];
    slots.push(slot);
    await AsyncStorage.setItem('scheduledSlots', JSON.stringify(slots));
    // console.log($&);
  } catch (err) {
    console.error("Error saving slot:", err);
  }
};

const { width, height } = Dimensions.get('window');

const AddScheduledWalk = ({ setIsAddScheduledWalkVisible }) => {
  const { colors, isDark } = useTheme();
  const { addSlot } = useScheduledSlots();
  const { getScaledFontSize } = useFontSize();

  const [isSelectTime, setIsSelectTime] = React.useState(false);
  const [selectedHour, setSelectedHour] = React.useState('09');
  const [selectedMinute, setSelectedMinute] = React.useState('00');
  const [selectedDays, setSelectedDays] = useState([]);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [invitedFriendsCount, setInvitedFriendsCount] = useState(0);

  const animatedHeight = useRef(new Animated.Value(50)).current;

  const toggleDaySelection = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isSelectTime ? 260 : 50,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [isSelectTime]);

  const onPressAdd = async () => {
    if (!scheduleName || !fromLocation || !toLocation || selectedDays.length === 0) {
      console.warn("Please fill in all required fields.");
      return;
    }

    const pastelColors = [
      '#378D4E', '#FF6600', '#2A2A2A', '#FFBDC2', '#7CA3DA',
      '#FFFFFF', '#FFD700', '#9B59B6'
    ];
    const randomColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];

    const newSlot = {
      days: selectedDays,
      date: new Date().toISOString().split('T')[0],
      time: `${selectedHour}:${selectedMinute}`,
      from: fromLocation,
      to: toLocation,
      scheduleName: scheduleName,
      themeColor: randomColor,
      id: Date.now().toString(), 
      invitedFriendsCount: invitedFriendsCount
    };

    // Add to context (which will update storage and state)
    addSlot(newSlot);
    // console.log($&);
    setIsAddScheduledWalkVisible(false);
  };

  return (
    <View style={[styles.container, { 
      display: 'flex', 
      alignItems: 'center', 
      width, 
      height,  
      zIndex: 100 
    }]}>
      <BlurView 
        intensity={20} 
        tint={'dark'} 
        style={StyleSheet.absoluteFill} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : -30}
      >
        {/* Pop Up Box */}
        <Animated.View style={[styles.popUpBox, {
          backgroundColor: isDark ? "#292929ff" : "#FFFFFF",
          width: width * 0.95,
          height: isSelectTime ? height * 0.8 : height * 0.55,
          alignSelf: 'center',
          maxHeight: height * 0.85,
          marginBottom: 20,
        }]}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Drag Indicator */}
            <View style={{
              width: 40,
              height: 3,
              backgroundColor: isDark ? "#606061ff" : "#D6D6D6",
              borderRadius: 10,
              alignSelf: 'center',
              marginTop: 10
            }} />
            
            {/* Schedule Walk Header */}
            <View style={{
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: 10
            }}>
              <Text style={[styles.header, { color: colors.text, fontSize: getScaledFontSize(20) }]}>
                Schedule Walk
              </Text>
              
              {/* Cancel Button */}
              <TouchableOpacity
                style={{
                  width: 30,
                  height: 30,
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
                  style={{ transform: [{ rotate: '45deg' }] }} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Schedule Title */}
            <TextInput
              placeholder="Schedule Title"
              placeholderTextColor="#8D8D8D"
              style={{
                marginHorizontal: 30,
                marginTop: 15,
                padding: 15,
                borderWidth: 1,
                borderColor: isDark ? "#444" : "#D1D1D1",
                borderRadius: 10,
                color: colors.text,
                fontSize: getScaledFontSize(16),
              }}
              value={scheduleName}
              onChangeText={setScheduleName}
            />

            {/* Time Range Selector */}
            <View style={{
              flexDirection: 'row',
              marginHorizontal: 30,
              marginTop: 20,
              width: width * 0.80, 
              height: 100,
              borderWidth: 1,
              borderColor: isDark ? "#444" : "#D1D1D1",
              borderRadius: 10,
              padding: 10
            }}>
              {/* Vertical Timeline */}
              <View style={{ flexDirection: 'column' }}>
                {/* From Dot */}
                <View style={{
                  width: 5,
                  height: 5,
                  borderRadius: 5,
                  backgroundColor: isDark ? "#606061ff" : "#D6D6D6",
                  marginTop: 18
                }} />
                
                {/* Dotted Line */}
                <View style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 20,
                  paddingVertical: 2
                }}>
                  {Array.from({ length: 6 }).map((_, i) => (
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
                
                {/* To Dot */}
                <View style={{
                  width: 5,
                  height: 5,
                  borderRadius: 5,
                  backgroundColor: "transparent",
                  marginTop: 17,
                  borderWidth: 1.5,
                  borderColor: isDark ? "#606061ff" : "#D6D6D6",
                }} />
              </View>

              {/* Time Inputs */}
              <View style={{ 
                flexDirection: 'column', 
                flex: 1, 
                justifyContent: 'space-between',
                marginLeft: 10
              }}>
                <TextInput
                  placeholder="From"
                  placeholderTextColor="#8D8D8D"
                  style={{
                    height: 40,
                    paddingLeft: 5,
                    color: colors.text,
                    fontSize: getScaledFontSize(16),
                  }}
                  value={fromLocation}
                  onChangeText={setFromLocation}
                />
                
                {/* Divider Line */}
                <View style={{
                  width: '95%',
                  height: 1,
                  backgroundColor: isDark ? "#444" : "#D1D1D1",
                }} />
                
                <TextInput
                  placeholder="To"
                  placeholderTextColor="#8D8D8D"
                  style={{
                    height: 40,
                    paddingLeft: 5,
                    color: colors.text,
                    fontSize: getScaledFontSize(16),
                  }}
                  value={toLocation}
                  onChangeText={setToLocation}
                />
              </View>
            </View>
            
            {/* Time Selection */}
            <Animated.View
              style={{
                marginHorizontal: 30,
                marginTop: 20,
                width: width * 0.80,
                height: animatedHeight,
                borderWidth: 1,
                borderColor: isDark ? "#444" : "#D1D1D1",
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <TouchableOpacity
                style={{
                  height: 50,
                  justifyContent: 'center',
                  paddingLeft: 20,
                  display: isSelectTime ? 'none' : 'flex',
                }}
                onPress={() => setIsSelectTime(!isSelectTime)}
              >
                <Text style={{ color: "#8D8D8D", fontSize: getScaledFontSize(16) }}>
                  Select Time
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color="#8D8D8D"
                  style={{ position: 'absolute', right: 20, top: 15 }}
                />
              </TouchableOpacity>
              
              {/* Time Picker */}
              {isSelectTime && (
                <View style={{ 
                  flex: 1, 
                  flexDirection: 'row', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginBottom: 0
                }}>
                  <Picker
                    selectedValue={selectedHour}
                    onValueChange={setSelectedHour}
                    style={{ width: 100 }}
                  >
                    {Array.from({ length: 18 }, (_, i) => {
                      const hour = (i + 5).toString().padStart(2, '0');
                      return <Picker.Item key={hour} label={hour} value={hour} />;
                    })}
                  </Picker>
                  
                  <Text style={{ color: colors.text, fontSize: getScaledFontSize(18) }}>:</Text>
                  
                  <Picker
                    selectedValue={selectedMinute}
                    onValueChange={setSelectedMinute}
                    style={{ width: 100 }}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <Picker.Item 
                        key={i} 
                        label={i.toString().padStart(2, '0')} 
                        value={i.toString().padStart(2, '0')} 
                      />
                    ))}
                  </Picker>
                </View>
              )}
              
              {/* Days of Week */}
              <View style={styles.daysContainer}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: isDark ? "#3a3a3aff" : "#EEEEEE"
                      },
                      selectedDays.includes(day) && { 
                        backgroundColor: '#FF944D',
                        borderColor: '#FF944D',
                        height: 45
                      }
                    ]}
                    onPress={() => toggleDaySelection(day)}
                  >
                    <Text style={[
                      styles.dayText,
                      { fontSize: getScaledFontSize(10), color: colors.text },
                      selectedDays.includes(day) && { color: 'white' }
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            
            </Animated.View>

            {/* invite button and save button */}
            <View style={{ marginTop: 20, flexDirection: 'row', paddingBottom: 20 }}>
              {/* invite friends */}
              <View style={{ marginBottom: 20, flexDirection: 'column', marginLeft: 30 }}>
                <Text style={{ color: colors.text, marginTop: 10, fontSize: getScaledFontSize(10) }}>
                  Invite friends
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setInvitedFriendsCount(prev => prev + 1);
                  }}
                  style={{
                    width: 35,
                    height: 35,
                    borderRadius: 17.5,
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? "#8e8e8eff" : "#494949ff",
                    alignItems: 'center',
                    marginTop: 10,
                    borderStyle: 'dashed',
                    overflow: 'hidden',
                    backgroundColor: isDark ? "#3a3a3aff" : "#EEEEEE",
                  }}>
                  <ImageBackground 
                    source={require('../images/profile-pictures/14.jpg')} 
                    style={{ width: '100%', height: '100%', borderRadius: 17.5, overflow: 'hidden', opacity: 0.3 }} 
                    imageStyle={{ borderRadius: 17.5 }}
                  />
                  <Ionicons 
                    name="add" 
                    size={20} 
                    color={isDark ? "#D6D6D6" : "#272727ff"} 
                    style={{ position: 'absolute', top: 7, left: 7 }}
                  />
                </TouchableOpacity>
              </View>
              
              {/* save button */}
              <TouchableOpacity
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#FF944D',
                  alignSelf: 'center',
                  marginLeft: "auto",
                  marginRight: 20,
                }}
                onPress={() => onPressAdd()}>
                <Ionicons 
                  name="arrow-forward" 
                  size={15} 
                  color="white" />
              </TouchableOpacity>
            </View>

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddScheduledWalk;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popUpBox: {
    borderRadius: 20,
  },
  header: {
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 20,
    paddingTop: 10,
    height: 40
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontWeight: '500',
  },
});
