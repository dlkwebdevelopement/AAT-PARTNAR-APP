import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import AxiosService from "../../utils/AxioService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import moment from "moment";
import { colors } from "../../utils/constants";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "react-native-vector-icons/AntDesign";

const NotificationScreen = () => {
  const [notificationData, setNotificationData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visibleMenuId, setVisibleMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [vendorId, setVendorId] = useState("");
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      const vendor = JSON.parse(user);
      const vendorID = vendor._id;
      setVendorId(vendorID);

      setLoading(true);
      const res = await AxiosService.post("vendor/getVendorNotification", {
        vendorId: vendorID,
      });

      if (res.status === 200) {
        await AxiosService.post("vendor/notificatonReaded", { vendorId: vendorID });
        setNotificationData(res.data.vendorMessage);
      }
    } catch (error) {
      console.error(error.response ? error.response.data.message : error.message);
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

  const handleNavigate = (title) => {
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
        vendorId,
        messageId,
      });
      if (res.status === 200) {
        setVisibleMenuId(null);
        fetchNotifications();
        Toast.show({ type: "success", text1: "Notification deleted" });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response ? error.response.data.message : error.message,
      });
    }
  };

  const NotificationItem = React.memo(({ item }) => (
    <View style={styles.notification_list_main_container}>
      <View style={styles.header_section_main_container}>
        <View style={styles.icon_and_datetime_container}>
          <Image
            source={
              item.title === "New Booking Request" || item.title === "Vehicle approved by admin"
                ? require("../../assets/Images/notification-bell.png")
                : require("../../assets/Images/notification-bell1.png")
            }
            style={styles.icon}
          />
          <View style={{ gap: 3 }}>
            <Text style={styles.heading_txt}>{item.title}</Text>
            <Text style={styles.date_time_txt}>
              {moment(item.dateAt).format("DD-MM-YYYY")} | {moment(item.dateAt).format("LT")}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={(e) => toggleMenu(e, item._id)} style={styles.menu_icon}>
          <Text style={{ fontSize: 20, color: colors.dark_gray }}>⋮</Text>
        </TouchableOpacity>

        {/* Popup Menu */}
        <Modal
          transparent
          visible={visibleMenuId === item._id}
          animationType="fade"
          onRequestClose={() => setVisibleMenuId(null)}
        >
          <TouchableOpacity style={styles.modal_overlay} activeOpacity={1} onPressOut={() => setVisibleMenuId(null)}>
            <View
              style={[
                styles.menu_container,
                {
                  top: menuPosition.y,
                  left: menuPosition.x > width - 150 ? width - 190 : menuPosition.x,
                },
              ]}
            >
              <TouchableOpacity style={styles.menu_item} onPress={() => handleNavigate(item.title)}>
                <FontAwesome name="eye" size={20} color={colors.dark_green} />
                <Text style={styles.menu_text}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menu_item, { borderTopWidth: 1, borderColor: colors.light_gray }]}
                onPress={() => handleDelete(item._id)}
              >
                <AntDesign name="delete" size={20} color={colors.red} />
                <Text style={styles.menu_text}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
      <Text style={styles.subject_txt}>{item.description}</Text>
    </View>
  ));

  return (
    <View style={styles.main_container}>
      {notificationData.length === 0 && !loading ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.no_data_main_container}
        >
          <Image source={require("../../assets/Images/notification.png")} style={styles.img} />
          <Text style={styles.main_txt}>No Notifications</Text>
          <Text style={styles.sub_txt}>You do not have any notification at this time</Text>
        </ScrollView>
      ) : loading ? (
        <ActivityIndicator size="large" color={colors.dark_green} />
      ) : (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          data={[...notificationData].reverse()}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => <NotificationItem item={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
      <Toast />
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  main_container: {
    flex: 1,
    backgroundColor: colors.very_light_gray,
    paddingTop: 15,
    paddingHorizontal: 15,
  },
  notification_list_main_container: {
    backgroundColor: colors.white,
    marginBottom: 15,
    padding: 15,
    elevation: 1.5,
    borderRadius: 10,
  },
  header_section_main_container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  icon_and_datetime_container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 45,
    height: 45,
  },
  heading_txt: {
    fontSize: 17,
    fontWeight: "600",
  },
  date_time_txt: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.dark_gray,
  },
  subject_txt: {
    fontSize: 13.5,
    fontWeight: "500",
    color: colors.dark_gray,
  },
  menu_icon: {
    padding: 8,
  },
  modal_overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  menu_container: {
    position: "absolute",
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    width: 170,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menu_item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  menu_text: {
    fontSize: 16,
    color: colors.dark_gray,
    marginLeft: 10,
  },
  no_data_main_container: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    gap: 10,
  },
  img: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  main_txt: {
    fontSize: 25,
    fontWeight: "800",
    color: colors.dark_green,
  },
  sub_txt: {
    fontSize: 16,
    maxWidth: "60%",
    textAlign: "center",
    fontWeight: "500",
    color: colors.dark_gray,
  },
});
