import { StyleSheet, Text, View, Dimensions, Image, TouchableOpacity } from 'react-native';
import React from 'react'
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SelectWalker = ({ partner, onConfirm, onSwipe, onClose }) => {
  return (
      <View style={styles.container}>
          {/* [user name and bio] and rating */}
          <View style = {styles.headerRow}>
              {/* name and bio */}
              <View style={styles.nameBioContainer}>
                  <View style={styles.nameContainer}>
                      <Text style={styles.name}>{partner?.name ?? 'Mpilonhle Radebe'}</Text>
                      <Image source = {require('../icons/checkmark.png')} style = {styles.checkmark} />
                  </View>
                  <Text style = {styles.bio}>{partner?.bio ?? "I walk to campus daily from Horizon. let's walk together."}</Text>
              </View>

              {/* rating */}
              <View style = {styles.ratingContainer}>
                  <Ionicons name='star' size={20} />
                  <View style={styles.ratingTextContainer}>
                      <Text style={styles.rating}>{partner?.rating ?? '4.8'}</Text>
                      <Text style = {styles.reviews}>{partner?.reviews ? `${partner.reviews} reviews` : '13 reviews'}</Text>
                  </View>
              </View>
          </View>
          
          {/* availability and gender */}
          <View style = {styles.tagsRow}>
              {/* availability  */}
              <View style = {styles.availability}>
                  <Text style = {styles.btnText}>{partner?.availability ?? 'Available Now'}</Text>
              </View>

              {/* gender */}
              <View
                style={[
                  styles.gender,
                  { backgroundColor: partner?.gender?.toLowerCase() === 'female' ? '#E7A8B8' : '#7CA3DA' }
                ]}
              >
                  <Text style = {styles.btnText}>{partner?.gender ?? 'Male'}</Text>
              </View>
          </View>

          {/* number of walk and university level  */}
          <View style={styles.statsRow}>
              {/* walks */}
              <View style={styles.statItem}>
                  <Text style = {styles.numbers}>{partner?.walks ?? '13'}</Text>
                  <Text style = {styles.numbersText}>Walks</Text>
              </View>

              {/* level */}
              <View style={styles.statItem}>
                  <Text style={styles.numbers}>{partner?.year ?? '3rd'}</Text>
                  <Text style={styles.numbersText}>Year</Text>
              </View>
          </View>

          {/* swipe up for next and confirm button  */}
          <View style={styles.bottomSection}>
              {/* swipe view - now centered */}
              <TouchableOpacity style = {styles.swipeContainer} onPress={onSwipe}>
                <View style={{ alignItems: 'center' }}>
                <Ionicons name='chevron-up-outline' color={'black'} size={10}/>
                <Ionicons name='chevron-up-outline' color={'#8D8D8D'} size={10} style={{ marginTop: -5 }} />
                <Text style={styles.swipeText}>swipe to next</Text>
                </View>
              </TouchableOpacity>

              {/* confirm button */}
              <TouchableOpacity style = {styles.confirmBtn} onPress={onConfirm}>
                  <Ionicons name='chevron-forward-outline' color={'white'} size={20}/>
              </TouchableOpacity>
          </View>
    </View>
  )
}

export default SelectWalker

const styles = StyleSheet.create({
    container: {
        width: width * 0.98,
        height: height * 0.4,
        borderRadius: 47,
        backgroundColor: 'white',
        padding: 25,
        borderWidth: 0.2,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row', 
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    nameBioContainer: {
        flex: 1,
        marginRight: 10,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    name: {
        fontSize: 35,
        fontWeight: '400',
    },
    checkmark: {
        width: 15,
        height: 15,
        marginLeft: -35,
        marginBottom: 6,
    },
    bio: {
        fontSize: 12,
        marginTop: 8,
        opacity: 0.8,
        lineHeight: 16,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center', 
        gap: 8,
    },
    ratingTextContainer: {
        alignItems: 'flex-start',
    },
    rating: {
        fontSize: 35,
        fontWeight: '600'
    },
    reviews: {
        fontSize: 12,
        marginTop: 4,
    },
    tagsRow: {
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: 24, 
        gap: 12
    },
    availability: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 0.3,
        borderColor: 'black'
    },
    btnText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 10,
        textAlign: 'center',
    },
    gender: {
        backgroundColor: '#7CA3DA',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 0.3,
        borderColor: 'black'
    },
    statsRow: {
        flexDirection: 'row', 
        marginTop: 24, 
        gap: 32
    },
    statItem: {
        alignItems: 'flex-start'
    },
    numbers: {
        fontSize: 35,
    },
    numbersText: {
        fontSize: 13,
        fontWeight: '300',
        marginTop: 4,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 25,
        left: 25,
        right: 25,
        flexDirection: 'row',
        alignItems: 'center',
    },
    swipeContainer: {
        alignItems: 'center',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    swipeText: {
        fontSize: 8,
        fontWeight: '200',
        marginTop: 4,
    },
    confirmBtn: {
        backgroundColor: '#000',
        width: 65,
        height: 65,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
    }
})