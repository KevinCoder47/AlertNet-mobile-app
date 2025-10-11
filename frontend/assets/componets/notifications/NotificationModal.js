import React from 'react';
import { Modal, View } from 'react-native';
import { useNotifications } from '../../contexts/NotificationContext';
import WalkRequest from './WalkRequest';
import AcceptanceLoader from '../Loaders/AcceptanceLoader'

const NotificationModal = () => {
  const {
    currentWalkRequest,
    isNotificationVisible,
    acceptWalkRequest,
    declineWalkRequest,
    setIsNotificationVisible,
    acceptanceLoading,
    setAcceptanceLoading
  } = useNotifications();

  console.log("🔍 NOTIFICATION MODAL STATE:", {
    isNotificationVisible,
    hasWalkRequest: !!currentWalkRequest,
    acceptanceLoading
  });

  console.log('🔍 DEBUG - NotificationModal State:', {
    isNotificationVisible,
    hasWalkRequest: !!currentWalkRequest,
    acceptanceLoading
  });

  if (!currentWalkRequest) {
    return null;
  }

  return (
    <Modal
      visible={isNotificationVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        // Only close if not in loading state, otherwise ignore
        if (!acceptanceLoading) {
          setIsNotificationVisible(false);
          setAcceptanceLoading(false);
        }
        // If loading, don't allow close - user must wait
      }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        {/* Show AcceptanceLoader when loading, otherwise show WalkRequest */}
        {acceptanceLoading ? (
          <AcceptanceLoader 
            partnerName={currentWalkRequest.partnerName}
            meetupPoint={currentWalkRequest.meetupPoint}
          />
        ) : (
          <WalkRequest
            walkData={currentWalkRequest}
            onAccept={acceptWalkRequest}
            onDecline={declineWalkRequest}
            acceptanceLoading={acceptanceLoading} 
          />
        )}
      </View>
    </Modal>
  );
};

export default NotificationModal;