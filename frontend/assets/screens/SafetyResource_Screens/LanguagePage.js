import React, { useState, useContext, createContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFontSize } from '../../contexts/FontSizeContext';
import { useTheme } from '../../contexts/ColorContext'; // ✅ import theme

// Language Context for app-wide language state
const LanguageContext = createContext();

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('English');
  
  return (
    <LanguageContext.Provider value={{ currentLanguage, setCurrentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translations object - you can expand this with actual translations
const translations = {
  English: {
    language: 'Language',
    search: 'Search...',
    save: 'Save',
    languageChanged: 'Language changed successfully!',
  },
  IsiZulu: {
    language: 'Ulimi',
    search: 'Sesha...',
    save: 'Gcina',
    languageChanged: 'Ulimi lushintshelwe ngempumelelo!',
  },
  Afrikaans: {
    language: 'Taal',
    search: 'Soek...',
    save: 'Stoor',
    languageChanged: 'Taal suksesvol verander!',
  },
  IsiPedi: {
    language: 'Polelo',
    search: 'Nyaka...',
    save: 'Boloka',
    languageChanged: 'Polelo e fetošitšwe ka katlego!',
  },
  Mandarin: {
    language: '语言',
    search: '搜索...',
    save: '保存',
    languageChanged: '语言更改成功！',
  },
  Español: {
    language: 'Idioma',
    search: 'Buscar...',
    save: 'Guardar',
    languageChanged: '¡Idioma cambiado exitosamente!',
  },
  Français: {
    language: 'Langue',
    search: 'Rechercher...',
    save: 'Enregistrer',
    languageChanged: 'Langue changée avec succès!',
  },
  Deutsch: {
    language: 'Sprache',
    search: 'Suchen...',
    save: 'Speichern',
    languageChanged: 'Sprache erfolgreich geändert!',
  },
  Português: {
    language: 'Idioma',
    search: 'Pesquisar...',
    save: 'Salvar',
    languageChanged: 'Idioma alterado com sucesso!',
  },
};

// --- Data for the language list ---
const languages = [
  { code: 'UK', name: 'English', native: 'English' },
  { code: 'ZA', name: 'IsiZulu', native: 'Zulu' },
  { code: 'ZA', name: 'Afrikaans', native: 'Afrikaner' },
  { code: 'ZA', name: 'IsiPedi', native: 'Pedi' },
  { code: 'CH', name: 'Mandarin', native: 'Chinese' },
  { code: 'SP', name: 'Español', native: 'Spanish' },
  { code: 'FR', name: 'Français', native: 'French' },
  { code: 'GE', name: 'Deutsch', native: 'German' },
  { code: 'PO', name: 'Português', native: 'Portuguese' },
];

const LanguagePage = ({setIsLanguagePage, setIsSafetyResources}) => {
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const { getScaledFontSize } = useFontSize();
  const { colors } = useTheme(); // ✅ grab theme colors
  
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [searchQuery, setSearchQuery] = useState('');

  const t = translations[currentLanguage] || translations['English'];

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    if (selectedLanguage !== currentLanguage) {
      setCurrentLanguage(selectedLanguage);
      const newLangTranslations = translations[selectedLanguage] || translations['English'];

      Alert.alert(
        'Success',
        newLangTranslations.languageChanged,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsLanguagePage(false);
              setIsSafetyResources(true);
            }
          }
        ]
      );
    } else {
      setIsLanguagePage(false);
      setIsSafetyResources(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setIsLanguagePage(false)
            setIsSafetyResources(true)
          }}
        >
          <Text style={[styles.backArrow, { color: colors.text, fontSize: getScaledFontSize(28) }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: getScaledFontSize(20) }]}>
          {t.language}
        </Text>
      </View>

      {/* --- Search Bar --- */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.searchIcon, { fontSize: getScaledFontSize(18), color: colors.text }]}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { fontSize: getScaledFontSize(16), color: colors.text }]}
          placeholder={t.search}
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* --- Language List --- */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredLanguages.map((lang, index) => {
          const isSelected = lang.name === selectedLanguage;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.languageItem,
                { backgroundColor: colors.card },
                isSelected && { backgroundColor: colors.surface, borderColor: '#e74c3c', borderWidth: 1.5 },
              ]}
              onPress={() => setSelectedLanguage(lang.name)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.langCode, 
                { color: isSelected ? '#e74c3c' : colors.text, fontSize: getScaledFontSize(16) }
              ]}>
                {lang.code}
              </Text>
              <View style={styles.langTextContainer}>
                <Text style={[
                  styles.langName, 
                  { color: isSelected ? '#e74c3c' : colors.text, fontSize: getScaledFontSize(16) }
                ]}>
                  {lang.name}
                </Text>
                <Text style={[styles.langNative, { color: colors.muted, fontSize: getScaledFontSize(14) }]}>
                  {lang.native}
                </Text>
              </View>
              <View style={[
                styles.radioCircle,
                { borderColor: isSelected ? '#e74c3c' : colors.border, backgroundColor: colors.card }
              ]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: '#e74c3c' }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* --- Save Button --- */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            { backgroundColor: selectedLanguage !== currentLanguage ? '#e74c3c' : colors.surface }
          ]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.saveButtonText,
            { 
              color: selectedLanguage !== currentLanguage ? '#fff' : '#e74c3c',
              fontSize: getScaledFontSize(16) 
            }
          ]}>
            {t.save}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  backArrow: {
    color: '#333',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
    marginRight: 28, // Balance the back arrow space
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for the floating save button
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  langCode: {
    fontWeight: 'bold',
    width: 40,
  },
  langTextContainer: {
    flex: 1,
  },
  langName: {
    fontWeight: 'bold',
  },
  langNative: {},
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  saveButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    fontWeight: 'bold',
  },
});

export default LanguagePage;
