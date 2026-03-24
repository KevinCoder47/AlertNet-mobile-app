import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ColorContext';
import { useFontSize } from '../../contexts/FontSizeContext';
import Constants from 'expo-constants';

const { width: screenWidth } = Dimensions.get('window');

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'R49',
    period: '/month',
    description: 'Essential safety features',
    features: [
      'Emergency SOS alerts',
      'Location sharing',
      'Safe zone notifications',
      'Basic helpline access',
    ],
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R99',
    period: '/month',
    description: 'Complete protection suite',
    features: [
      'All Basic features',
      'AI threat detection',
      'Live 24/7 support',
      'Priority emergency response',
      'Unlimited safe contacts',
      'Advanced analytics',
    ],
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    recommended: true,
    yearlyPrice: 'R990',
    yearlySavings: 'Save R198',
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 'R69',
    period: '/month',
    description: 'Enhanced safety tools',
    features: [
      'All Basic features',
      'Voice panic word',
      'Enhanced location tracking',
      'Priority notifications',
      '10 safe contacts',
    ],
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
];

const SubscriptionScreen = ({ setIsSubscriptionScreen, setIsSafetyResources }) => {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const { colors } = useTheme();
  const { getScaledFontSize } = useFontSize();

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={() => {
            setIsSubscriptionScreen(false);
            setIsSafetyResources(true);
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { fontSize: getScaledFontSize(20), color: colors.text }]}>
            Choose Your Plan
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
            Premium protection for your safety
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trial Banner */}
        <View style={[styles.trialBanner, { backgroundColor: '#10B981' }]}>
          <Feather name="gift" size={24} color="white" />
          <View style={styles.trialContent}>
            <Text style={[styles.trialTitle, { fontSize: getScaledFontSize(16) }]}>
              7-Day Free Trial
            </Text>
            <Text style={[styles.trialSubtitle, { fontSize: getScaledFontSize(13) }]}>
              Cancel anytime, no commitment required
            </Text>
          </View>
        </View>

        {/* Billing Period Toggle */}
        <View style={styles.billingToggleContainer}>
          <Text style={[styles.billingLabel, { fontSize: getScaledFontSize(14), color: colors.text }]}>
            Billing Period
          </Text>
          <View style={[styles.billingToggle, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[
                styles.billingOption,
                billingPeriod === 'monthly' && { backgroundColor: '#8B5CF6' }
              ]}
              onPress={() => setBillingPeriod('monthly')}
            >
              <Text style={[
                styles.billingOptionText,
                { fontSize: getScaledFontSize(13) },
                billingPeriod === 'monthly' ? { color: 'white' } : { color: colors.text }
              ]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.billingOption,
                billingPeriod === 'yearly' && { backgroundColor: '#8B5CF6' }
              ]}
              onPress={() => setBillingPeriod('yearly')}
            >
              <Text style={[
                styles.billingOptionText,
                { fontSize: getScaledFontSize(13) },
                billingPeriod === 'yearly' ? { color: 'white' } : { color: colors.text }
              ]}>
                Yearly
              </Text>
              {billingPeriod === 'yearly' && (
                <View style={styles.savingsBadge}>
                  <Text style={[styles.savingsText, { fontSize: getScaledFontSize(10) }]}>
                    Save 20%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                { backgroundColor: colors.card },
                selectedPlan === plan.id && { 
                  borderWidth: 2,
                  borderColor: plan.color,
                }
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.7}
            >
              {plan.recommended && (
                <View style={[styles.recommendedBadge, { backgroundColor: plan.color }]}>
                  <Feather name="star" size={12} color="white" />
                  <Text style={[styles.recommendedText, { fontSize: getScaledFontSize(11) }]}>
                    Most Popular
                  </Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={[styles.planIconContainer, { backgroundColor: plan.bgColor }]}>
                  <Feather 
                    name={plan.id === 'basic' ? 'shield' : plan.id === 'premium' ? 'award' : 'zap'} 
                    size={24} 
                    color={plan.color} 
                  />
                </View>
                <View style={styles.planHeaderText}>
                  <Text style={[styles.planName, { fontSize: getScaledFontSize(18), color: colors.text }]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planDescription, { fontSize: getScaledFontSize(12), color: colors.textSecondary || colors.text }]}>
                    {plan.description}
                  </Text>
                </View>
                <View style={[styles.radioButton, selectedPlan === plan.id && { borderColor: plan.color }]}>
                  {selectedPlan === plan.id && (
                    <View style={[styles.radioInner, { backgroundColor: plan.color }]} />
                  )}
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={[styles.price, { fontSize: getScaledFontSize(32), color: colors.text }]}>
                  {billingPeriod === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                </Text>
                <Text style={[styles.period, { fontSize: getScaledFontSize(14), color: colors.textSecondary || colors.text }]}>
                  {billingPeriod === 'yearly' ? '/year' : plan.period}
                </Text>
              </View>

              {billingPeriod === 'yearly' && plan.yearlySavings && (
                <View style={[styles.savingsChip, { backgroundColor: '#10B981' + '20' }]}>
                  <Text style={[styles.savingsChipText, { fontSize: getScaledFontSize(12), color: '#10B981' }]}>
                    {plan.yearlySavings}
                  </Text>
                </View>
              )}

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Feather name="check-circle" size={16} color={plan.color} />
                    <Text style={[styles.featureText, { fontSize: getScaledFontSize(13), color: colors.text }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features Comparison */}
        <View style={[styles.comparisonCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.comparisonTitle, { fontSize: getScaledFontSize(16), color: colors.text }]}>
            Why Choose Premium?
          </Text>
          <View style={styles.comparisonRow}>
            <Feather name="clock" size={20} color="#8B5CF6" />
            <Text style={[styles.comparisonText, { fontSize: getScaledFontSize(13), color: colors.text }]}>
              24/7 live support and monitoring
            </Text>
          </View>
          <View style={styles.comparisonRow}>
            <Feather name="shield" size={20} color="#8B5CF6" />
            <Text style={[styles.comparisonText, { fontSize: getScaledFontSize(13), color: colors.text }]}>
              AI-powered threat detection
            </Text>
          </View>
          <View style={styles.comparisonRow}>
            <Feather name="users" size={20} color="#8B5CF6" />
            <Text style={[styles.comparisonText, { fontSize: getScaledFontSize(13), color: colors.text }]}>
              Unlimited emergency contacts
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity 
          style={[styles.ctaButton, { backgroundColor: selectedPlanData?.color || '#8B5CF6' }]}
        >
          <Text style={[styles.ctaButtonText, { fontSize: getScaledFontSize(16) }]}>
            Start 7-Day Free Trial
          </Text>
          <Feather name="arrow-right" size={20} color="white" />
        </TouchableOpacity>

        {/* Legal */}
        <TouchableOpacity style={styles.legalLink}>
          <Text style={[styles.legalLinkText, { fontSize: getScaledFontSize(13), color: colors.textSecondary || colors.text }]}>
            Terms of Use & Privacy Policy
          </Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { fontSize: getScaledFontSize(11), color: colors.textSecondary || colors.text }]}>
          By activating, you agree to AlertNet's Terms of Use and Privacy Policy. 
          Unless cancelled 24 hours before trial ends, you'll be charged automatically. 
          Subscription renews until cancelled.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  trialContent: {
    marginLeft: 12,
    flex: 1,
  },
  trialTitle: {
    color: 'white',
    fontWeight: '700',
    marginBottom: 2,
  },
  trialSubtitle: {
    color: 'white',
    opacity: 0.9,
  },
  billingToggleContainer: {
    marginBottom: 24,
  },
  billingLabel: {
    fontWeight: '600',
    marginBottom: 12,
  },
  billingToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  billingOptionText: {
    fontWeight: '600',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsText: {
    color: 'white',
    fontWeight: '700',
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  recommendedText: {
    color: 'white',
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  planDescription: {
    opacity: 0.7,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontWeight: '700',
    marginRight: 4,
  },
  period: {
    opacity: 0.7,
  },
  savingsChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  savingsChipText: {
    fontWeight: '600',
  },
  featuresContainer: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
  },
  comparisonCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  comparisonTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  comparisonText: {
    flex: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  ctaButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  legalLink: {
    alignItems: 'center',
    marginBottom: 12,
  },
  legalLinkText: {
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
  disclaimer: {
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.6,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 16,
  },
});

export default SubscriptionScreen;