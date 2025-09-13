import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import React from 'react'
import { useTheme } from '../contexts/ColorContext'
import { Ionicons } from '@expo/vector-icons'

const {width} = Dimensions.get("window")
const SavedLocation = ({
  LocationType,
  LocationName,
  address,
  isSavedLocationAvailable,
  onPress,
  onLongPress
}) => {
    const { colors, isDark } = useTheme();

    if (!isSavedLocationAvailable) {
      return (
        <TouchableOpacity 
          onPress={onPress}
            style={[styles.container, { 
                borderColor: isDark ? "#4F4F4F" : "#E2DFDF",
              backgroundColor: isDark ? colors.background : '#FFF',
              borderStyle: 'dashed',
              paddingHorizontal: width * 0.02,
              flexDirection: 'row',
              alignItems: 'center',
            }]}
        >
                <View style={[styles.iconContainer, { 
                    backgroundColor: isDark ? "#313131" : "#F2F2F2" 
                }]}>
            <Ionicons 
              name='add-outline'
                        color={isDark 
                            ? "#FFF" 
                            : "#000"}
                        size={20}

                    />
          </View>
          
          <Text style={[styles.locationName, { color: colors.secondary, marginLeft: 10 }]}>
            Add {LocationType}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        
            style={[styles.container, { 
                borderColor: isDark ? "#4F4F4F" : "#E2DFDF",
              backgroundColor: isDark ? colors.background : '#FFF', // Added background color for better visibility
                justifyContent: 'center',
        }]}
        onPress={onPress}
        onLongPress={onLongPress}
        >
            <View style={styles.contentContainer}>
                {/* Icon Container */}
                <View style={[styles.iconContainer, { 
                    backgroundColor: isDark ? "#313131" : "#F2F2F2" 
                }]}>
                    <Image 
                        source={isDark 
                            ? require('../icons/clock-dark.png') 
                            : require('../icons/clock-light.png')}
                        style={styles.icon}
                    />
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={[styles.locationName, { color: colors.text }]}>
                        {LocationType}
                        {/* - {LocationName} */}
                    </Text>
                    <Text 
                        style={[styles.address, { color: colors.text }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {address}
                    </Text>
                </View>

                {/* Chevron Icon */}
                <ChevronRight
                    color={colors.text}
                    size={20}
                    style={styles.chevron}
                />
            </View>
        </TouchableOpacity>
    )
}

export default SavedLocation

const styles = StyleSheet.create({
    container: {
        width: width * 0.86,
        height: 80,
        borderRadius: 10,
        borderWidth: 1,
        
    },
    contentContainer: {
        flexDirection: "row",
        alignItems: 'center',
        paddingHorizontal: width * 0.02,
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center"
    },
    icon: {
        width: 25,
        height: 25
    },
    textContainer: {
        flex: 1,
        marginLeft: 10,
        gap: 4
    },
    locationName: {
        fontFamily: "Helvetica",
        fontSize: 15,
        fontWeight: "900",
    },
    address: {
        fontFamily: "Helvetica",
        fontSize: width * 0.037,
        fontWeight: "400",
        width: '90%' // Better control over text truncation
    },
    chevron: {
        marginLeft: 'auto'
    }
})