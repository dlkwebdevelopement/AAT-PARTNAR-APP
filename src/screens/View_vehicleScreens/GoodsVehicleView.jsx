import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { colors } from "../../utils/constants";
import Icon1 from "react-native-vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const GoodsVehicleView = ({ route }) => {
  const navigation = useNavigation();
  const { vehicle } = route.params;

  return (
    <View style={{ backgroundColor: colors.white, flex: 1 }}>
      {/* nav container */}
      <Pressable
        style={styles.nav_container}
        onPress={() => navigation.navigate("Vehicle Management")}
      >
        <Icon1 name="arrow-left" size={30} />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: colors.light_gray }}>
          {/* main container */}
          <View style={styles.main_container}>
            {/* vehicle image */}
            <View style={styles.vehicle_img_container}>
              <Image source={vehicle.vehicle_img} style={styles.vehicle_img} />
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
                  {/* vehicle no */}
                  <Text style={styles.details_txt}>: {vehicle.vehicle_no}</Text>
                  {/* vehicle model  */}
                  <Text style={styles.details_txt}>
                    : {vehicle.vehicle_model}
                  </Text>
                  {/* vehicle ton */}
                  <Text style={styles.details_txt}>
                    : {vehicle.vehicle_ton}
                  </Text>
                  {/* vehicle size */}
                  <Text style={styles.details_txt}>
                    : {vehicle.vehicle_size}
                  </Text>
                  {/* millage */}
                  <Text style={styles.details_txt}>: {vehicle.mileage}</Text>
                </View>
              </View>
            </View>
            { vehicle.vehicleApprovedByAdmin === 'rejected'  && <View style={styles.vehicle_details_main_sec}>
            <Text style={styles.heading_txt}>Rejected Reason</Text>
            <Text  >
              {vehicle.rejectedReason}
            </Text>
            </View>}
            {/* owner details section */}
            <View style={styles.vehicle_details_main_sec}>
              <Text style={styles.heading_txt}>Vendor Details</Text>
              {/* heading text */}
              <View style={styles.vehicle_details_sec}>
                {/* label container */}
                <View style={{ gap: 5 }}>
                  <Text style={styles.label}>Vendor Name</Text>
                  <Text style={styles.label}>Vendor phone no</Text>
                </View>
                <View style={{ gap: 5 }}>
                  {/* owner name */}
                  <Text style={styles.details_txt}>: {vehicle.owner_name}</Text>
                  {/* owner phone number  */}
                  <Text style={styles.details_txt}>
                    : {vehicle.owner_phone}
                  </Text>
                </View>
              </View>
              <View style={styles.vendor_img_container}>
                <Text style={styles.document_label}>Vendor Image</Text>
                <Image source={vehicle.owner_img} style={styles.vendor_img} />
              </View>
              {/* vendor aadhar card section */}
              <View style={styles.vendor_img_container}>
                <Text style={styles.document_label}>Vendor Aadhar card</Text>
                {/* image container */}
                <View style={styles.doc_img_container}>
                  <Image
                    source={vehicle.aadhar_card}
                    style={styles.aadhar_img}
                  />
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
                <Image
                  source={vehicle.license_card}
                  style={styles.aadhar_img}
                />
              </View>
              {/* insurance container */}
              <View style={styles.document_container}>
                {/* document name text */}
                <Text style={styles.document_label}>Vehicle Insurance</Text>
                {/* document image */}
                <Image source={vehicle.insurance} style={styles.aadhar_img} />
              </View>
              {/* RC book container */}
              <View style={styles.document_container}>
                {/* document name text */}
                <Text style={styles.document_label}>Vehicle RC</Text>
                {/* document image */}
                <Image
                  source={vehicle.rc_card}
                  style={[styles.aadhar_img, styles.rc_img]}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
});
