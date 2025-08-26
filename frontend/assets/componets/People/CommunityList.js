import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const initialData = [
  {
    id: '1',
    name: 'City of Johannesburg EMS',
    message:
      'Public, Information, Education & Relations Officers (PIER) were in Orlando Industrial Business Park for awareness...',
    logo: require('../../images/ems.png'),
    status: 'online',
  },
  {
    id: '2',
    name: 'University of Johannesburg',
    message:
      'Survey: Undergraduate Students’ Views on Hubbly Bubbly Use. Kindly participate by completing this quick form...',
    logo: require('../../images/uj.png'),
    status: 'online',
  },
  {
    id: '3',
    name: 'Halen Joseph Hospital',
    message:
      'Do you have any service complaints or compliments? Here’s how to do it quickly online or by phone...',
    logo: require('../../images/hospital.jpg'),
    status: 'online',
  },
  {
    id: '4',
    name: 'UJ APK Campus',
    message:
      'The USSRC & @ujinternalleague presents the SRC Soccer Cup ⚽ happening this Saturday. Come support your faculty!',
    logo: require('../../images/ujapk.jpg'),
    status: 'online',
  },
];

export default function CommunityList() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(initialData);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      // Simulate data refresh
      setData([...initialData]); // You can update with new data here
      setRefreshing(false);
    }, 1500);
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity key={item.id} style={styles.row}>
      <Image source={item.logo} style={styles.logo} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{item.name}</Text>
        <Text numberOfLines={2} style={styles.message}>{item.message}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={isDark ? '#ccc' : '#444'} />
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.container}
    />
  );
}

const getStyles = (isDark) =>
  StyleSheet.create({
    container: {
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 0.4,
      borderColor: isDark ? '#444' : '#ddd',
    },
    logo: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
    },
    textBlock: {
      flex: 1,
    },
    title: {
      color: isDark ? '#fff' : '#111',
      fontWeight: '600',
      fontSize: 14,
      marginBottom: 2,
    },
    message: {
      color: isDark ? '#aaa' : '#555',
      fontSize: 12,
    },
  });
