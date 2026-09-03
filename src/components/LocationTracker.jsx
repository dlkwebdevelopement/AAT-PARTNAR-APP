import React, { useEffect, useRef } from "react";
import * as Location from "expo-location";
import AxiosService from "../utils/AxioService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LocationTracker = () => {
  const locationSubscription = useRef(null); // Persist the subscription

  useEffect(() => {
    const trackVehicleLocation = async () => {
      const vendor = await AsyncStorage.getItem("user");
      if (!vendor) return;
      
      const vendordata = JSON.parse(vendor);
      const vendorId = vendordata._id;

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission denied");
        return;
      }

      // Stop any previous tracking before starting a new one
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1, // Update when moving at least 10 meters
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          console.log("Updated Location:", latitude, longitude);
          sendLocationToServer(latitude, longitude, vendorId);
        }
      );
    };

    const sendLocationToServer = async (lat, lng, vendorId) => {
      try {
        const res = await AxiosService.post("vendor/updateVendorLocaiton", {
          vendorId,
          latitude: lat,
          longitude: lng,
        });

        if (res.status === 200) {
          console.log("Location sent successfully:", { latitude: lat, longitude: lng });
        }
      } catch (error) {
        console.error("Error sending location:", error.response?.data || error.message);
      }
    };

    trackVehicleLocation();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  return null; 
};

export default LocationTracker;
