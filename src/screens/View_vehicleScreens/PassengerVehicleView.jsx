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
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../utils/constants";
import { AntDesign as Icon1 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import CarouselSlider from "../../components/CaroselReusable";
import AxiosService, { getCorrectImageUrl } from "../../utils/AxioService";

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

  // ✅ Fixed: renamed from getImageUrl to getImgUri
  const getImgUri = (uri) => {
    if (!uri) return null;
    return { uri: getCorrectImageUrl(uri) };
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.light_gray, flex: 1 }} edges={["top"]}>
      {/* nav container */}
      <Pressable
        style={styles.nav_container}
        onPress={() => navigation.goBack()}
      >
        <Icon1 name="arrow-left" size={30} color={colors.black} />
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
            {/* vehicle image carousel */}
            <CarouselSlider
              data={vehicle.vehicleImages || []}
              autoPlay={true}
              scrollAnimationDuration={1500}
              height={200}
              onSnapToItem={handleSnapToItem}
            />

            {/* Rejected reason section */}
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

                <Text
                  style={[
                    vehicle.registerAmountRefund === false
                      ? styles.advance_txt
                      : styles.refund_txt,
                  ]}
                >
                  {vehicle.registerAmountRefund === false
                    ? "Advance Paid"
                    : "Advance Refunded"}
                </Text>
              </View>

              <View style={styles.vehicle_details_sec}>
                {/* Labels */}
                <View style={{ gap: 5 }}>
                  {vehicle.subCategory === "car" && (
                    <Text style={styles.label}>Car Type</Text>
                  )}
                  <Text style={styles.label}>Vehicle Number</Text>
                  <Text style={styles.label}>Vehicle Model</Text>
                  {vehicle.subCategory !== "auto" && (
                    <Text style={styles.label}>Vehicle Color</Text>
                  )}
                  {vehicle.subCategory !== "auto" &&
                    vehicle.subCategory !== "truck" && (
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
                  <Text style={styles.label}>Fuel Type</Text>
                </View>

                {/* Values */}
                <View style={{ gap: 5 }}>
                  {vehicle.subCategory === "car" && (
                    <Text style={styles.details_txt}>
                      : {vehicle.vehicleType}
                    </Text>
                  )}
                  <Text style={styles.details_txt}>
                    : {vehicle.licensePlate}
                  </Text>
                  <Text style={styles.details_txt}>
                    : {vehicle.vehicleModel}
                  </Text>
                  {vehicle.subCategory !== "auto" && (
                    <Text style={styles.details_txt}>
                      : {vehicle.vehicleColor}
                    </Text>
                  )}
                  {vehicle.subCategory !== "auto" &&
                    vehicle.subCategory !== "truck" && (
                      <Text style={styles.details_txt}>
                        : {vehicle.numberOfSeats}
                      </Text>
                    )}
                  {vehicle.subCategory === "bus" && (
                    <Text style={styles.details_txt}>: {vehicle.ac}</Text>
                  )}
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

            {/* owner / vendor details section */}
            <View style={styles.vehicle_details_main_sec}>
              <Text style={styles.heading_txt}>Vendor Details</Text>
              <View style={styles.vehicle_details_sec}>
                <View style={{ gap: 5 }}>
                  <Text style={styles.label}>Vendor Name</Text>
                  <Text style={styles.label}>Vendor phone no</Text>
                </View>
                <View style={{ gap: 5 }}>
                  <Text style={styles.details_txt}>
                    : {userDetails?.userName || "Loading..."}
                  </Text>
                  <Text style={styles.details_txt}>
                    : {userDetails?.phoneNumber || "Loading..."}
                  </Text>
                </View>
              </View>

              {/* Vendor Image */}
              <View style={styles.vendor_img_container}>
                <Text style={styles.document_label}>Vendor Image</Text>
                {vehicle.ownerImage && vehicle.ownerImage.length > 0 ? (
                  vehicle.ownerImage.map((e, index) => (
                    <Image
                      key={index}
                      source={getImgUri(e)}
                      style={styles.aadhar_img}
                    />
                  ))
                ) : (
                  <Text style={styles.details_txt}>No Image Provided</Text>
                )}
              </View>

              {/* Vendor Aadhar Card */}
              <View style={styles.vendor_img_container}>
                <Text style={styles.document_label}>Vendor Aadhar card</Text>
                <View style={styles.doc_img_container}>
                  {vehicle.ownerAdharCard &&
                    vehicle.ownerAdharCard.length > 0 ? (
                    vehicle.ownerAdharCard.map((e, index) => (
                      <Image
                        key={index}
                        source={getImgUri(e)}
                        style={styles.aadhar_img}
                      />
                    ))
                  ) : (
                    <Text style={styles.details_txt}>No Aadhar Provided</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Document details section */}
            <View style={styles.vehicle_details_main_sec}>
              <Text style={styles.heading_txt}>Document Details</Text>

              {/* Driving License */}
              <View style={styles.document_container}>
                <Text style={styles.document_label}>Driving License</Text>
                {vehicle.ownerDrivingLicense &&
                  vehicle.ownerDrivingLicense.length > 0 ? (
                  vehicle.ownerDrivingLicense.map((e, index) => (
                    <Image
                      key={index}
                      source={getImgUri(e)}
                      style={styles.aadhar_img}
                    />
                  ))
                ) : (
                  <Text style={styles.details_txt}>No License Provided</Text>
                )}
              </View>

              {/* Vehicle Insurance */}
              <View style={styles.document_container}>
                <Text style={styles.document_label}>Vehicle Insurance</Text>
                {vehicle.vehicleInsurance &&
                  vehicle.vehicleInsurance.length > 0 ? (
                  vehicle.vehicleInsurance.map((e, index) => (
                    <Image
                      key={index}
                      source={getImgUri(e)}
                      style={styles.aadhar_img}
                    />
                  ))
                ) : (
                  <Text style={styles.details_txt}>No Insurance Provided</Text>
                )}
              </View>

              {/* Vehicle RC */}
              <View style={styles.document_container}>
                <Text style={styles.document_label}>Vehicle RC</Text>
                {vehicle.vehicleRC && vehicle.vehicleRC.length > 0 ? (
                  vehicle.vehicleRC.map((e, index) => (
                    <Image
                      key={index}
                      source={getImgUri(e)}
                      style={styles.aadhar_img}
                    />
                  ))
                ) : (
                  <Text style={styles.details_txt}>No RC Provided</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Register Again button */}
      {vehicle.registerAmountRefund === false &&
        vehicle.vehicleApprovedByAdmin === "rejected" && (
          <TouchableOpacity
            onPress={() => {
              let reregScreen = "CarReregForm";
              if (vehicle.subCategory === "auto") reregScreen = "AutoReregForm";
              else if (vehicle.subCategory === "van")
                reregScreen = "VanReregForm";
              else if (vehicle.subCategory === "bus")
                reregScreen = "BusReregForm";
              else if (vehicle.subCategory === "truck")
                reregScreen = "TruckRereg";

              navigation.navigate(reregScreen, { vehicle: vehicle });
            }}
            style={styles.btn_container}
          >
            <Text style={styles.btn_txt}>Register Again</Text>
          </TouchableOpacity>
        )}
    </SafeAreaView>
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
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.light_gray,
    paddingBottom: 15,
  },
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
  aadhar_img: {
    width: 400,
    height: 200,
    resizeMode: "contain",
    marginTop: 10,
  },
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
    backgroundColor: colors.deep_blue,
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
    backgroundColor: colors.deep_blue,
    width: 110,
    height: 21,
    textAlign: "center",
    color: colors.white,
    borderRadius: 10,
    fontWeight: "500",
  },
  refund_txt: {
    backgroundColor: colors.red,
    width: "auto",
    paddingHorizontal: 5,
    height: 21,
    textAlign: "center",
    color: colors.white,
    borderRadius: 10,
    fontWeight: "500",
  },
});