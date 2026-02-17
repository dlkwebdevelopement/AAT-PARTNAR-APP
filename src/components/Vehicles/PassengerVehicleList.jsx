import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { colors } from "../../utils/constants";
import { TouchableOpacity } from "react-native";
import Fontaswome from "react-native-vector-icons/FontAwesome";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import carImg from "../../assets/Images/car5.png";
import busImg from "../../assets/Images/bus.png";
import autoImg from "../../assets/Images/auto.png";
import vanImg from "../../assets/Images/van.png";
import goodsImg from "../../assets/Images/XL-truck.png";
import Icon from "react-native-vector-icons/MaterialIcons";
import Icon2 from "react-native-vector-icons/MaterialCommunityIcons";
import Antdesign from "react-native-vector-icons/AntDesign";
import Toast from "react-native-toast-message";
import ToggleSwitch from "toggle-switch-react-native";

const PassengerVehicleList = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicleData, setVehicleData] = useState([]);
  const [showButton, setShowButton] = useState(false);
  const [filtered, setFiltered] = useState("all");
  const [isOn, setIson] = useState({});
  const navigation = useNavigation();

  const getVehicles = async () => {
    const vendor = await AsyncStorage.getItem("user");
    const vendorData = JSON.parse(vendor);
    const vendorId = vendorData._id;
    try {
      const res = await AxiosService.get(
        `vendor/getAllVehiclesByVendor/${vendorId}`
      );
      const vehicleDatas = res.data.vehicles.filter(
        (data) => data.categoryType === "Passengers"
      );
      setVehicleData(vehicleDatas);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (vehicleId) => {
    const vendor = await AsyncStorage.getItem("user");
    const vendorData = JSON.parse(vendor);
    const vendorId = vendorData._id;
    try {
      setLoading(true);
      const res = await AxiosService.delete(
        `admin/deleteVehicle/${vendorId}/${vehicleId}`
      );
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: "Vechicle Deleted Successfully",
        });
        getVehicles();
      }
    } catch (error) {
      if (error.response) {
        Toast.show({
          type: "error",
          text1: error.response.data.message,
        });
      } else if (error.message) {
        Toast.show({
          type: "error",
          text1: error.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Something went wrong, please try again later",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      getVehicles();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await getVehicles();
    setRefreshing(false);
  };

  const filteredData =
    filtered === "all"
      ? vehicleData
      : vehicleData.filter(
          (vehicle) => vehicle.vehicleApprovedByAdmin === filtered
        );

  const handleFilterChange = (filter) => {
    setFiltered(filter);
    setShowButton(false);
  };

  const handleNavigation = (item) => {
    if (item.subCategory === "car") {
      navigation.navigate("CarReregForm", { vehicle: item });
    } else if (item.subCategory === "auto") {
      navigation.navigate("AutoReregForm", { vehicle: item });
    } else if (item.subCategory === "bus") {
      navigation.navigate("BusReregForm", { vehicle: item });
    } else {
      navigation.navigate("VanReregForm", { vehicle: item });
    }
  };

  useEffect(() => {
    if (vehicleData?.length > 0) {
      setIson((prevState) => {
        const initialState = {};
        vehicleData.forEach((item) => {
          initialState[item._id] = prevState[item._id] ?? item.vehicleIsOnline;
        });
        return initialState;
      });
    }
  }, [vehicleData]); 
  
  const isToggleSwitch = (id) => {
    setIson((prevState) => {
      const newState = {
        ...prevState,
        [id]: !prevState[id], 
      };
  
      const status = newState[id]; 
      handleVehicleAvailable(id, status);
  
      return newState;
    });
  };
  
  const handleVehicleAvailable = async (vehicleId, status) => {
    const vendor = await AsyncStorage.getItem("user");
    const vendordata = JSON.parse(vendor);
    const vendorId = vendordata._id;
  
    try {
      const res = await AxiosService.post("vendor/vehicleAvailableStatus", {
        vendorId,
        vehicleId,
        status,
      });
  
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: res.data.message,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "An error occurred",
      });
    }
  };

  return (
    <View style={styles.main_container}>
      <Toast />

      {loading ? (
        <ActivityIndicator
          size="large"
          style={{ marginTop: "20px" }}
          color={colors.dark_gray}
        />
      ) : (
        <>
          {/* no vehicle available section */}
          {vehicleData.length === 0 && (
            <>
              <View style={styles.no_data_main_container}>
                {/* bell image */}
                <Image
                  source={require("../../assets/Images/no-car-list.jpg")}
                  style={styles.img}
                />
                {/* main text */}
                <Text style={styles.main_txt}>No Vehicles Available</Text>
                <Text style={styles.sub_txt}>
                  It looks like you haven’t added any vehicles yet. Click the
                  add vehicle button to add a new vehicle!
                </Text>
              </View>
            </>
          )}
          {vehicleData.length !== 0 && (
            <View style={styles.filter_main_container}>
              {/*show all button */}
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
                    onPress={() => handleFilterChange("approved")}
                  >
                    <Fontaswome name="check" size={17} color={colors.black} />
                    <Text
                      style={[styles.filter_btn_txt, styles.approved_btn_txt]}
                    >
                      Approved
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filter_btn_container,
                      styles.pending_btn_container,
                    ]}
                    onPress={() => handleFilterChange("pending")}
                  >
                    <Icon2 name="timer-sand" size={20} />
                    <Text style={styles.filter_btn_txt}>Pending</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filter_btn_container,
                      styles.rejected_btn_container,
                    ]}
                    onPress={() => handleFilterChange("rejected")}
                  >
                    <Icon name="cancel" size={20} />
                    <Text style={styles.filter_btn_txt}>Rejected</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filter_btn_container, styles.filter_btn_txt]} // You can customize the style if needed
                    onPress={() => handleFilterChange("all")}
                  >
                    <Fontaswome name="list" size={17} color={colors.black} />
                    <Text style={styles.filter_btn_txt}>All</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
          {/* vehicle listing section */}
          <View style={{ paddingTop: 10, paddingBottom: 230 }}>
            <FlatList
              showsVerticalScrollIndicator={false}
              data={filteredData}
              keyExtractor={(item) => item._id}
              renderItem={({ item, index }) => {
                let imageSrc;
                if (item.subCategory === "car") {
                  imageSrc = carImg;
                } else if (item.subCategory === "auto") {
                  imageSrc = autoImg;
                } else if (item.subCategory === "van") {
                  imageSrc = vanImg;
                } else if (item.subCategory === "bus") {
                  imageSrc = busImg;
                } else if (item.subCategory === "truck") {
                  imageSrc = goodsImg;
                }
                return (
                  //vehicle main container
                  <View key={index} style={styles.main_vehicle_conatiner}>
                    <View style={styles.vehicle_container}>
                      {/* vehicle image */}
                      <Image source={imageSrc} style={styles.vehicle_img} />
                      {/* vehicle details section */}
                      <View style={styles.vehicleDetails_container}>
                        <View>
                          <Text
                            style={[
                              styles.booking_status_txt,
                              item.vehicleApprovedByAdmin === "approved"
                                ? styles.booking_status_txt
                                : item.vehicleApprovedByAdmin === "pending"
                                ? styles.pending_booking
                                : item.vehicleApprovedByAdmin === "rejected"
                                ? styles.rejected_status
                                : styles.booking_status_txt,
                            ]}
                          >
                            {item.vehicleApprovedByAdmin === "approved"
                              ? "Approved"
                              : item.vehicleApprovedByAdmin === "pending"
                              ? "Pending"
                              : item.vehicleApprovedByAdmin === "rejected"
                              ? "Rejected"
                              : "Unknown Status"}
                          </Text>
                        </View>

                        <View>
                          {/* vehicle number */}
                          <Text style={styles.desc_txt}>
                            Vehicle Number:<Text> {item.licensePlate}</Text>
                          </Text>
                          {/* vehicle model */}
                          <Text style={styles.desc_txt}>
                            Vehicle Model:<Text> {item.vehicleModel}</Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                    {/* actions button section */}
                    <View style={styles.main_btn_conatiner}>
                      {/* view button */}
                      <TouchableOpacity
                        style={styles.btn_container}
                        onPress={() =>
                          navigation.navigate("PassengerVehicleView", {
                            vehicle: item,
                          })
                        }
                      >
                        {/* icon */}
                        <Fontaswome name="eye" size={20} />
                        {/* text */}
                        <Text style={styles.btn_txt}>View</Text>
                      </TouchableOpacity>

                      {item.vehicleApprovedByAdmin === "approved" && (
                        <ToggleSwitch
                          isOn={isOn[item._id] || false}
                          onColor="green"
                          offColor="gray"
                          label={
                            isOn[item._id]
                              ? "Vehicle is Available"
                              : "Vehicle is Unavailable"
                          }
                          labelStyle={{ color: "black", fontWeight: "900" }}
                          size="medium"
                          onToggle={() => isToggleSwitch(item._id)}
                        />
                      )}
                      {/* <TouchableOpacity
                        style={[
                          styles.btn_container,
                          styles.edit_btn_container,
                        ]}
                        onPress={() =>
                          navigation.navigate("PassengerVehicleEdit", {
                            vehicle: item,
                          })
                        }
                      >
                        <Fontaswome name="edit" size={20} />
                        <Text style={styles.btn_txt}>Edit</Text>
                      </TouchableOpacity> */}
                      {item.vehicleApprovedByAdmin === "rejected" &&
                        item.registerAmountRefund === true && (
                          <TouchableOpacity
                            onPress={() => onDelete(item._id)}
                            style={[
                              styles.btn_container,
                              styles.delete_btn_container,
                            ]}
                          >
                            <Antdesign name="delete" size={20} />
                            <Text style={styles.btn_txt}>Delete</Text>
                          </TouchableOpacity>
                        )}

                      {item.vehicleApprovedByAdmin === "rejected" &&
                        item.registerAmountRefund === false && (
                          <TouchableOpacity
                            style={[
                              styles.btn_container,
                              styles.edit_btn_container,
                            ]}
                            onPress={() => handleNavigation(item)}
                          >
                            <Fontaswome name="edit" size={20} />
                            <Text style={styles.btn_txt}>Register again</Text>
                          </TouchableOpacity>
                        )}
                    </View>
                    <Toast />
                  </View>
                );
              }}
              onRefresh={onRefresh}
              refreshing={refreshing}
            />
          </View>
        </>
      )}
    </View>
  );
};

export default PassengerVehicleList;

const styles = StyleSheet.create({
  main_container: {},
  // no vehicle list section style
  no_data_main_container: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(12),
    gap: 10,
  },
  img: {
    height: hp(30),
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
    maxWidth: wp(80),
    textAlign: "center",
    fontWeight: "500",
    color: colors.dark_gray,
  },
  //   vehicle listing section style
  main_vehicle_conatiner: {
    backgroundColor: colors.very_light_gray,
    marginBottom: 15,
    padding: 8,
    borderRadius: 10,
    borderColor: colors.gray,
    borderWidth: 1,
  },
  vehicle_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 5,
  },
  vehicle_img: {
    width: wp(30),
    height: 100,
    resizeMode: "contain",
  },
  desc_txt: {
    fontWeight: "600",
  },
  //   action buttons styles
  main_btn_conatiner: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: colors.white,
    marginTop: 10,
    padding: 5,
    borderRadius: 7,
    gap: 10,
    paddingHorizontal: 10,
  },
  btn_container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.very_light_green,
    paddingVertical: 7,
    borderRadius: 5,
    paddingHorizontal: 15,
    flexDirection: "row",
    gap: 5,
  },
  edit_btn_container: {
    backgroundColor: colors.light_blue,
  },
  delete_btn_container: {
    backgroundColor: colors.light_orange,
  },
  btn_txt: {
    fontWeight: "600",
  },
    booking_status_txt: {
    backgroundColor: colors.label_green,
    paddingHorizontal: 6,
    paddingVertical: 3,
    width: 90, // fixed width for alignment
    textAlign: "center",
    borderRadius: 3,
    color: colors.black,
    fontWeight: "500",
    alignSelf: "flex-start", // aligns it to left so it doesn't shift content
    marginBottom: 5,
    borderWidth: 0.8,
    borderColor: colors.dark_green,
  },
  pending_booking: {
    backgroundColor: colors.light_yellow,
    color: colors.black,
    borderColor: colors.yellow,
    borderWidth: 0.8,
    width: 90,
    textAlign: "center",
    borderRadius: 3,
    fontWeight: "500",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 5,
  },
  rejected_status: {
    backgroundColor: colors.light_orange,
    color: colors.black,
    borderColor: colors.red,
    borderWidth: 0.8,
    width: 90,
    textAlign: "center",
    borderRadius: 3,
    fontWeight: "500",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 5,
  },

  vehicleDetails_container: {
    display: "flex",
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
    // marginBottom: 5,
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
});
