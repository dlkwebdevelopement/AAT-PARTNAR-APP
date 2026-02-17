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
import React, { useState } from "react";
import { past_booking_Data } from "../../Data/PastBooking_data";
import { colors } from "../../utils/constants";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Icon1 from "react-native-vector-icons/Entypo";
import Icon2 from "react-native-vector-icons/MaterialCommunityIcons";
import Icon3 from "react-native-vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import moment from "moment";

const PastBookings = () => {
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

  const filteredData =
    filtered === "all"
      ? bookingDetails
      : bookingDetails.filter((book) => book.tripStatus === filtered);

  const handleButton = () => {
    setFiltered("all");
    setShowButton(!showButton);
  };
  const handleApproved = () => {
    setFiltered("completed");
    setShowButton(false);
  };
  const handlePending = () => {
    setFiltered("cancelled");
    setShowButton(false);
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
          (item.vendorApprovedStatus === "rejected") ||
          (item.tripStatus === "completed" || item.tripStatus === "cancelled")
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

  if (loading) {
    return (
      <View style={styles.load}>
        <ActivityIndicator size="large" color={colors.dark_green} />
      </View>
    );
  }

  // if(bookingDetails.length === 0){
  //   <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} style={styles.no_data_main_container}>
  //   {/* bell image */}
  //   <Image
  //     source={require("../../assets/Images/no-history.png")}
  //     style={styles.img}
  //   />
  //   {/* main text */}
  //   <Text style={styles.main_txt}>No Details</Text>
  //   <Text style={styles.sub_txt}>
  //     You do not have any bookings history at this time
  //   </Text>
  // </ScrollView>
  // }

  return (
    <>
      <>
        {/* Filter section */}
        {bookingDetails.length > 0 && (
          <View style={styles.filter_main_container}>
            {/*show all button */}
            <TouchableOpacity
              style={styles.filter_btn_container}
              onPress={handleButton}
            >
              {/* icon */}
              <Icon name="filter-alt" size={20} />
              {/* button text */}
              <Text style={styles.filter_btn_txt}>
                {filtered === "all"
                  ? "All"
                  : filtered.charAt(0).toUpperCase() + filtered.slice(1)}
              </Text>
            </TouchableOpacity>
            {showButton && (
              <>
                {/* Completed button */}
                <TouchableOpacity
                  style={[
                    styles.filter_btn_container,
                    styles.approved_btn_container,
                  ]}
                  onPress={handleApproved}
                >
                  {/* icon */}
                  <Icon1 name="check" size={17} color={colors.black} />
                  {/* button text */}
                  <Text
                    style={[styles.filter_btn_txt, styles.approved_btn_txt]}
                  >
                    Completed
                  </Text>
                </TouchableOpacity>
                {/* Pending button */}
                <TouchableOpacity
                  style={[
                    styles.filter_btn_container,
                    styles.rejected_btn_container,
                  ]}
                  onPress={handlePending}
                >
                  {/* icon */}
                  <Icon1 name="cross" size={20} />
                  {/* button text */}
                  <Text style={styles.filter_btn_txt}>Cancelled</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </>

      {/* booking details list */}

      {filteredData.length === 0 ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.no_data_main_container}
        >
          {/* bell image */}
          <Image
            source={require("../../assets/Images/no-history.png")}
            style={styles.img}
          />
          {/* main text */}
          <Text style={styles.main_txt}>No Details</Text>
          <Text style={styles.sub_txt}>
            You do not have any bookings history at this time
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          data={filteredData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            // bookings list main section
            <Pressable
              onPress={() =>
                navigation.navigate("AutoBookingDetails", {
                  bookingDetails: item,
                })
              }
              style={styles.booking_list_main_container}
            >
              {/* header section */}
              <View style={styles.header_section}>
                {/* user name and icon container */}
                <View style={styles.user_and_booking_date_container}>
                  {/* user icon */}
                  <Image
                    source={require("../../assets/Images/user-past.png")}
                    style={styles.user_icon}
                  />
                  {/* user name and booking date*/}
                  <View style={{ gap: 3 }}>
                    {/* customer name */}
                    <Text style={styles.cutomer_name_txt}>
                      {item.customer.customerName}
                    </Text>
                    {/* booking date */}
                    <Text style={styles.booking_date_txt}>
                      {moment(item.bookedAt).format("DD-MM-YYYY")}
                    </Text>  

                    
                  </View>
                </View>
                {/*booking status section*/}
                <View style={{justifyContent:"center",alignItems:"center"}}>
                <Text
                  style={[
                    styles.booking_status_txt,
                    item.tripStatus === "cancelled"
                      ? styles.rejected_booking
                      : styles.booking_status_txt,
                  ]}
                >
                  {item.tripStatus.charAt(0).toUpperCase() +
                    item.tripStatus.slice(1)}
                </Text>

                <Text style={styles.booking_date_txt}>
                    ID: {String(item._id).slice(-5).toLocaleUpperCase()}
                    </Text>
                </View>
               
              </View>
              {/* description container */}
              <View style={styles.desc_container}>
                {/* vehicle no */}
                <Text style={styles.desc_txt}>
                  Vehicle No: {item.vehicleDetails.foundVehicle.licensePlate}
                </Text>
                {/* pick up date */}
                <Text style={styles.desc_txt}>
                  Pick-up date: {moment(item.pickupDate).format("DD-MM-YYYY")}
                </Text>
                {/* Drop date */}
                {item.tripStatus === "completed" ? (
                  <Text style={styles.desc_txt}>
                  Drop date: {item.returnDate !==null
                    ? moment(item.returnDate).format("DD-MM-YYYY") 
                    : moment(item.pickupDate).format("DD-MM-YYYY")
                  }
                </Text>
                ) : (
                  ""
                )}

                {item.tripStatus === "cancelled" && (
                  <Text style={styles.desc_txt}>
                    Rejected Reason: {item.vendorRejectedReason?item.vendorRejectedReason :item.customerCancelledReason}
                  </Text>
                )}

                {/* pick up location */}
                {/* <View style={styles.location_container}>
                <Icon3
                  name="location-crosshairs"
                  size={12}
                  color={colors.dark_green}
                />
                <Text style={styles.location_txt}>{item.pick_up_location}</Text>
              </View> */}
                {/* drop location */}
                {/* <View style={styles.location_container}>
                <Icon3
                  name="location-dot"
                  size={12}
                  color={colors.dark_green}
                />
                <Text style={styles.location_txt}>{item.drop_location}</Text>
              </View> */}
              </View>
            </Pressable>
          )}
        />
      )}
    </>
  );
};

export default PastBookings;

const styles = StyleSheet.create({
  // No data available section style
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  rejected_btn_container: {
    backgroundColor: colors.light_orange,
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
    backgroundColor: colors.smoke_white,
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderColor: colors.label_green,
    borderWidth: 0.3,
  },
  user_and_booking_date_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,

    // backgroundColor: colors.pale_green,
    // padding: 5,
    // borderRadius: 5,
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
    width: 80,
    textAlign: "center",
    borderRadius: 3,
    color: colors.white,
    fontWeight: "600",
  },
  rejected_booking: {
    backgroundColor: colors.red,
    color: colors.white,
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
});
