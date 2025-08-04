import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  ActivityIndicator, // Import ActivityIndicator for a loading spinner
} from 'react-native';

// --- IMPORTANT: Paste your YouTube API Key here ---
const YOUTUBE_API_KEY = 'AIzaSyCe98TpaYgAWEeZhNFBd-6Sg7U3Ig4XnDU'; 

// --- The initial data is now much simpler. We only need the videoId and category. ---
const initialVideoData = [
  { category: 'Active Shooter Response', videoId: 'O-Wlf5jh34U' },
  { category: 'Basic First Aid', videoId: '5OKFljZ2GQE' },
  { category: 'CPR (Cardiopulmonary Resuscitation)', videoId: 'y52c9ebL-Wo' },
  { category: 'Domestic Violence', videoId: 'gWRcdOybOCE' },
  { category: 'Earthquake Preparedness', videoId: 'MllUVQM3KVk' },
  { category: 'Fire Safety & Evacuation', videoId: 'Xgc90CoJbDI' },
];

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const SafetyVideos = ({ setIsSafetyVideos, setIsSafetyResources }) => {
  // State to hold the full video details once fetched
  const [fetchedVideos, setFetchedVideos] = useState([]);
  // State to manage the loading status
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      // Create a comma-separated string of all video IDs for an efficient, single API call
      const videoIds = initialVideoData.map(v => v.videoId).join(',');
      
      // Construct the API URL. We ask for 'snippet' (title, channel) and 'statistics' (view count)
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;

      try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.items) {
          // Map the API response back to our original structure
          const detailedVideos = initialVideoData.map(initialVideo => {
            const apiDetails = data.items.find(item => item.id === initialVideo.videoId);
            if (apiDetails) {
              return {
                ...initialVideo,
                video: {
                  title: apiDetails.snippet.title,
                  channel: apiDetails.snippet.channelTitle,
                  // Format view count to be more readable
                  views: `${Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(apiDetails.statistics.viewCount)} views`,
                  videoId: initialVideo.videoId,
                },
              };
            }
            return initialVideo; // Fallback in case a video isn't found
          });
          setFetchedVideos(detailedVideos);
        }
      } catch (error) {
        console.error("Failed to fetch video details:", error);
        Alert.alert("Error", "Could not load video details. Please check your connection.");
      } finally {
        setIsLoading(false); // Stop loading, whether successful or not
      }
    };

    fetchVideoDetails();
  }, []); // The empty array [] ensures this effect runs only once when the component mounts

  const handleVideoSelect = async (videoId) => {
    const youtubeURL = `https://www.youtube.com/watch?v=${videoId}`;
    const supported = await Linking.canOpenURL(youtubeURL);
    if (supported) {
      await Linking.openURL(youtubeURL);
    } else {
      Alert.alert(`Don't know how to open this URL: ${youtubeURL}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setIsSafetyVideos(false); setIsSafetyResources(true); }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Videos</Text>
      </View>

      <View style={styles.mainContent}>
        {isLoading ? (
          // Show a loading spinner in the center while fetching data
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#d9534f" />
          </View>
        ) : (
          // Once loaded, show the video list
          <>
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {fetchedVideos.map((item, index) => (
                <View key={index} style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>{item.category}</Text>
                  <TouchableOpacity onPress={() => handleVideoSelect(item.video.videoId)}>
                    <View style={styles.videoCard}>
                      <Image
                        source={{ uri: `https://img.youtube.com/vi/${item.video.videoId}/hqdefault.jpg` }}
                        style={styles.thumbnail}
                      />
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

            <View style={styles.alphabetSidebar}>
              {alphabet.map((letter) => (
                <Text key={letter} style={styles.alphabetLetter}>{letter}</Text>
              ))}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backArrow: { fontSize: 28, color: '#333', marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  mainContent: { flex: 1, flexDirection: 'row' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 20 },
  categoryContainer: { marginBottom: 25 },
  categoryTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  videoCard: { flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: 120, height: 80, backgroundColor: '#e0e0e0', borderRadius: 15, marginRight: 15 },
  videoInfo: { flex: 1 },
  videoTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  videoChannel: { fontSize: 13, color: '#888', marginBottom: 2 },
  videoViews: { fontSize: 13, color: '#888' },
  alphabetSidebar: { width: 30, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  alphabetLetter: { fontSize: 11, color: '#d9534f', fontWeight: 'bold', marginBottom: 3 },
});

export default SafetyVideos;