import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.6;
const CARD_MARGIN_HORIZONTAL = 10;
const ITEM_WIDTH = CARD_WIDTH + CARD_MARGIN_HORIZONTAL * 2;

const plans = [
  { id: 'basic', name: 'Basic' },
  { id: 'premium', name: 'Premium', bestOffer: true },
  { id: 'plus', name: 'Plus' },
];

const SubscriptionScreen = ({setIsSubscriptionScreen, setIsSafetyResources}) => {
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [activeIndex, setActiveIndex] = useState(1);
  const flatListRef = useRef(null);

  const onScroll = (event) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const renderPlanCard = ({ item, index }) => {
    const isCenter = index === activeIndex;

    return (
      <View style={styles.cardWrapper}>
        <View style={[styles.planCard, isCenter ? styles.centerPlanCard : styles.sidePlanCard]}>
          {item.bestOffer && (
            <View style={[styles.bestOfferBadge, !isCenter && { top: 0 }]}>
              <Text style={styles.bestOfferText}>Best Offer</Text>
            </View>
          )}
          <Text style={styles.planName}>{item.name}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => {setIsSubscriptionScreen(false)
            setIsSafetyResources(true)
            }}>
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              setIsSubscriptionScreen(false);
              setIsSafetyResources(true);
            }}>
              <Icon name="menu" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>
            Access premium tools to stay protected anytime, anywhere
          </Text>

          <FlatList
            ref={flatListRef}
            data={plans}
            renderItem={renderPlanCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            onMomentumScrollEnd={onScroll}
            initialScrollIndex={1}
            getItemLayout={(data, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
          />

          <View style={styles.pagination}>
            {plans.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index === activeIndex ? '#C53A3A' : '#D8D8D8' },
                ]}
              />
            ))}
          </View>
        </View>

        <LinearGradient
          colors={['#D86B5A', '#C04848']}
          style={styles.bottomSection}>
          <View style={styles.trialContainer}>
            <Text style={styles.trialText}>Start your 7-day trial</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#F5B0A2' }}
              thumbColor={'#fff'}
              onValueChange={() => setTrialEnabled((prev) => !prev)}
              value={trialEnabled}
            />
          </View>

          <TouchableOpacity
            style={styles.planButton}
            onPress={() => setSelectedPlan('monthly')}>
            <Text style={styles.planButtonText}>Monthly Plan</Text>
            <View style={styles.radioOuter}>
              {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.planButton}
            onPress={() => setSelectedPlan('yearly')}>
            <Text style={styles.planButtonText}>Yearly Plan</Text>
            <View style={styles.radioOuter}>
              {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.activateButton}>
            <Text style={styles.activateButtonText}>Activate</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.legalLink}>Terms of Use and Privacy Policy</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By clicking "Activate" you confirm that you have read and agreed to
            AlertNet's Terms of Use and Privacy Policy. Unless you cancel at least 24 hours
            before the end of the 7-day free trial, you will be automatically charged $R.
            Subscription renews automatically until you cancel prior to the end
            of current period.
          </Text>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  topSection: {
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 40,
    marginTop: 8,
    marginBottom: 20,
  },
  carouselContainer: {
    paddingHorizontal: (screenWidth - ITEM_WIDTH) / 2,
    alignItems: 'center',
  },
  cardWrapper: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    height: 320,
  },
  planCard: {
    width: CARD_WIDTH,
    height: 250,
    backgroundColor: '#FCEAE4',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: CARD_MARGIN_HORIZONTAL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0D4CC',
  },
  centerPlanCard: {
    height: 290,
    backgroundColor: '#FFF',
    borderColor: '#EFEFEF',
    transform: [{ translateY: -15 }],
  },
  sidePlanCard: {
    opacity: 0.6,
  },
  bestOfferBadge: {
    position: 'absolute',
    top: -15,
    backgroundColor: '#C53A3A',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 7,
  },
  bestOfferText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  bottomSection: {
    padding: 30,
  },
  trialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  trialText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  planButton: {
    backgroundColor: '#A94A3B',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  planButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F5B0A2',
  },
  activateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  activateButtonText: {
    color: '#B5493C',
    fontSize: 18,
    fontWeight: 'bold',
  },
  legalLink: {
    color: '#fff',
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 12,
    fontWeight: '600',
  },
  disclaimer: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default SubscriptionScreen;