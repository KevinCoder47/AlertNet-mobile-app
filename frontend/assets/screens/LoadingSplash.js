import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Animated, StyleSheet, Text } from 'react-native';


import splash1 from '../images/splash1.png';
import splash2 from '../images/splash2.png';
import splash3 from '../images/splash3.png';

const images = [splash1, splash2, splash3];

export default function LoadingSplash({ onDone }) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (index >= images.length) {
      onDone(); 
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          setIndex(prev => prev + 1);
        });
      }, 700);
    });
  }, [index]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={images[index]}
        style={[styles.image, { opacity: fadeAnim }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});
