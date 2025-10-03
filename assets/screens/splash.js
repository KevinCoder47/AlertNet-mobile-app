import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

export default function splash() {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState(1);
  const fullText = 'AlertNet';

  const bgColor = useState(new Animated.Value(0))[0];
  const logoOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    let timeout;

    if (phase === 1 && text.length < fullText.length) {
      timeout = setTimeout(() => {
        setText(prev => prev + fullText[prev.length]);
      }, 150);
    } else if (phase === 1 && text.length === fullText.length) {
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => setPhase(2), 800);
      });
    } else if (phase === 2) {
      Animated.timing(bgColor, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => setPhase(3), 800);
      });
    }

    return () => clearTimeout(timeout);
  }, [text, phase]);

  const backgroundColor = bgColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#000000', '#f42d03'],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <View style={styles.row}>
        <Animated.Image
          source={require('../images/logo.png')}
          style={[styles.logo, { opacity: logoOpacity }]}
          resizeMode="contain"
        />
        <Text style={[
          styles.text,
          phase === 1 ? styles.redText : styles.blackText
        ]}>
          {phase === 1 ? text : fullText}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  redText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'red',
    marginLeft: 10
  },
  blackText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 10
  },
  logo: {
    width: 60,
    height: 60
  }
});