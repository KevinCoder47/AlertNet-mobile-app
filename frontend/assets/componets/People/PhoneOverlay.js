import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { useTheme } from '../../contexts/ColorContext';
import { FirebaseService } from '../../../backend/Firebase/FirebaseService';

const { width, height } = Dimensions.get('window');

const PhoneOverlay = ({ visible, onClose, myPhone, userEmail }) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '' });
  const [error, setError] = useState('');
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [numberExists, setNumberExists] = useState(null);
  const [userExistsOnPlatform, setUserExistsOnPlatform] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [statusData, setStatusData] = useState({
    batteryLevel: null,
    networkStatus: null,
    friendRequests: []
  });

  const debounceTimeout = useRef(null);
  
  // Use your theme context instead of useColorScheme
  const { colors, isDark } = useTheme();
  const styles = getStyles(isDark, colors); // Pass colors to styles

  // Animation for status bar
  const statusOpacity = useRef(new Animated.Value(1)).current;

  // Status bar animation effect
  useEffect(() => {
    Animated.timing(statusOpacity, {
      toValue: confirmVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [confirmVisible]);

  // Battery monitoring
  useEffect(() => {
    const initializeBattery = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        setStatusData(prev => ({ ...prev, batteryLevel: Math.round(level * 100) }));
      } catch (error) {
        console.log('Battery access not available:', error);
      }
    };

    initializeBattery();

    let batteryListener;
    let interval;

    const setupBatteryMonitoring = async () => {
      try {
        batteryListener = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setStatusData(prev => ({ ...prev, batteryLevel: Math.round(batteryLevel * 100) }));
        });

        interval = setInterval(async () => {
          try {
            const level = await Battery.getBatteryLevelAsync();
            setStatusData(prev => ({ ...prev, batteryLevel: Math.round(level * 100) }));
          } catch (error) {
            console.log('Battery update failed:', error);
          }
        }, 10000);
      } catch (error) {
        console.log('Battery monitoring setup failed:', error);
      }
    };

    setupBatteryMonitoring();

    return () => {
      if (batteryListener?.remove) batteryListener.remove();
      if (interval) clearInterval(interval);
    };
  }, []);

  // Network monitoring
  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setStatusData(prev => ({ 
          ...prev, 
          networkStatus: networkState.isConnected ? 'Online' : 'Offline' 
        }));
      } catch (error) {
        console.log('Network status check failed:', error);
        setStatusData(prev => ({ ...prev, networkStatus: 'Unknown' }));
      }
    };

    checkNetworkStatus();
    const interval = setInterval(checkNetworkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Friend requests monitoring
  useEffect(() => {
    if (!myPhone) return;
    
    const unsubscribe = FirebaseService.listenToFriendRequests(myPhone, (requests) => {
      setStatusData(prev => ({ ...prev, friendRequests: requests }));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [myPhone]);

  // Enhanced phone number validation
  const checkNumberExists = async (phoneNumber) => {
    if (phoneNumber.length < 5) return;

    setCheckingNumber(true);
    setNumberExists(null);
    setUserExistsOnPlatform(null);
    setError('');

    try {
      const userCheck = await FirebaseService.checkUserExists(phoneNumber);
      
      if (userCheck.error) {
        setError('Error checking user database');
        return;
      }

      setUserExistsOnPlatform(userCheck.exists);
      
      if (!userCheck.exists) {
        setError('This person is not on AlertNet');
        return;
      }

      const existingRequest = await FirebaseService.checkExistingFriendRequest(myPhone, phoneNumber);
      
      if (existingRequest.error) {
        setError('Error checking existing requests');
        return;
      }

      if (existingRequest.exists) {
        const errorMessage = existingRequest.direction === 'outgoing' 
          ? 'Friend request already sent to this person'
          : 'This person has already sent you a friend request. Check your notifications.';
        
        setError(errorMessage);
        setNumberExists(true);
      } else {
        setNumberExists(false);
        setError('');
      }

    } catch (error) {
      console.error('Error in checkNumberExists:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setCheckingNumber(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'phone') {
      setNumberExists(null);
      setUserExistsOnPlatform(null);
      setError('');
      
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      
      if (value.length >= 5) {
        debounceTimeout.current = setTimeout(() => checkNumberExists(value), 1000);
      } else {
        setCheckingNumber(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', phone: '' });
    setError('');
    setNumberExists(null);
    setUserExistsOnPlatform(null);
    setCheckingNumber(false);
    setConfirmVisible(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const { firstName, phone } = formData;
    
    if (!firstName.trim()) {
      setError('Please enter first name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }
    if (numberExists || !userExistsOnPlatform) {
      return;
    }

    setError('');
    setCheckingNumber(true);

    try {
      const result = await FirebaseService.sendFriendRequest({
        firstName: firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: phone.trim(),
        senderPhone: myPhone,
        senderEmail: userEmail
      });

      if (result.success) {
        setConfirmVisible(true);
      } else {
        setError(result.error || result.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setCheckingNumber(false);
    }
  };

  const getPhoneInputStatus = () => {
    if (checkingNumber) return 'checking';
    if (userExistsOnPlatform === false) return 'not-found';
    if (numberExists === true) return 'already-exists';
    if (userExistsOnPlatform === true && numberExists === false) return 'available';
    return 'default';
  };

  const renderPhoneInputStatus = () => {
    const status = getPhoneInputStatus();
    
    const statusComponents = {
      checking: <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 8 }} />,
      'not-found': <Ionicons name="close-circle" size={20} color="#ff4d4f" style={{ marginLeft: 8 }} />,
      'already-exists': <Text style={styles.alreadyAddedText}>Already requested</Text>,
      available: <Ionicons name="checkmark-circle" size={20} color="#4BB543" style={{ marginLeft: 8 }} />,
      default: null
    };

    return statusComponents[status] || null;
  };

  const isSubmitDisabled = () => {
    return checkingNumber || 
           numberExists === true || 
           userExistsOnPlatform === false || 
           !formData.firstName.trim() || 
           !formData.phone.trim();
  };

  return (
    <Modal 
      animationType="slide" 
      transparent 
      visible={visible} 
      onRequestClose={handleClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoiding}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.overlay}>
                {/* Status Bar - Hidden when request sent */}
                {!confirmVisible && (
                  <Animated.View style={[styles.statusBar, { opacity: statusOpacity }]}>
                    <View style={styles.statusItem}>
                      <Ionicons name="battery-half" size={14} color="white" />
                      <Text style={styles.statusText}>
                        {statusData.batteryLevel ?? '--'}%
                      </Text>
                    </View>
                    
                    <View style={styles.statusItem}>
                      <Ionicons
                        name="wifi"
                        size={14}
                        color={statusData.networkStatus === 'Online' ? 'white' : '#ff4d4f'}
                      />
                      <Text
                        style={[
                          styles.statusText, 
                          { color: statusData.networkStatus === 'Online' ? 'white' : '#ff4d4f' }
                        ]}
                      >
                        {statusData.networkStatus ?? 'Offline'}
                      </Text>
                    </View>
                    
                    <View style={styles.statusItem}>
                      <Ionicons name="people" size={14} color="white" />
                      <Text style={styles.statusText}>
                        {statusData.friendRequests.length} Requests
                      </Text>
                    </View>
                  </Animated.View>
                )}

                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Add Contact</Text>
                  <TouchableOpacity 
                    onPress={handleClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={28} color={colors.textSecondary || colors.secondary} />
                  </TouchableOpacity>
                </View>

                {!confirmVisible ? (
                  <>
                    {/* Form Inputs */}
                    <TextInput
                      style={styles.input}
                      placeholder="First name"
                      placeholderTextColor={colors.placeholder || colors.secondary}
                      value={formData.firstName}
                      onChangeText={(text) => handleInputChange('firstName', text)}
                      autoFocus
                      returnKeyType="next"
                      autoCapitalize="words"
                    />
                    
                    <TextInput
                      style={styles.input}
                      placeholder="Last name"
                      placeholderTextColor={colors.placeholder || colors.secondary}
                      value={formData.lastName}
                      onChangeText={(text) => handleInputChange('lastName', text)}
                      returnKeyType="next"
                      autoCapitalize="words"
                    />
                    
                    <View style={styles.phoneInputContainer}>
                      <TextInput
                        style={[styles.input, styles.phoneInput]}
                        placeholder="Phone number"
                        placeholderTextColor={colors.placeholder || colors.secondary}
                        keyboardType="phone-pad"
                        value={formData.phone}
                        onChangeText={(text) => handleInputChange('phone', text)}
                        maxLength={15}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                      />
                      {renderPhoneInputStatus()}
                    </View>

                    {error ? (
                      <Text style={styles.errorText} numberOfLines={3}>
                        {error}
                      </Text>
                    ) : null}

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[
                        styles.requestButton,
                        isSubmitDisabled() && styles.disabledButton
                      ]}
                      onPress={handleSubmit}
                      disabled={isSubmitDisabled()}
                      activeOpacity={0.8}
                    >
                      {checkingNumber ? (
                        <ActivityIndicator 
                          size="small" 
                          color="#fff" 
                          style={{ marginRight: 8 }} 
                        />
                      ) : (
                        <Ionicons 
                          name="send-outline" 
                          size={20} 
                          color="#fff" 
                          style={{ marginRight: 8 }} 
                        />
                      )}
                      <Text style={styles.requestButtonText}>
                        {checkingNumber ? 'Sending...' : 'Request to Connect'}
                      </Text>
                    </TouchableOpacity>

                    {/* Footer Text */}
                    <Text style={styles.footerText}>
                      By tapping{' '}
                      <Text style={styles.footerBold}>"Request to Connect"</Text>, you
                      authorize AlertNet to share your location and safety updates with
                      this person through the app.
                    </Text>
                  </>
                ) : (
                  /* Success Confirmation */
                  <View style={styles.confirmContainer}>
                    <Ionicons name="checkmark-circle-outline" size={60} color="#4BB543" />
                    <Text style={styles.confirmText}>
                      Request Sent To {formData.firstName}!
                    </Text>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Updated styles to use theme colors
const getStyles = (isDark, colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    paddingHorizontal: width * 0.025, // 2.5% of screen width
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  keyboardAvoiding: { 
    width: '100%',
  },
  overlay: {
    backgroundColor: colors.card || colors.background,
    borderRadius: 14,
    padding: width * 0.05, // 5% of screen width
    minHeight: height * 0.45, // 45% of screen height
    maxHeight: height * 0.8,  // 80% of screen height
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusItem: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statusText: { 
    color: 'white', 
    marginLeft: 4, 
    fontSize: 12,
    fontWeight: '500',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder || colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    marginBottom: 15,
    color: colors.text,
    backgroundColor: colors.inputBackground || colors.background,
    minHeight: 48, // Ensure consistent height across devices
  },
  phoneInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  alreadyAddedText: { 
    color: '#ff4d4f', 
    fontWeight: '600',
    fontSize: 12,
  },
  errorText: { 
    color: '#ff4d4f', 
    marginBottom: 15,
    fontSize: 14,
    lineHeight: 18,
  },
  requestButton: { 
    flexDirection: 'row', 
    backgroundColor: '#FF6600', 
    paddingVertical: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 50, // Ensure consistent button height
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  requestButtonText: { 
    color: 'white', 
    fontWeight: '600', 
    fontSize: 16,
  },
  footerText: { 
    marginTop: 15, 
    fontSize: 12, 
    color: colors.textSecondary || colors.secondary, 
    textAlign: 'center', 
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  footerBold: {
    fontWeight: '600',
  },
  confirmContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: height * 0.12, // 12% of screen height
  },
  confirmText: { 
    marginTop: 15, 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#4BB543',
    textAlign: 'center',
  },
});

export default PhoneOverlay;