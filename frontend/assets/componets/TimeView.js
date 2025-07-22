import { StyleSheet, Text, View, Dimensions } from 'react-native'
import React, { useState, useEffect, useMemo } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ColorContext'
import ScheduledWalkRectangle from './ScheduledWalkRectangle';
import { ScrollView } from 'react-native';

const {width} = Dimensions.get('window');
const SLOT_WIDTH = 200;
const SLOT_MARGIN = 10;

const TimeView = () => {
  const hours = Array.from({ length: 18 }, (_, i) => `${String(i + 5).padStart(2, '0')}:00`);
  const { colors, isDark } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [savedSlots, setSavedSlots] = useState([]);

  // Helper to convert time to minutes from start (5:00)
  const getMinutesFromStart = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return (hour - 5) * 60 + minute;
  };

  // Calculate position for saved slots
  const calculateSlotPosition = (time) => {
    const minutesFromStart = getMinutesFromStart(time);
    return 20 + (minutesFromStart * 2);
  };

  // Process slots to prevent overlapping
  const processedSlots = useMemo(() => {
    if (savedSlots.length === 0) return [];

    // Create a sorted copy by time
    const sortedSlots = [...savedSlots].sort((a, b) => 
      getMinutesFromStart(a.time) - getMinutesFromStart(b.time)
    );

    const lanes = [];
    const assignments = [];

    for (const slot of sortedSlots) {
      const minutes = getMinutesFromStart(slot.time);
      const top = 20 + minutes * 2;
      const height = 60; // 30 minutes * 2px/min
      const end = top + height;

      let laneIndex = 0;
      // Find first available lane
      while (laneIndex < lanes.length) {
        if (lanes[laneIndex] <= top) break;
        laneIndex++;
      }

      // Create new lane if needed
      if (laneIndex === lanes.length) {
        lanes.push(end);
      } else {
        lanes[laneIndex] = end;
      }

      assignments.push({
        slot,
        laneIndex,
        top,
        left: 80 + laneIndex * (SLOT_WIDTH + SLOT_MARGIN)
      });
    }

    return assignments;
  }, [savedSlots]);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const slotsData = await AsyncStorage.getItem('scheduledSlots');
        if (slotsData) {
          setSavedSlots(JSON.parse(slotsData));
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchSlots();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate position for time indicator
  const calculateIndicatorPosition = () => {
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    // Calculate total minutes from 05:00
    let totalMinutes = (currentHour - 5) * 60 + currentMinutes;
    
    // Clamp the value between 0 and 1020 (05:00 to 22:00 range)
    totalMinutes = Math.max(0, Math.min(totalMinutes, 17 * 60));
    
    // Position = timeline padding (20) + (minutes * 2)
    return 20 + (totalMinutes * 2);
  };

  const indicatorTop = calculateIndicatorPosition();
  const totalHeight = 18 * 120 + 40; // 18 hours * 120px + padding

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={{ height: totalHeight }}
      >
        {/* Base Timeline */}
        <View style={[styles.container, { zIndex: 0 }]}>
          {/* Time slots */}
          <View style={{ paddingLeft: 10 }}>
            {hours.map((time, index) => (
              <View style={{ flexDirection: "row", height: 120 }} key={index}>
                <Text style={[styles.timeText, { color: colors.text }]}>{time}</Text>
                <View style={{ 
                  width: 8, 
                  height: 1, 
                  backgroundColor: "#6b6b6bff", 
                  marginTop: 8, 
                  marginLeft: 2 
                }} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Saved Slots - Positioned absolutely but scrolls with content */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: totalHeight, zIndex: 1 }}>
        {processedSlots.map(({ slot, top, left, laneIndex }) => (
          <View 
            key={`${slot.id}-${laneIndex}`} 
            style={{ 
              position: 'absolute', 
              top: top + 10, 
              left: left 
            }}
          >
            <ScheduledWalkRectangle slot={slot} />
          </View>
        ))}
      </View>

      {/* Time indicator - Fixed position */}
      <View style={[styles.indicatorContainer, { top: indicatorTop }]}>
        <View style={[
          styles.indicatorCircle, 
          { backgroundColor: isDark ? "#8e8e8eff" : "#000000ff" }
        ]} />
        <View style={[
          styles.indicatorLine, 
          { backgroundColor: isDark ? "#8e8e8eff" : "#000000ff" }
        ]} />
      </View>
    </View>
  );
}

export default TimeView

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
    paddingTop: 20, // Only top padding
    position: 'relative',
  },
  timeText: {
    fontSize: 14,
  },
  indicatorContainer: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 5,
    zIndex: 2,
  },
  indicatorCircle: {
    width: 5,
    height: 5,
    borderRadius: 5,
  },
  indicatorLine: {
    width: width * 0.7,
    height: 1,
  },
});