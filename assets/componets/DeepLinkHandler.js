import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

const DeepLinkHandler = () => {
  const { 
    setIsNotificationVisible, 
    setCurrentWalkRequest,
    handleIncomingWalkRequest 
  } = useNotifications();

  useEffect(() => {
    const handleDeepLink = (url) => {
      console.log('🔗 Deep link received:', url);
      
      if (url.includes('walk-request')) {
        console.log('🔗 Processing walk request deep link');
        
        // Parse URL parameters if needed
        const urlParams = new URL(url);
        const requestId = urlParams.searchParams.get('requestId');
        
        console.log('🔗 Request ID from URL:', requestId);
        
        // For now, just show the notification modal
        // You can fetch the actual walk request data here if needed
        setIsNotificationVisible(true);
      }
    };

    // Handle URL when app is opened from closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 App opened with URL:', url);
        handleDeepLink(url);
      }
    });

    // Handle URL when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 URL event received:', url);
      handleDeepLink(url);
    });

    return () => {
      subscription?.remove();
    };
  }, [setIsNotificationVisible, setCurrentWalkRequest]);

  return null;
};

export default DeepLinkHandler;