import React, { useEffect, useRef, useState, useContext } from "react";
import {
  View,
  Image,
  StyleSheet,
  Text,
  ImageBackground,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService, { getCorrectImageUrl } from "./AxioService";
import { AuthContext } from "../screens/AuthContext";
import { colors } from "./constants";

const { width } = Dimensions.get("window");

const isValidProfileImage = (img) => {
  if (!img) return false;
  if (typeof img !== "string") return false;
  const cleanImg = img.trim().toLowerCase();
  if (cleanImg === "" || cleanImg === "undefined" || cleanImg === "null") return false;
  if (cleanImg.endsWith("/undefined") || cleanImg.endsWith("/null")) return false;
  return true;
};

const Custom_drawer_style = (props) => {
  const { logout } = useContext(AuthContext);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [vendorName, setVendorName] = useState("Driver");
  const [profileImg, setProfileImg] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log("Error during logout:", error);
    }
  };

  const getVendorData = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        const vendorData = JSON.parse(user);

        // Immediate UI update from cache
        if (vendorData.userName) {
          setVendorName(vendorData.userName);
        } else if (vendorData.name) {
          setVendorName(vendorData.name);
        }
        if (vendorData.profileImg) {
          setProfileImg(vendorData.profileImg);
        }

        // Fetch fresh data from backend API
        if (vendorData._id) {
          try {
            const res = await AxiosService.post("vendor/getVendorById", { vendorId: vendorData._id });
            if (res.status === 200 && res.data.user) {
              const dbVendor = res.data.user;
              if (dbVendor.userName) {
                setVendorName(dbVendor.userName);
              } else if (dbVendor.name) {
                setVendorName(dbVendor.name);
              }
              if (dbVendor.profileImg) {
                setProfileImg(dbVendor.profileImg);
              }
              await AsyncStorage.setItem("user", JSON.stringify(dbVendor));
            }
          } catch (apiError) {
            console.log("Error fetching fresh vendor data in drawer:", apiError.message);
          }
        }
      }
    } catch (error) {
      console.log("Error loading vendor data:", error);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    getVendorData();

    const unsubscribe = props.navigation.addListener("state", () => {
      getVendorData();
    });

    return unsubscribe;
  }, [props.navigation]);

  const handleBecomeVendor = () => {
    props.navigation.navigate("BecomeVendor"); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require("../assets/Images/driver-img.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* FIXED TOP SECTION */}
          <View style={styles.headerContainer}>
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => props.navigation.closeDrawer()}
            >
              <Icon name="close" size={24} color={colors.dark_gray} />
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.imageOuterRing,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={styles.imageInnerRing}>
                <Image
                  source={
                    isValidProfileImage(profileImg)
                      ? {
                        uri:
                          profileImg.startsWith("file://") ||
                            profileImg.startsWith("content://") ||
                            profileImg.startsWith("assets-library://")
                            ? profileImg
                            : getCorrectImageUrl(profileImg),
                      }
                      : require("../../assets/Aatpartner.png")
                  }
                  style={styles.profileImage}
                />
              </View>
            </Animated.View>

            <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
              <Text style={styles.greetingText}>Welcome Back</Text>
              <Text style={styles.userName}>{vendorName}</Text>
            </Animated.View>
          </View>

          {/* Decorative Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>MENU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SCROLLABLE MENU SECTION */}
          <DrawerContentScrollView
            {...props}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Drawer Items */}
            <View style={styles.drawerItemsContainer}>
              <DrawerItemList {...props} />
            </View>

            {/* Become Vendor Button */}
            <TouchableOpacity onPress={handleBecomeVendor}>
              <LinearGradient
                colors={colors.premium_blue_gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Icon name="storefront-outline" size={22} color="#fff" style={{ marginRight: 15 }} />
                <Text style={styles.gradientButtonText}>Become a Vendor</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity onPress={handleLogout}>
              <LinearGradient
                colors={colors.danger_gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Icon name="logout" size={22} color="#fff" style={{ marginRight: 15 }} />
                <Text style={styles.gradientButtonText}>Log out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </DrawerContentScrollView>

          {/* FIXED BOTTOM FOOTER */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>App Version 1.0.0</Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Custom_drawer_style;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.light_gray },
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(255, 255, 255, 0.97)" },
  scrollContent: { flexGrow: 1 },
  headerContainer: {
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    marginBottom: 0,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  imageOuterRing: {
    width: width * 0.36,
    height: width * 0.36,
    borderRadius: width * 0.18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: colors.deep_blue,
  },
  imageInnerRing: {
    width: "92%",
    height: "92%",
    borderRadius: 100,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profileImage: { width: "100%", height: "100%", borderRadius: 100 },
  textContainer: { alignItems: "center", marginTop: 8 },
  greetingText: { fontSize: 14, color: colors.dark_gray, fontWeight: "600", letterSpacing: 0.3 },
  userName: { fontSize: 22, fontWeight: "800", color: colors.deep_blue, marginTop: 2, textTransform: "uppercase", letterSpacing: 1.2 },
  
  dividerContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginVertical: 5 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.gray },
  dividerText: { marginHorizontal: 10, fontSize: 12, color: colors.dark_gray, fontWeight: "600", letterSpacing: 1 },
  drawerItemsContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 0 },

  // Standardized Gradient Button
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 10,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  gradientButtonText: { color: "#fff", fontSize: 16, fontWeight: "600", letterSpacing: 0.5 },

  footerContainer: { paddingVertical: 20, borderTopWidth: 1, borderTopColor: colors.light_gray, alignItems: "center" },
  footerText: { fontSize: 12, color: colors.placeholder_gray, fontWeight: "400" },
});
