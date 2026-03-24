// services/feedDataService.js
import { generateId } from '../../utilities/helpers'

// Initial feed data - in production this would come from your backend
const initialFeedData = [
  {
    id: '1',
    name: 'Amahle Mdletshe',
    alertType: 'Fire Alert',
    coordinates: { latitude: -26.2041, longitude: 28.0473 },
    description: "There's a fire at UJ APK just behind student centre. Please avoid the area!",
    likes: 1013,
    comments: [
      { id: '1', name: 'Sarah Johnson', text: 'Stay safe everyone!', time: '5m ago' },
      { id: '2', name: 'Mike Chen', text: 'Thanks for the heads up', time: '3m ago' },
    ],
    liked: false,
    image: require('../images/fire.jpg'),
    avatar: require('../images/Kuhle.jpg'),
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: '2',
    name: 'Angel Kiana',
    alertType: 'Safety & Crime',
    coordinates: { latitude: -26.1951, longitude: 28.0568 },
    description: 'Someone just got their phone snatched, near Richmond Corner',
    likes: 67,
    comments: [
      { id: '1', name: 'John Doe', text: 'Did they report it to security?', time: '10m ago' },
    ],
    liked: false,
    image: require('../images/richmond.jpg'),
    avatar: require('../images/Cheyenne.jpg'),
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
  },
  {
    id: '3',
    name: 'Kemal Smith',
    alertType: 'Utility Issue',
    coordinates: { latitude: -29.8587, longitude: 31.0218 },
    description: 'Burst water pipe near UJ APB. Authorities notified.',
    likes: 321,
    comments: [],
    liked: false,
    video: require('../images/waterburst.mp4'),
    avatar: require('../images/kemal.jpg'),
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
];

class FeedDataService {
  constructor() {
    this.feedData = [...initialFeedData];
    this.listeners = [];
    this.reportedPosts = new Set(); // Track reported posts
  }

  // Subscribe to data changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of data changes
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.feedData));
  }

  // Get all feed items
  getFeedData() {
    return [...this.feedData];
  }

  // Add new post
  addPost(postData) {
    const newPost = {
      id: generateId(),
      ...postData,
      likes: 0,
      comments: [],
      liked: false,
      timestamp: new Date(),
    };
    
    this.feedData.unshift(newPost);
    this.notifyListeners();
    
    // In production, you would send this to your backend
    this.saveToBackend(newPost);
    
    return newPost;
  }

  // Update post (like, unlike)
  updatePost(postId, updates) {
    this.feedData = this.feedData.map(post =>
      post.id === postId ? { ...post, ...updates } : post
    );
    this.notifyListeners();
    
    // In production, sync with backend
    this.syncWithBackend(postId, updates);
  }

  // Add comment to post
  addComment(postId, comment) {
    const newComment = {
      id: generateId(),
      ...comment,
      timestamp: new Date(),
    };

    this.feedData = this.feedData.map(post =>
      post.id === postId 
        ? { ...post, comments: [...(post.comments || []), newComment] }
        : post
    );
    
    this.notifyListeners();
    
    // In production, sync with backend
    this.syncCommentWithBackend(postId, newComment);
    
    return newComment;
  }

  // Report post for inappropriate content
  reportPost(postId, reason = 'inappropriate_content') {
    try {
      // Add to reported posts set
      this.reportedPosts.add(postId);
      
      // In production, send report to backend for moderation
      this.sendReportToBackend(postId, reason);
      
      // console.log($&);
      
      return {
        success: true,
        message: 'Post has been reported and will be reviewed by our moderation team.'
      };
    } catch (error) {
      console.error('Error reporting post:', error);
      return {
        success: false,
        message: 'Failed to report post. Please try again.'
      };
    }
  }

  // Check if a post has been reported
  isPostReported(postId) {
    return this.reportedPosts.has(postId);
  }

  // Delete post (for moderation)
  deletePost(postId) {
    this.feedData = this.feedData.filter(post => post.id !== postId);
    this.reportedPosts.delete(postId); // Remove from reported posts
    this.notifyListeners();
    
    // In production, sync with backend
    this.deleteFromBackend(postId);
  }

  // Refresh data (for pull-to-refresh)
  async refreshData() {
    // In production, this would fetch fresh data from backend
    // For now, simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Reset to initial data (in production, this would be fresh backend data)
    this.feedData = [...initialFeedData];
    this.notifyListeners();
  }

  // Backend integration methods (implement these for your backend)
  async saveToBackend(post) {
    try {
      // Example: await api.post('/alerts', post);
      // console.log($&);
    } catch (error) {
      console.error('Error saving post to backend:', error);
    }
  }

  async syncWithBackend(postId, updates) {
    try {
      // Example: await api.patch(`/alerts/${postId}`, updates);
      // console.log($&);
    } catch (error) {
      console.error('Error syncing post with backend:', error);
    }
  }

  async syncCommentWithBackend(postId, comment) {
    try {
      // Example: await api.post(`/alerts/${postId}/comments`, comment);
      // console.log($&);
    } catch (error) {
      console.error('Error syncing comment with backend:', error);
    }
  }

  async deleteFromBackend(postId) {
    try {
      // Example: await api.delete(`/alerts/${postId}`);
      // console.log($&);
    } catch (error) {
      console.error('Error deleting post from backend:', error);
    }
  }

  async sendReportToBackend(postId, reason) {
    try {
      // Example: await api.post(`/alerts/${postId}/report`, { reason });
      // console.log($&);
    } catch (error) {
      console.error('Error sending report to backend:', error);
    }
  }
}

// Export singleton instance
export const feedDataService = new FeedDataService();
export default FeedDataService;