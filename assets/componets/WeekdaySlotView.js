import { StyleSheet, Text, View, FlatList } from 'react-native'
import React, {useState} from 'react'
import WeekDayTab from '../componets/WeekDayTab'

const WeekdaySlotView = ({isFullScreen, setIsFullScreen}) => {
    const getCurrentWeekdayIndex = () => {
      const today = new Date();
      const day = today.getDay(); // 0 (Sun) - 6 (Sat)
      return (day + 6) % 7; // Adjust to 0 (Mon) - 6 (Sun)
    };
    const [activeIndex, setActiveIndex] = useState(getCurrentWeekdayIndex());
    const baseSlots = [8, 4, 13, 5, 3, 0, 1];
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const getWeekStart = () => {
      const today = new Date();
      const day = today.getDay(); // Sunday - Saturday : 0 - 6
      const diff = today.getDate() - ((day + 6) % 7); // Adjust to Monday
      return new Date(today.setDate(diff));
    };

    const startOfWeek = getWeekStart();

    const days = weekDays.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + index);
      const dayDate = date.getDate().toString().padStart(2, '0');
      return {
        day,
        date: dayDate,
        slots: baseSlots[index],
      };
    });

  return (
    <View style = {{height: 60, }}>
          <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={days}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
          <WeekDayTab
              day={item.day}
              date={item.date}
              slots={item.slots}
              isActive={activeIndex === index}
              onPress={() => {
                setActiveIndex(index);
                setIsFullScreen(true);
              }}
              dotColors={[]} />
      )}
    />
    </View>
  );
};

export default WeekdaySlotView

const styles = StyleSheet.create({})