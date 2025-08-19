import { StyleSheet, View, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import React from 'react';

const { width, height } = Dimensions.get('window');

const GeneralLoader = ({
  containerStyle = {},
  animationStyle = {},
  animationSource = require('../animations/loading-dots.json'),
  autoPlay = true,
  loop = true,
  speed = 1
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <LottieView
        source={animationSource}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={[styles.animation, animationStyle]}
      />
    </View>
  );
};

export default GeneralLoader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    width: width,
    height: height,
    position: 'absolute',
    zIndex: 99,
    top: 0,
    left: 0,
  },
  animation: {
    width: 150,
    height: 150,
  },
});