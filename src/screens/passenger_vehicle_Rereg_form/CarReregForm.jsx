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
import React, { useEffect, useState } from "react";
import { AntDesign as Icon } from "@expo/vector-icons";
import { colors } from "../../utils/constants";
import * as DocumentPicker from "expo-document-picker";
import AxiosService, { getCorrectImageUrl } from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Spinner from "react-native-loading-spinner-overlay";
import { BlurView } from "expo-blur";
import Dropdown from "../../components/CustomDropdown";
import RazorpayCheckout from "react-native-razorpay";
import { EXPO_PUBLIC_RAZORPAY_KEY_ID } from "@env";

const GST_RATE = 18;

const CarReregForm = ({ navigation, route }) => {
  const [vendorId, setVendorId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [numberOfSeats, setNumberOfSeats] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [milage, setMilage] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [pricePerKm, setPricePerKm] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [registerAmount, setRegisterAmount] = useState(2000);

  const [ownerAdharCard, setOwnerAdharCard] = useState([]);
  const [ownerImage, setOwnerImage] = useState([]);
  const [ownerDrivingLicense, setOwnerDrivingLicense] = useState([]);
  const [vehicleImages, setVehicleImages] = useState([]);
  const [vehicleInsurance, setVehicleInsurance] = useState([]);
  const [vehicleRC, setVehicleRC] = useState([]);
  const [loading, setLoading] = useState(false);

  // Config & Payment state
  const [advanceAmount, setAdvanceAmount] = useState(500);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [pricePerKmError, setPricePerKmError] = useState("");

  const { vehicle } = route.params;

  const calcGST = (base) => {
    const b = parseFloat(parseFloat(base).toFixed(2));
    const gst = parseFloat(((b * GST_RATE) / 100).toFixed(2));
    return {
      baseAmount: b,
      gstAmount: gst,
      totalAmount: parseFloat((b + gst).toFixed(2)),
    };
  };

  useEffect(() => {
    if (vehicle) {
      setVehicleMake(vehicle.vehicleMake || "");
      setVehicleModel(vehicle.vehicleModel || "");
      setLicensePlate(vehicle.licensePlate || "");
      setVehicleColor(vehicle.vehicleColor || "");
      setNumberOfSeats(vehicle.numberOfSeats || "");
      setVehicleType(vehicle.vehicleType || "");
      setMilage(vehicle.milage || "");
      setPricePerDay(vehicle.pricePerDay || "");
      setPricePerKm(vehicle.pricePerKm || "");
      setFuelType(vehicle.fuelType || "");
      setRegisterAmount(vehicle.registerAmount || 2000);
      setVehicleId(vehicle._id);
      setOwnerAdharCard(vehicle.ownerAdharCard || []);
      setOwnerImage(vehicle.ownerImage || []);
      setOwnerDrivingLicense(vehicle.ownerDrivingLicense || []);
      setVehicleImages(vehicle.vehicleImages || []);
      setVehicleInsurance(vehicle.vehicleInsurance || []);
      setVehicleRC(vehicle.vehicleRC || []);
    }
  }, [vehicle]);

  const getImgUri = (uri) => {
    if (!uri) return null;
    if (typeof uri !== "string") return uri; // Already a local object with uri property
    return getCorrectImageUrl(uri);
  };

  function normalizeFileData(fileData) {
    return fileData.map((file) => {
      if (typeof file === "string") {
        return file;
      }
      if (file.uri) {
        return file.uri;
      }
      return null;
    });
  }

  const normalizedOwnerAdharCard = normalizeFileData(ownerAdharCard);
  console.log(normalizedOwnerAdharCard);

  const fetchRegisterFee = async () => {
    try {
      const res = await AxiosService.get("payment/config?vehicleType=car");
      if (res.status === 200 && res.data.config) {
        const cfg = res.data.config;
        setRegisterAmount(parseFloat(cfg.fixedRegisterAmount || cfg.minRegisterAmount || 2000));
        setAdvanceAmount(cfg.advanceAmount != null ? parseFloat(cfg.advanceAmount) : 500);
        if (cfg.minPrice != null) setMinPrice(parseFloat(cfg.minPrice));
        if (cfg.maxPrice != null) setMaxPrice(parseFloat(cfg.maxPrice));
      }
    } catch (err) {
      console.log("fetchRegisterFee error:", err.message);
    }
  };

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
    fetchRegisterFee();
  }, []);

  const convertToBase64 = async (file) => {
    try {
      if (typeof file === "string") return null; // Already a URL
      const response = await fetch(file.uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting file to base64:", error);
      return null;
    }
  };

  const PickDocument = async (setDocumentState, limit, currentDocuments) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "application/pdf"],
        multiple: true,
      });

      if (result.canceled) {
        Alert.alert("No Document Selected", "Please select at least one document.");
        return;
      }

      const pickedDocs = result.assets ? result.assets : [result];
      const validDocuments = pickedDocs.filter(
        (doc) => doc.mimeType === "image/jpeg" || doc.mimeType === "application/pdf"
      );

      if (validDocuments.length > 0) {
        if (currentDocuments.length + validDocuments.length > limit) {
          Alert.alert("Limit Exceeded", `Max ${limit} documents allowed.`);
          return;
        }
        setDocumentState((prev) => [...prev, ...validDocuments]);
      }
    } catch (error) {
      console.log("Error picking documents", error);
    }
  };

  const renderDocument = (documents, setDocumentState) => {
    if (!documents || documents.length === 0) return null;

    return documents.map((document, index) => {
      const uri = typeof document === "string" ? getImgUri(document) : document.uri;
      const mimeType =
        typeof document === "string" ? "image/jpeg" : document.mimeType;

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
            <Text style={styles.doc_name}>{uri}</Text>
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

  const handlePricePerKmChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    setPricePerKm(cleaned);
    if (!cleaned) {
      setPricePerKmError("");
      return;
    }
    const val = parseFloat(cleaned);
    if (isNaN(val)) {
      setPricePerKmError("Enter a valid number");
      return;
    }
    if (minPrice !== null && val < minPrice)
      setPricePerKmError(`Min allowed: ₹${minPrice}/km`);
    else if (maxPrice !== null && val > maxPrice)
      setPricePerKmError(`Max allowed: ₹${maxPrice}/km`);
    else setPricePerKmError("");
  };

  const buildPayload = async () => {
    const process = async (docs) => await Promise.all(docs.map(async d => typeof d === 'string' ? d : await convertToBase64(d)));
    
    return {
      vendorId,
      vehicleId,
      vehicleCategory: "cars",
      vehicleMake,
      vehicleModel,
      licensePlate,
      vehicleColor,
      numberOfSeats,
      vehicleType,
      milage,
      pricePerDay,
      pricePerKm,
      fuelType,
      registerAmount,
      advanceAmount,
      ownerImage: typeof ownerImage[0] === 'string' ? ownerImage[0] : await convertToBase64(ownerImage[0]),
      ownerAdharCard: await process(ownerAdharCard),
      ownerDrivingLicense: await process(ownerDrivingLicense),
      vehicleImages: await process(vehicleImages),
      vehicleInsurance: await process(vehicleInsurance),
      vehicleRC: await process(vehicleRC),
    };
  };

  const handleSubmit = () => {
    if (!vehicleMake || !vehicleModel || !licensePlate || !pricePerKm) {
      Toast.show({ type: "error", text1: "Please fill all required fields" });
      return;
    }
    if (pricePerKmError) {
      Toast.show({ type: "error", text1: pricePerKmError });
      return;
    }

    setPaymentDetails(calcGST(registerAmount));
    setShowPaymentConfirm(true);
  };

  const handleConfirmPayment = async () => {
    setShowPaymentConfirm(false);
    setLoading(true);
    try {
      const payload = await buildPayload();
      const res = await AxiosService.post("payment/initiate-register-fee", payload);

      if (res.status === 200 && res.data.razorpayOrderId) {
        const options = {
          description: "AAT Car Re-registration Fee",
          image: `${AxiosService.defaults.baseURL.split('/api')[0]}/uploads/logo.png`,
          key: EXPO_PUBLIC_RAZORPAY_KEY_ID,
          amount: Math.round(res.data.amount * 100),
          name: "AAT",
          order_id: res.data.razorpayOrderId,
          prefill: {
            email: res.data.vendorDetails?.email || "",
            contact: String(res.data.vendorDetails?.contact || ""),
            name: res.data.vendorDetails?.name || "",
          },
          theme: { color: colors.deep_blue },
        };

        RazorpayCheckout.open(options)
          .then(async (data) => {
            await verifyPayment(data);
          })
          .catch((error) => {
            console.log("Razorpay Error:", error);
            Toast.show({ type: "error", text1: "Payment failed or cancelled." });
          });
      } else {
        // If no payment required (e.g. status was already paid)
        await processDirectUpdate(payload);
      }
    } catch (error) {
      console.error("Initiate error:", error);
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Failed to initiate update.",
      });
    } finally {
      setLoading(false);
    }
  };

  const processDirectUpdate = async (payload) => {
    try {
      const res = await AxiosService.put(`vendor/editCar/${vendorId}/${vehicleId}`, payload);
      if (res.status === 200) {
        Toast.show({ type: "success", text1: "Vehicle updated successfully!" });
        setTimeout(() => navigation.navigate("Vechicle Management"), 2000);
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to update vehicle." });
    }
  };

  const verifyPayment = async (data) => {
    setLoading(true);
    try {
      const verifyRes = await AxiosService.post("payment/verify", {
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      });

      if (verifyRes.status === 200) {
        Toast.show({ type: "success", text1: "Payment successful! Vehicle updated." });
        setTimeout(() => navigation.navigate("Vechicle Management"), 2000);
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Payment verification failed." });
    } finally {
      setLoading(false);
    }
  };

  const fuleTypeData = [
    { label: "Petrol", value: "Petrol" },
    { label: "Diesel", value: "Diesel" },
    { label: "CNG", value: "CNG" },
    { label: "Hybrid", value: "Hybrid" },
    { label: "Electric batteries", value: "Electric batteries" },
  ];

  const carTypeData = [
    { label: "SUV", value: "SUV" },
    { label: "Hatchback", value: "Hatchback" },
    { label: "Sedan", value: "Sedan" },
  ];

  const handleSelectCarType = (item) => {
    setVehicleType(item.value);
  };

  const handleSelectFule = (item) => {
    setFuelType(item.value);
  };

  return (
    // main container
    <View style={styles.main_container}>
      {/* nav container */}
      <Pressable
        style={styles.nav_container}
        onPress={() => navigation.navigate("Vechicle Management")}
      >
        <Icon name="left" size={30} />
      </Pressable>
      {/* content container */}
      <View style={styles.content_container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Form heading section*/}
          <View style={styles.form_heading_container}>
            {/* form vehicle image */}
            <Image
              source={require("../../assets/Images/car5.png")}
              style={styles.heading_img}
            />
            {/* form heading text */}
            <Text style={styles.form_heading_txt}>Car Registartion Form</Text>
          </View>
          {/* heading text */}
          <Text style={styles.heading_txt}>
            To attach your vehicle with AAT, you need to provide the following
            details
          </Text>

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
          {/* vehicle type */}
          <View style={styles.input_field_container}>
            <Text style={styles.label}>Vehicle Type</Text>
            {/* <TextInput
                value={vehicleType}
                onChangeText={setVehicleType}
                style={styles.input_field}
                placeholder="Ex: Sedan"
              /> */}

            <Dropdown
              data={carTypeData}
              defaultValue={vehicleType}
              placeholder="Select car type"
              onSelect={handleSelectCarType}
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
            <Text style={styles.label}>
              Price per Km{" "}
              {minPrice !== null && maxPrice !== null && (
                <Text style={styles.price_range_hint}>
                  (₹{minPrice} – ₹{maxPrice}/km allowed)
                </Text>
              )}
            </Text>
            <TextInput
              keyboardType="numeric"
              value={pricePerKm}
              onChangeText={handlePricePerKmChange}
              style={[
                styles.input_field,
                pricePerKmError
                  ? styles.input_error
                  : !pricePerKmError && pricePerKm
                  ? styles.input_valid
                  : null,
              ]}
              placeholder={
                minPrice !== null && maxPrice !== null
                  ? `e.g. ${minPrice} – ${maxPrice}`
                  : "Enter price per km"
              }
            />
            {pricePerKmError ? (
              <Text style={styles.error_text}>{pricePerKmError}</Text>
            ) : pricePerKm && minPrice !== null ? (
              <Text style={styles.valid_text}>✓ Within allowed range</Text>
            ) : null}
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
              data={fuleTypeData}
              placeholder="Select fuel type"
              onSelect={handleSelectFule}
              defaultValue={fuelType}
            />
          </View>
          {/* button */}
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.btn_container,
              (registerAmount === null || !!pricePerKmError) && styles.btn_disabled,
            ]}
            disabled={registerAmount === null || !!pricePerKmError}
          >
            <Text style={styles.btn_txt}>Update & Pay Register Fee</Text>
            <Text style={styles.btn_sub_txt}>
              ₹{(registerAmount * 1.18).toFixed(2)} total (incl. GST)
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showPaymentConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPaymentConfirm(false)}
        >
          <View style={styles.modal_overlay}>
            <View style={styles.modal_box}>
              <Text style={styles.modal_title}>Confirm Re-registration</Text>
              <Text style={styles.modal_subtitle}>Vehicle Update & Fee</Text>
              <View style={styles.modal_row}>
                <Text style={styles.modal_label}>Base Amount</Text>
                <Text style={styles.modal_value}>₹{paymentDetails?.baseAmount}</Text>
              </View>
              <View style={styles.modal_row}>
                <Text style={styles.modal_label}>GST (18%)</Text>
                <Text style={styles.modal_value}>₹{paymentDetails?.gstAmount?.toFixed(2)}</Text>
              </View>
              <View style={[styles.modal_row, styles.modal_total_row]}>
                <Text style={styles.modal_total_label}>Total Payable</Text>
                <Text style={styles.modal_total_value}>₹{paymentDetails?.totalAmount?.toFixed(2)}</Text>
              </View>
              <Text style={styles.modal_note}>
                Payment is required to resubmit your vehicle for admin approval.
              </Text>
              <View style={styles.modal_btn_row}>
                <TouchableOpacity style={styles.modal_cancel_btn} onPress={() => setShowPaymentConfirm(false)}>
                  <Text style={styles.modal_cancel_txt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modal_pay_btn} onPress={handleConfirmPayment}>
                  <Text style={styles.modal_pay_txt}>Confirm & Pay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Toast />
        {loading && (
          <BlurView style={styles.absolute} intensity={150}>
            <Spinner
              color={colors.deep_blue}
              visible={loading}
              textStyle={styles.spinnerTextStyle}
            />
          </BlurView>
        )}
      </View>
    </View>
  );
};

export default CarReregForm;

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
    backgroundColor: "#FAFAFA",
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
  btn_sub_txt: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  btn_disabled: {
    backgroundColor: "#ccc",
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 10,
  },
  input_error: { borderColor: "#ff4d4f", borderWidth: 1.5 },
  input_valid: { borderColor: "#52c41a", borderWidth: 1.5 },
  error_text: { color: "#ff4d4f", fontSize: 12, marginTop: 5, fontWeight: "500" },
  valid_text: { color: "#52c41a", fontSize: 12, marginTop: 5, fontWeight: "500" },
  price_range_hint: { fontSize: 11, color: "#888", fontWeight: "400" },

  // Modal styles
  modal_overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal_box: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  modal_title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
  },
  modal_subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  modal_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modal_label: { fontSize: 14, color: "#666" },
  modal_value: { fontSize: 14, fontWeight: "600", color: "#333" },
  modal_total_row: {
    borderBottomWidth: 0,
    marginTop: 10,
    paddingVertical: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  modal_total_label: { fontSize: 16, fontWeight: "bold", color: "#333" },
  modal_total_value: { fontSize: 18, fontWeight: "bold", color: colors.deep_blue },
  modal_note: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 15,
    fontStyle: "italic",
  },
  modal_btn_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    gap: 15,
  },
  modal_cancel_btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  modal_cancel_txt: { color: "#666", fontWeight: "600" },
  modal_pay_btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.deep_blue,
    alignItems: "center",
  },
  modal_pay_txt: { color: "#fff", fontWeight: "600" },
  // rendered documents style
  doc_container: {
    paddingTop: 10,
    alignItems: "center",
  },
  doc_name: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    color: colors.deep_blue,
    backgroundColor: colors.white,
    padding: 5,
    width: "100%",
    borderRadius: 5,
    borderColor: colors.deep_blue,
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
    borderColor: colors.deep_blue,
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
    color: colors.deep_blue,
  },
});
