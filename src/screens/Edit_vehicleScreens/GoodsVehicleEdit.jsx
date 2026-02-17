import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useState } from "react";
import { colors } from "../../utils/constants";
import Icon1 from "react-native-vector-icons/AntDesign";
import Icon2 from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const GoodsVehicleEdit = ({ route }) => {
  const navigation = useNavigation();
  const { vehicle } = route.params;

  // Initialize state for each vehicle property
  const [vehicleNo, setVehicleNo] = useState(vehicle.vehicle_no);
  const [vehicleModel, setVehicleModel] = useState(vehicle.vehicle_model);
  const [vehicleTon, setVehicleTon] = useState(vehicle.vehicle_ton);
  const [vehicleSize, setVehicleSize] = useState(vehicle.vehicle_size);
  const [mileage, setMileage] = useState(vehicle.mileage);
  const [ownerName, setOwnerName] = useState(vehicle.owner_name);
  const [ownerPhone, setOwnerPhone] = useState(vehicle.owner_phone);

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
            {/* edit image container */}
            <Pressable style={styles.edit_img_btn_container}>
              {/* icon */}
              <Icon2 name="image-edit" size={22} color={colors.white} />
              {/* text */}
              <Text style={styles.image_edit_btn_txt}>Edit Images</Text>
            </Pressable>
            {/* vehicle details section */}
            <View style={styles.vehicle_details_main_sec}>
              {/* heading text */}
              <Text style={styles.heading_txt}>Edit Vehicle Details</Text>
              <View style={styles.vehicle_details_sec}>
                {/* vehicle number field */}
                <View style={styles.input_container}>
                  <Text style={styles.label}>Vehicle Number</Text>
                  <TextInput
                    style={styles.input_field}
                    value={vehicleNo}
                    onChangeText={(text)=>{
                      const formatedText = text.toLocaleUpperCase();
                      setVehicleNo(formatedText)
                    }}
                    placeholder="TN 01 GH 0000"
                  />
                </View>
                {/* vehicle Model field */}
                <View style={styles.input_container}>
                  <Text style={styles.label}>Vehicle Model</Text>
                  <TextInput
                    style={styles.input_field}
                    value={vehicleModel}
                    onChangeText={setVehicleModel}
                  />
                </View>
                {/* vehicle ton field */}
                <View style={styles.input_container}>
                  <Text style={styles.label}>Ton</Text>
                  <TextInput
                    style={styles.input_field}
                    value={vehicleTon}
                    onChangeText={setVehicleTon}
                  />
                </View>
                {/* vehicle size field*/}
                <View style={styles.input_container}>
                  <Text style={styles.label}>Size</Text>
                  <TextInput
                    style={styles.input_field}
                    value={vehicleSize}
                    onChangeText={setVehicleSize}
                  />
                </View>
                {/* milage field*/}
                <View style={styles.input_container}>
                  <Text style={styles.label}>Mileage</Text>
                  <TextInput
                    style={styles.input_field}
                    value={mileage}
                    onChangeText={setMileage}
                  />
                </View>
              </View>
            </View>
            {/* owner details section */}
            <View style={styles.vehicle_details_main_sec}>
              <Text style={styles.heading_txt}>Edit Vendor Details</Text>
              {/* heading text */}
              <View style={styles.vehicle_details_sec}>
                <View style={styles.vehicle_details_sec}>
                  {/* vendor name field */}
                  <View style={styles.input_container}>
                    <Text style={styles.label}>Vendor Name</Text>
                    <TextInput
                      style={styles.input_field}
                      value={ownerName}
                      onChangeText={setOwnerName}
                    />
                  </View>
                  {/* vendor phone number field */}
                  <View style={styles.input_container}>
                    <Text style={styles.label}>Vendor phone number</Text>
                    <TextInput
                      style={styles.input_field}
                      value={ownerPhone}
                      onChangeText={setOwnerPhone}
                    />
                  </View>
                  {/* vendor image details */}
                  <View
                    style={[styles.input_container, styles.image_container]}
                  >
                    <Text style={styles.label}>Vendor Image</Text>
                    <Image
                      source={vehicle.owner_img}
                      style={styles.doc_images}
                    />
                  </View>
                </View>
              </View>
            </View>
            {/* edit images and documents section */}
            <View style={styles.vehicle_details_main_sec}>
              {/* heading text */}
              <Text style={styles.heading_txt}>Edit Documents</Text>
              <View style={styles.vehicle_details_sec}>
                <View style={styles.vehicle_details_sec}>
                  {/* license details */}
                  <View
                    style={[styles.input_container, styles.image_container]}
                  >
                    <Text style={styles.label}>License</Text>
                    <Image
                      source={vehicle.license_card}
                      style={styles.doc_images}
                    />
                  </View>
                  {/* insurance details */}
                  <View
                    style={[styles.input_container, styles.image_container]}
                  >
                    <Text style={styles.label}>Insurance</Text>
                    <Image
                      source={vehicle.insurance}
                      style={styles.doc_images}
                    />
                  </View>
                  {/* RC book details */}
                  <View
                    style={[styles.input_container, styles.image_container]}
                  >
                    <Text style={styles.label}>RC book</Text>
                    <Image source={vehicle.rc_card} style={styles.doc_images} />
                  </View>
                </View>
              </View>
            </View>
            {/* save button section */}
            <TouchableOpacity style={styles.save_btn_container}>
              <Text style={styles.save_btn_txt}>Save changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default GoodsVehicleEdit;

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
  // vehicle and vendor details section style
  vehicle_details_main_sec: {
    marginTop: 20,
    padding: 10,
    borderRadius: 10,
    borderColor: colors.gray,
    borderWidth: 1,
  },
  vehicle_details_sec: {
    gap: 15,
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
    color: colors.black,
    marginBottom: 5,
  },
  details_txt: {
    color: colors.black,
    fontSize: 15,
    fontWeight: "600",
  },
  // image edit button style
  edit_img_btn_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blue,
    marginTop: 10,
    padding: 7,
    borderRadius: 7,
    gap: 10,
  },
  image_edit_btn_txt: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  //   input field section style
  input_container: {
    backgroundColor: colors.smoke_white,
    padding: 10,
    borderRadius: 7,
  },
  input_field: {
    borderColor: colors.light_gray,
    borderWidth: 1,
    height: 40,
    flex: 1,
    borderRadius: 5,
    padding: 10,
    backgroundColor: colors.white,
  },
  // image and document edit section style
  image_container: {
    alignItems: "center",
    justifyContent: "center",
  },
  doc_images: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  // save button section style
  save_btn_container: {
    backgroundColor: colors.dark_green,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginVertical: 20,
    borderRadius: 7,
  },
  save_btn_txt: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 15,
  },
});
