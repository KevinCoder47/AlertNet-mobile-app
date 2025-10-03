import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseService } from '../../backend/Firebase/FirebaseService';

const PhoneOverlay = ({ visible, onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const [checkingNumber, setCheckingNumber] = useState(false);
  const [numberExists, setNumberExists] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const debounceTimeout = useRef(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Simulate backend check with debounce
  const checkNumberExists = (num) => {
    setCheckingNumber(true);
    setNumberExists(false);
    setError('');
    setTimeout(() => {
      if (num.endsWith('5')) {
        setNumberExists(true);
      } else {
        setNumberExists(false);
      }
      setCheckingNumber(false);
    }, 1500);
  };

  const onChangePhone = (text) => {
    setPhone(text);
    setNumberExists(false);
    setError('');
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    if (text.length >= 5) {
      debounceTimeout.current = setTimeout(() => {
        checkNumberExists(text);
      }, 700);
    } else {
      setCheckingNumber(false);
      setNumberExists(false);
    }
  };

  const closeOverlay = () => {
    setConfirmVisible(false);
    onClose();
  };

  const onSubmit = async () => {
    if (!firstName.trim()) {
      setError('Please enter first name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }
    if (numberExists) {
      setError('This phone number is already added.');
      return;
    }
    setError('');
    setCheckingNumber(true);

    const result = await FirebaseService.sendFriendRequest({
      firstName,
      lastName,
      phone
    });

    setCheckingNumber(false);

    if (result.success) {
      setConfirmVisible(true);
      setFirstName('');
      setLastName('');
      setPhone('');
      setNumberExists(false);
    } else {
      setError(result.error || 'Failed to send friend request');
    }
  };

  const styles = getStyles(isDark);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={closeOverlay}>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          closeOverlay();
        }}
      >
        <View style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoiding}
          >

            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.overlay}>
                <View style={styles.header}>
                  <Text style={styles.title}>Add Contact</Text>
                  <TouchableOpacity onPress={closeOverlay}>
                    <Ionicons
                      name="close"
                      size={28}
                      color={isDark ? '#ccc' : '#555'}
                    />
                  </TouchableOpacity>
                </View>

                {confirmVisible ? (
                  <View style={styles.confirmContainer}>
                    <Ionicons name="checkmark-circle-outline" size={60} color="#4BB543" />
                    <Text style={styles.confirmText}>Request Sent!</Text>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="First name"
                      placeholderTextColor={isDark ? '#aaa' : '#666'}
                      value={firstName}
                      onChangeText={setFirstName}
                      autoFocus
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Last name"
                      placeholderTextColor={isDark ? '#aaa' : '#666'}
                      value={lastName}
                      onChangeText={setLastName}
                    />

                    <View style={styles.phoneInputContainer}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        placeholder="Phone number"
                        placeholderTextColor={isDark ? '#aaa' : '#666'}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={onChangePhone}
                        maxLength={15}
                      />
                      {checkingNumber && (
                        <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 8 }} />
                      )}
                      {numberExists && !checkingNumber && (
                        <Text style={styles.alreadyAddedText}>Already added</Text>
                      )}
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                      style={[
                        styles.requestButton,
                        numberExists ? { backgroundColor: '#aaa' } : null,
                      ]}
                      onPress={onSubmit}
                      disabled={numberExists}
                    >
                      <Ionicons
                        name="send-outline"
                        size={20}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.requestButtonText}>Request to Connect</Text>
                    </TouchableOpacity>

                    <Text style={styles.footerText}>
                      By tapping{' '}
                      <Text style={{ fontWeight: '600' }}>"Request to Connect"</Text>, you
                      authorize AlertNet to share your location and safety updates with
                      this person through the app.
                    </Text>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
      paddingHorizontal: 5,
      paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    keyboardAvoiding: {
      width: '100%',
    },
    overlay: {
      backgroundColor: isDark ? '#121212' : 'white',
      borderRadius: 14,
      padding: 20,
      elevation: 5,
      shadowColor: isDark ? '#000' : '#aaa',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      zIndex: 10,
      minHeight: 320,
      justifyContent: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? 'white' : 'black',
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ccc',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      marginBottom: 12,
      color: isDark ? 'white' : 'black',
      backgroundColor: isDark ? '#222' : '#fff',
    },
    phoneInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    alreadyAddedText: {
      color: '#ff4d4f',
      marginLeft: 8,
      fontWeight: '600',
    },
    errorText: {
      color: '#ff4d4f',
      marginBottom: 10,
    },
    requestButton: {
      flexDirection: 'row',
      marginTop: 15,
      backgroundColor: '#FF6600',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
    },
    footerText: {
      marginTop: 12,
      fontSize: 12,
      color: isDark ? '#aaa' : '#666',
      textAlign: 'center',
      lineHeight: 18,
    },
    confirmContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
    },
    confirmText: {
      marginTop: 0,
      fontSize: 22,
      fontWeight: '700',
      color: '#4BB543',
    },
  });

export default PhoneOverlay;


