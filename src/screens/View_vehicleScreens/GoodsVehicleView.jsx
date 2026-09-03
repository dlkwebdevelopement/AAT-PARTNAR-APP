import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../utils/constants";
import { AntDesign as Icon1 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import AxiosService, { getCorrectImageUrl } from "../../utils/AxioService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GoodsVehicleView = ({ route }) => {
  const [userDetails, setUserDetails] = useState(null);
  const navigation = useNavigation();
  const { vehicle } = route.params;

  const getVendorData = async () => {
    try {
      const vendor = await AsyncStorage.getItem("user");
      if (vendor) {
        setUserDetails(JSON.parse(vendor));
      }
    } catch (e) {
      console.log("Error getting vendor data:", e);
    }
  };

  React.useEffect(() => {
    getVendorData();
  }, []);

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
        <Icon1 name="arrow-left" size={30} />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: colors.light_gray }}>
          {/* main container */}
          <View style={styles.main_container}>
            {/* vehicle image */}
            <View style={styles.vehicle_img_container}>
              {vehicle.vehicleImages?.[0] ? (
                <Image source={getImgUri(vehicle.vehicleImages[0])} style={styles.vehicle_img} />
              ) : (
                <View style={[styles.vehicle_img, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text>No Image</Text>
                </View>
              )}
            </View>
            {/* vehicle details section */}
            <View style={styles.vehicle_details_main_sec}>
              <Text style={styles.heading_txt}>Vehicle Details</Text>
              {/* heading text */}
              <View style={styles.vehicle_details_sec}>
                {/* label container */}
                <View style={{ gap: 5 }}>
                  <Text style={styles.label}>Vehicle Number</Text>
                  <Text style={styles.label}>Vehicle Model</Text>
                  <Text style={styles.label}>Ton</Text>
                  <Text style={styles.label}>Size</Text>
                  <Text style={styles.label}>Mileage</Text>
                </View>
                <View style={{ gap: 5 }}>
                  <Text style={styles.details_txt}>: {vehicle.licensePlate}</Text>
                  <Text style={styles.details_txt}>: {vehicle.vehicleModel}</Text>
                  <Text style={styles.details_txt}>: {vehicle.ton || "N/A"} Kg</Text>
                  <Text style={styles.details_txt}>: {vehicle.size || "N/A"}</Text>
                  <Text style={styles.details_txt}>: {vehicle.milage || "N/A"}</Text>
                </View>
              </View>
            </View>
            {vehicle.vehicleApprovedByAdmin === 'rejected' && (
              <View style={styles.vehicle_details_main_sec}>
                <Text style={styles.heading_txt}>Rejected Reason</Text>
                <Text>{vehicle.rejectedReason}</Text>
              </View>
            )}
            {/* owner details section */}
            <View style={styles.vehicle_details_main_sec}>
              <Text style={styles.heading_txt}>Vendor Details</Text>
              <View style={styles.vehicle_details_sec}>
                <View style={{ gap: 5 }}>
                  <Text style={styles.label}>Vendor Name</Text>
                  <Text style={styles.label}>Vendor phone no</Text>
                </View>
                <View style={{ gap: 5 }}>
                  <Text style={styles.details_txt}>: {userDetails?.userName || "Loading..."}</Text>
                  <Text style={styles.details_txt}>: {userDetails?.phoneNumber || "Loading..."}</Text>
                </View>
              </View>
              <View style={styles.vendor_img_container}>
                <Text style={styles.document_label}>Vendor Image</Text>
                {vehicle.ownerImage && vehicle.ownerImage.length > 0 ? (
                  vehicle.ownerImage.map((img, i) => (
                    <Image key={i} source={getImgUri(img)} style={styles.vendor_img} />
                  ))
                ) : (
                  <Text style={styles.details_txt}>No Image Provided</Text>
                )}
              </View>
              <View style={styles.vendor_img_container}>
                <Text style={styles.document_label}>Vendor Aadhar card</Text>
                <View style={styles.doc_img_container}>
                  {vehicle.ownerAdharCard && vehicle.ownerAdharCard.length > 0 ? (
                    vehicle.ownerAdharCard.map((img, i) => (
                      <Image key={i} source={getImgUri(img)} style={styles.aadhar_img} />
                    ))
                  ) : (
                    <Text style={styles.details_txt}>No Aadhar Provided</Text>
                  )}
                </View>
              </View>
            </View>
            {/* Document details section*/}
            <View style={styles.vehicle_details_main_sec}>
              <Text style={styles.heading_txt}>Document Details</Text>
              <View style={styles.document_container}>
                <Text style={styles.document_label}>Driving License</Text>
                {vehicle.ownerDrivingLicense && vehicle.ownerDrivingLicense.length > 0 ? (
                  vehicle.ownerDrivingLicense.map((img, i) => (
                    <Image key={i} source={getImgUri(img)} style={styles.aadhar_img} />
                  ))
                ) : (
                  <Text style={styles.details_txt}>No License Provided</Text>
                )}
              </View>
              <View style={styles.document_container}>
                <Text style={styles.document_label}>Vehicle Insurance</Text>
                {vehicle.vehicleInsurance && vehicle.vehicleInsurance.length > 0 ? (
                  vehicle.vehicleInsurance.map((img, i) => (
                    <Image key={i} source={getImgUri(img)} style={styles.aadhar_img} />
                  ))
                ) : (
                  <Text style={styles.details_txt}>No Insurance Provided</Text>
                )}
              </View>
              <View style={styles.document_container}>
                <Text style={styles.document_label}>Vehicle RC</Text>
                {vehicle.vehicleRC && vehicle.vehicleRC.length > 0 ? (
                  vehicle.vehicleRC.map((img, i) => (
                    <Image key={i} source={getImgUri(img)} style={[styles.aadhar_img, styles.rc_img]} />
                  ))
                ) : (
                  <Text style={styles.details_txt}>No RC Provided</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      {vehicle.vehicleApprovedByAdmin === "rejected" &&
        vehicle.registerAmountRefund === false && (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("TruckRereg", {
                vehicle: vehicle,
              });
            }}
            style={styles.btn_container}
          >
            <Text style={styles.btn_txt}>Register Again</Text>
          </TouchableOpacity>
        )}
    </SafeAreaView>
  );
};

export default GoodsVehicleView;

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
    backgroundColor: colors.deep_blue,
    width: "100%",
    padding: 12,
    borderRadius: 8,
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  btn_txt: {
    textAlign: "center",
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
});
