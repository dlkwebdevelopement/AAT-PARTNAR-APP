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
  Animated,
  StatusBar,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from "moment";
import AxiosService from "../../utils/AxioService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { colors } from "../../utils/constants";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { getStoredNotifications, clearStoredNotifications } from "../../utils/notificationSetup";

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleMenuId, setVisibleMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [vendorId, setVendorId] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [hasPermission, setHasPermission] = useState(true);

  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  useEffect(() => {
    fetchNotifications();
    checkPermissions();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      checkPermissions();
    }, [])
  );

  const checkPermissions = async () => {
    try {
      const Constants = require('expo-constants').default || require('expo-constants');
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      if (isExpoGo) {
        setHasPermission(true);
        return;
      }
      const Notifications = require('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (err) {
      console.log('Error checking permissions:', err);
    }
  };

  const requestPermission = async () => {
    try {
      const Constants = require('expo-constants').default || require('expo-constants');
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      if (isExpoGo) {
        setHasPermission(true);
        return;
      }
      const Notifications = require('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        fetchNotifications(); // Refresh list to see any new system notifications
      } else {
        Alert.alert(
          "Permission Denied",
          "Please enable notifications in your device settings to stay updated.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (err) {
      console.log('Error requesting permissions:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (!user) return;
      const vendor = JSON.parse(user);
      const vid = vendor._id || vendor.id;
      if (!vid) {
        console.log("No vendor ID found in storage");
        setLoading(false);
        return;
      }
      setVendorId(vid);

      setLoading(true);

      // 1. Fetch from Backend
      console.log("Fetching notifications for vendor:", vid);
      const res = await AxiosService.post("vendor/getVendorNotification", {
        vendorId: vid,
      });
      console.log("Backend response status:", res.status);

      let backendMsgs = [];
      if (res.status === 200 && res.data) {
        const msgs = res.data.vendorMessage || res.data.messages || [];
        console.log("Fetched backend messages count:", Array.isArray(msgs) ? msgs.length : "Not an array");
        if (Array.isArray(msgs)) {
          backendMsgs = msgs.map(m => ({ ...m, source: 'backend', _id: m._id || m.id }));
        }
        // Mark as read in backend
        await AxiosService.post("vendor/notificatonReaded", { vendorId: vid });
      }

      // 2. Fetch from Local Storage
      const localMsgs = await getStoredNotifications();
      const formattedLocal = localMsgs.map(m => ({
        _id: m.id,
        title: m.title,
        description: m.body,
        dateAt: m.timestamp,
        source: 'local',
        read: m.read
      }));

      // 3. Merge and Sort
      const combined = [...backendMsgs, ...formattedLocal].sort((a, b) =>
        new Date(b.dateAt) - new Date(a.dateAt)
      );

      setNotifications(combined);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      Toast.show({ type: "error", text1: "Failed to load notifications" });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    Alert.alert(
      "Clear All",
      "Are you sure you want to clear your local notification history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await clearStoredNotifications();
              fetchNotifications();
              Toast.show({ type: "success", text1: "History cleared" });
            } catch (err) {
              Toast.show({ type: "error", text1: "Failed to clear" });
            }
          }
        }
      ]
    );
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

  const handleDelete = async (item) => {
    try {
      if (item.source === 'backend') {
        const res = await AxiosService.post("vendor/deleteNotification", {
          vendorid: vendorId,
          messageId: item._id,
        });
        if (res.status === 200) {
          fetchNotifications();
        }
      } else {
        fetchNotifications();
      }
      setVisibleMenuId(null);
      Toast.show({ type: "success", text1: "Notification Deleted" });
    } catch (error) {
      Toast.show({ type: "error", text1: "Error deleting notification" });
    }
  };

  const handleViewNotification = (item) => {
    setSelectedNotification(item);
    setDetailModalVisible(true);
  };

  const getIcon = (title) => {
    const t = title?.toLowerCase() || "";
    if (t.includes("booking")) {
      if (t.includes("cancel")) return <MaterialCommunityIcons name="calendar-remove" size={24} color={colors.red} />;
      return <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.deep_blue} />;
    }
    if (t.includes("vehicle") || t.includes("car") || t.includes("auto")) {
      return <Ionicons name="checkmark-circle" size={24} color={colors.deep_blue} />;
    }
    if (t.includes("bus")) {
      return <MaterialCommunityIcons name="bus" size={24} color={colors.deep_blue} />;
    }
    if (t.includes("permission") || t.includes("enable")) {
      return <Ionicons name="notifications-circle" size={24} color={colors.deep_blue} />;
    }
    return <Ionicons name="notifications" size={24} color={colors.gray} />;
  };

  const NotificationItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => handleViewNotification(item)}
    >
      <Animated.View style={[styles.notificationCard, { opacity: fadeAnim }]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            {getIcon(item.title)}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemTime}>
              {moment(item.dateAt).fromNow()}
            </Text>
          </View>
          <TouchableOpacity onPress={(e) => toggleMenu(e, item._id)} style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.dark_gray} />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>

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
                  top: menuPosition.y - 20,
                  left: menuPosition.x > width - 180 ? width - 190 : menuPosition.x - 150,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.menuItem, { borderColor: colors.light_gray }]}
                onPress={() => handleDelete(item)}
              >
                <AntDesign name="delete" size={18} color={colors.red} />
                <Text style={styles.menuText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </Animated.View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={detailModalVisible}
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.detailModalContainer}>
          {selectedNotification && (
            <>
              <View style={styles.detailHeader}>
                <View style={styles.modalIconCircle}>
                  {getIcon(selectedNotification.title)}
                </View>
                <Text style={styles.detailTitle}>{selectedNotification.title}</Text>
                <Text style={styles.detailTime}>
                  {moment(selectedNotification.dateAt).format("MMMM Do YYYY, h:mm a")}
                </Text>
              </View>
              <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.detailDescription}>
                  {selectedNotification.description || selectedNotification.body}
                </Text>
              </ScrollView>
              <View style={styles.detailFooter}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Clear All Row Only (No Custom Header Bar) */}
      {notifications.length > 0 && (
        <View style={styles.clearAllOnlyContainer}>
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
            <Text style={styles.clearAllTxt}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {!hasPermission && (
        <View style={styles.permissionBanner}>
          <View style={styles.permissionContent}>
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Enable Notifications</Text>
              <Text style={styles.permissionSub}>
                Get real-time updates about bookings, payouts, and other alerts.
              </Text>
            </View>
            <TouchableOpacity onPress={requestPermission} style={styles.allowBtn}>
              <Text style={styles.allowBtnText}>Allow</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.deep_blue} />
        </View>
      ) : notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.deep_blue} />}
        >
          <View style={styles.emptyIconCircle}>
            <Ionicons name="notifications-off-outline" size={80} color={colors.deep_blue} />
          </View>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySub}>No new notifications at the moment. We'll alert you when something happens.</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnTxt}>Refresh</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => (item._id || item.id).toString()}
          renderItem={({ item }) => <NotificationItem item={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.deep_blue} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      {renderDetailModal()}
      <Toast />
    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.deep_blue,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginRight: 15,
    padding: 5,
  },
  clearAllBtn: {
    padding: 5,
  },
  clearAllTxt: {
    fontSize: 14,
    color: colors.red,
    fontWeight: "600",
  },
  permissionBanner: {
    backgroundColor: colors.deep_blue,
    margin: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  permissionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  permissionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  permissionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  permissionSub: {
    color: "#E0E0E0",
    fontSize: 12,
    marginTop: 2,
  },
  allowBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  allowBtnText: {
    color: colors.deep_blue,
    fontWeight: "bold",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailModalContainer: {
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    width: "85%",
    maxHeight: "65%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.deep_blue,
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  moreButton: {
    padding: 4,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4A4A4A",
    fontWeight: "400",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    marginTop: hp(10),
  },
  emptyIconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.deep_blue,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshBtn: {
    backgroundColor: colors.deep_blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshBtnTxt: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  menuContainer: {
    position: "absolute",
    backgroundColor: colors.white,
    width: 160,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  
  // Modal Details Style
  detailHeader: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.deep_blue,
    textAlign: "center",
    marginBottom: 6,
    width: "100%",
  },
  detailTime: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  detailBody: {
    marginBottom: 24,
    width: "100%",
  },
  detailDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: "#333",
    textAlign: "center",
  },
  detailFooter: {
    gap: 12,
    width: "100%",
  },
  actionBtn: {
    backgroundColor: colors.deep_blue,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  actionBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E6E2",
    width: "100%",
  },
  closeBtnText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "700",
  },
  clearAllOnlyContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
});
