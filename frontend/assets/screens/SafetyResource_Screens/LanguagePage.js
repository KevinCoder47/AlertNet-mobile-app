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
  
  // State to track the temporarily selected language (before saving)
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  // State for the search input
  const [searchQuery, setSearchQuery] = useState('');

  // Get current translations
  const t = translations[currentLanguage] || translations['English'];

  // Filter languages based on search query
  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle save button press
  const handleSave = () => {
    if (selectedLanguage !== currentLanguage) {
      setCurrentLanguage(selectedLanguage);
      
      // Get translation for success message in the newly selected language
      const newLangTranslations = translations[selectedLanguage] || translations['English'];
      
      Alert.alert(
        'Success',
        newLangTranslations.languageChanged,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to safety resources
              setIsLanguagePage(false);
              setIsSafetyResources(true);
            }
          }
        ]
      );
    } else {
      // If no change, just go back
      setIsLanguagePage(false);
      setIsSafetyResources(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setIsLanguagePage(false)
            setIsSafetyResources(true)
          }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.language}</Text>
      </View>

      {/* --- Search Bar --- */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t.search}
          placeholderTextColor="#999"
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
              style={[styles.languageItem, isSelected && styles.selectedItem]}
              onPress={() => setSelectedLanguage(lang.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.langCode, isSelected && styles.selectedLangCode]}>
                {lang.code}
              </Text>
              <View style={styles.langTextContainer}>
                <Text style={[styles.langName, isSelected && styles.selectedLangName]}>
                  {lang.name}
                </Text>
                <Text style={styles.langNative}>{lang.native}</Text>
              </View>
              <View style={[styles.radioCircle, isSelected && styles.selectedRadioCircle]}>
                {isSelected && <View style={styles.radioDot} />}
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
            selectedLanguage !== currentLanguage && styles.saveButtonActive
          ]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.saveButtonText,
            selectedLanguage !== currentLanguage && styles.saveButtonTextActive
          ]}>
            {t.save}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- Styles ---
// Identical to original with small additions for active save button
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  backArrow: {
    fontSize: 28,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
    marginRight: 28, // Balance the back arrow space
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for the floating save button
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  selectedItem: {
    backgroundColor: '#fdebe9',
    borderColor: '#e74c3c',
    borderWidth: 1.5,
  },
  langCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    width: 40,
  },
  selectedLangCode: {
    color: '#e74c3c',
  },
  langTextContainer: {
    flex: 1,
  },
  langName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedLangName: {
    color: '#e74c3c',
  },
  langNative: {
    fontSize: 14,
    color: '#888',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioCircle: {
    borderColor: '#e74c3c',
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e74c3c',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#fdebe9',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonActive: {
    backgroundColor: '#e74c3c',
  },
  saveButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonTextActive: {
    color: '#fff',
  },
});

export default LanguagePage;

// Example usage in your main App component:
/*
import { LanguageProvider } from './LanguagePage';

export default function App() {
  return (
    <LanguageProvider>
      <YourAppContent />
    </LanguageProvider>
  );
}
*/