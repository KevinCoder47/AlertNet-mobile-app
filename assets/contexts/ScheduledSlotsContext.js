import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ScheduledSlotsContext = createContext();

export const ScheduledSlotsProvider = ({ children }) => {
  const [scheduledSlots, setScheduledSlots] = useState([]);
  
  // Load slots from AsyncStorage on initial render
  useEffect(() => {
    const loadSlots = async () => {
      try {
        const slotsData = await AsyncStorage.getItem('scheduledSlots');
        if (slotsData) {
          setScheduledSlots(JSON.parse(slotsData));
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    loadSlots();
  }, []);
  
  // Save slots to AsyncStorage whenever they change
  useEffect(() => {
    const saveSlots = async () => {
      try {
        await AsyncStorage.setItem('scheduledSlots', JSON.stringify(scheduledSlots));
      } catch (e) {
        console.error(e);
      }
    };
    
    saveSlots();
  }, [scheduledSlots]);
  
  const addSlot = (newSlot) => {
    setScheduledSlots(prevSlots => [...prevSlots, newSlot]);
  };
  
  return (
    <ScheduledSlotsContext.Provider value={{ scheduledSlots, addSlot }}>
      {children}
    </ScheduledSlotsContext.Provider>
  );
};

export const useScheduledSlots = () => useContext(ScheduledSlotsContext);