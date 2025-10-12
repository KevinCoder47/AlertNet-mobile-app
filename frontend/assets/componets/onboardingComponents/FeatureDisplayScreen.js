import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions, TouchableOpacity, Animated, Image } from 'react-native';
import { useFonts } from 'expo-font';
import CardDesign from './CardDesign';
import GetStarted from './GetStarted';

const { width: SCREEN_WIDTH, height } = Dimensions.get('window');

// SOS Button Component
const SOSBtn = ({ isSOSPreview, onPress, }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSOSPreview) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSOSPreview]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.sosContainer,
          {
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
            backgroundColor: isSOSPreview ? '#FFBDC2' : '#DC2626',
          },
        ]}
      >
        <View style={styles.sosInnerCircle1}>
          <View style={styles.sosInnerCircle2}>
            <Text style={styles.sosText}>SOS</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Message Row Component
const MessageRow = ({ time, text, highlight, endText, opacity, translateY }) => (
  <Animated.View style={[styles.messageRow, { opacity, transform: [{ translateY }] }]}>
    <Text style={styles.messageTime}>{time}</Text>
    <View style={styles.messageTextContainer}>
      <Text style={styles.messageText}>
        {text}
        <Text style={styles.messageHighlight}>{highlight}</Text>
        {endText}
      </Text>
    </View>
  </Animated.View>
);

// Group Item Component for Walk Partner
const GroupItem = ({ name }) => (
  <View style={styles.groupItem}>
    <View style={styles.groupDot} />
    <Text style={styles.groupName}>{name}</Text>
  </View>
);

const FeatureDisplayScreen = ({onComplete, setOnboardingComplete, setIsLoggedIn}) => {
  const [fontsLoaded] = useFonts({
    'Poppins Bold': require('../../fonts/Poppins/Poppins-Bold.ttf'),
    'Poppins Medium': require('../../fonts/Poppins/Poppins-Medium.ttf'),
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSOSPreview, setIsSOSPreview] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef();

  const messages = [
    { id: 1, time: '21:45', text: 'Your ', highlight: 'Friends', endText: ' have been notified.' },
    { id: 2, time: '21:47', text: '', highlight: 'Mpilo', endText: ' is on the way to you.' },
    { id: 3, time: '21:48', text: '', highlight: 'Campus Security', endText: ' is on the way to you.' }
  ];

  const messageAnims = useRef(messages.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!isSOSPreview) {
      messageAnims.forEach(anim => anim.setValue(0));
      setVisibleMessages([]);
      messages.forEach((message, index) => {
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, message]);
          Animated.timing(messageAnims[index], {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }, index * 2000);
      });
    } else {
      setVisibleMessages([]);
      messageAnims.forEach(anim => anim.setValue(0));
    }
  }, [isSOSPreview]);

  const handleSOSPress = () => {
    if (isSOSPreview) {
      setIsSOSPreview(false);
    } else {
      setIsSOSPreview(true);
    }
  };

  const cardStyles = [{
    id: 'run',
    title: 'Richmond Mon Run',
    image: require('../../images/onboarding/run.jpg'),
    backgroundColor: '#CB85A1',
    textColor: '#774257'
  },
    {
      id: 'group',
      title: 'Horizon Heights group',
      image: require('../../images/onboarding/group.jpg'),
      backgroundColor: '#16151D',
      textColor: '#C1BAAF'
    },
    {
      id: 'campus',
      title: 'Campus to Campus',
      image: require('../../images/onboarding/campus.jpg'),
      backgroundColor: '#95AFBC',
      textColor: '#438092'
    },
    {
      id:'library',
      title: 'APK 6PM Study sess',
      image: require('../../images/onboarding/library.jpg'),
      backgroundColor: '#542A02',
      textColor: '#C0BCB2'
    },
    {
      id: 'uj',
      title: 'UJ Library Night Walk',
      image: require('../../images/onboarding/uj.jpg'),
      backgroundColor: '#C15D4D',
      textColor: '#481B20'
    }
  ]

  // Animation for pulsing circle
  const pulseAnim = useRef(new Animated.Value(0)).current;
  
  // Scale interpolations for three pulses
  const pulseScale1 = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5]
  });
  const pulseOpacity1 = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.8, 0]
  });
  
  const pulseScale2 = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2]
  });
  const pulseOpacity2 = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.5, 0]
  });
  
  const pulseScale3 = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5]
  });
  const pulseOpacity3 = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.3, 0]
  });

  useEffect(() => {
    // Only run animation for close friends screen
    if (currentIndex === 2) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [currentIndex]);

  const features = [
    {
      id: 'alerts',
      title: 'Instant Alerts',
      tagline: 'Your safety, one tap away',
      content: (
        <View style={styles.contentContainer}>
          <View style={{ marginTop: 85, alignItems: 'center' }}>
            {isSOSPreview && (
              <Text style={styles.pressMeText}>Press me!</Text>
            )}
            <SOSBtn isSOSPreview={isSOSPreview} onPress={handleSOSPress} />
          </View>
          {visibleMessages.length > 0 && (
            <View style={styles.messagesContainer}>
              {visibleMessages.map((message, index) => (
                <MessageRow
                  key={message.id}
                  time={message.time}
                  text={message.text}
                  highlight={message.highlight}
                  endText={message.endText}
                  opacity={messageAnims[index]}
                  translateY={messageAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })}
                />
              ))}
            </View>
          )}
          <Text style={styles.featureComment}>pop up notifications.</Text>
        </View>
      ),
      comment: 'pop up notifications.'
    },
    {
      id: 'walk',
      title: "Walk Partner",
      tagline: "find nearby students to walk with",
      content: (
        <View style={styles.contentContainer}>
          {/* run card */}
          <View style={{
            position: 'absolute',
            top: 140, left: -100,
            transform: [{ rotate: '-10deg' }]
          }}>
            <CardDesign {...cardStyles[0]} />
          </View>

          {/* campus card */}
          <View style={{
            position: 'absolute',
            top: 50, left: 0,
            transform: [{ rotate: '-5deg' }]
          }}>
            <CardDesign {...cardStyles[2]} />
          </View>

          {/* library card */}
          <View style={{
            position: 'absolute',
            top: 80, right: 10,
            transform: [{ rotate: '5deg' }]
          }}>
            <CardDesign {...cardStyles[3]} />
          </View>

          {/* UJ card */}
          <View style={{
            position: 'absolute',
            bottom: 220, right: -100,
            transform: [{ rotate: '-11deg' }]
          }}>
            <CardDesign {...cardStyles[4]} />
          </View>

          {/* group card */}
          <View style={{
            position: 'absolute',
            bottom: 140, left: 0, right: 0,
            alignItems: 'center',
            transform: [{ rotate: '5deg' }]
          }}>
            <CardDesign {...cardStyles[1]} />
          </View>
          <Text style={styles.featureComment}>All Walking.</Text>
        </View>
      ),
      comment: 'All Walking.'
    },
    {
      id: 'closeFriends',
      title: 'Close Friends',
      tagline: 'Stay close, even when apart.',
      content: (
        <View style={[styles.contentContainer, {marginTop: 50}]}>
          <View style={styles.circleContainer}>
            {/* Base Circle - You */}
            <View style={styles.baseCircle}>
              <Image 
                style={styles.youImage} 
                source={require('../../images/onboarding/you.jpeg')} 
              />
            </View>
            
            {/* Pulsing Circles */}
            <Animated.View style={[styles.pulsingCircle, {
              transform: [{ scale: pulseScale1 }],
              opacity: pulseOpacity1
            }]} />
            <Animated.View style={[styles.pulsingCircle, {
              transform: [{ scale: pulseScale2 }],
              opacity: pulseOpacity2
            }]} />
            <Animated.View style={[styles.pulsingCircle, {
              transform: [{ scale: pulseScale3 }],
              opacity: pulseOpacity3
            }]} />
            
            {/* Close Friends */}
            {/* Musa on second pulse (left) */}
            <View style={[styles.friendCircle, styles.musaPosition]}>
              <Image 
                style={styles.friendImage} 
                source={require('../../images/onboarding/Musa.png')} 
              />
              <Text style={styles.friendName}>Musa</Text>
            </View>
            
            {/* Kevin on third pulse (right) */}
            <View style={[styles.friendCircle, styles.kevinPosition]}>
              <Image 
                style={styles.friendImage} 
                source={require('../../images/onboarding/kevin.png')} 
              />
              <Text style={styles.friendName}>Kevin</Text>
            </View>
          </View>
          
          <Text style={styles.featureComment}>
            Track your close friends in real-time. See their location, battery level, and check in with a tap.
          </Text>
        </View>
      ),
      comment: 'Your close friends are always there.'
    },
    {
      id: 'getStarted',
      title: '',
      tagline: '',
      content: <GetStarted
        onComplete={onComplete}
        setOnboardingComplete={setOnboardingComplete}
         />,
    }
  ];

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Hide header on GetStarted screen (index 3) */}
      {currentIndex < 3 && (
        <View style={styles.header}>
          <Text style={styles.featureTitle}>{features[currentIndex].title}</Text>
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>{features[currentIndex].tagline}</Text>
          </View>
        </View>
      )}
      
      <View style={{ flex: 1 }}>
        <Animated.FlatList
          ref={flatListRef}
          data={features}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={ev => {
            const newIndex = Math.floor(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(newIndex);
            if (newIndex === 0) {
              setIsSOSPreview(true);
            }
          }}
          renderItem={({ item, index }) => (
            <View style={[
              styles.slide,
              index === 3 ? styles.fullScreenSlide : null
            ]}>
              {item.content}
            </View>
          )}
        />
      </View>
      
      {/* Hide pagination on GetStarted screen (index 3) */}
{currentIndex < 3 && (
  <View style={styles.pagination}>
    {features.slice(0, 4).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          i === currentIndex ? styles.activeDot : null
        ]}
      />
    ))}
  </View>
)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF7EE',
    // paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    marginTop: 50,
    paddingTop: 60
  },
  featureTitle: {
    fontSize: 45,
    fontFamily: 'Poppins Bold',
    textAlign: 'center',
    lineHeight: 50,
    maxWidth: 190,
  },
  tagContainer: {
    backgroundColor: '#C84022',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  tagText: {
    color: '#FFC8A3',
    fontFamily: 'Poppins Medium',
    fontSize: 12
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
  },
  fullScreenSlide: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  sosButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins Bold',
  },
  pressMeText: {
    fontFamily: 'Poppins Medium',
    fontSize: 10,
    marginBottom: 5,
    marginLeft: 60,
    transform: [{ rotate: '30deg' }],
    color: '#C84022'
  },
  messagesContainer: {
    width: '100%',
    maxWidth: 350,
    marginTop: 60,
    marginLeft: 50
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    maxWidth: 250
  },
  messageTime: {
    color: '#666',
    fontSize: 11,
    fontWeight: '500',
    minWidth: 50,
    marginRight: 10,
    fontFamily: 'Poppins Medium',
  },
  messageTextContainer: {
    flex: 1,
  },
  messageText: {
    color: '#333',
    fontSize: 11,
    lineHeight: 20,
    fontFamily: 'Poppins Medium',
  },
  messageHighlight: {
    color: '#F97316',
    fontWeight: '600',
  },
  groupsContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  groupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 15,
  },
  groupName: {
    fontSize: 18,
    fontFamily: 'Poppins Medium',
    color: '#333',
  },
  allWalking: {
    color: '#10B981',
    fontSize: 16,
    fontFamily: 'Poppins Medium',
    marginTop: 10,
  },
  featureComment: {
    color: '#FE5235',
    fontSize: 11,
    fontFamily: 'Poppins SemiBold',
    marginTop: 'auto',
    textAlign: 'center',
    marginBottom: 70,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#FFCBA9',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#C84022',
    width: 5,
  },
  sosContainer: {
    width: height * 0.11,
    height: height * 0.11,
    borderRadius: (height * 0.11) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosInnerCircle1: {
    backgroundColor: '#DE2B38',
    width: height * 0.10,
    height: height * 0.10,
    borderRadius: (height * 0.10) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosInnerCircle2: {
    backgroundColor: '#C80110',
    width: height * 0.09,
    height: height * 0.09,
    borderRadius: (height * 0.09) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins Bold',
    fontSize: 20,
  },
  circleContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  baseCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FE5235',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  youImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  pulsingCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 125,
    backgroundColor: '#FE5235',
    zIndex: 1,
  },
  friendCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  friendImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  friendName: {
    position: 'absolute',
    bottom: -20,
    fontSize: 12,
    fontFamily: 'Poppins Medium',
    color: '#333',
    textAlign: 'center',
    width: 70,
  },
  musaPosition: {
    left: 40,
    top: 125,
  },
  kevinPosition: {
    right: 40,
    top: 125,
  },
});

export default FeatureDisplayScreen;