import { StyleSheet, Text, View, Pressable } from "react-native";
import { FontAwesome5, MaterialIcons, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors } from "../utils/constants";
import StepsCarousel from "./StepsCarousel";
import AxiosService from "../utils/AxioService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const StatsComp = () => {
  const navigation = useNavigation();
  const [vehicleCount, setVehicleCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [vendorId, setVendorId] = useState("");
  const [totalUpcomingBookings, setTotalUpComingBookings] = useState(0);


  useFocusEffect(
    React.useCallback(()=>{
      getData();
    },[])
  )



  const getData = async () => {
    try {
      const vendor = await AsyncStorage.getItem("user");
      if (vendor) {
        const vendorData = JSON.parse(vendor);
        const vendorID = vendorData._id;
        setVendorId(vendorID);

        const [vendorRes, bookingsRes] = await Promise.all([
          AxiosService.post("vendor/getVendorById", {
            vendorId: vendorID,
          }),
          AxiosService.get(`vendor/getBookingsByVendorId/${vendorID}`),
        ]);

        if (vendorRes.status === 200) {
          const totalVehicles =
            vendorRes.data.user.vehicles.cars.length +
            vendorRes.data.user.vehicles.vans.length +
            vendorRes.data.user.vehicles.autos.length +
            vendorRes.data.user.vehicles.buses.length +
            vendorRes.data.user.vehicles.trucks.length;

          const formattedVehicleCount =
            totalVehicles < 10 ? `0${totalVehicles}` : totalVehicles;
          setVehicleCount(formattedVehicleCount);
          setTotalEarnings(vendorRes.data.user.totalEarnings);
        }

        if (bookingsRes.status === 200) {
          const totalBookingsData = bookingsRes.data.bookings
          const totalBookingsapproved = totalBookingsData.filter((item)=>item.vendorApprovedStatus === "approved")
          const totalBookingsCount = totalBookingsapproved.length
                    

          const upcomingBookings = bookingsRes.data.bookings.filter(
            (booking) =>
              booking.vendorApprovedStatus === "pending"
          );

          const totalUpcomingBookingsCount = upcomingBookings.length;

          setTotalUpComingBookings(totalUpcomingBookingsCount);
          setTotalBookings(totalBookingsCount);
        }
      } 
    } catch (error) {
      console.log("Error retrieving data:", error);
    }
  }; 
 
  const formattedTotalBookings =
    totalBookings < 10 ? `0${totalBookings}` : totalBookings;
  const formattedUpcomingBookings =
    totalUpcomingBookings < 10
      ? `0${totalUpcomingBookings}`
      : totalUpcomingBookings;

 


  return (
    <View style={styles.main_container}>
      {/* content container */}
      <View style={styles.content_container}>
        {/* first section */}
        <View style={styles.first_sec}>
          {/* vehicle container */}
          <Pressable 
            style={[styles.vehicle_container, { backgroundColor: '#E3F2FD' }]}
            onPress={() => navigation.navigate("Vehicle Management")}
          >
            {/* image container */}
            <LinearGradient 
              colors={['#00d2ff', '#3a7bd5']}
              style={[styles.icon_gradient_container, { shadowColor: '#3a7bd5' }]}
              start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            >
              <Ionicons name="car-sport" size={24} color="#ffffff" />
            </LinearGradient>
            {/* description container */}
            <View style={styles.desc_container}>
              {/* heading text */}
              <Text style={styles.heading_txt}>Total Vehicles</Text>
              {/* count text */}
              <Text style={styles.count_txt}>{vehicleCount}</Text>
            </View>
          </Pressable>
          {/* total earnings container */}
          <Pressable
            style={[styles.vehicle_container, styles.earnings_container, { backgroundColor: '#EFF6FF' }]}
            onPress={() => navigation.navigate("My Earnings")}
          >
            {/* image container */}
            <LinearGradient 
              colors={['#00b09b', '#96c93d']}
              style={[styles.icon_gradient_container, { shadowColor: '#00b09b' }]}
              start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            >
              <FontAwesome5 name="rupee-sign" size={20} color="#ffffff" />
            </LinearGradient>
            {/* description container */}
            <View style={styles.desc_container}>
              {/* heading text */}
              <Text style={styles.heading_txt}>Total Earnings</Text>
              {/* count text */}
              <Text style={styles.count_txt}>₹ {totalEarnings?parseFloat(totalEarnings).toFixed(2):'00'}</Text>
            </View>
          </Pressable>
        </View>
        {/* second section */}
        <View style={styles.first_sec}>
          {/* booking details container */}
          <Pressable
            style={[styles.vehicle_container, styles.booking_container, { backgroundColor: '#FFEBEE' }]}
            onPress={() => navigation.navigate("My Bookings")}
          >
            {/* image container */}
            <LinearGradient 
              colors={['#ff416c', '#ff4b2b']}
              style={[styles.icon_gradient_container, { shadowColor: '#ff416c' }]}
              start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            >
              <Ionicons name="calendar" size={24} color="#ffffff" />
            </LinearGradient>
            {/* description container */}
            <View style={styles.desc_container}>
              {/* heading text */}
              <Text style={styles.heading_txt}>Total Bookings</Text>
              {/* count text */}
              <Text style={styles.count_txt}>{formattedTotalBookings}</Text>
            </View>
          </Pressable>
          {/* Upcoming Trips */}
          <Pressable
            style={[styles.vehicle_container, styles.upcoming_container, { backgroundColor: '#FFF3E0' }]}
            onPress={() => navigation.navigate("My Bookings")}
          >
            {/* image container */}
            <LinearGradient 
              colors={['#f7971e', '#ffd200']}
              style={[styles.icon_gradient_container, { shadowColor: '#f7971e' }]}
              start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            >
              <MaterialCommunityIcons name="clock-fast" size={26} color="#ffffff" />
            </LinearGradient>
            {/* description container */}
            <View style={styles.desc_container}>
              {/* heading text */}
              <Text style={styles.heading_txt}>Upcoming Trips</Text>
              {/* count text */}
              <Text style={styles.count_txt}> {formattedUpcomingBookings}</Text>
            </View>
          </Pressable>
        </View>
        {/* Need help section */}
        <Pressable 
          style={[styles.need_help_container, { backgroundColor: '#F3E5F5' }]}
          onPress={() => navigation.navigate("Support")}
        >
          {/* image */}
          <LinearGradient 
            colors={['#8e2de2', '#4a00e0']}
            style={[styles.icon_gradient_container, { shadowColor: '#8e2de2' }]}
            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
          >
            <MaterialIcons name="support-agent" size={28} color="#ffffff" />
          </LinearGradient>
          {/* description section */}
          <View style={{ gap: 3 }}>
            <Text style={styles.need_help_heading_txt}>Need any help</Text>
            <Text style={styles.need_help_sub_heading_txt}>Chat with us</Text>
          </View>
        </Pressable>
        {/* steps carousel */}
        <StepsCarousel />
      </View>
    </View>
  );
};

export default StatsComp;

const styles = StyleSheet.create({
  main_container: {
    // paddingHorizontal: 15,
  },
  first_sec: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  desc_container: {
    gap: 5,
  },
  // vehicle statistics container style
  icon_gradient_container: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  vehicle_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    width: wp(45),
    padding: 12,
    justifyContent: "space-between",
    borderRadius: 14,
    paddingVertical: 15,
    elevation: 4,
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
  },
  heading_txt: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.placeholder_gray,
  },
  count_txt: {
    fontSize: 18,
    fontWeight: "800",
    width: "100%",
    color: colors.deep_blue,
  },
  // earnings container style
  earnings_container: {
  },
  // booking container style
  booking_container: {
  },
  // upcoming bookings container
  upcoming_container: {
  },
  // Need help seection style
  need_help_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 14,
    elevation: 4,
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
  },
  need_help_heading_txt: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.deep_blue,
  },
  need_help_sub_heading_txt: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.placeholder_gray,
  }
});
