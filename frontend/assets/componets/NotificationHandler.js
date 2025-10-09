import React, { useEffect } from 'react';
import { Modal } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '../contexts/NotificationContext';
import WalkRequest from './notifications/WalkRequest';

const NotificationHandler = () => {
  const {
    currentWalkRequest,
    isNotificationVisible,
    acceptWalkRequest,
    declineWalkRequest,
    setIsNotificationVisible,
    setCurrentWalkRequest,
  } = useNotifications();

  useEffect(() => {
    // Handle notifications when app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data?.walkRequest) {
        setCurrentWalkRequest(data.walkRequest);
        setIsNotificationVisible(true);
      }
    });

    // Handle notification taps
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.walkRequest) {
        setCurrentWalkRequest(data.walkRequest);
        setIsNotificationVisible(true);
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  if (!currentWalkRequest) return null;

  return (
    <Modal
      visible={isNotificationVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={declineWalkRequest}
    >
      <WalkRequest
        walkData={currentWalkRequest}
        onAccept={acceptWalkRequest}
        onDecline={declineWalkRequest}
      />
    </Modal>
  );
};

export default NotificationHandler;