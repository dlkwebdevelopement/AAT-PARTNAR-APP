import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Text,
  SafeAreaView,
  ImageBackground,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // example icon library

const { width } = Dimensions.get("window");

const Custom_drawer_style = (props) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
  }, []);

  // Navigate function for Become Vendor
  const handleBecomeVendor = () => {
    props.navigation.navigate("BecomeVendor"); // Make sure "BecomeVendor" is a valid route
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require("../assets/Images/driver-img.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <DrawerContentScrollView
            {...props}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Section */}
            <View style={styles.headerContainer}>
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
                    source={require("../assets/Images/AAT-logo.png")}
                    style={styles.profileImage}
                  />
                </View>
              </Animated.View>

              <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
                <Text style={styles.greetingText}>Welcome Back</Text>
                <Text style={styles.userName}>Driver</Text>
              </Animated.View>
            </View>

            {/* Decorative Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>MENU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Drawer Items */}
            <View style={styles.drawerItemsContainer}>
              <DrawerItemList {...props} />
            </View>

            {/* Become Vendor Button */}
            <TouchableOpacity style={styles.vendorButton} onPress={handleBecomeVendor}>
              <Icon name="storefront-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.vendorButtonText}>Become a Vendor</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>App Version 1.0.0</Text>
            </View>
          </DrawerContentScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Custom_drawer_style;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(255, 255, 255, 0.97)" },
  scrollContent: { flexGrow: 1 },
  headerContainer: {
    alignItems: "center",
    paddingVertical: 35,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  imageOuterRing: {
    width: width * 0.36,
    height: width * 0.36,
    borderRadius: width * 0.18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3d6304",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  imageInnerRing: {
    width: "90%",
    height: "90%",
    borderRadius: 100,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileImage: { width: "100%", height: "100%", borderRadius: 100 },
  textContainer: { alignItems: "center", marginTop: 15 },
  greetingText: { fontSize: 14, color: "#555", fontWeight: "500", letterSpacing: 0.3 },
  userName: { fontSize: 22, fontWeight: "700", color: "#3d6304", marginTop: 2, textTransform: "uppercase", letterSpacing: 1.2 },
  dividerContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginVertical: 15 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(61, 99, 4, 0.25)" },
  dividerText: { marginHorizontal: 10, fontSize: 12, color: "#3d6304", fontWeight: "600", letterSpacing: 1 },
  drawerItemsContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 5 },

  // Vendor Button
  vendorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3d6304",
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
  },
  vendorButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  footerContainer: { paddingVertical: 20, borderTopWidth: 1, borderTopColor: "rgba(61, 99, 4, 0.15)", alignItems: "center" },
  footerText: { fontSize: 12, color: "#999", fontWeight: "400" },
});
