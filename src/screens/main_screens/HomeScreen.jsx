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
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import * as Location from "expo-location";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../AuthContext";
import moment from "moment";
import { SafeAreaView } from "react-native-safe-area-context";

const HomeScreen = ({ navigation }) => {
  const [vendorDetails, setVendorDetails] = useState({});
  const [vehicleCount, setVehicleCount] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [vendorId, setVendorId] = useState("");
  const [sosLoading, setSosLoading] = useState(false);

  const { isAuthenticated, logout } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated) {
      logout();
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
      const vendorId = vendorData._id || vendorData.id;
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
      if (!vendorId) return;
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

  const handleSOS = async () => {
    try {
      setSosLoading(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        ToastAndroid.show('Location permission needed for SOS', ToastAndroid.LONG);
        setSosLoading(false);
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
        ToastAndroid.show('SOS Alert Sent to Emergency Contacts and Admin!', ToastAndroid.LONG);
      }
    } catch (error) {
      console.log('SOS Error', error);
      ToastAndroid.show('Failed to trigger SOS', ToastAndroid.SHORT);
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe_area} edges={["bottom"]}>
      <ScrollView
        style={styles.main_container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <CarouselSlider />
        <View style={styles.content_container}>
          <View style={styles.name_icon_container}>
            <Text style={styles.user_name_txt}>Hello, {vendorDetails.userName}</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={handleSOS}
                disabled={sosLoading}
                style={styles.bell_icon_container}
              >
                <LinearGradient
                  colors={['#FF416C', '#FF4B2B']}
                  style={{
                    flexDirection: 'row',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 5,
                    shadowColor: '#FF416C',
                    shadowOpacity: 0.4,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <Icon name="car-brake-alert" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 6, fontSize: 14, letterSpacing: 1 }}>SOS</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
          <StatsComp />

          {/* Coming Soon Section */}
          <View style={styles.coming_soon_section}>
            <View style={{ alignItems: 'center', marginBottom: 15 }}>
              <View style={styles.coming_soon_tag}>
                <Icon name="rocket-launch" size={18} color={colors.white} />
                <Text style={styles.coming_soon_tag_txt}>Coming Soon</Text>
              </View>
            </View>
            <Pressable
              style={styles.coming_soon_card}
              onPress={() => navigation.navigate("Bus")}
            >
              <View style={styles.card_content}>
                <LinearGradient
                  colors={colors.premium_blue_gradient}
                  style={styles.bus_icon_bg}
                >
                  <Bell name="directions-bus" size={26} color={colors.white} />
                </LinearGradient>
                <View style={styles.card_text_container}>
                  <Text style={styles.card_title}>Bus Registration</Text>
                  <Text style={styles.card_sub}>List your buses and reach more travelers.</Text>
                  <View style={styles.badge_container}>
                    <Text style={styles.badge_text}>Notify Me</Text>
                  </View>
                </View>
                <Bell name="chevron-right" size={24} color={colors.placeholder_gray} />
              </View>
            </Pressable>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Pressable onPress={() => navigation.navigate("BecomeVendor")}>
              <LinearGradient
                colors={colors.premium_blue_gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient_btn_container}
              >
                <Bell name="storefront" size={22} color={colors.white} />
                <Text style={styles.gradient_btn_txt}>Become a Vendor</Text>
              </LinearGradient>
            </Pressable>
          </View>


        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safe_area: { flex: 1, backgroundColor: colors.white },
  main_container: { flex: 1, backgroundColor: colors.white },
  content_container: { paddingHorizontal: 15, paddingTop: 5, paddingBottom: 40 },
  user_name_txt: { fontSize: 24, fontWeight: "800", color: colors.deep_blue },
  name_icon_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderRadius: 10,
    marginBottom: 10,
  },
  bell_icon_container: { position: "relative" },
  notification_badge: { position: "absolute", top: -3, right: -3 },
  notification_count: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#FF416C",
    borderRadius: 50,
    paddingHorizontal: 5,
    paddingVertical: 2,
    elevation: 3,
  },
  gradient_btn_container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 8,
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  gradient_btn_txt: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  coming_soon_section: {
    marginVertical: 25,
  },
  coming_soon_tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.deep_blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  coming_soon_tag_txt: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  section_title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.deep_blue,
    marginBottom: 15,
  },
  coming_soon_card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 5,
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  card_content: {
    flexDirection: "row",
    alignItems: "center",
  },
  bus_icon_bg: {
    width: 55,
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  card_text_container: {
    flex: 1,
    marginLeft: 16,
  },
  card_title: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.black,
  },
  card_sub: {
    fontSize: 12,
    color: colors.placeholder_gray,
    marginTop: 4,
    lineHeight: 18,
  },
  badge_container: {
    backgroundColor: colors.light_blue,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
  },
  badge_text: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.deep_blue,
    textTransform: 'uppercase',
  },
});
