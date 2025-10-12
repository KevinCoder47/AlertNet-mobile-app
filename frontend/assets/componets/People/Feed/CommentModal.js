// components/CommentModal.js - UPDATED WITH FIREBASE
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ColorContext';
import { AlertFeedService } from '../../../services/alertFeedService';

const CommentModal = ({ visible, onClose, post, onAddComment }) => {
  const { colors } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState(null);

  // Setup real-time listener for comments when modal opens
  useEffect(() => {
    if (visible && post?.id) {
      setLoading(true);
      
      // Setup real-time listener
      const unsubscribeFn = AlertFeedService.listenToComments(
        post.id,
        (result) => {
          if (result.success) {
            setComments(result.comments);
            setLoading(false);
          } else {
            console.error('Error loading comments:', result.error);
            setLoading(false);
          }
        }
      );
      
      setUnsubscribe(() => unsubscribeFn);
    }

    // Cleanup listener when modal closes
    return () => {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
    };
  }, [visible, post?.id]);

  const handleAddComment = () => {
    if (commentText.trim() && post?.id) {
      // Call parent handler which will use Firebase
      onAddComment(post.id, { text: commentText.trim() });
      setCommentText('');
    }
  };

  const CommentItem = ({ comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        {comment.userAvatar ? (
          <Image 
            source={{ uri: comment.userAvatar }} 
            style={styles.avatarImage}
          />
        ) : (
          <Ionicons name="person-circle" size={32} color={colors.iconSecondary} />
        )}
      </View>
      <View style={styles.commentContent}>
        <View style={[styles.commentBubble, { backgroundColor: colors.surface }]}>
          <Text style={[styles.commentName, { color: colors.text }]}>
            {comment.userName || comment.name || 'User'}
          </Text>
          <Text style={[styles.commentText, { color: colors.text }]}>
            {comment.text}
          </Text>
        </View>
        <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
          {comment.time}
        </Text>
      </View>
    </View>
  );

  const EmptyComments = () => (
    <View style={styles.noCommentsContainer}>
      <Ionicons name="chatbubble-outline" size={48} color={colors.iconSecondary} />
      <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
        No comments yet
      </Text>
      <Text style={[styles.noCommentsSubtext, { color: colors.textTertiary }]}>
        Be the first to comment
      </Text>
    </View>
  );

  const LoadingComments = () => (
    <View style={styles.noCommentsContainer}>
      <ActivityIndicator size="large" color="#ff5621" />
      <Text style={[styles.noCommentsText, { color: colors.textSecondary, marginTop: 16 }]}>
        Loading comments...
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.commentModalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.commentHeader, { borderBottomColor: colors.separator }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.iconPrimary} />
          </TouchableOpacity>
          <Text style={[styles.commentHeaderTitle, { color: colors.text }]}>
            Comments {comments.length > 0 ? `(${comments.length})` : ''}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
          {loading ? (
            <LoadingComments />
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          ) : (
            <EmptyComments />
          )}
        </ScrollView>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.commentInputContainer, { 
            borderTopColor: colors.separator,
            backgroundColor: colors.background 
          }]}
        >
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                }
              ]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.placeholder}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !commentText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!commentText.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={commentText.trim() ? '#ff5621' : colors.iconSecondary} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  commentModalContainer: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    marginRight: 12,
    marginTop: 4,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  commentName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 11,
    marginLeft: 12,
  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noCommentsText: {
    fontSize: 16,
    marginTop: 12,
  },
  noCommentsSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  commentInputContainer: {
    borderTopWidth: 1,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CommentModal;