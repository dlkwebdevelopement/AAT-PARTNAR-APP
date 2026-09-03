import { StyleSheet, Text, View, TouchableOpacity, Animated } from "react-native";
import React, { useState, useRef } from "react";
import { colors } from "../../utils/constants";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import PassengerVehicleList from "../../components/Vehicles/PassengerVehicleList";
import GoodsVehicleList from "../../components/Vehicles/GoodsVehicleList";

const VehicleManageScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("passenger");
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Button indicator position
  const [indicatorPosition] = useState(new Animated.Value(0));

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    
    // Fade out current list
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(indicatorPosition, {
        toValue: tab === "passenger" ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTab(tab);
      
      // Fade in new list
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  // Calculate indicator position based on active tab
  const indicatorTranslateX = indicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, wp(42) + 10], // Width of button + gap
  });

  return (
    <View style={styles.main_container}>
      {/* Button container with sliding indicator */}
      <View style={styles.Btn_main_container}>
        <Animated.View 
          style={[
            styles.sliding_indicator,
            {
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]} 
        />
        
        {/* Passenger vehicle button */}
        <TouchableOpacity
          style={[styles.btn_container]}
          onPress={() => handleTabChange("passenger")}
          activeOpacity={0.7}
        >
          <FontAwesome5
            name="car-side"
            size={18}
            color={activeTab === "passenger" ? colors.white : colors.deep_blue}
          />
          <Text style={[
            styles.btn_txt, 
            activeTab === "passenger" && styles.selected_btn_txt
          ]}>
            Passenger
          </Text>
        </TouchableOpacity>
        
        {/* Goods vehicle button */}
        <TouchableOpacity
          style={[styles.btn_container]}
          onPress={() => handleTabChange("goods")}
          activeOpacity={0.7}
        >
          <FontAwesome5
            name="truck"
            size={18}
            color={activeTab === "goods" ? colors.white : colors.deep_blue}
          />
          <Text style={[
            styles.btn_txt, 
            activeTab === "goods" && styles.selected_btn_txt
          ]}>
            Goods
          </Text>
        </TouchableOpacity>
      </View>

      {/* Prominent Add vehicle button */}
      <TouchableOpacity
        style={styles.add_btn_container}
        onPress={() => navigation.navigate("BecomeVendor")}
        activeOpacity={0.8}
      >
        <View style={styles.add_btn_content}>
          <FontAwesome5 name="plus-circle" size={20} color={colors.white} />
          <Text style={styles.add_btn_txt}>Add New Vehicle</Text>
          <FontAwesome5 name="arrow-right" size={16} color={colors.white} style={styles.arrow_icon} />
        </View>
      </TouchableOpacity>

      {/* Vehicle count badge */}
    

      {/* Animated content */}
      <Animated.View style={[styles.content_container, { opacity: fadeAnim }]}>
        {activeTab === "passenger" && <PassengerVehicleList />}
        {activeTab === "goods" && <GoodsVehicleList />}
      </Animated.View>
    </View>
  );
};

export default VehicleManageScreen;

const styles = StyleSheet.create({
  main_container: {
    backgroundColor: colors.white,
    flex: 1,
    paddingTop: hp(2),
    paddingHorizontal: wp(4),
  },

  // Header styles
  header_container: {
    marginBottom: hp(2),
  },
  header_title: {
    fontSize: hp(3.2),
    fontWeight: "bold",
    color: colors.black,
    marginBottom: hp(0.5),
  },
  header_subtitle: {
    fontSize: hp(1.8),
    color: colors.gray,
    fontWeight: "500",
  },
  
  // Button section style with sliding indicator
  Btn_main_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    padding: hp(0.8),
    borderRadius: 12,
    gap: wp(2.5),
    marginBottom: hp(2),
    position: "relative",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  sliding_indicator: {
    position: "absolute",
    width: wp(42),
    height: hp(5.5),
    backgroundColor: colors.red,
    borderRadius: 8,
    left: hp(0.8),
    top: hp(0.8),
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  btn_txt: {
    fontSize: hp(1.9),
    fontWeight: "700",
    color: colors.black,
  },
  
  selected_btn_txt: {
    color: colors.white,
  },
  
  btn_container: {
    backgroundColor: "transparent",
    padding: hp(1),
    paddingVertical: hp(1.2),
    width: wp(42),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: wp(2.5),
    zIndex: 1,
  },
  
  // Enhanced Add button styles
  add_btn_container: {
    backgroundColor: colors.deep_blue,
    borderRadius: 14,
    marginBottom: hp(2),
    marginTop: hp(0.5),
    elevation: 5,
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: colors.deep_blue,
  },
  
  add_btn_content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: hp(1.8),
    gap: wp(3),
  },
  
  add_btn_txt: {
    fontSize: hp(2.2),
    color: colors.white,
    fontWeight: "bold",
    letterSpacing: 0.5,
    flex: 0.8,
    textAlign: "center",
  },
  
  arrow_icon: {
    opacity: 0.9,
  },
  
  // Count badge styles
  count_badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: hp(1.5),
    gap: wp(2),
  },
  
  count_text: {
    fontSize: hp(1.6),
    color: colors.deep_blue,
    fontWeight: "600",
  },
  
  content_container: {
    flex: 1,
    marginTop: hp(0.5),
  },
});