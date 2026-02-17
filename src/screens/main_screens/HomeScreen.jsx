import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  Pressable,
  ToastAndroid,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useContext } from "react";
import CarouselSlider from "../../components/CarouselSlider";
import { colors } from "../../utils/constants";
import Bell from "react-native-vector-icons/MaterialIcons";
import StatsComp from "../../components/StatsComp";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../AuthContext";
import moment from "moment";

const HomeScreen = ({ navigation }) => {
  const [vendorDetails, setVendorDetails] = useState({});
  const [vehicleCount, setVehicleCount] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [vendorId, setVendorId] = useState("");

  const { isAuthenticated, logout } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated) {
      logout();
      navigation.replace("Login");
      ToastAndroid.show(
        "Session Expired. Please log in again.",
        ToastAndroid.SHORT
      );
    }
  }, []);

  const getUserData = async () => {
    try {
      const vendor = await AsyncStorage.getItem("user");
      if (!vendor) return;
      const vendorData = JSON.parse(vendor);
      const vendorId = vendorData._id;
      setVendorId(vendorId);

      const res = await AxiosService.post("vendor/getVendorById", { vendorId });
      if (res.status === 200) {
        setVendorDetails(res.data.user);
        const totalVehicles =
          res.data.user.vehicles.cars.length +
          res.data.user.vehicles.vans.length +
          res.data.user.vehicles.autos.length +
          res.data.user.vehicles.buses.length +
          res.data.user.vehicles.trucks.length;

        setVehicleCount(totalVehicles < 10 ? `0${totalVehicles}` : totalVehicles);
      }
    } catch (error) {
      console.log("Error retrieving user data:", error);
    }
  };

  const getNotificationCount = async () => {
    try {
      const res = await AxiosService.post("vendor/getVendorNotification", {
        vendorId,
      });
      if (res.status === 200) {
        const unread = res.data.vendorMessage.filter((msg) => !msg.readed);
        setNotificationCount(unread.length);
      }
    } catch (error) {
      console.log("Error fetching notifications", error.message);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      getUserData();
      getNotificationCount();
    }, [vendorId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await getUserData();
    await getNotificationCount();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.main_container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <CarouselSlider />
      <View style={styles.content_container}>
        <View style={styles.name_icon_container}>
          <Text style={styles.user_name_txt}>Hello, {vendorDetails.userName}</Text>
          <Pressable
            onPress={() => navigation.navigate("Notifications")}
            style={styles.bell_icon_container}
          >
            <Bell name="notifications" size={30} />
            {notificationCount > 0 && (
              <View style={styles.notification_badge}>
                <Text style={styles.notification_count}>
                  {notificationCount > 999 ? "999+" : notificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        <StatsComp />
        <Pressable
          style={styles.become_vendor_btn_container}
          onPress={() => navigation.navigate("BecomeVendor")}
        >
          <Text style={styles.become_vendor_btn_txt}>Become a Vendor</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  main_container: { flex: 1, backgroundColor: colors.white },
  content_container: { padding: 15, paddingBottom: 40 },
  user_name_txt: { fontSize: 22, fontWeight: "700" },
  name_icon_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.very_light_gray,
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  bell_icon_container: { position: "relative" },
  notification_badge: { position: "absolute", top: -5, right: -5 },
  notification_count: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "red",
    borderRadius: 50,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  become_vendor_btn_container: {
    backgroundColor: colors.dark_green,
    padding: 10,
    borderRadius: 5,
  },
  become_vendor_btn_txt: {
    fontSize: 15,
    color: colors.white,
    textAlign: "center",
    fontWeight: "800",
  },
});
