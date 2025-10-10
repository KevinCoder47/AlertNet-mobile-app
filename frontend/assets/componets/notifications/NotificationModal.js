import React from 'react';
import { Modal, View } from 'react-native';
import { useNotifications } from '../../contexts/NotificationContext';
import WalkRequest from './WalkRequest';

const NotificationModal = () => {
  const {
    currentWalkRequest,
    isNotificationVisible,
    acceptWalkRequest,
    declineWalkRequest,
    setIsNotificationVisible
  } = useNotifications();

  console.log('🎪 NotificationModal rendered - State:', {
    isNotificationVisible,
    hasWalkRequest: !!currentWalkRequest,
    walkRequest: currentWalkRequest
  });

  if (!currentWalkRequest) {
    console.log('🎪 No currentWalkRequest - returning null');
    return null;
  }

  console.log('🎪 Rendering Modal with walk request:', currentWalkRequest);

  return (
    <Modal
      visible={isNotificationVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        console.log('🎪 Modal closed via back button');
        setIsNotificationVisible(false);
      }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <WalkRequest
          walkData={currentWalkRequest}
          onAccept={() => {
            console.log('🎪 Accept button pressed');
            acceptWalkRequest();
          }}
          onDecline={() => {
            console.log('🎪 Decline button pressed');
            declineWalkRequest();
          }}
        />
      </View>
    </Modal>
  );
};

export default NotificationModal;