import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
  } from "react-native";
  import React, { useState, useEffect } from "react";
  import Icon from "react-native-vector-icons/AntDesign";
  import { colors } from "../../utils/constants";
  import * as DocumentPicker from "expo-document-picker";
  import AxiosService from "../../utils/AxioService";
  import Toast from "react-native-toast-message";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import Spinner from "react-native-loading-spinner-overlay";
  import { BlurView } from "expo-blur";
  import Dropdown from "../../components/CustomDropdown";
  
  
  const BusReregForm = ({ navigation,route }) => {
    const [vendorId, setVendorId] = useState("");
    const [vehicleId, setVehicleId] = useState("");
    const [vehicleMake, setVehicleMake] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");
    const [licensePlate, setLicensePlate] = useState("");
    const [vehicleColor, setVehicleColor] = useState("");
    const [numberOfSeats, setNumberOfSeats] = useState("");
    const [milage, setMilage] = useState("");
    const [pricePerDay, setPricePerDay] = useState("");
    const [pricePerKm, setPricePerKm] = useState("");
    const [fuelType, setFuelType] = useState("");
    const [ac, setAc] = useState("");
    const [registerAmount , setRegisterAmount] = useState(2000)
  
    const [ownerAdharCard, setOwnerAdharCard] = useState([]);
    const [ownerImage, setOwnerImage] = useState([]);
    const [ownerDrivingLicense, setOwnerDrivingLicense] = useState([]);
    const [vehicleImages, setVehicleImages] = useState([]);
    const [vehicleInsurance, setVehicleInsurance] = useState([]);
    const [vehicleRC, setVehicleRC] = useState([]);
    const [loading, setLoading] = useState(false);
    const { vehicle } = route.params;

    useEffect(() => {
      if (vehicle) {
        setVehicleMake(vehicle.vehicleMake || "");
        setVehicleModel(vehicle.vehicleModel || "");
        setLicensePlate(vehicle.licensePlate || "");
        setVehicleColor(vehicle.vehicleColor || "");
        setNumberOfSeats(vehicle.numberOfSeats || "");
        setMilage(vehicle.milage || "");
        setPricePerDay(vehicle.pricePerDay || "");
        setPricePerKm(vehicle.pricePerKm || "");
        setFuelType(vehicle.fuelType || "");
        setRegisterAmount(vehicle.registerAmount || 2000);
        setAc(vehicle.ac || "")
        setVehicleId(vehicle._id);
        //   setOwnerAdharCard(vehicle.ownerAdharCard || []);
        //   setOwnerImage(vehicle.ownerImage || []);
        //   setOwnerDrivingLicense(vehicle.ownerDrivingLicense || []);
        //   setVehicleImages(vehicle.vehicleImages || []);
        //   setVehicleInsurance(vehicle.vehicleInsurance || []);
        //   setVehicleRC(vehicle.vehicleRC || []);
      }
    }, [vehicle]);
  
  
    const getVendorData = async () => {
      try {
        const vendor = await AsyncStorage.getItem("user");
  
        if (vendor) {
          const vendorData = JSON.parse(vendor);
          const vendorID = vendorData._id;
          setVendorId(vendorID);
        }
      } catch (error) {
        console.log("Error retrieving user data:", error);
      }
    };
  
    useEffect(() => {
      getVendorData();
    }, []);
  
    const PickDocument = async (setDocumentState, limit, currentDocuments) => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["image/jpeg", "application/pdf"],
          multiple: true,
        });
  
        if (result.type === "cancel") {
          Alert.alert(
            "No Document Selected",
            "Please select at least one document."
          );
          return;
        }
  
        const pickedDocs = result.assets ? result.assets : [result];
  
        const validDocuments = pickedDocs.filter(
          (doc) =>
            doc.mimeType === "image/jpeg" || doc.mimeType === "application/pdf"
        );
  
        if (validDocuments.length > 0) {
          if (currentDocuments.length + validDocuments.length > limit) {
            Alert.alert(
              "Document Limit Exceeded",
              `You can only upload up to ${limit} document(s).`
            );
            return;
          }
  
          setDocumentState((prevDocuments) => [
            ...prevDocuments,
            ...validDocuments,
          ]);
        } else {
          Alert.alert("Invalid File Type", "Please select a valid file type.");
        }
      } catch (error) {
        console.log("Error picking documents", error);
      }
    };
  
    const renderDocument = (documents, setDocumentState) => {
      if (!documents || documents.length === 0) return null;
  
      return documents.map((document, index) => {
        const { uri, mimeType, name } = document;
  
        return (
          <View key={index} style={styles.doc_container}>
            <Text style={styles.sub_heading_txt}>
              Selected Document {index + 1}
            </Text>
  
            {mimeType && mimeType.startsWith("image/") ? (
              <View style={styles.doc_img_container}>
                <Image source={{ uri }} style={styles.image} />
              </View>
            ) : (
              <Text style={styles.doc_name}>
                {name ? name : "No name available"}
              </Text>
            )}
  
            <Pressable
              style={styles.remove_button}
              onPress={() => removeDocument(index, setDocumentState)}
            >
              <Text style={styles.remove_button_text}>Remove</Text>
            </Pressable>
          </View>
        );
      });
    };
  
    const removeDocument = (index, setDocumentState) => {
      setDocumentState((prevDocuments) =>
        prevDocuments.filter((_, i) => i !== index)
      );
    };
  
   
    
    const handleSubmit = async () => {
        
    
        const formData = new FormData();
        formData.append("vendorId", vendorId);
        formData.append("vehicleId", vehicleId);
        formData.append("vehicleMake", vehicleMake);
        formData.append("vehicleModel", vehicleModel);
        formData.append("licensePlate", licensePlate);
        formData.append("vehicleColor", vehicleColor);
        formData.append("numberOfSeats", numberOfSeats);
        formData.append("milage", milage);
        formData.append("pricePerDay", pricePerDay);
        formData.append("pricePerKm", pricePerKm);
        formData.append("fuelType", fuelType);
        formData.append("ac",ac)
    
        if (ownerImage.length > 0) {
          formData.append("ownerImage", {
            uri: ownerImage[0].uri,
            type: ownerImage[0].mimeType,
            name: ownerImage[0].name,
          });
        }
    
        ownerAdharCard.forEach((doc) => {
          formData.append("ownerAdharCard", {
            uri: doc.uri,
            type: doc.mimeType,
            name: doc.name,
          });
        });
    
        ownerDrivingLicense.forEach((doc) => {
          formData.append("ownerDrivingLicense", {
            uri: doc.uri,
            type: doc.mimeType,
            name: doc.name,
          });
        });
    
        vehicleImages.forEach((img) => {
          formData.append("vehicleImages", {
            uri: img.uri,
            type: img.mimeType,
            name: img.name,
          });
        });
    
        vehicleInsurance.forEach((ins) => {
          formData.append("vehicleInsurance", {
            uri: ins.uri,
            type: ins.mimeType,
            name: ins.name,
          });
        });
    
        vehicleRC.forEach((rc) => {
          formData.append("vehicleRC", {
            uri: rc.uri,
            type: rc.mimeType,
            name: rc.name,
          });
        });
    
        console.log("form", formData);
    
        try {
          setLoading(true);
          const res = await AxiosService.post(
            `vendor/editBus/${vendorId}/${vehicleId}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              timeout: 5000,
            }
          );
    
          if (res.status === 201  ) {
            setVendorId("");
            setVehicleMake("");
            setVehicleModel("");
            setLicensePlate("");
            setVehicleColor("");
            setNumberOfSeats("");
            setMilage("");
            setAc("")
            setPricePerDay("");
            setPricePerKm("");
            setFuelType("");
            setOwnerAdharCard([]);
            setOwnerImage([]);
            setOwnerDrivingLicense([]);
            setVehicleImages([]);
            setVehicleInsurance([]);
            setVehicleRC([]);
    
            Toast.show({
              type: "success",
              text1: "Bus update successful!",
              text2: "Bus has been updated successfully.",
              position:"bottom"
            });
        setTimeout(() => {
            navigation.goBack();
        }, 2000);
           
          }
        } catch (error) {
          console.log("Error", error);
          if (error.response) {
            Toast.show({
              type: "error",
              text1: error.response.data.message,
              position:"bottom"
    
            });
          } else if (error.message) {
            Toast.show({
              type: "error",
              text1: error.message,
              position:"bottom"
    
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Something went wrong, please try again later",
              position:"bottom"
    
            });
          }
        } finally {
          setLoading(false);
        }
      };
    
    const dropdownData = [
      { label: "Petrol", value: "Petrol" },
      { label: "Diesel", value: "Diesel" },
      { label: "CNG", value: "CNG" },
      { label: "LPG", value: "LPG" },
      { label: "Electric batteries", value: "Electric batteries" },
    ];
  
    const handleSelectFule = (item) => {
      setFuelType(item.value);
    };
  
    
  
  
    return (
      // main container
      <View style={styles.main_container}>
        {/* nav container */}
        <Pressable
          style={styles.nav_container}
          onPress={() => navigation.navigate("BecomeVendor")}
        >
          <Icon name="arrow-left" size={30} />
        </Pressable>
        {/* content container */}
        <View style={styles.content_container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Form heading section*/}
            <View style={styles.form_heading_container}>
              {/* form vehicle image */}
              <Image
                source={require("../../assets/Images/bus.png")}
                style={styles.heading_img}
              />
              {/* form heading text */}
              <Text style={styles.form_heading_txt}>Bus Registartion Form</Text>
            </View>
            {/* heading text */}
            <Text style={styles.heading_txt}>
              To attach your vehicle with AAT, you need to provide the following
              details
            </Text>
  
            {/* vendor image */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>
                Vendor Image{" "}
                <Text style={styles.subText}>( maximum 1 image )</Text>
              </Text>
              <Pressable
                style={styles.container}
                onPress={() => PickDocument(setOwnerImage, 1, ownerImage)}
              >
                <Image
                  source={require("../../assets/Images/file.png")}
                  style={styles.img}
                />
                <Text style={styles.sub_txt}>Click to upload file</Text>
              </Pressable>
              {/* displaying selected document */}
              {renderDocument(ownerImage, setOwnerImage)}
            </View>
            {/* vendor aadhar card */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>
                Vendor Aadhar card{" "}
                <Text style={styles.subText}>( front and back )</Text>
              </Text>
              <Pressable
                style={styles.container}
                onPress={() => PickDocument(setOwnerAdharCard, 2, ownerAdharCard)}
              >
                <Image
                  source={require("../../assets/Images/file.png")}
                  style={styles.img}
                />
                <Text style={styles.sub_txt}>Click to upload file</Text>
              </Pressable>
              {/* displaying selected document */}
              {renderDocument(ownerAdharCard, setOwnerAdharCard)}
            </View>
            {/* vehicle image */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>
                Vehicle Image{" "}
                <Text style={styles.subText}>( maximum 5 images )</Text>
              </Text>
              <Pressable
                style={styles.container}
                onPress={() => PickDocument(setVehicleImages, 5, vehicleImages)}
              >
                <Image
                  source={require("../../assets/Images/file.png")}
                  style={styles.img}
                />
                <Text style={styles.sub_txt}>Click to upload file</Text>
              </Pressable>
              {/* displaying selected document */}
              {renderDocument(vehicleImages, setVehicleImages)}
            </View>
            {/* license */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>
                License <Text style={styles.subText}>( fornt and back )</Text>
              </Text>
              <Pressable
                style={styles.container}
                onPress={() =>
                  PickDocument(setOwnerDrivingLicense, 2, ownerDrivingLicense)
                }
              >
                <Image
                  source={require("../../assets/Images/file.png")}
                  style={styles.img}
                />
                <Text style={styles.sub_txt}>Click to upload file</Text>
              </Pressable>
              {/* displaying selected document */}
              {renderDocument(ownerDrivingLicense, setOwnerDrivingLicense)}
            </View>
            {/* insurance */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>
                Insurence <Text style={styles.subText}>( maximum 2 images )</Text>
              </Text>
              <Pressable
                style={styles.container}
                onPress={() =>
                  PickDocument(setVehicleInsurance, 2, vehicleInsurance)
                }
              >
                <Image
                  source={require("../../assets/Images/file.png")}
                  style={styles.img}
                />
                <Text style={styles.sub_txt}>Click to upload file</Text>
              </Pressable>
              {/* displaying selected document */}
              {renderDocument(vehicleInsurance, setVehicleInsurance)}
            </View>
            {/* Rc book */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>
                Rc book <Text style={styles.subText}>( front and back )</Text>
              </Text>
              <Pressable
                style={styles.container}
                onPress={() => PickDocument(setVehicleRC, 2, vehicleRC)}
              >
                <Image
                  source={require("../../assets/Images/file.png")}
                  style={styles.img}
                />
                <Text style={styles.sub_txt}>Click to upload file</Text>
              </Pressable>
              {/* displaying selected document */}
              {renderDocument(vehicleRC, setVehicleRC)}
            </View>
            {/* vehicle make year */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>Vehicle Make Year</Text>
              <TextInput
                value={vehicleMake}
                onChangeText={setVehicleMake}
                style={styles.input_field}
              />
            </View>
  
            {/* vehicle model */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>Vehicle Model</Text>
              <TextInput
                value={vehicleModel}
                onChangeText={setVehicleModel}
                style={styles.input_field}
                placeholder="Ex: Toyota"
              />
            </View>
            {/* license plate */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>Vehicle Number</Text>
              <TextInput
                value={licensePlate}
                onChangeText={setLicensePlate}
                style={styles.input_field}
              />
            </View>
            {/* vehicle color */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>Vehicle Color</Text>
              <TextInput
                value={vehicleColor}
                onChangeText={setVehicleColor}
                style={styles.input_field}
              />
            </View>
            {/* number of seats */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>No of Seats</Text>
              <TextInput
                value={numberOfSeats}
                onChangeText={setNumberOfSeats}
                style={styles.input_field}
              />
            </View>
  
            <View style={styles.input_field_container}>
              <Text style={styles.label}>AC</Text>
              <TextInput
                value={ac}
                onChangeText={setAc}
                style={styles.input_field}
                placeholder="EX : Yes or No"
              />
            </View>
  
            <View style={styles.input_field_container}>
              <Text style={styles.label}>Price per Km</Text>
              <TextInput
                keyboardType="numeric"
                value={pricePerKm}
                onChangeText={setPricePerKm}
                style={styles.input_field}
              />
            </View>
            <View style={styles.input_field_container}>
              <Text style={styles.label}>Price per Day</Text>
              <TextInput
                keyboardType="numeric"
                value={pricePerDay}
                onChangeText={setPricePerDay}
                style={styles.input_field}
              />
            </View>
            {/* milage */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>Milage</Text>
              <TextInput
                keyboardType="number-pad"
                value={milage}
                onChangeText={setMilage}
                style={styles.input_field}
              />
            </View>
            {/* vehicle fuel type */}
            <View style={styles.input_field_container}>
              <Text style={styles.label}>Fuel Type</Text>
              {/* <TextInput
                value={fuelType}
                onChangeText={setFuelType}
                style={styles.input_field}
              /> */}
               <Dropdown
                data={dropdownData}
                placeholder="Select fuel type"
                onSelect={handleSelectFule}
                defaultValue={fuelType}
              />
            </View>
            {/* button */}
            <TouchableOpacity onPress={handleSubmit} style={styles.btn_container}>
              <Text style={styles.btn_txt}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
          <Toast />
          {loading && (
            <BlurView style={styles.absolute} intensity={150}>
              <Spinner
                color={colors.dark_green}
                visible={loading}
                textStyle={styles.spinnerTextStyle}
              />
            </BlurView>
          )}
        </View>
      </View>
    );
  };
  export default BusReregForm;
  
  const styles = StyleSheet.create({
    main_container: {
      backgroundColor: colors.light_gray,
      flex: 1,
    },
    nav_container: {
      padding: 15,
      paddingTop: 40,
    },
    content_container: {
      backgroundColor: colors.white,
      flex: 1,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      paddingHorizontal: 15,
      paddingTop: 10,
    },
    heading_txt: {
      textAlign: "center",
      fontWeight: "500",
      fontSize: 15,
      marginBottom: 20,
      backgroundColor: colors.label_green,
      color: colors.black,
      padding: 5,
      borderRadius: 10,
      marginTop: 5,
    },
    // form heading sectioon style
    form_heading_container: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    heading_img: {
      width: 50,
      height: 50,
      resizeMode: "contain",
    },
    form_heading_txt: {
      fontSize: 17,
      fontWeight: "700",
    },
    // input field style
    input_field_container: {
      backgroundColor: colors.very_light_gray,
      padding: 10,
      borderRadius: 10,
      marginBottom: 20,
      borderColor: colors.light_gray,
      borderWidth: 1,
    },
    input_field: {
      borderColor: colors.gray,
      borderWidth: 1,
      flex: 1,
      height: 40,
      borderRadius: 8,
      padding: 10,
      backgroundColor: colors.white,
    },
    img: {
      width: 40,
      height: 50,
      resizeMode: "contain",
      opacity: 0.6,
    },
    sub_txt: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.dark_gray,
    },
    container: {
      alignItems: "center",
      borderColor: colors.gray,
      borderWidth: 1,
      padding: 8,
      borderRadius: 10,
      backgroundColor: colors.white,
    },
    //submit button style
    btn_container: {
      backgroundColor: colors.dark_green,
      width: "100%",
      padding: 10,
      borderRadius: 6,
      marginBottom: 15,
    },
    btn_txt: {
      textAlign: "center",
      color: colors.white,
      fontWeight: "600",
      fontSize: 16,
    },
    label: {
      fontSize: 15,
      fontWeight: "500",
      marginBottom: 10,
    },
    // rendered documents style
    doc_container: {
      paddingTop: 10,
      alignItems: "center",
    },
    doc_name: {
      fontSize: 14,
      textAlign: "center",
      fontWeight: "500",
      color: colors.dark_green,
      backgroundColor: colors.white,
      padding: 5,
      width: "100%",
      borderRadius: 5,
      borderColor: colors.light_green,
      borderWidth: 1,
    },
    image: {
      width: 100,
      height: 100,
      resizeMode: "contain",
    },
    doc_img_container: {
      width: "100%",
      borderRadius: 5,
      borderColor: colors.light_green,
      borderWidth: 1,
      backgroundColor: colors.white,
      alignItems: "center",
    },
    sub_heading_txt: {
      marginBottom: 5,
      fontSize: 14,
      fontWeight: "500",
    },
    remove_button: {
      backgroundColor: "red",
      padding: 3,
      borderRadius: 5,
      marginTop: 10,
    },
    remove_button_text: {
      color: "white",
      textAlign: "center",
      fontSize: 10,
    },
  
    subText: {
      fontSize: 12,
      color: "gray",
    },
    absolute: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    spinnerTextStyle: {
      color: colors.dark_green,
    },
  });
  