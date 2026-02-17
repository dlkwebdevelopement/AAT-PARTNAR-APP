import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Image,
  Linking,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { colors } from "../../utils/constants";
import Icon from "react-native-vector-icons/AntDesign";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
// import { useNavigation } from "@react-navigation/native";
import Icon3 from "react-native-vector-icons/FontAwesome6";
import { TouchableOpacity } from "react-native";
import carImg from "../../assets/Images/car5.png";
import autoImg from "../../assets/Images/auto.png";
import vanImg from "../../assets/Images/van.png";
import busImg from "../../assets/Images/bus.png";
import smallTruckImg from "../../assets/Images/under1-ton.jpg";
import mediumTruckImg from "../../assets/Images/XL-truck.png";
import largeTruckImg from "../../assets/Images/below-20-ton.png";
import XLTruckImg from "../../assets/Images/moreThen20-ton.png";
import AxiosService from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import navigationgif from "../../assets/Images/navigation.png";
import Navigateicon from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AntDesign } from "@expo/vector-icons";

const API_KEY = "AIzaSyBwgknRJiqNR7SHEY2j68RVsMy5OOgU70I";

const AutoBookingDetails_screen = ({ navigation, route }) => {
  const [modalshow, setmodalshow] = useState(false);
  const [totalFare, setTotalFare] = useState();
  const [vendorRejectedReason, setVendorRejectedReason] = useState("");
  const [vendorApprovedStatus, setVendorApprovedStatus] = useState("");
  const [paymentMethod, setPamentMethod] = useState(null);
  const [pickupCoordinates, setPickupCoordinates] = useState(null);
  const [dropCoordinates, setDropCoordinates] = useState(null);
  const { bookingDetails } = route.params;
  // const navigation = useNavigation();
  const [otp, setOtp] = useState();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date(bookingDetails.pickupDate));
  const [show, setShow] = useState(false);
  const [modalForComplete, setModalForComplete] = useState(false);
  const [fare,setfare]=useState(1000)
  // const [selectedMethod, setSelectedMethod] = useState(null);
  let vehicleimg;
  const defaultTruckImg = XLTruckImg;

  useFocusEffect(
    React.useCallback(() => {
      handleSetLocations();
    }, [])
  );

  const showDatepicker = () => {
    setShow(true);
  };

  const onChange = (event, selectedDate) => {
    setShow(false);

    if (selectedDate) {
      setDate(selectedDate);
      handleReturnDateUpdate(selectedDate);
    }
  };

  const handleReturnDateUpdate = async (selectedDate) => {
    try {
      const res = await AxiosService.post("vendor/updateReturndate", {
        bookingId: bookingDetails._id,
        vendorId: bookingDetails.vehicleDetails.vendorId,
        vehicleId: bookingDetails.vehicleDetails.foundVehicle._id,
        date: selectedDate,
      });
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: res.data.message,
        });

        setTimeout(() => {
          navigation.navigate("My Bookings");
        }, 1000);
      }
    } catch (error) {
      if (error.response) {
        Toast.show({
          type: "error",
          text1: error.response.message,
        });
      } else if (error.message) {
        Toast.show({
          type: "error",
          text1: error.message,
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Something went wrong please try again later",
          position: "top",
        });
      }
    }
  };

  const handlePhone = (num) => {
    Linking.openURL(`tel:${num}`);
  };

  const BookingApproval = async (ApprovedStatus) => {
    setLoading(true);
    const bookingId = bookingDetails._id;

    if (bookingDetails?.tripType === "Round Trip" && !totalFare) {
      Toast.show({
        type: "info",
        text1: "Please enter the total amount",
        position: "top",
      });
      setLoading(false);
      return;
    }

    if (bookingDetails.tripType === "Round Trip") {
      if (
        ApprovedStatus === "approved" &&
        totalFare < 500 &&
        bookingDetails?.vehicleDetails.foundVehicle.subCategory !== "auto"
      ) {
        Toast.show({
          type: "info",
          text1: "The total amount must exceed the advance payment",
          position: "top",
        });
        setLoading(false);
        return;
      }
    }

    try {
      const res = await AxiosService.post("vendor/vendorBookingApproval", {
        bookingId,
        vendorApprovedStatus: ApprovedStatus
          ? ApprovedStatus
          : vendorApprovedStatus,
        vendorRejectedReason,
        totalFare: totalFare ? totalFare : bookingDetails?.totalFare,
      });
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: res.data.message,
          position: "top",
        }); 

        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      if (error.response) {
        Toast.show({
          type: "error",
          text1: error.response.data.message,
          position: "top",
        });
      } else if (error.message) {
        Toast.show({
          type: "error",
          text1: error.message,
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Something went wrong please try again later",
          position: "top",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const startRide = async () => {
    setLoading(true);
    const bookingId = bookingDetails._id;

    try {
      const res = await AxiosService.post("vendor/VendorStartTrip", {
        bookingId,
        otp,
      });
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: res.data.message,
          position: "top",
        });
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      if (error.response) {
        Toast.show({
          type: "error",
          text1: error.response.data.message,
          position: "top",
        });
      } else if (error.message) {
        Toast.show({
          type: "error",
          text1: error.message,
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Something went wrong please try again later",
          position: "top",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const RejectModelOpen = () => {
    setVendorApprovedStatus("rejected");
    setmodalshow(true);
  };

  const RejectModelClose = () => {
    setVendorApprovedStatus("");
    setVendorRejectedReason("");
    setmodalshow(false);
  };

  const showAlert = () => {
    Alert.alert(
      "Confirmation",
      "Are you sure confirm the ride.",
      [
        {
          text: "Cancel",
          onPress: () => setVendorApprovedStatus(""),
          style: "cancel",
        },
        {
          text: "ok",
          onPress: () => {
            setVendorApprovedStatus("approved");
            BookingApproval("approved");
          },
        },
      ],
      { cancelable: false }
    );
  };

  const completeRide = async () => {
    setLoading(true);
    const bookingId = bookingDetails._id;
    try {
      const res = await AxiosService.post("vendor/vendorCompleteRide", {
        bookingId,
        paymentMethod,
      });
      if (res.status === 200) {
        setModalForComplete(false);
        Toast.show({
          type: "success",
          text1: res.data.message,
          position: "top",
        });

        updateVendorPaymentDetials();

        setTimeout(() => {
          navigation.navigate("MainHome");
        }, 2000);
      }
    } catch (error) {
      if (error.response) {
        Toast.show({
          type: "error",
          text1: error.response.data.message,
          position: "top",
        });
      } else if (error.message) {
        Toast.show({
          type: "error",
          text1: error.message,
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Something went wrong please try again later",
          position: "top",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateVendorPaymentDetials = async () => {
    try {
      const res = await AxiosService.post(
        "vendor/getVendorBookingsByMonthAndWeek",
        { vendorId: bookingDetails.vehicleDetails.vendorId }
      );
      if (res.status === 200) {
        console.log("Vendor Payouts updated succesfully");
      }
    } catch (error) {
      console.log(error.response.data.message);
    }
  };

  const subCategoryImageMap = {
    car: carImg,
    auto: autoImg,
    van: vanImg,
    bus: busImg,
    truck: {
      Small: smallTruckImg,
      Medium: mediumTruckImg,
      Large: largeTruckImg,
      XL: XLTruckImg,
    },
  };

  const { subCategory, goodsType } = bookingDetails.vehicleDetails.foundVehicle;

  if (subCategory === "truck" && goodsType) {
    vehicleimg = subCategoryImageMap[subCategory][goodsType] || defaultTruckImg;
  } else {
    vehicleimg = subCategoryImageMap[subCategory] || defaultTruckImg;
  }

  const refundAdvance = async () => {
    try {
      const res = await AxiosService.post("vendor/vendorAdvanceRefund", {
        bookingId: bookingDetails._id,
      });
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: res.data.message,
          position: "top",
        });
      }
    } catch (error) {
      if (error.response) {
        Toast.show({
          type: "error",
          text1: error.response.data.message,
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: error.message,
          position: "top",
        });
      }
    }
  };

  const openGoogleMaps = () => {
    if (pickupCoordinates && dropCoordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${pickupCoordinates.latitude},${pickupCoordinates.longitude}&destination=${dropCoordinates.latitude},${dropCoordinates.longitude}&travelmode=driving`;
      Linking.openURL(url).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }
  };

  const geocodeAddress = async (address) => {
    const apiKey = API_KEY;
    const baseUrl = "https://maps.googleapis.com/maps/api/geocode/json";

    try {
      const response = await axios.get(baseUrl, {
        params: {
          address: address,
          key: apiKey,
        },
      });

      if (response.data.status === "OK") {
        return response.data.results[0].geometry.location;
      } else {
        console.error("Geocoding API Error:", response.data.status);
        return null;
      }
    } catch (error) {
      console.error("Error fetching geocoding data:", error.message);
      return null;
    }
  };

  const handleSetLocations = async () => {
    const pickupLocation = await geocodeAddress(bookingDetails?.pickupLocation);
    const dropLocation = await geocodeAddress(bookingDetails.dropLocation);

    if (pickupLocation) {
      setPickupCoordinates({
        latitude: pickupLocation.lat,
        longitude: pickupLocation.lng,
      });
    }
    if (dropLocation) {
      setDropCoordinates({
        latitude: dropLocation.lat,
        longitude: dropLocation.lng,
      });
    }
  };

  console.log("bookingdetails", bookingDetails.customerPayedOnline);

  return (
    // main container
    <>
      <View style={styles.main_container}>
        {/* navigation container */}
        <Pressable
          style={styles.nav_container}
          onPress={() => navigation.navigate("My Bookings")}
        >
          <Icon name="arrow-left" size={30} />
        </Pressable>
        {/* content section */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.content_container}
        >
          {/* heading text */}
          <Text style={styles.heading_txt}>Booking Details</Text>

          {/* vehicle image and details section */}
          <View style={styles.vehicle_details_main_container}>
            {/* image container */}
            <View style={styles.vehicle_img_container}>
              <Image source={vehicleimg} style={styles.vehicle_img} />
            </View>
            {/* vehicle details container */}
            <View style={{ gap: 5 }}>
              {/* vehicle model */}
              <Text style={styles.vehicle_desc_txt}>
                Booking ID{" "}
                <Text>
                  : {String(bookingDetails._id).slice(-5).toLocaleUpperCase()}
                </Text>
              </Text>
              <Text style={styles.vehicle_desc_txt}>
                Vehicle Model{" "}
                <Text>
                  : {bookingDetails.vehicleDetails.foundVehicle.vehicleModel}
                </Text>
              </Text>
              {/* vehicle number plate */}
              <Text style={styles.vehicle_desc_txt}>
                Vehicle Number{" "}
                <Text>
                  : {bookingDetails.vehicleDetails.foundVehicle.licensePlate}
                </Text>
              </Text>
              {/* cost per Km */}
              <Text style={styles.vehicle_desc_txt}>
                Cost per Km{" "}
                <Text>
                  : ₹ {bookingDetails.vehicleDetails.foundVehicle.pricePerKm}
                </Text>
              </Text>

              <Text style={styles.vehicle_desc_txt}>
                Cost per Day{" "}
                <Text>
                  : ₹ {bookingDetails.vehicleDetails.foundVehicle.pricePerDay}
                </Text>
              </Text>

              <Text style={styles.vehicle_desc_txt}>
                Total Km{" "}
                <Text>: {parseInt(bookingDetails.totalKm).toFixed(2)} Km</Text>
              </Text>
            </View>
          </View>
          {/* location and customer details */}
          {/* heading text */}
          <Text style={styles.main_txt}>Location and Customer Details</Text>
          <View style={styles.location_customer_details_main_container}>
            {/* location section */}
            <View style={styles.main_location_container}>
              {/* pick up location section */}
              <View style={styles.location_container}>
                {/* icon and heading section */}
                <View style={styles.icon_location_heading_conatainer}>
                  {/* icon */}
                  <Icon3
                    name="location-crosshairs"
                    size={15}
                    color={colors.dark_green}
                  />
                  {/*header text */}
                  <Text style={styles.location_header_txt}>
                    Pick-up Location
                  </Text>
                </View>
                {/* location text */}
                <Text style={styles.location_txt}>
                  {bookingDetails.pickupLocation}
                </Text>
              </View>
              {/* icon */}
              <Image
                source={require("../../assets/Images/upDown.png")}
                style={styles.location_up_down_img}
              />
              {/* drop location */}
              <View style={styles.location_container}>
                {/* icon and heading section */}
                <View style={styles.icon_location_heading_conatainer}>
                  {/* icon */}
                  <Icon3
                    name="location-dot"
                    size={15}
                    color={colors.dark_green}
                  />
                  {/*header text */}
                  <Text style={styles.location_header_txt}>Drop Location</Text>
                </View>
                {/* location text */}
                <Text style={styles.location_txt}>
                  {bookingDetails.dropLocation}
                </Text>
              </View>
              <TouchableOpacity
                onPress={openGoogleMaps}
                style={[
                  styles.phone_btn_container,
                  {
                    flexDirection: "row",
                    paddingHorizontal: 1,
                    justifyContent: "center",
                    alignContent: "center",
                  },
                ]}
              >
                {/* <Image style={{width:70,height:70}} source={navigationgif} /> */}
                <Navigateicon name="navigate" size={30} color={colors.white} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.white,
                  }}
                >
                  Get Direction to map
                </Text>
              </TouchableOpacity>
            </View>
            {/* cutomer details section */}
            <View style={styles.customer_details_main_container}>
              {/* heading text */}
              <Text style={styles.sub_heading_txt}>Customer Details</Text>
              {/* customer details */}
              <View style={styles.customer_details_container}>
                {/* customer icon */}
                <Image
                  source={require("../../assets/Images/pro-pic.png")}
                  style={styles.customer_icon}
                />
                {/* description */}
                <View style={{ gap: 4 }}>
                  {/* customer name */}
                  <Text style={styles.customer_details_txt}>
                    Name: <Text>{bookingDetails.customer.customerName}</Text>
                  </Text>
                  {/* customer address */}
                  <Text style={styles.customer_details_txt}>
                    Address:{" "}
                    <Text>{bookingDetails.customer.customerAddress}</Text>
                  </Text>
                </View>
              </View>
              {/*customer phone number */}
              <TouchableOpacity
                style={styles.phone_btn_container}
                onPress={() =>
                  handlePhone(`+${bookingDetails.customer.customerPhoneNumber}`)
                }
              >
                {/* icon */}
                <Icon3 name="phone" size={15} color={colors.white} />
                {/* phone number */}
                <Text
                  style={[styles.customer_details_txt, styles.phone_num_txt]}
                >
                  {bookingDetails.customer.customerPhoneNumber}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {bookingDetails.tripType === "One Day Trip" &&
            bookingDetails.vendorApprovedStatus === "pending" && (
              <Text
                style={{
                  backgroundColor: colors.gray,
                  padding: 10,
                  borderRadius: 8,
                  textAlign: "center",
                  color: colors.black,
                  fontWeight: "700",
                  marginBottom: 5,
                }}
              >
                Total Amount : ₹ {bookingDetails.totalFare}
              </Text>
            )}

          {bookingDetails.returnDate === null &&
            bookingDetails.vehicleDetails.foundVehicle.subCategory ===
              "truck" && (
              <View
                style={[
                  styles.location_customer_details_main_container,
                  styles.fare_details_main_container,
                  { alignItems: "center" },
                ]}
              >
                <Text style={styles.label_txt}>
                  Please specify the date when the vehicle will be available.
                </Text>
                <TouchableOpacity
                  onPress={showDatepicker}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateText}>
                    {date ? date.toDateString() : "Select Date"}
                  </Text>
                </TouchableOpacity>
                {date && (
                  <Text style={styles.instruction}>
                    Once you select the date, it cannot be updated again.
                  </Text>
                )}
              </View>
            )}

          {show && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChange}
              minimumDate={
                bookingDetails.pickupDate
                  ? new Date(bookingDetails.pickupDate)
                  : new Date()
              }
            />
          )}

          {/* fare details section*/}
          {/* heading text */}
          {bookingDetails.tripStatus === "completed" ||
            (bookingDetails.tripStatus === "cancelled" && (
              <View
                style={[
                  styles.location_customer_details_main_container,
                  styles.fare_details_main_container,
                ]}
              >
                <Text style={[styles.sub_heading_txt, { marginBottom: 10 }]}>
                  Booking Details
                </Text>

                <View
                  style={[styles.amount_container, { paddingHorizontal: 20 }]}
                >
                  <Text style={styles.label_txt}>Trip Status : </Text>
                  <Text style={styles.amount_txt}>
                    {" "}
                    {bookingDetails.tripStatus.charAt(0).toUpperCase() +
                      bookingDetails.tripStatus.slice(1)}
                  </Text>
                </View>

                <View
                  style={[styles.amount_container, { paddingHorizontal: 20 }]}
                >
                  <Text style={styles.label_txt}>Cancelled By :</Text>
                  <Text style={styles.amount_txt}>
                    {" "}
                    {bookingDetails.customerCancelled ? "Cusotmer" : "Vendor"}
                  </Text>
                </View>
                <View
                  style={[styles.amount_container, { paddingHorizontal: 20 }]}
                >
                  <Text style={styles.label_txt}>Advance Refund Status : </Text>
                  <Text style={styles.amount_txt}>
                    {" "}
                    {bookingDetails.advanceRefund ? "Refunded" : "Not Refunded"}
                  </Text>
                </View>
              </View>
            ))}
          {bookingDetails.vehicleDetails.foundVehicle.subCategory === "auto" &&
          bookingDetails.vendorApprovedStatus === "pending" ? (
            <View></View>
          ) : (
            <View
              style={[
                styles.location_customer_details_main_container,
                styles.fare_details_main_container,
              ]}
            >
              <Text style={[styles.sub_heading_txt, { marginBottom: 10 }]}>
                Fare Details
              </Text>

              {bookingDetails.vehicleDetails.foundVehicle.subCategory !==
                "auto" && (
                <View style={styles.amount_container}>
                  <Text style={styles.label_txt}>Advance Paid:</Text>
                  <Text style={styles.amount_txt}>
                    {" "}
                    ₹{bookingDetails.advanceAmount}
                  </Text>
                </View>
              )}
              {/* total amount section */}

              {/* payable amount section */}
              {bookingDetails?.vendorApprovedStatus === "approved" &&
 !bookingDetails?.customerPayedOnline && (
  <View style={[styles.amount_container]}>
    <Text style={styles.label_txt}>Payable Amount:</Text>
    <Text style={styles.amount_txt}>
      ₹ {bookingDetails.remainingPayment}
    </Text>
  </View>
)}
              {bookingDetails.vendorApprovedStatus === "approved" &&
                bookingDetails.penaltyAmount !== 0 && (
                  <View style={[styles.amount_container]}>
                    <Text style={styles.label_txt}>Penalty Amount:</Text>
                    <Text style={styles.amount_txt}>
                      {" "}
                      ₹ {bookingDetails.penaltyAmount}
                    </Text>
                  </View>
                )}

              {bookingDetails.vendorApprovedStatus === "approved" && (
                <View style={styles.amount_container}>
                  <Text style={styles.label_txt}>Total Amount:</Text>
                  <Text style={styles.amount_txt}>
                    {" "}
                    ₹ {bookingDetails.totalFare}
                  </Text>
                </View>
              )}
            </View>
          )}

          {!bookingDetails.advanceRefund &&
            bookingDetails.tripStatus === "cancelled" && (
              <TouchableOpacity
                onPress={refundAdvance}
                style={[
                  bookingDetails.tripStatus === "cancelled"
                    ? styles.refund_btn_container
                    : styles.phone_btn_container,
                  { paddingVertical: 10 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.btn_txt}>Refund Advance</Text>
                )}
              </TouchableOpacity>
            )}

          {bookingDetails.tripType !== "Round Trip" &&
            bookingDetails.vendorApprovedStatus === "pending" &&
            bookingDetails.tripStatus !== "cancelled" &&
            bookingDetails.vehicleDetails.foundVehicle.subCategory !== "auto" &&
            bookingDetails.vehicleDetails.foundVehicle.subCategory !== "car" &&
             (
              <TextInput
                style={styles.input_field}
                value={totalFare}
                onChangeText={setTotalFare}
                placeholder="Enter Total Amount"
                keyboardType="numeric"
              />
            )}

{bookingDetails.tripType === "Round Trip" &&
            bookingDetails.vendorApprovedStatus === "pending" &&
            bookingDetails.tripStatus !== "cancelled" && (
              <TextInput
                style={styles.input_field}
                value={totalFare}
                onChangeText={setTotalFare}
                placeholder="Enter Total Amount "
                keyboardType="numeric"
              />
            )}
          {/* enter otp input field */}
          {bookingDetails.tripType === "One Day Trip" &&
            bookingDetails.tripStatus === "start" && 
         
            bookingDetails.vehicleDetails.foundVehicle.subCategory === "auto" &&
              (
              <TextInput
                value={otp}
                onChangeText={setOtp}
                style={styles.input_field}
                placeholder="Enter OTP"
                keyboardType="number-pad"
              />
            )}

{bookingDetails.tripType === "One Day Trip" &&
            bookingDetails.tripStatus === "start" && 
         
            bookingDetails.vehicleDetails.foundVehicle.subCategory === "car" &&
              (
              <TextInput
                value={otp}
                onChangeText={setOtp}
                style={styles.input_field}
                placeholder="Enter car OTP"
                keyboardType="number-pad"
              />
            )}

{bookingDetails?.customerPayedOnline && (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 18,
                  color: colors.dark_green,
                  textAlign: "center",
                }}
              >
                Payment Successful!
              </Text>
              <Image
                style={{ width: 15, height: 15 }}
                source={require("../../assets/Images/check.png")}
              />
            </View>
          )}

          {bookingDetails.vendorApprovedStatus === "approved" &&
            bookingDetails.tripStatus === "start" && (
              <View style={{ marginBottom: 40 }}>
                {/* confirm button */}
                <TouchableOpacity
                  onPress={startRide}
                  style={[styles.phone_btn_container, { paddingVertical: 10 }]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.btn_txt}>Start Ride</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

    

          {bookingDetails.vendorApprovedStatus === "approved" &&
            bookingDetails.tripStatus === "ongoing" && (
              <View style={{ marginBottom: 40 }}>
                {/* confirm button */}
                <TouchableOpacity
                  onPress={() => setModalForComplete(true)}
                  style={[styles.phone_btn_container, { paddingVertical: 10 }]}
                >
                  {/* {loading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : ( */}
                  <Text style={styles.btn_txt}>Complete Ride</Text>
                  {/* )}   */}
                </TouchableOpacity>

                <Modal transparent={true} visible={modalForComplete}>
                  <View style={styles.modal_background}>
                    <View style={styles.modal_container}>
                      <Pressable
                        style={styles.closeButton}
                        onPress={() => setModalForComplete(false)}
                      >
                        <AntDesign
                          name="close"
                          size={20}
                          color={colors.dark_gray}
                        />
                      </Pressable>
                      <Image
                        source={require("../../assets/Images/payment_Method.png")}
                        style={styles.modal_img}
                      />
                      <Text style={styles.reg_txt}>
                        Choose a payment method
                      </Text>

                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 15,
                          // marginBottom: 15,
                        }}
                      >
                        <Pressable
                          style={
                            paymentMethod === "online"
                              ? styles.onlicashButtonActive
                              : styles.onlicashButton
                          }
                          onPress={() => setPamentMethod("online")}
                        >
                          <Text
                            style={[
                              styles.cashCollectingText,
                              {
                                color:
                                  paymentMethod === "online"
                                    ? colors.white
                                    : colors.dark_gray,
                              },
                            ]}
                          >
                            UPI Payment
                          </Text>
                        </Pressable>

                        <Pressable
                          style={
                            paymentMethod === "cash"
                              ? styles.onlicashButtonActive
                              : styles.onlicashButton
                          }
                          onPress={() => setPamentMethod("cash")}
                        >
                          <Text
                            style={[
                              styles.cashCollectingText,
                              {
                                color:
                                  paymentMethod === "cash"
                                    ? colors.white
                                    : colors.dark_gray,
                              },
                            ]}
                          >
                            Cash Payment
                          </Text>
                        </Pressable>
                      </View>

                      <TouchableOpacity
                        onPress={completeRide}
                        style={[
                          styles.phone_btn_container,
                          { paddingVertical: 10, marginBottom: 10 },
                        ]}
                      >
                        {loading ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.white}
                          />
                        ) : (
                          <Text style={styles.btn_txt}>Complete Ride</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </View>
            )}

          {/* button container */}
          {bookingDetails.vendorApprovedStatus === "pending" &&
            bookingDetails.tripStatus !== "cancelled" && (
              <View style={styles.main_btn_container}>
                {/* confirm button */}
                <TouchableOpacity
                  onPress={showAlert}
                  style={styles.btn_container}
                >
                  {vendorApprovedStatus !== "rejected" && loading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.btn_txt}>Confirm Ride</Text>
                  )}
                </TouchableOpacity>
                {/* cancel button */}
                <TouchableOpacity
                  style={[styles.btn_container, styles.cancel_btn_container]}
                  onPress={RejectModelOpen}
                >
                  <Text style={styles.btn_txt}>Cancel Ride</Text>
                </TouchableOpacity>
              </View>
            )}
          {/* Start ride button */}
          {/* <TouchableOpacity style={styles.start_ride_btn_container}>
          <Text style={styles.btn_txt}>Start Ride</Text>
        </TouchableOpacity> */}
          {/* Modal section */}
          <Modal
            transparent={true}
            visible={modalshow}
            onRequestClose={() => setmodalshow(false)}
          >
            {/* modal background */}
            {/* <TouchableWithoutFeedback onPress={() => setmodalshow(false)}> */}
            <View style={styles.modal_background}>
              {/* modal container */}
              <View style={styles.modal_container}>
                {/* image */}
                <Image
                  source={require("../../assets/Images/modal.png")}
                  style={styles.modal_img}
                />
                <Text style={styles.reg_txt}>
                  Enter reason for cancellation
                </Text>
                {/* input field */}
                <TextInput
                  value={vendorRejectedReason}
                  onChangeText={setVendorRejectedReason}
                  placeholder="Enter reason"
                  style={styles.modal_input_fireld}
                />
                <TouchableOpacity
                  onPress={() => BookingApproval("rejected")}
                  style={styles.modal_ok_btn_container}
                >
                  {vendorApprovedStatus === "rejected" && loading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.modal_ok_btn_txt}>Submit</Text>
                  )}
                </TouchableOpacity>
                {/* close icon */}
                <TouchableOpacity
                  style={styles.close_icon}
                  onPress={RejectModelClose}
                >
                  <Icon
                    name="closecircle"
                    size={20}
                    color={"rgba(0,0,0,0.40)"}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {/* </TouchableWithoutFeedback> */}
          </Modal>
        </ScrollView>
      </View>
      <Toast />
    </>
  );
};
export default AutoBookingDetails_screen;

const styles = StyleSheet.create({
  main_container: {
    backgroundColor: colors.light_gray,
    flex: 1,
  },
  nav_container: {
    padding: 15,
    paddingTop: 40,
  },
  // content section style
  content_container: {
    backgroundColor: colors.white,
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 15,
  },
  heading_txt: {
    backgroundColor: colors.very_light_green,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    padding: 7,
    borderRadius: 10,
  },
  // vehicle details section style
  vehicle_details_main_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    borderColor: colors.gray,
    borderWidth: 0.8,
    backgroundColor: colors.smoke_white,
    marginTop: 20,
    borderRadius: 10,
    padding: 10,
    gap: 10,
    marginBottom: 20,
  },
  vehicle_img_container: {
    backgroundColor: colors.white,
    borderRadius: 7,
    borderColor: colors.light_green,
    borderWidth: 0.5,
    padding: 3,
  },
  vehicle_img: {
    width: wp(27),
    height: 100,
    resizeMode: "contain",
  },
  vehicle_desc_txt: {
    fontWeight: "600",
  },
  // location and customer details section style
  main_txt: {
    fontSize: 17,
    fontWeight: "700",
  },
  location_customer_details_main_container: {
    backgroundColor: colors.very_light_green,
    padding: 10,
    marginTop: 5,
    borderRadius: 10,
    borderColor: colors.light_green,
    borderWidth: 0.4,
    marginBottom: 30,
  },
  // pickup and drop location section style
  main_location_container: {},
  icon_location_heading_conatainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.light_yellow,
    padding: 5,
    borderRadius: 4,
  },
  location_container: {
    backgroundColor: colors.white,
    padding: 5,
    borderRadius: 7,
    elevation: 2,
  },
  location_header_txt: {
    fontSize: 16,
    fontWeight: "700",
  },
  location_txt: {
    textAlign: "start",
    fontSize: 17,
    fontWeight: "600",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  location_up_down_img: {
    width: 20,
    height: 20,
    alignSelf: "center",
    marginVertical: 15,
  },
  // customer details section style
  customer_details_main_container: {
    backgroundColor: colors.white,
    marginTop: 15,
    padding: 10,
    borderRadius: 7,
  },
  sub_heading_txt: {
    fontSize: 16,
    fontWeight: "700",
    borderBottomColor: colors.gray,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  // customer icon and description section style
  customer_details_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  customer_icon: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  customer_details_txt: {
    fontSize: 16,
    fontWeight: "500",
  },
  // phone button style
  phone_btn_container: {
    backgroundColor: colors.dark_green,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 5,
    borderRadius: 5,
    marginTop: 15,
  },

  refund_btn_container: {
    backgroundColor: colors.dark_green,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 5,
    borderRadius: 5,
    // marginTop: 15,
    marginBottom: 30,
  },

  phone_num_txt: {
    color: colors.white,
  },
  // fare details section style
  fare_details_main_container: {
    backgroundColor: colors.smoke_white,
    borderColor: colors.blue,
    marginBottom: 30,
  },
  amount_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  label_txt: {
    fontSize: 16,
    fontWeight: "500",
  },
  amount_txt: {
    fontSize: 17,
    fontWeight: "700",
  },
  // amount enter field style
  input_field: {
    backgroundColor: colors.very_light_gray,
    flex: 1,
    height: 45,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    fontWeight: "500",
    borderColor: colors.gray,
    borderWidth: 1,
    // marginBottom: 40,
  },
  reason_input_field: {
    marginBottom: 10,
  },
  // button section style
  main_btn_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    gap: 10,
    marginTop: 10,
  },
  btn_container: {
    backgroundColor: colors.dark_green,
    width: wp(44),
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 5,
  },
  cancel_btn_container: {
    backgroundColor: colors.red,
  },
  btn_txt: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  // start ride button style
  start_ride_btn_container: {
    backgroundColor: colors.dark_green,
    marginBottom: 40,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },
  // modal section style
  modal_container: {
    display: "flex",
    justifyContent: "center",
    backgroundColor: colors.white,
    width: wp(80),
    paddingVertical: 20,
    gap: 10,
    borderRadius: 15,
    position: "relative",
    padding: 15,
  },
  modal_background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modal_img: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    alignSelf: "center",
  },
  reg_txt: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 15,
  },
  modal_input_fireld: {
    backgroundColor: colors.very_light_gray,
    height: 40,
    padding: 10,
    borderRadius: 10,
    borderColor: colors.gray,
    borderWidth: 1,
    marginBottom: 5,
  },
  modal_ok_btn_container: {
    backgroundColor: colors.dark_green,
    width: "100%",
    height: 35,
    borderRadius: 6,
  },
  modal_ok_btn_txt: {
    color: colors.white,
    textAlign: "center",
    fontSize: 17,
    // padding: 5,
    height: 30,
    marginTop: 5,
    fontWeight: "700",
  },
  close_icon: {
    position: "absolute",
    top: 7,
    right: 7,
  },
  start_ride_btn: {
    backgroundColor: colors.dark_green,
    width: "100%",
    height: 30,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    width: "43%",
    backgroundColor: colors.light_gray,
    borderRadius: 6,
    borderColor: colors.light_green,
    borderWidth: 1,
    justifyContent: "center",
    marginVertical: 5,
  },
  dateText: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: "500",
  },
  instruction: {
    marginTop: 20,
    color: colors.dark_gray,
    fontSize: 14,
    textAlign: "center",
  },
  onlicashButton: {
    borderBlockColor: colors.gray,
    borderWidth: 1,
    borderRightColor: colors.gray,
    borderLeftColor: colors.gray,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    width: 200,
    height: 35,
    backgroundColor: colors.light_gray,
  },
  onlicashButtonActive: {
    backgroundColor: colors.red,
    borderRightColor: colors.red,
    borderLeftColor: colors.red,
    borderColor: colors.red,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    width: 200,
    height: 35,
  },
  cashCollectingText: {
    color: colors.dark_gray,
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 5,
    borderWidth: 1,
    borderRadius: 50,
    borderColor: colors.gray,
  },
});
