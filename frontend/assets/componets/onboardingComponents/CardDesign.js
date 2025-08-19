import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableWithoutFeedback 
} from 'react-native';
import { useFonts } from 'expo-font';

const CardDesign = ({ 
  title, 
  image, 
  backgroundColor, 
  textColor 
}) => {
  const [fontsLoaded] = useFonts({
    'Poppins Bold': require('../../fonts/Poppins/Poppins-Bold.ttf'),
    'Poppins Medium': require('../../fonts/Poppins/Poppins-Medium.ttf'),
  });
  
  const [isRotated, setIsRotated] = useState(false);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TouchableWithoutFeedback
      onPress={() => setIsRotated(!isRotated)}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor,
            transform: [
              { rotate: isRotated ? '5deg' : '0deg' }
            ],
          },
        ]}
      >
        {/* Walk title */}
        <Text
          style={[
            styles.title,
            { color: textColor }
          ]}
        >
          {title}
        </Text>

        {/* Image */}
        <Image
          source={image}
          style={styles.image}
        />
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 243,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins Bold',
    marginLeft: 10,
    marginTop: 10,
  },
  image: {
    width: 140,
    height: 110,
    borderRadius: 10,
    marginTop: 'auto',
    marginBottom: 10,
    alignSelf: 'center',
  }
});

export default CardDesign;