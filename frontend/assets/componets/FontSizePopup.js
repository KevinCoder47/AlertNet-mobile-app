import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFontSize } from '../contexts/FontSizeContext';
import { useTheme } from '../contexts/ColorContext'; // ✅ theme import

const { height } = Dimensions.get('window');

export default function FontSizePopup({ visible, onClose }) {
  const { fontSizeScale, setFontSizeScale, fontSizeOptions, getScaledFontSize } = useFontSize();
  const { colors } = useTheme(); // ✅ theme

  const slideAnim = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleOptionSelect = (scale) => setFontSizeScale(scale);

  if (!visible) return null;

  const primaryColor = '#FFA500'; // ✅ orange accents

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Overlay */}
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        {/* Popup Content */}
        <Animated.View style={[styles.popup, { transform: [{ translateY: slideAnim }], backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={[styles.title, { fontSize: getScaledFontSize(20), color: colors.text }]}>Font Size</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary || colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollableContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.description, { fontSize: getScaledFontSize(14), color: colors.textSecondary || colors.text }]}>
              Choose your preferred text size for better readability
            </Text>

            <View style={styles.optionsContainer}>
              {fontSizeOptions.map(option => {
                const selected = fontSizeScale === option.scale;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.option,
                      { 
                        backgroundColor: selected ? primaryColor : colors.card, 
                        borderColor: selected ? primaryColor : 'transparent',
                      }
                    ]}
                    onPress={() => handleOptionSelect(option.scale)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionLeft}>
                        <View style={[styles.radioButton, { borderColor: selected ? primaryColor : colors.textSecondary }]}>
                          {selected && <View style={[styles.radioButtonInner, { backgroundColor: primaryColor }]} />}
                        </View>
                        <Text style={[styles.optionLabel, { fontSize: getScaledFontSize(16), color: selected ? '#fff' : colors.text }]}>
                          {option.label}
                        </Text>
                      </View>
                      <Text style={[styles.previewText, { fontSize: option.scale * 16, color: selected ? '#fff' : colors.textSecondary }]}>
                        Aa
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.previewContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.previewTitle, { fontSize: getScaledFontSize(16), color: colors.text }]}>Preview:</Text>
              <Text style={[styles.previewSample, { fontSize: getScaledFontSize(14), color: colors.text }]}>
                This is how text will appear in the app with your selected font size.
              </Text>
              <Text style={[styles.previewSample, { fontSize: getScaledFontSize(18), color: colors.text }]}>Safety Resources</Text>
              <Text style={[styles.previewSample, { fontSize: getScaledFontSize(12), color: colors.textSecondary }]}>Search something...</Text>
            </View>
          </ScrollView>

          {/* Done Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: primaryColor }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.doneButtonText, { fontSize: getScaledFontSize(16), color: '#fff' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  overlay: { position: 'absolute', top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)' },
  overlayTouchable: { flex:1 },
  popup: { borderTopLeftRadius:20, borderTopRightRadius:20, maxHeight: height*0.8, minHeight:450, flex:1 },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:20, paddingBottom:15, borderBottomWidth:1, borderBottomColor:'#f0f0f0' },
  scrollableContent: { flex:1 },
  scrollContentContainer: { padding:20, paddingBottom:10 },
  handle: { position:'absolute', top:8, left:'50%', marginLeft:-20, width:40, height:4, backgroundColor:'#ddd', borderRadius:2 },
  title: { fontWeight:'600', flex:1, textAlign:'center' },
  closeButton: { padding:4 },
  description: { marginBottom:25, textAlign:'center', lineHeight:20 },
  optionsContainer: { marginBottom:25 },
  option: { paddingVertical:15, paddingHorizontal:16, borderRadius:12, marginBottom:8, borderWidth:2 },
  optionContent: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  optionLeft: { flexDirection:'row', alignItems:'center', flex:1 },
  radioButton: { width:20, height:20, borderRadius:10, borderWidth:2, marginRight:12, alignItems:'center', justifyContent:'center' },
  radioButtonInner: { width:8, height:8, borderRadius:4 },
  optionLabel: { fontWeight:'500' },
  previewText: { fontWeight:'500' },
  previewContainer: { padding:16, borderRadius:12, borderWidth:1 },
  previewTitle: { fontWeight:'600', marginBottom:8 },
  previewSample: { lineHeight:20, marginBottom:4 },
  footer: { padding:20, paddingTop:10, borderTopWidth:1, borderTopColor:'#f0f0f0', backgroundColor:'transparent' },
  doneButton: { paddingVertical:16, paddingHorizontal:30, borderRadius:12, alignItems:'center', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.2, shadowRadius:4, elevation:3, width:'100%' },
  doneButtonText: { fontWeight:'600' },
});
