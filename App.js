import "./global.css";
import 'expo-dev-client';
import React, { useEffect, useContext, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import Toast from "react-native-toast-message";
import { Alert, Platform } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppStack from "./src/AppStack";
import { AuthProvider, AuthContext } from "./src/screens/AuthContext";
import { navigationRef } from "./src/utils/navigationRef";

// Import enhanced notification service
import {
  registerForPushNotificationsAsync,
  configureNotificationHandler,
  initializeNotificationListeners,
  retryPendingToken,
  getUnreadCount,
} from "./src/utils/notificationSetup";

import LocationTracker from "./src/components/LocationTracker";
import { BaseChargeProvider } from './src/utils/BaseChargeContext';

enableScreens();

function MainApp() {
  const { isAuthenticated, user } = useContext(AuthContext);
  const notificationListeners = useRef(null);




  // Setup notifications when user is authenticated
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        console.log('🔔 Setting up notifications...');
        
        // Configure notification handler
        configureNotificationHandler();

        // Register for push notifications
        const token = await registerForPushNotificationsAsync();
        
        if (token) {
          console.log('✅ Push notification token obtained');
        }

        // Initialize notification listeners (foreground + response)
        const cleanup = initializeNotificationListeners();
        notificationListeners.current = cleanup;

        // Retry any pending tokens from previous failed attempts
        await retryPendingToken();

        // Log platform info
        console.log(`📱 Platform: ${Platform.OS}`);
        
      } catch (error) {
        console.error("❌ Notification setup error:", error);
      }
    };

    if (isAuthenticated) {
      setupNotifications();
    }

    // Cleanup listeners on unmount
    return () => {
      if (notificationListeners.current) {
        notificationListeners.current();
      }
    };
  }, [isAuthenticated]);

  // Handle deep linking from notifications
  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      if (url) {
        console.log('🔗 Deep link received:', url);
        // Parse URL and navigate
        try {
          const route = url.replace(/.*?:\/\//g, '');
          const [screen, paramsString] = route.split('?');
          const params = paramsString ? JSON.parse(decodeURIComponent(paramsString)) : {};
          navigationRef.navigate(screen, params);
        } catch (error) {
          console.error('Error parsing deep link:', error);
        }
      }
    };

    // Set up deep linking (if using expo-linking)
    // const subscription = Linking.addEventListener('url', handleDeepLink);
    // Linking.getInitialURL().then(url => {
    //   if (url) handleDeepLink({ url });
    // });

    // return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <AppStack />
      <LocationTracker />
      <Toast />
    </>
  );
}

export default function App() {
  // Handle global errors
  useEffect(() => {
    // Set up global error handler
    const errorHandler = (error, isFatal) => {
      if (isFatal) {
        console.error('Fatal error:', error);
        Alert.alert(
          'Unexpected Error',
          'An unexpected error occurred. Please restart the app.',
          [{ text: 'OK' }]
        );
      }
    };

    // Add error handler
    if (ErrorUtils) {
      ErrorUtils.setGlobalHandler(errorHandler);
    }

    return () => {
      // Restore default error handler
      if (ErrorUtils) {
        ErrorUtils.setGlobalHandler(ErrorUtils.getGlobalHandler());
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <BaseChargeProvider>
            <NavigationContainer ref={navigationRef}>
              <MainApp />
            </NavigationContainer>
          </BaseChargeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}