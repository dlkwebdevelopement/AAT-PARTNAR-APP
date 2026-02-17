import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  FlatList,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import { colors } from "../../utils/constants";
import { useFocusEffect } from "@react-navigation/native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Icon from "react-native-vector-icons/MaterialIcons";
import Icon1 from "react-native-vector-icons/Entypo";
import Icon2 from "react-native-vector-icons/MaterialCommunityIcons";
import Icon3 from "react-native-vector-icons/FontAwesome6";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import moment from "moment";

const UpcomingBookings = () => {
  const [showButton, setShowButton] = useState(false);
  const [filtered, setFiltered] = useState("all");
  const [loading, setLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      getBookings();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await getBookings();
    setRefreshing(false);
  };

  const getBookings = async () => {
    try {
      setLoading(true);
      const vendor = await AsyncStorage.getItem("user");
      const vendorData = JSON.parse(vendor);
      const vendorId = vendorData._id;

      const res = await AxiosService.get(
        `vendor/getBookingsByVendorId/${vendorId}`
      );
      const data = res.data.bookings;
      const filteredData = data.filter(
        (item) =>
          (item.vendorApprovedStatus === "approved" ||
            item.vendorApprovedStatus === "pending") &&
          item.tripStatus !== "completed" &&
          item.tripStatus !== "cancelled"
      );

      if (res.status === 200) {
        setBookingDetails(filteredData);
        console.log("Bookings fetched successfully");
      }
    } catch (error) {
      console.error(
        error.response
          ? error.response.data.error
          : error.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredData =
    filtered === "all"
      ? bookingDetails
      : bookingDetails.filter((book) => book.vendorApprovedStatus === filtered);

  const toggleFilter = (filter) => {
    setFiltered(filter);
    setShowButton(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.dark_green} />
      </View>
    );
  }

  if (bookingDetails.length === 0) {
    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.no_data_main_container}
      >
        <Image
          source={require("../../assets/Images/no-booking.png")}
          style={styles.img}
        />
        <Text style={styles.main_txt}>No Bookings</Text>
        <Text style={styles.sub_txt}>
          You do not have any bookings at this time
        </Text>
      </ScrollView>
    );
  }

  return (
    <>
      {/* Filter section */}
      <View style={styles.filter_main_container}>
        <TouchableOpacity
          style={styles.filter_btn_container}
          onPress={() => setShowButton(!showButton)}
        >
          <Icon name="filter-alt" size={20} />
          <Text style={styles.filter_btn_txt}>
            {filtered.charAt(0).toUpperCase() + filtered.slice(1)}
          </Text>
        </TouchableOpacity>
        {showButton && (
          <>
            <TouchableOpacity
              style={[
                styles.filter_btn_container,
                styles.approved_btn_container,
              ]}
              onPress={() => toggleFilter("approved")}
            >
              <Icon1 name="check" size={17} color={colors.black} />
              <Text style={[styles.filter_btn_txt, styles.approved_btn_txt]}>
                Approved
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filter_btn_container,
                styles.pending_btn_container,
              ]}
              onPress={() => toggleFilter("pending")}
            >
              <Icon2 name="timer-sand" size={20} />
              <Text style={styles.filter_btn_txt}>Pending</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Booking details list */}

      {filteredData.length === 0 ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.no_data_main_container}
        >
          <Image
            source={require("../../assets/Images/no-booking.png")}
            style={styles.img}
          />
          <Text style={styles.main_txt}>No Bookings</Text>
          <Text style={styles.sub_txt}>
            You do not have any bookings at this time
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          data={filteredData.reverse()}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Pressable
              style={styles.booking_list_main_container}
              onPress={() =>
                navigation.navigate("AutoBookingDetails", {
                  bookingDetails: item,
                })
              }
            >
              <View style={styles.header_section}>
                <View style={styles.user_and_booking_date_container}>
                  <Image
                    source={require("../../assets/Images/user.png")}
                    style={styles.user_icon}
                  />
                  <View style={{ gap: 3 }}>
                    <Text style={styles.cutomer_name_txt}>
                      {item.customer.customerName}
                    </Text>
                    <Text style={styles.booking_date_txt}>
                      {moment(item.bookedAt).format("DD-MM-YYYY")}
                    </Text>
                  </View>
                </View>
                <View>
                <Text
                  style={[
                    styles.booking_status_txt,
                    item.vendorApprovedStatus === "pending"
                      ? styles.pending_booking
                      : {},
                  ]}
                >
                  {item.vendorApprovedStatus.charAt(0).toUpperCase() +
                    item.vendorApprovedStatus.slice(1)}
                </Text>
                <Text style={[styles.booking_date_txt,{marginTop:3,textAlign:"center"}]}>
                ID: {String(item._id).slice(-5).toLocaleUpperCase()}
                </Text>
                </View>
              </View>
              <View style={{}}>
                <View style={styles.desc_container}>
                  <View style={styles.vehicle_no_img_container}>
                    <View>
                      <Text style={styles.desc_txt}>
                        Vehicle No:{" "}
                        {item.vehicleDetails.foundVehicle.licensePlate}
                      </Text>
                      <Text style={styles.desc_txt}>
                        Pick-up date:{" "}
                        {moment(item.pickupDate).format("DD-MM-YYYY")}
                      </Text>
                    </View>
                    <Image source={item.image} style={styles.vehicle_img} />
                  </View>
                  <View style={styles.location_container}>
                    <Icon3
                      name="location-crosshairs"
                      size={12}
                      color={colors.dark_green}
                    />
                    <Text style={styles.location_txt}>
                      {item.pickupLocation}
                    </Text>
                  </View>
                  <View style={styles.location_container}>
                    <Icon3
                      name="location-dot"
                      size={12}
                      color={colors.dark_green}
                    />
                    <Text style={styles.location_txt}>{item.dropLocation}</Text>
                  </View>
                </View>

                {item.vendorApprovedStatus === "approved" && (
                  <View>
                    <Text
                      style={[
                        styles.desc_txt,
                        {
                          borderTopWidth: 1,
                          borderTopColor: colors.light_gray,
                          paddingTop: 5,
                          marginTop: 5,
                        },
                      ]}
                    >
                      Trip Status:{" "}
                      <Text
                        style={[
                          styles.desc_txt,
                          item.tripStatus === "ongoing"
                            ? styles.ongoing_txt
                            : styles.yet_to_start_txt,
                        ]}
                      >
                        {" "}
                        {item.tripStatus === "start"
                          ? "Yet to start"
                          : item.tripStatus.charAt(0).toUpperCase() +
                            item.tripStatus.slice(1)}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </>
  );
};

export default UpcomingBookings;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // No data available section style
  no_data_main_container: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(15),
    gap: 10,
  },
  img: {
    height: hp(27),
    width: wp(100),
    resizeMode: "contain",
  },
  main_txt: {
    fontSize: 25,
    fontWeight: "800",
    color: colors.dark_green,
    marginTop: -20,
  },
  sub_txt: {
    fontSize: 16,
    maxWidth: wp(55),
    textAlign: "center",
    fontWeight: "500",
    color: colors.dark_gray,
  },
  //   filter section style
  filter_main_container: {
    alignItems: "center",
    borderColor: colors.dark_green,
    borderWidth: 0.2,
    width: wp(40),
    alignSelf: "flex-end",
    backgroundColor: colors.white,
    padding: 3,
    borderRadius: 2.5,
    marginBottom: 10,
    gap: 5,
  },
  filter_btn_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.light_gray,
    width: "100%",
    justifyContent: "center",
    padding: 5,
    borderRadius: 50,
    borderWidth: 0.3,
    borderColor: colors.dark_gray,
  },
  approved_btn_container: {
    backgroundColor: colors.label_green,
  },
  pending_btn_container: {
    backgroundColor: colors.light_yellow,
  },
  filter_btn_txt: {
    fontSize: 17,
    fontWeight: "600",
  },
  approved_btn_txt: {
    color: colors.black,
  },
  // booking details list style
  booking_list_main_container: {
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: colors.light_gray,
    borderWidth: 1,
    elevation: 0.5,
  },
  header_section: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: colors.pale_green,
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderColor: colors.label_green,
    borderWidth: 0.3,
  },
  vehicle_no_img_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vehicle_img: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  user_and_booking_date_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  user_icon: {
    width: 45,
    height: 45,
    resizeMode: "contain",
  },
  cutomer_name_txt: {
    fontSize: 18,
    fontWeight: "700",
  },
  booking_status_txt: {
    backgroundColor: colors.dark_green,
    paddingHorizontal: 5,
    paddingVertical: 3,
    width: 75,
    textAlign: "center",
    borderRadius: 3,
    color: colors.white,
    fontWeight: "600",
  },
  pending_booking: {
    backgroundColor: colors.light_yellow,
    color: colors.black,
    borderColor: colors.yellow,
    borderWidth: 0.8,
  },
  booking_date_txt: {
    fontWeight: "500",
    color: colors.dark_gray,
  },
  location_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    // gap: 10,
  },
  desc_container: {
    gap: 3,
  },
  desc_txt: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.dark_gray,
  },
  location_txt: {
    fontWeight: "700",
    marginLeft: 5,
  },
  ongoing_txt: {
    color: colors.red,
  },
  yet_to_start_txt: {
    color: colors.dark_green,
  },
});
