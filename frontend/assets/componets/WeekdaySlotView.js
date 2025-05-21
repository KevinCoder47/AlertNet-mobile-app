import { StyleSheet, Text, View, FlatList } from 'react-native'
import React, {useState} from 'react'
import WeekDayTab from '../componets/WeekDayTab'

const WeekdaySlotView = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const days = [
  { day: 'Mon', date: '05', slots: 8 },
  { day: 'Tue', date: '06', slots: 4 },
  { day: 'Wed', date: '07', slots: 13 },
  { day: 'Thu', date: '08', slots: 5 },
  { day: 'Fri', date: '09', slots: 3 },
  { day: 'Sat', date: '10', slots: 0 },
  { day: 'Sun', date: '11', slots: 1 }
]

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
              onPress={() => setActiveIndex(index)}
              dotColors={[]} />
      )}
    />
    </View>
  );
};

export default WeekdaySlotView

const styles = StyleSheet.create({})