// components/CommentModal.js
import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ColorContext'; // Add this import

const CommentModal = ({ visible, onClose, post, onAddComment }) => {
  const { colors } = useTheme();
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (commentText.trim()) {
      const newComment = {
        id: Date.now().toString(),
        name: 'You',
        text: commentText.trim(),
        time: 'now',
      };
      onAddComment(post.id, newComment);
      setCommentText('');
    }
  };

  const CommentItem = ({ comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        <Ionicons name="person-circle" size={32} color={colors.iconSecondary} />
      </View>
      <View style={styles.commentContent}>
        <View style={[styles.commentBubble, { backgroundColor: colors.surface }]}>
          <Text style={[styles.commentName, { color: colors.text }]}>{comment.name}</Text>
          <Text style={[styles.commentText, { color: colors.text }]}>{comment.text}</Text>
        </View>
        <Text style={[styles.commentTime, { color: colors.textSecondary }]}>{comment.time}</Text>
      </View>
    </View>
  );

  const EmptyComments = () => (
    <View style={styles.noCommentsContainer}>
      <Ionicons name="chatbubble-outline" size={48} color={colors.iconSecondary} />
      <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>No comments yet</Text>
      <Text style={[styles.noCommentsSubtext, { color: colors.textTertiary }]}>Be the first to comment</Text>
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
          <Text style={[styles.commentHeaderTitle, { color: colors.text }]}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
          {post?.comments?.length > 0 ? (
            post.comments.map((comment) => (
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