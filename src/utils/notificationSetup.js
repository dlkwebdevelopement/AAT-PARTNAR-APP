import * as Notifications from 'expo-notifications';
import { Platform, Alert, Linking } from 'react-native';
import AxiosService from './AxioService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from './navigationRef';

/**
 * Configure global notification behavior
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Register device for push notifications
 * @returns {Promise<string|null>} Expo push token or null
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  try {
    // Android: create default notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notification Permission',
        'Please allow notifications to stay updated.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Allow Notifications',
            onPress: () => {
              if (Platform.OS === 'ios') Linking.openURL('app-settings:');
              else Linking.openSettings();
            },
          },
        ]
      );
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;
    console.log('Expo push token:', token);

    // Save token to backend
    const user = await AsyncStorage.getItem('user');
    if (user) {
      const vendor = JSON.parse(user);
      const vendorId = vendor._id;

      const res = await AxiosService.post('vendor/storeFCMTokenToVendor', {
        vendorId,
        expoPushToken: token,
      });

      if (res.status === 200) console.log('Token stored successfully');
    }
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }

  return token;
}

/**
 * Listen for notifications when user interacts
 */
export function listenForNotifications() {
  Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const notificationData = response.notification.request.content.data;

      if (notificationData?.screen) {
        navigate(notificationData.screen, notificationData.params || {});
      } else {
        console.log('No screen found in notification data:', notificationData);
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  });
}
