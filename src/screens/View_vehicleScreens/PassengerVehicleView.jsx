import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { colors } from "../../utils/constants";
import Icon1 from "react-native-vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";
import CarouselSlider from "../../components/CaroselReusable";

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PassengerVehicleView = ({ route }) => {
  const [userDetails, setUserDetails] = useState("");
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const { vehicle } = route.params;

  const getVendorData = async () => {
    const vendor = await AsyncStorage.getItem("user");
    const vendorData = JSON.parse(vendor);
    setUserDetails(vendorData);
  };

  useEffect(() => {
    getVendorData();
  }, []);

  const handleSnapToItem = (index) => {
    console.log(`Snapped to item ${index}`);
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await getVendorData();
    setRefreshing(false);
  };

  return (
    <View style={{ backgroundColor: colors.white, flex: 1 }}>
      {/* nav container */}
      <Pressable
        style={styles.nav_container}
        onPress={() => navigation.navigate("Vehicle Management")}
      >
        <Icon1 name="arrow-left" size={30} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ backgroundColor: colors.light_gray }}>
          {/* main container */}
          <View style={styles.main_container}>
            {/* vehicle image */}
            {/* <View style={styles.vehicle_img_container}>
              <Image source={{ uri: vehileImage }} style={styles.vehicle_img} /> */}
            <CarouselSlider
              data={vehicle.vehicleImages}
              autoPlay={true}
              scrollAnimationDuration={1500}
              height={200}
              onSnapToItem={handleSnapToItem}
            />
            {/* </View> */}

            {vehicle.vehicleApprovedByAdmin === "rejected" && (
              <View
                style={[
                  styles.vehicle_details_main_sec,
                  { backgroundColor: "#fae3e1", borderColor: colors.dark_gray },
                ]}
              >
                <Text
                  style={[
                    styles.heading_txt,
                    { borderBottomColor: colors.dark_gray },
                  ]}
                >
                  Rejected Reason
                </Text>
                <Text style={styles.label}>{vehicle.rejectedReason}</Text>
              </View>
            )}

            {/* vehicle details section */}
            <View style={styles.vehicle_details_main_sec}>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: colors.gray,
                  marginBottom: 10,
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={[
                    styles.heading_txt,
                    { borderBottomWidth: 0, marginBottom: 0 },
                  ]}
                >
                  Vehicle Details
                </Text>

                 <Text style={[vehicle.registerAmountRefund === false?styles.advance_txt:styles.refund_txt]}>{vehicle.registerAmountRefund === false? 'Advance Paid':'Advance Refunded'}</Text>
              </View>
              {/* heading text */}
              <View style={styles.vehicle_details_sec}>
                {/* label container */}
                <View style={{ gap: 5 }}>
                  {vehicle.subCategory === "car" && (
                    <Text style={styles.label}>Car Type</Text>
                  )}
                  <Text style={styles.label}>Vehicle Number</Text>
                  <Text style={styles.label}>Vehicle Model</Text>
                  {vehicle.subCategory !== "auto" && (
                    <Text style={styles.label}>Vehicle Color</Text>
                  )}
                  {vehicle.subCategory !== "auto" && vehicle.subCategory !==  "truck" && (
                    <Text style={styles.label}>Number of seats</Text>
                  )}
                  {vehicle.subCategory === "bus" && (
                    <Text style={styles.label}>AC</Text>
                  )}
                  {vehicle.subCategory !== "auto" && (
                    <Text style={styles.label}>Mileage</Text>
                  )}
                  {vehicle.subCategory === "truck" && (
                    <Text style={styles.label}>Ton</Text>
                  )}
                  {vehicle.subCategory === "truck" && (
                    <Text style={styles.label}>Size</Text>
                  )}
                  <Text style={styles.label}>Price Per Day</Text>
                  <Text style={styles.label}>Price Per Km</Text>
                  <Text style={styles.label}>Fuel Type </Text>
                </View>
                <View style={{ gap: 5 }}>
                  {vehicle.subCategory === "car" && (
                    <Text style={styles.details_txt}>
                      : {vehicle.vehicleType}
                    </Text>
                  )}

                  {/* vehicle no */}
                  <Text style={styles.details_txt}>
                    : {vehicle.licensePlate}
                  </Text>
                  {/* vehicle model  */}
                  <Text style={styles.details_txt}>
                    : {vehicle.vehicleModel}
                  </Text>
                  {/* vehicle color */}
                  {vehicle.subCategory !== "auto" && (
                    <Text style={styles.details_txt}>
                      : {vehicle.vehicleColor}
                    </Text>
                  )}
                  {/* number of seats */}
                  {vehicle.subCategory !== "auto" && vehicle.subCategory !==  "truck" &&(
                    <Text style={styles.details_txt}>
                      : {vehicle.numberOfSeats}
                    </Text>
                  )}
                  {vehicle.subCategory === "bus" && (
                    <Text style={styles.details_txt}>: {vehicle.ac}</Text>
                  )}
                  {/* millage */}
                  {vehicle.subCategory !== "auto" && (
                    <Text style={styles.details_txt}>: {vehicle.milage}</Text>
                  )}
                  {vehicle.subCategory === "truck" && (
                    <Text style={styles.details_txt}>: {vehicle.ton} Kg</Text>
                  )}
                  {vehicle.subCategory === "truck" && (
                    <Text style={styles.details_txt}>: {vehicle.size}</Text>
                  )}
                  <Text style={styles.details_txt}>
                    : ₹ {vehicle.pricePerDay}
                  </Text>

                  <Text style={styles.details_txt}>
                    : ₹ {vehicle.pricePerKm}
                  </Text>
                  <Text style={styles.details_txt}>: {vehicle.fuelType}</Text>
                </View>
              </View>
            </View>

            {/* owner details section */}
            <View style={styles.vehicle_details_main_sec}>
              {/* heading text */}
              <Text style={styles.heading_txt}>Vendor Details</Text>
              <View style={styles.vehicle_details_sec}>
                {/* label container */}
                <View style={{ gap: 5 }}>
                  <Text style={styles.label}>Vendor Name</Text>
                  <Text style={styles.label}>Vendor phone no</Text>
                </View>
                <View style={{ gap: 5 }}>
                  {/* vendor name */}
                  <Text style={styles.details_txt}>
                    : {userDetails.userName}
                  </Text>
                  {/* vendor phone number  */}
                  <Text style={styles.details_txt}>
                    : {userDetails.phoneNumber}
                  </Text>
                </View>
              </View>
              {/* vendor image section*/}
              <View style={styles.vendor_img_container}>
                <Text style={styles.document_label}>Vendor Image</Text>
                {vehicle.ownerImage.map((e, index) => (
                  <Image
                    key={index}
                    source={{ uri: e }}
                    style={styles.aadhar_img}
                  />
                ))}
              </View>
              {/* vendor aadhar card section */}
              <View style={styles.vendor_img_container}>
                <Text style={styles.document_label}>Vendor Aadhar card</Text>
                {/* image container */}
                <View style={styles.doc_img_container}>
                  {vehicle.ownerAdharCard.map((e, index) => (
                    <Image
                      key={index}
                      source={{ uri: e }}
                      style={styles.aadhar_img}
                    />
                  ))}
                </View>
              </View>
            </View>
            {/* Document details section*/}
            <View style={styles.vehicle_details_main_sec}>
              {/* heading text */}
              <Text style={styles.heading_txt}>Document Details</Text>
              {/* documents container */}
              {/* driving license container */}
              <View style={styles.document_container}>
                {/* document name text */}
                <Text style={styles.document_label}>Driving License</Text>
                {/* document image */}
                {vehicle.ownerDrivingLicense.map((e, index) => (
                  <Image
                    key={index}
                    source={{ uri: e }}
                    style={styles.aadhar_img}
                  />
                ))}
              </View>
              {/* insurance container */}
              <View style={styles.document_container}>
                {/* document name text */}
                <Text style={styles.document_label}>Vehicle Insurance</Text>
                {/* document image */}
                {vehicle.vehicleInsurance.map((e, index) => (
                  <Image
                    key={index}
                    source={{ uri: e }}
                    style={styles.aadhar_img}
                  />
                ))}
              </View>
              {/* RC book container */}
              <View style={styles.document_container}>
                {/* document name text */}
                <Text style={styles.document_label}>Vehicle RC</Text>
                {/* document image */}
                {vehicle.vehicleRC.map((e, index) => (
                  <Image
                    key={index}
                    source={{ uri: e }}
                    style={styles.aadhar_img}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      {(vehicle.registerAmountRefund === false && vehicle.vehicleApprovedByAdmin === "rejected" ) && (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("CarReregForm", {
              vehicle: vehicle,
            })
          }
          style={styles.btn_container}
        >
          <Text style={styles.btn_txt}>Register Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PassengerVehicleView;

const styles = StyleSheet.create({
  main_container: {
    padding: 15,
    backgroundColor: colors.white,
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  nav_container: {
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: colors.light_gray,
    paddingBottom: 15,
  },
  //  vehicle image style
  vehicle_img_container: {
    borderColor: colors.gray,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  vehicle_img: {
    width: wp(100),
    height: 190,
    resizeMode: "contain",
  },
  // vehicle details section style
  vehicle_details_main_sec: {
    marginTop: 20,
    padding: 10,
    borderRadius: 10,
    borderColor: colors.gray,
    borderWidth: 1,
  },
  vehicle_details_sec: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  heading_txt: {
    fontSize: 17,
    fontWeight: "700",
    borderBottomColor: colors.gray,
    borderBottomWidth: 1,
    paddingBottom: 5,
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.dark_gray,
  },
  details_txt: {
    color: colors.black,
    fontSize: 15,
    fontWeight: "600",
  },
  // vendor image section style
  vendor_img_container: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    borderColor: colors.light_gray,
    borderWidth: 1,
    borderRadius: 7,
    padding: 5,
  },
  vendor_img: {
    width: wp(30),
    height: hp(15),
    resizeMode: "contain",
  },
  // vendor aadhar card section style
  aadhar_img: {
    width: 400,
    height: 200,
    resizeMode: "contain",
    marginTop: 10,
  },
  // document section style
  document_label: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  document_container: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.light_gray,
    borderWidth: 1,
    borderRadius: 7,
    padding: 5,
    marginVertical: 5,
  },
  rc_img: {
    width: 400,
    height: 120,
    resizeMode: "contain",
  },
  btn_container: {
    backgroundColor: colors.dark_green,
    width: "100%",
    padding: 10,
    borderRadius: 8,
  },
  btn_txt: {
    textAlign: "center",
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
  advance_txt: {
    backgroundColor: colors.dark_green,
    width: 110,
    height: 21,
    textAlign: "center",
    color: colors.white,
    borderRadius: 10,
    fontWeight: "500",
  },
  refund_txt: {
    backgroundColor: colors.red,
    width: 'auto',
    paddingHorizontal:5,
    height: 21,
    textAlign: "center",
    color: colors.white,
    borderRadius: 10,
    fontWeight: "500",
  },
});
