import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AxiosService from '../utils/AxiosService';
import { ToastAndroid, Alert } from 'react-native';

export const useSOS = () => {
  const [sosLoading, setSosLoading] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [activeSosId, setActiveSosId] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);

  const stopSOS = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setSosActive(false);
    setActiveSosId(null);
    ToastAndroid.show('SOS Live Tracking Stopped', ToastAndroid.SHORT);
  };

  const triggerSOS = async () => {
    try {
      setSosLoading(true);

      const userStr = await AsyncStorage.getItem("user");
      const vendorId = userStr ? JSON.parse(userStr)._id : null;

      if (!vendorId) {
        Alert.alert("Error", "Please login again to use SOS");
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission needed for SOS');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      const res = await AxiosService.post('vendor/trigger-sos', {
        vendorId,
        lat,
        lng
      });

      if (res.status === 201) {
        Alert.alert('SOS Triggered!', 'Alert sent to emergency contacts and admin. Live tracking started.');
        const sosId = res.data.sosAlert?._id;
        if (sosId) {
          setSosActive(true);
          setActiveSosId(sosId);
          startLiveTracking(sosId);
        }
      }
    } catch (error) {
      console.log('SOS Error', error);
      Alert.alert('Error', 'Failed to trigger SOS');
    } finally {
      setSosLoading(false);
    }
  };

  const startLiveTracking = async (sosId) => {
    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000, 
          distanceInterval: 10, 
        },
        async (newLocation) => {
          try {
            await AxiosService.put(`vendor/update-sos-location/${sosId}`, {
              lat: newLocation.coords.latitude,
              lng: newLocation.coords.longitude,
            });
            console.log("SOS Location updated", newLocation.coords.latitude, newLocation.coords.longitude);
          } catch (updateError) {
            console.error("Failed to update SOS location", updateError);
          }
        }
      );
      setLocationSubscription(sub);
    } catch (error) {
      console.error("Failed to start watching location", error);
    }
  };

  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  return { triggerSOS, stopSOS, sosLoading, sosActive };
};
