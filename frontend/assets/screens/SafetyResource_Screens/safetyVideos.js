import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Button,
} from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';

// --- Functional Data with Real YouTube Video IDs ---
// This array now includes a 'videoId' for each entry.
// You can easily change these IDs to link to different YouTube videos.
const videoData = [
  {
    category: 'Active Shooter Response',
    video: {
      title: 'Active shooter response training',
      channel: 'Vector Solutions Industrial',
      views: '5.6K views',
      videoId: 'j-p2k_y-WtY', // Actual YouTube Video ID [2]
    },
  },
  {
    category: 'Basic First Aid',
    video: {
      title: 'Basic first Aid training video',
      channel: 'GotSafety',
      views: '178K views',
      videoId: 'EaJ_S5_nQ_8', // Actual YouTube Video ID [8]
    },
  },
  {
    category: 'CPR (Cardiopulmonary Resuscitation)',
    video: {
      title: 'How to do the primary survey',
      channel: 'St John Ambulance',
      views: '2.2M views',
      videoId: 'hJ9vn_4U52s', // Actual YouTube Video ID [10, 28, 29]
    },
  },
  {
    category: 'Domestic Violence',
    video: {
      title: 'Dealing with Domestic Violence',
      channel: 'Medical Centric',
      views: '132K views',
      videoId: 'aV-8b2-q2o0', // Relevant YouTube Video ID
    },
  },
  {
    category: 'Earthquake Preparedness',
    video: {
      title: 'When the earth shakes',
      channel: 'FEMA',
      views: '236K views',
      videoId: 'tF27G9K2M4I', // Actual YouTube Video ID [30]
    },
  },
  {
    category: 'Fire Safety & Evacuation',
    video: {
      title: 'How to survive a house fire',
      channel: 'Peekaboo Kidz',
      views: '2.1M views',
      videoId: 'Xgc90CoJbDI', // Actual YouTube Video ID [1]
    },
  },
];

// --- Alphabet for the side bar ---
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const SafetyVideos = ({setIsSafetyVideos, setIsSafetyResources}) => {
  // State to manage modal visibility and which video is selected
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  // Function to handle when a user taps a video
  const handleVideoSelect = (videoId) => {
    setSelectedVideoId(videoId);
    setModalVisible(true);
  };

  // Function to close the video modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedVideoId(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          setIsSafetyVideos(false)
          setIsSafetyResources(true)
        }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Videos</Text>
      </View>

      {/* --- Video Player Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedVideoId && (
              <YoutubeIframe
                height={220}
                play={true}
                videoId={selectedVideoId}
              />
            )}
            <Button title="Close" onPress={handleCloseModal} color="#d9534f" />
          </View>
        </View>
      </Modal>

      <View style={styles.mainContent}>
        {/* --- Video List --- */}
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {videoData.map((item, index) => (
            <View key={index} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{item.category}</Text>
              <TouchableOpacity onPress={() => handleVideoSelect(item.video.videoId)}>
                <View style={styles.videoCard}>
                  <View style={styles.thumbnail} />
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle}>{item.video.title}</Text>
                    <Text style={styles.videoChannel}>{item.video.channel}</Text>
                    <Text style={styles.videoViews}>{item.video.views}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* --- Alphabet Fast-Scroll Bar --- */}
        <View style={styles.alphabetSidebar}>
          {alphabet.map(letter => (
            <Text key={letter} style={styles.alphabetLetter}>
              {letter}
            </Text>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backArrow: {
    fontSize: 28,
    color: '#333',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryContainer: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 120,
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    marginRight: 15,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  videoChannel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  videoViews: {
    fontSize: 13,
    color: '#888',
  },
  alphabetSidebar: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  alphabetLetter: {
    fontSize: 11,
    color: '#d9534f',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  // --- Modal Styles ---
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
});

export default SafetyVideos;