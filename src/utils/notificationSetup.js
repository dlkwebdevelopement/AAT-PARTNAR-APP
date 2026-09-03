import { Platform, Alert, Linking, ToastAndroid, AppState } from 'react-native';
import AxiosService from './AxioService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from './navigationRef';
import Constants from 'expo-constants';

const isExpoGo = () => {
  return Constants.executionEnvironment === 'storeClient';
};

// Lazily load expo-notifications to avoid import warnings in Expo Go
let Notifications = null;
const getNotificationsModule = () => {
  if (isExpoGo()) return null;
  if (!Notifications) {
    Notifications = require('expo-notifications');
  }
  return Notifications;
};

/**
 * Configure global notification behavior
 */
export function configureNotificationHandler() {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) {
    console.log('📱 Expo Go detected - skipping notification handler configuration');
    return;
  }
  NotificationsModule.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowInForeground: true, // Show notification when app is in foreground
    }),
  });
}

/**
 * Show custom pop-up alert for notifications
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 */
export const showNotificationPopUp = (title, body, data = {}) => {
  Alert.alert(
    title || 'New Notification',
    body || 'You have a new notification',
    [
      {
        text: 'View',
        onPress: () => {
          if (data && data.screen) {
            navigate(data.screen, data.params || {});
          }
        },
      },
      {
        text: 'Close',
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
};

/**
 * Show Android Toast notification
 * @param {string} message - Toast message
 */
export const showToastNotification = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.showWithGravity(
      message,
      ToastAndroid.LONG,
      ToastAndroid.TOP
    );
  }
};

/**
 * Send a local notification immediately
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 */
export async function sendLocalNotification(title, body, data = {}) {
  try {
    // Show pop-up alert
    showNotificationPopUp(title, body, data);
    
    // Show Android toast
    if (Platform.OS === 'android') {
      showToastNotification(body);
    }

    const NotificationsModule = getNotificationsModule();
    if (!NotificationsModule) {
      console.log('📱 Expo Go detected - skipping native scheduleNotificationAsync');
      return;
    }

    // Also send system notification
    await NotificationsModule.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,
        sound: 'car_horn',
        priority: NotificationsModule.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null means send immediately
    });

    console.log('✅ Local notification sent:', title);
  } catch (error) {
    console.error('❌ Error sending local notification:', error);
  }
}

/**
 * Register device for push notifications
 * @returns {Promise<string|null>} Expo push token or null
 */
export async function registerForPushNotificationsAsync() {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) {
    console.log('📱 Expo Go detected - skipping push token registration');
    return null;
  }
  let token = null;

  try {
    // Android: create default notification channel
    if (Platform.OS === 'android') {
      await NotificationsModule.setNotificationChannelAsync('default', {
        name: 'default',
        importance: NotificationsModule.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'car_horn',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      // Create additional channel for bookings
      await NotificationsModule.setNotificationChannelAsync('bookings', {
        name: 'Booking Updates',
        importance: NotificationsModule.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
        sound: 'car_horn',
        enableVibrate: true,
        enableLights: true,
      });
    }

    // Check existing permissions
    const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await NotificationsModule.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notification Permission Required',
        'Please allow notifications to stay updated about your bookings.',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') Linking.openURL('app-settings:');
              else Linking.openSettings();
            },
          },
        ]
      );
      return null;
    }

    // Get Expo push token using Project ID (Required for Expo 49+)
    const tokenData = await NotificationsModule.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || '0f03418b-4123-4ebf-a160-dbbee43fa370',
    });
    token = tokenData.data;
    console.log('✅ Expo push token:', token);

    // Save token to backend
    const user = await AsyncStorage.getItem('user');
    if (user) {
      const vendor = JSON.parse(user);
      const vendorId = vendor._id;

      try {
        const res = await AxiosService.post('vendor/storeFCMTokenToVendor', {
          vendorId,
          expoPushToken: token,
          deviceType: Platform.OS,
        });

        if (res.status === 200) {
          console.log('✅ Token stored successfully');
          
          // Send welcome notification after successful registration
          await sendLocalNotification(
            '🔔 Notifications Enabled',
            'You will now receive updates about your bookings',
            { type: 'welcome', screen: 'Home' }
          );
        }
      } catch (error) {
        console.error('❌ Failed to store token:', error);
        // Store token locally to retry later
        await AsyncStorage.setItem('pendingPushToken', token);
      }
    }
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
  }

  return token;
}

/**
 * Listen for notifications when app is in foreground
 */
export function listenForForegroundNotifications() {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) return { remove: () => {} };

  return NotificationsModule.addNotificationReceivedListener((notification) => {
    try {
      const { title, body, data } = notification.request.content;
      console.log('📱 Foreground notification:', { title, body, data });

      // Show pop-up alert
      showNotificationPopUp(title, body, data);

      // Show Android toast
      if (Platform.OS === 'android') {
        showToastNotification(body || title);
      }

      // Store notification in AsyncStorage for history
      storeNotificationLocally({ title, body, data, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error handling foreground notification:', error);
    }
  });
}

/**
 * Listen for notifications when user interacts (taps)
 */
export function listenForNotificationResponses() {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) return { remove: () => {} };

  return NotificationsModule.addNotificationResponseReceivedListener((response) => {
    try {
      const notificationData = response.notification.request.content.data;
      const { title, body } = response.notification.request.content;

      console.log('👆 Notification tapped:', { title, body, notificationData });

      // Navigate directly without confirmation alert for better UX
      if (notificationData?.screen) {
        navigate(notificationData.screen, notificationData.params || {});
      } else {
        navigate('Home');
      }

      // Mark notification as read in local storage
      markNotificationAsRead(notificationData?.id);
    } catch (error) {
      console.error('❌ Error handling notification response:', error);
      // Navigate to home as fallback
      navigate('Home');
    }
  });
}

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const stored = await AsyncStorage.getItem('notifications');
    if (stored) {
      const notifications = JSON.parse(stored);
      const updated = notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem('notifications', JSON.stringify(updated));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
};

/**
 * Store notification locally for history
 * @param {object} notification - Notification object
 */
const storeNotificationLocally = async (notification) => {
  try {
    const stored = await AsyncStorage.getItem('notifications');
    const notifications = stored ? JSON.parse(stored) : [];
    
    notifications.unshift({
      ...notification,
      id: Date.now().toString(),
      read: false,
    });

    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.pop();
    }

    await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Error storing notification:', error);
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
const markNotificationAsRead = async (notificationId) => {
  try {
    if (!notificationId) return;
    
    const stored = await AsyncStorage.getItem('notifications');
    if (stored) {
      const notifications = JSON.parse(stored);
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem('notifications', JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Initialize all notification listeners
 * @returns {function} Cleanup function
 */
export function initializeNotificationListeners() {
  if (isExpoGo()) {
    console.log('📱 Expo Go detected - skipping notification listeners');
    return () => {};
  }
  const foregroundSubscription = listenForForegroundNotifications();
  const responseSubscription = listenForNotificationResponses();

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Check for pending tokens and retry sending to backend
 */
export async function retryPendingToken() {
  try {
    const pendingToken = await AsyncStorage.getItem('pendingPushToken');
    if (pendingToken) {
      console.log('📦 Found pending token, retrying...');
      
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const vendor = JSON.parse(user);
        const vendorId = vendor._id;

        const res = await AxiosService.post('vendor/storeFCMTokenToVendor', {
          vendorId,
          expoPushToken: pendingToken,
          deviceType: Platform.OS,
        });

        if (res.status === 200) {
          await AsyncStorage.removeItem('pendingPushToken');
          console.log('✅ Pending token stored successfully');
          
          // Send success notification
          await sendLocalNotification(
            '✅ Notifications Ready',
            'You will now receive updates about your bookings',
            { type: 'success' }
          );
        }
      }
    }
  } catch (error) {
    console.error('❌ Error retrying pending token:', error);
  }
}

/**
 * Get all stored notifications
 * @returns {Promise<Array>} List of notifications
 */
export async function getStoredNotifications() {
  try {
    const stored = await AsyncStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting stored notifications:', error);
    return [];
  }
}

/**
 * Clear all stored notifications
 */
export async function clearStoredNotifications() {
  try {
    await AsyncStorage.removeItem('notifications');
    console.log('✅ Notifications cleared');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Get unread notification count
 * @returns {Promise<number>} Unread count
 */
export async function getUnreadCount() {
  try {
    const stored = await AsyncStorage.getItem('notifications');
    if (stored) {
      const notifications = JSON.parse(stored);
      return notifications.filter(n => !n.read).length;
    }
    return 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Schedule a notification for later
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 * @param {Date} triggerDate - When to trigger
 */
export async function scheduleNotification(title, body, data = {}, triggerDate) {
  try {
    const NotificationsModule = getNotificationsModule();
    if (!NotificationsModule) {
      console.log('📱 Expo Go detected - skipping native scheduleNotification');
      return null;
    }
    const notificationId = await NotificationsModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'car_horn',
        channelId: data.type === 'booking' ? 'bookings' : 'default',
      },
      trigger: { date: triggerDate },
    });

    console.log('✅ Notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications() {
  try {
    const NotificationsModule = getNotificationsModule();
    if (!NotificationsModule) return;
    await NotificationsModule.cancelAllScheduledNotificationsAsync();
    console.log('✅ All scheduled notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}
