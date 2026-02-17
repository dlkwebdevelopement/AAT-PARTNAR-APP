import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import moment from "moment";
import AxiosService from "../../utils/AxioService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "react-native-vector-icons/AntDesign";
import Toast from "react-native-toast-message";
import { colors } from "../../utils/constants";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleMenuId, setVisibleMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [vendorId, setVendorId] = useState("");

  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      const vendor = JSON.parse(user);
      setVendorId(vendor._id);

      setLoading(true);
      const res = await AxiosService.post("vendor/getVendorNotification", {
        vendorId: vendor._id,
      });

      if (res.status === 200) {
        // Mark notifications as read
        await AxiosService.post("vendor/notificatonReaded", { vendorId: vendor._id });
        setNotifications(res.data.vendorMessage.reverse());
      }
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const toggleMenu = (event, id) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setVisibleMenuId(visibleMenuId === id ? null : id);
  };

  const handleView = (title) => {
    setVisibleMenuId(null);
    if (title === "New Booking Request" || title === "Booking Cancelled") {
      navigation.navigate("My Bookings");
    } else {
      navigation.navigate("Vehicle Management");
    }
  };

  const handleDelete = async (messageId) => {
    try {
      const res = await AxiosService.post("vendor/deleteNotification", {
        vendorid: vendorId,
        messageId,
      });

      if (res.status === 200) {
        Toast.show({ type: "success", text1: "Notification Deleted" });
        setVisibleMenuId(null);
        fetchNotifications();
      }
    } catch (err) {
      Toast.show({ type: "error", text1: err.response?.data?.message || err.message });
    }
  };

  const NotificationItem = React.memo(({ item }) => (
    <View style={styles.notificationContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <Image
            source={
              item.title === "New Booking Request" || item.title === "Vehicle approved by admin"
                ? require("../../assets/Images/notification-bell.png")
                : require("../../assets/Images/notification-bell1.png")
            }
            style={styles.icon}
          />
          <View style={{ gap: 3 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.dateTime}>
              {moment(item.dateAt).format("DD-MM-YYYY")} | {moment(item.dateAt).format("LT")}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={(e) => toggleMenu(e, item._id)} style={styles.menuIcon}>
          <Text style={{ fontSize: 20, color: colors.dark_gray }}>⋮</Text>
        </TouchableOpacity>

        {/* Popup Menu */}
        <Modal
          transparent
          visible={visibleMenuId === item._id}
          animationType="fade"
          onRequestClose={() => setVisibleMenuId(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setVisibleMenuId(null)}
          >
            <View
              style={[
                styles.menuContainer,
                {
                  top: menuPosition.y,
                  left: menuPosition.x > width - 180 ? width - 190 : menuPosition.x,
                },
              ]}
            >
              <TouchableOpacity style={styles.menuItem} onPress={() => handleView(item.title)}>
                <FontAwesome name="eye" size={20} color={colors.dark_green} />
                <Text style={styles.menuText}>View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { borderTopWidth: 1, borderColor: colors.light_gray }]}
                onPress={() => handleDelete(item._id)}
              >
                <AntDesign name="delete" size={20} color={colors.red} />
                <Text style={styles.menuText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      <Text style={styles.description}>{item.description}</Text>
    </View>
  ));

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.dark_green} />
      ) : notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.noDataContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Image source={require("../../assets/Images/notification.png")} style={styles.image} />
          <Text style={styles.mainText}>No Notifications</Text>
          <Text style={styles.subText}>You do not have any notification at this time</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => <NotificationItem item={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}
      <Toast />
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.very_light_gray,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  notificationContainer: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 1.5,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: { width: 45, height: 45 },
  title: { fontSize: 17, fontWeight: "600" },
  dateTime: { fontSize: 13, fontWeight: "500", color: colors.dark_gray },
  description: { fontSize: 14, fontWeight: "500", color: colors.dark_gray },
  menuIcon: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  menuContainer: {
    position: "absolute",
    backgroundColor: colors.white,
    width: 170,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  menuText: { marginLeft: 10, fontSize: 16, color: colors.dark_gray },
  noDataContainer: { alignItems: "center", justifyContent: "center", marginTop: hp(15), gap: 10 },
  image: { width: wp(45), height: hp(21) },
  mainText: { fontSize: 25, fontWeight: "800", color: colors.dark_green },
  subText: { fontSize: 16, fontWeight: "500", textAlign: "center", maxWidth: wp(60), color: colors.dark_gray },
});
