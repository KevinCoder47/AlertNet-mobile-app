import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFontSize } from '../contexts/FontSizeContext';
import { useTheme } from '../contexts/ColorContext';

const { width: screenWidth } = Dimensions.get('window');

export default function AppearancePopup({ visible, onClose }) {
  const { getScaledFontSize } = useFontSize();
  const { colors, theme, setTheme, isDarkMode } = useTheme();

  const themeOptions = [
    {
      id: 'light',
      name: 'Light Mode',
      icon: 'sunny-outline',
      description: 'Classic light appearance'
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      icon: 'moon-outline',
      description: 'Easy on the eyes'
    },
    {
      id: 'auto',
      name: 'System Default',
      icon: 'phone-portrait-outline',
      description: 'Match device settings'
    }
  ];

  const handleThemeSelect = (themeId) => {
    setTheme(themeId);
    // Close popup after selection
    setTimeout(() => {
      onClose();
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            activeOpacity={1} 
            style={[styles.popup, { backgroundColor: colors.background }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { 
                  fontSize: getScaledFontSize(18), 
                  color: colors.text 
                }]}>
                  Appearance & Theme
                </Text>
                <Text style={[styles.subtitle, { 
                  fontSize: getScaledFontSize(14), 
                  color: colors.textSecondary || colors.secondary 
                }]}>
                  Choose your preferred theme
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Theme Options */}
            <View style={styles.optionsContainer}>
              {themeOptions.map((option, index) => (
                <View key={option.id}>
                  <TouchableOpacity
                    style={[
                      styles.option,
                      theme === option.id && styles.selectedOption
                    ]}
                    onPress={() => handleThemeSelect(option.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[
                        styles.iconContainer,
                        theme === option.id ? styles.selectedIconContainer : { 
                          backgroundColor: colors.iconBackground || (isDarkMode ? '#404040' : '#f5f5f5')
                        }
                      ]}>
                        <Ionicons 
                          name={option.icon} 
                          size={20} 
                          color={theme === option.id ? '#fff' : colors.text} 
                        />
                      </View>
                      <View style={styles.optionText}>
                        <Text style={[
                          styles.optionName, 
                          { 
                            fontSize: getScaledFontSize(16),
                            color: colors.text,
                            fontWeight: theme === option.id ? '600' : '400'
                          }
                        ]}>
                          {option.name}
                        </Text>
                        <Text style={[
                          styles.optionDescription, 
                          { 
                            fontSize: getScaledFontSize(13), 
                            color: colors.textSecondary || colors.secondary 
                          }
                        ]}>
                          {option.description}
                        </Text>
                      </View>
                    </View>
                    {theme === option.id && (
                      <MaterialIcons name="check" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  {index < themeOptions.length - 1 && (
                    <View style={[styles.separator, { 
                      backgroundColor: colors.separator || (isDarkMode ? '#404040' : '#f0f0f0')
                    }]} />
                  )}
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[
                styles.footerText, 
                { 
                  fontSize: getScaledFontSize(12), 
                  color: colors.textTertiary || colors.secondary 
                }
              ]}>
                Theme changes will be applied immediately
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.85,
    maxWidth: 400,
  },
  popup: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.8,
  },
  closeButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  selectedOption: {
    // Add any selected option styling if needed
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    flex: 1,
  },
  optionName: {
    marginBottom: 2,
  },
  optionDescription: {
    opacity: 0.8,
  },
  separator: {
    height: 1,
    marginLeft: 52,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerText: {
    opacity: 0.6,
    textAlign: 'center',
  },
});