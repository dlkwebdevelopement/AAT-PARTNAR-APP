import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { colors } from "../../utils/constants";
import Icon1 from "react-native-vector-icons/AntDesign";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const BecomeVendorScreen = ({ navigation }) => {
  return (
    <View style={styles.main_container}>
      {/* Navigation Back Button */}
      <Pressable
        style={styles.nav_container}
        onPress={() => navigation.goBack()}
      >
        <Icon1 name="arrow-left" size={30} color={colors.black} />
      </Pressable>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content_container}
      >
        {/* Banner Image and Heading */}
        <View style={styles.home_img_container}>
          <Image
            source={require("../../assets/Images/vendor.png")}
            style={styles.home_img}
          />
          <Text style={styles.heading_txt}>
            Become a Vendor - List Your Vehicles!
          </Text>
        </View>

        {/* Slogan */}
        <View style={styles.slogan_container}>
          <Image
            source={require("../../assets/Images/coin-2.png")}
            style={styles.coin_img}
          />
          <Text style={styles.slogan_txt}>
            Drive More, Earn More - Unleash Your Potential!
          </Text>
        </View>

        {/* Passenger Vehicles Section */}
        <View style={styles.vehicle_main_container}>
          <Text style={styles.vehicle_heading_txt}>Add Passenger Vehicles</Text>

          <View style={styles.vehicle_section}>
            <Pressable
              style={styles.vehicle_container}
              onPress={() => navigation.navigate("AutoRegForm")}
            >
              <Image
                source={require("../../assets/Images/auto.png")}
                style={styles.vehicle_img}
              />
              <Text style={styles.vehicle_name_txt}>Auto</Text>
            </Pressable>

            <Pressable
              style={styles.vehicle_container}
              onPress={() => navigation.navigate("CarRegForm")}
            >
              <Image
                source={require("../../assets/Images/car5.png")}
                style={styles.vehicle_img}
              />
              <Text style={styles.vehicle_name_txt}>Car</Text>
            </Pressable>
          </View>

          <View style={styles.vehicle_section}>
            <Pressable
              style={styles.vehicle_container}
              onPress={() => navigation.navigate("VanRegForm")}
            >
              <Image
                source={require("../../assets/Images/van.png")}
                style={styles.vehicle_img}
              />
              <Text style={styles.vehicle_name_txt}>Van</Text>
            </Pressable>

            <Pressable
              style={styles.vehicle_container}
              onPress={() => navigation.navigate("BusRegForm")}
            >
              <Image
                source={require("../../assets/Images/bus.png")}
                style={styles.vehicle_img}
              />
              <Text style={styles.vehicle_name_txt}>Bus</Text>
            </Pressable>
          </View>
        </View>

        {/* Goods Vehicles Section */}
        <View style={[styles.vehicle_main_container, styles.vehicle_main_goods_container]}>
          <Text style={styles.vehicle_heading_txt}>Add Goods Vehicles</Text>

          <View style={styles.vehicle_section}>
            <Pressable
              style={styles.vehicle_container}
              onPress={() => navigation.navigate("GoodsRegForm", { type: "Small" })}
            >
              <Image
                source={require("../../assets/Images/under1-ton.jpg")}
                style={styles.vehicle_img}
              />
              <Text style={styles.vehicle_name_txt}>0.5 - 1 Ton</Text>
            </Pressable>

            <Pressable
              style={styles.vehicle_container}
              onPress={() => navigation.navigate("GoodsRegForm", { type: "Medium" })}
            >
              <Image
                source={require("../../assets/Images/XL-truck.png")}
                style={styles.vehicle_img}
              />
              <Text style={styles.vehicle_name_txt}>1.1 - 10 Ton</Text>
            </Pressable>
          </View>

          <View style={styles.vehicle_section}>
            <Pressable
              style={styles.vehicle_container}
              onPress={() => navigation.navigate("GoodsRegForm", { type: "Large" })}
            >
              <Image
                source={require("../../assets/Images/below-20-ton.png")}
                style={styles.vehicle_img}
              />
              <Text style={styles.vehicle_name_txt}>10.1 - 20 Ton</Text>
            </Pressable>

            <Pressable
              style={styles.vehicle_container}
              onPress={() => navigation.navigate("GoodsRegForm", { type: "XL" })}
            >
              <Image
                source={require("../../assets/Images/moreThen20-ton.png")}
                style={styles.vehicle_img}
              />
              <Text style={styles.vehicle_name_txt}>More than 20 Ton</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default BecomeVendorScreen;

const styles = StyleSheet.create({
  main_container: { flex: 1, backgroundColor: colors.white },
  nav_container: { paddingTop: hp(5), paddingHorizontal: wp(4), paddingBottom: hp(2), backgroundColor: colors.light_gray },
  content_container: { padding: wp(4), paddingBottom: hp(5) },
  home_img_container: { alignItems: "center", marginVertical: hp(2) },
  home_img: { width: "80%", height: 120, resizeMode: "contain", marginTop: -10 },
  heading_txt: { fontSize: 20, fontWeight: "800", textAlign: "center", marginTop: 8 },
  slogan_container: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.light_yellow, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, marginBottom: 10 },
  coin_img: { width: 18, height: 18 },
  slogan_txt: { fontSize: 13, fontWeight: "600", color: colors.black },
  vehicle_main_container: { marginVertical: 10, padding: 10, borderRadius: 10, borderWidth: 0.4, borderColor: colors.dark_green, backgroundColor: colors.very_light_gray },
  vehicle_main_goods_container: { marginBottom: hp(5) },
  vehicle_heading_txt: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
  vehicle_section: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
  vehicle_container: { width: wp(42), alignItems: "center", justifyContent: "center", backgroundColor: colors.white, borderColor: colors.light_green, borderWidth: 0.5, borderRadius: 5, paddingVertical: 10 },
  vehicle_img: { width: 130, height: 100, resizeMode: "contain", marginBottom: 5 },
  vehicle_name_txt: { fontSize: 16, fontWeight: "700", textAlign: "center" },
});
