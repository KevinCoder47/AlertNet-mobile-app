import React from 'react';
import { Modal, View } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';
import WalkRequest from './notifications/WalkRequest';

const NotificationHandler = () => {
  const {
    currentWalkRequest,
    isNotificationVisible,
    acceptWalkRequest,
    declineWalkRequest,
    setIsNotificationVisible
  } = useNotifications();

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