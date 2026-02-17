import { StyleSheet, Text, View, Image, Pressable } from "react-native";
import React, { useState, useEffect } from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../utils/constants";
import StepsCarousel from "./StepsCarousel";
import AxiosService from "../utils/AxioService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const StatsComp = () => {
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
          <Pressable style={styles.vehicle_container}>
            {/* image container */}
            <View>
              <Image
                source={require("../assets/Images/vehicle2.png")}
                style={styles.img}
              />
            </View>
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
            style={[styles.vehicle_container, styles.earnings_container]}
          >
            {/* image container */}
            <View>
              <Image
                source={require("../assets/Images/earnings.png")}
                style={styles.img}
              />
            </View>
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
            style={[styles.vehicle_container, styles.booking_container]}
          >
            {/* image container */}
            <View>
              <Image
                source={require("../assets/Images/bookings.png")}
                style={styles.img}
              />
            </View>
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
            style={[styles.vehicle_container, styles.upcoming_container]}
          >
            {/* image container */}
            <View>
              <Image
                source={require("../assets/Images/upcoming_trips.png")}
                style={styles.upcoming_img}
              />
            </View>
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
        <Pressable style={styles.need_help_container}>
          {/* image */}
          <Image
            source={require("../assets/Images/customer_support.png")}
            style={styles.cutomer_supp_img}
          />
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
  img: {
    width: 36,
    height: 36,
  },
  vehicle_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.very_light_green,
    width: wp(45),
    padding: 10,
    justifyContent: "space-between",
    borderRadius: 10,
    paddingVertical: 15,
    elevation: 2,
    borderColor: colors.light_green,
    borderWidth: 0.7,
  },
  heading_txt: {
    fontSize: 15.5,
    fontWeight: "700",
  },
  count_txt: {
    fontSize: 18,
    fontWeight: "800",
    width: "100%",
  },
  // earnings container style
  earnings_container: {
    backgroundColor: colors.light_yellow,
    borderColor: "#ffd60a",
    borderWidth: 0.7,
  },
  // booking container style
  booking_container: {
    backgroundColor: colors.light_orange,
    borderColor: "#ff8500",
    borderWidth: 0.7,
  },
  // upcoming bookings container
  upcoming_container: {
    backgroundColor: colors.light_purple,
    borderColor: "#9d4edd",
    borderWidth: 0.7,
  },
  upcoming_img: {
    width: 35,
    height: 26,
  },
  // Need help seection style
  cutomer_supp_img: {
    width: 40,
    height: 40,
  },
  need_help_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
    backgroundColor: colors.light_blue,
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    borderColor: "#4895ef",
    borderWidth: 0.7,
  },
  need_help_heading_txt: {
    fontSize: 18,
    fontWeight: "700",
  },
  need_help_sub_heading_txt: {
    fontSize: 14,
    fontWeight: "500",
  },
});
