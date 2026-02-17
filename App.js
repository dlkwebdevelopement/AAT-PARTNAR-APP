import React, { useEffect, useContext } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import Toast from "react-native-toast-message";

import AppStack from "./src/AppStack";
import { AuthProvider, AuthContext } from "./src/screens/AuthContext";
import { navigationRef } from "./src/utils/navigationRef";

import {
  registerForPushNotificationsAsync,
  configureNotificationHandler,
  listenForNotifications,
} from "./src/utils/notificationSetup";

import LocationTracker from "./src/components/LocationTracker";

enableScreens();

function MainApp() {
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        configureNotificationHandler();
        await registerForPushNotificationsAsync();
        listenForNotifications();
      } catch (error) {
        console.error("Notification setup error:", error);
      }
    };

    if (isAuthenticated) {
      setupNotifications();
    }
  }, [isAuthenticated]);

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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <MainApp />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
