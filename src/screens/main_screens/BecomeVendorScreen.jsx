import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../utils/constants";
import Icon4 from "react-native-vector-icons/AntDesign";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const BecomeVendorScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon4 name="left" size={20} color={colors.deep_blue} />
          </Pressable>
          <Text style={styles.headerTitle}>BECOME A VENDOR</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.heroSection}>
            <View style={styles.heroContent}>
              <Image
                source={require("../../assets/Images/vendor.png")}
                style={styles.heroImage}
              />
              <Text style={styles.heroTitle}>List Your Vehicles and Start Earning</Text>

              <View style={styles.taglineContainer}>
                <Image
                  source={require("../../assets/Images/coin-2.png")}
                  style={styles.coinIcon}
                />
                <Text style={styles.taglineText}>Drive More, Earn More!</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleTag}>
              <Icon name="account-group" size={18} color={colors.white} />
              <Text style={styles.sectionTitleTagText}>Passenger Vehicles</Text>
            </View>

            <View style={styles.vehicleGrid}>
              <Pressable
                style={styles.vehicleContainer}
                onPress={() => navigation.navigate("AutoRegForm")}
              >
                <Image
                  source={require("../../assets/Images/auto.png")}
                  style={styles.vehicleImage}
                />
                <View style={styles.nameTag}>
                  <Icon name="rickshaw-electric" size={14} color={colors.white} />
                  <Text style={styles.vehicleName}>Auto</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.vehicleContainer}
                onPress={() => navigation.navigate("CarRegForm")}
              >
                <Image
                  source={require("../../assets/Images/car5.png")}
                  style={styles.vehicleImage}
                />
                <View style={styles.nameTag}>
                  <Icon name="car-sports" size={14} color={colors.white} />
                  <Text style={styles.vehicleName}>Car</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.vehicleContainer}
                onPress={() => navigation.navigate("VanRegForm")}
              >
                <Image
                  source={require("../../assets/Images/van.png")}
                  style={styles.vehicleImage}
                />
                <View style={styles.nameTag}>
                  <Icon name="van-passenger" size={14} color={colors.white} />
                  <Text style={styles.vehicleName}>Van</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.vehicleContainer}
                onPress={() => navigation.navigate("Bus")}
              >
                <View style={styles.comingSoonBadge}>
                  <Icon name="rocket-launch" size={10} color="#D97706" />
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
                <Image
                  source={require("../../assets/Images/bus.png")}
                  style={styles.vehicleImage}
                />
                <View style={styles.nameTag}>
                  <Icon name="bus" size={14} color={colors.white} />
                  <Text style={styles.vehicleName}>Bus</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleTag}>
              <Icon name="package-variant" size={18} color={colors.white} />
              <Text style={styles.sectionTitleTagText}>Goods Vehicles</Text>
            </View>
            <View style={styles.vehicleGrid}>
              <Pressable
                style={styles.vehicleContainer}
                onPress={() => navigation.navigate("GoodsRegForm", { type: "Small" })}
              >
                <Image
                  source={require("../../assets/Images/under1-ton.jpg")}
                  style={styles.vehicleImage}
                />
                <View style={styles.nameTag}>
                  <Icon name="truck-cargo-container" size={14} color={colors.white} />
                  <Text style={styles.vehicleName}>0.5 - 1 Ton</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.vehicleContainer}
                onPress={() => navigation.navigate("GoodsRegForm", { type: "Medium" })}
              >
                <Image
                  source={require("../../assets/Images/XL-truck.png")}
                  style={styles.vehicleImage}
                />
                <View style={styles.nameTag}>
                  <Icon name="truck" size={14} color={colors.white} />
                  <Text style={styles.vehicleName}>1.1 - 10 Ton</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.vehicleContainer}
                onPress={() => navigation.navigate("GoodsRegForm", { type: "Large" })}
              >
                <Image
                  source={require("../../assets/Images/below-20-ton.png")}
                  style={styles.vehicleImage}
                />
                <View style={styles.nameTag}>
                  <Icon name="truck-flatbed" size={14} color={colors.white} />
                  <Text style={styles.vehicleName}>10.1-20 Ton</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.vehicleContainer}
                onPress={() => navigation.navigate("GoodsRegForm", { type: "XL" })}
              >
                <Image
                  source={require("../../assets/Images/moreThen20-ton.png")}
                  style={styles.vehicleImage}
                />
                <View style={styles.nameTag}>
                  <Icon name="truck-trailer" size={14} color={colors.white} />
                  <Text style={styles.vehicleName}>20+ Ton</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default BecomeVendorScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: hp(2),
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.deep_blue,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingVertical: hp(2),
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
  },
  heroImage: {
    width: wp(85),
    height: 180,
    resizeMode: "contain",
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.deep_blue,
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  taglineContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBBF24", // Yellow tag
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
  },
  coinIcon: {
    width: 18,
    height: 18,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.deep_blue, // Deep blue text
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: wp(4),
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitleTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.deep_blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    alignSelf: "center",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  sectionTitleTagText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
  vehicleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  vehicleContainer: {
    width: wp(43),
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 0,
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  vehicleImage: {
    width: 90,
    height: 70,
    resizeMode: "contain",
    marginBottom: 8,
  },
  nameTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.deep_blue,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    color: colors.white,
  },
  bottomSpacing: {
    height: hp(5),
  },
  comingSoonBadge: {
    position: "absolute",
    top: -8,
    right: -5,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
    textTransform: "uppercase",
  },
});