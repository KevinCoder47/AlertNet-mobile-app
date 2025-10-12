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
      // console.log($&);
      
      if (url.includes('walk-request')) {
        // console.log($&);
        
        // Parse URL parameters if needed
        const urlParams = new URL(url);
        const requestId = urlParams.searchParams.get('requestId');
        
        // console.log($&);
        
        // For now, just show the notification modal
        // You can fetch the actual walk request data here if needed
        setIsNotificationVisible(true);
      }
    };

    // Handle URL when app is opened from closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        // console.log($&);
        handleDeepLink(url);
      }
    });

    // Handle URL when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      // console.log($&);
      handleDeepLink(url);
    });

    return () => {
      subscription?.remove();
    };
  }, [setIsNotificationVisible, setCurrentWalkRequest]);

  return null;
};

export default DeepLinkHandler;