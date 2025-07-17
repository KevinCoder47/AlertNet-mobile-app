import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Animated, 
  PanResponder, 
  ScrollView,
  TouchableOpacity // Added for plus icon
} from 'react-native';
import React, { useRef } from 'react';
import { useTheme } from '../contexts/ColorContext';
import WeekdaySlotView from '../componets/WeekdaySlotView';
import { BlurView } from 'expo-blur';
import TimeView from '../componets/TimeView';
import { Ionicons } from '@expo/vector-icons'; // Added for plus icon

const { width, height } = Dimensions.get('window');
const FULL_SCREEN_TOP = height * 0.07;
const NORMAL_TOP = height * 0.51;
const HANDLE_HEIGHT = 50;
const HEADER_HEIGHT_NORMAL = 70;

const TimeSlots = () => {
  const { colors } = useTheme();
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const animatedTop = useRef(new Animated.Value(NORMAL_TOP)).current;
  const isFullScreenRef = useRef(isFullScreen);

  React.useEffect(() => {
    isFullScreenRef.current = isFullScreen;
  }, [isFullScreen]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const startTop = isFullScreenRef.current ? FULL_SCREEN_TOP : NORMAL_TOP;
        const newTop = startTop + gestureState.dy;
        animatedTop.setValue(Math.max(FULL_SCREEN_TOP, Math.min(NORMAL_TOP, newTop)));
      },
      onPanResponderRelease: (_, gestureState) => {
        const { vy, dy } = gestureState;
        const currentTop = animatedTop._value;
        const midpoint = (FULL_SCREEN_TOP + NORMAL_TOP) / 2;
        const dragDistanceRatio = (currentTop - FULL_SCREEN_TOP) / (NORMAL_TOP - FULL_SCREEN_TOP);

        if (vy < -1.5 || (dy < -50 && dragDistanceRatio < 0.3)) {
          setIsFullScreen(true);
        } else if (vy > 1.5 || (dy > 50 && dragDistanceRatio > 0.7)) {
          setIsFullScreen(false);
        } else {
          const shouldFullScreen = currentTop < midpoint;
          setIsFullScreen(shouldFullScreen);
          
          Animated.spring(animatedTop, {
            toValue: shouldFullScreen ? FULL_SCREEN_TOP : NORMAL_TOP,
            useNativeDriver: false,
            tension: shouldFullScreen ? 70 : 50,
            friction: 15,
            velocity: vy,
          }).start();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    Animated.spring(animatedTop, {
      toValue: isFullScreen ? FULL_SCREEN_TOP : NORMAL_TOP,
      useNativeDriver: false,
      tension: isFullScreen ? 80 : 60,
      friction: 12,
    }).start();
  }, [isFullScreen, animatedTop]); // Added animatedTop to dependency array

  const getDateParts = (date = new Date()) => {
    const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(date);

    const result = {};
    parts.forEach(({ type, value }) => {
      if (type !== 'literal') {
        result[type] = value;
      }
    });
    return result;
  };

  const dateObj = getDateParts(new Date());

  return (
    <>
      <Animated.View
        style={{
          width,
          height,
          position: 'absolute',
          top: animatedTop,
          zIndex: 100,
          backgroundColor: colors.background,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {/* Draggable Area */}
        <View
          {...panResponder.panHandlers}
          style={{
            width: '100%',
            height: isFullScreen ? HANDLE_HEIGHT : HEADER_HEIGHT_NORMAL,
            zIndex: 101,
            backgroundColor: isFullScreen ? 'transparent' : colors.background, // Fixes content overlap
          }}
        >
          {/* Handle bar */}
          {isFullScreen && (
            <View style={{ 
              width: '100%', 
              height: HANDLE_HEIGHT, 
              justifyContent: 'center', 
              alignItems: 'center',
              paddingTop: 0
            }}>
              <View style={{
                width: 80,
                height: 4, // Increased for better visibility
                backgroundColor: colors.text,
                borderRadius: 2.5,
                opacity: 0.7, // Better visibility
              }} />
            </View>
          )}
          
          {/* Header content */}
          <View style={{ 
            paddingHorizontal: width * 0.05, 
            paddingTop: isFullScreen ? 0 : 10,
          }}>
            <View style={[styles.headerRow, { marginTop: isFullScreen ? 0 : 0 }]}>
              <Text
                style={[
                  styles.h2,
                  {
                    fontSize: isFullScreen ? 30 : 12,
                    color: isFullScreen ? colors.text : '#717171',
                  },
                ]}
              >
                {dateObj.weekday}
                {isFullScreen ? '' : `, ${dateObj.day}`}
              </Text>
              
              {/* Plus icon */}
       
                <TouchableOpacity onPress={() => console.log('Add pressed')}>
                  <Ionicons 
                    name="add" 
                    size={24} 
                    color={colors.text} 
                    style={{ marginRight: 10 }} 
                  />
                </TouchableOpacity>
           
            </View>
            
            {!isFullScreen && (
              <Text
                style={[
                  styles.h2,
                  {
                    color: colors.text,
                    fontSize: 15,
                    marginTop: 5,
                  },
                ]}
              >
                {dateObj.month} {dateObj.year}
              </Text>
            )}
          </View>
        </View>

        {/* Content area */}
        <View style={{ flex: 1, marginTop: isFullScreen ? 80 : 10 }}>
          <WeekdaySlotView
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
          />
          <View style={{ 
            width: width * 0.95, 
            height: 1, 
            backgroundColor: "#D7D7D7", 
            alignSelf: "center", 
            marginTop: 5,
            marginBottom: 5, // Added spacing
          }} />
          
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            scrollEnabled={true}
          >
            <TimeView />
          </ScrollView>
        </View>
      </Animated.View>

      {isFullScreen && (
        <BlurView
          intensity={50}
          tint="light"
          style={{ position: 'absolute', width, height, zIndex: 99 }}
        />
      )}
    </>
  );
};

export default TimeSlots;

const styles = StyleSheet.create({
  h1: {
    fontFamily: 'Helvetica',
    fontWeight: '900',
  },
  h2: {
    fontFamily: 'Helvetica',
    fontWeight: '700',
  },
  // Added for header layout
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});