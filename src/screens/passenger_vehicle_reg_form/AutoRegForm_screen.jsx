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
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RazorpayCheckout from "react-native-razorpay";
import React, { useState, useEffect } from "react";
import { AntDesign as Icon } from "@expo/vector-icons";
import { colors } from "../../utils/constants";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import Spinner from "react-native-loading-spinner-overlay";
import { BlurView } from "expo-blur";
import Dropdown from "../../components/CustomDropdown";
import CheckboxWithLabel from "../../components/CheckboxWithLabel";

const GST_RATE = 18;

const AutoRegForm_screen = ({ navigation }) => {
  const [vendorId, setVendorId] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [pricePerKm, setPricePerKm] = useState("");
  const [fuelType, setFuelType] = useState("");

  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [pricePerKmError, setPricePerKmError] = useState("");

  const [isChecked, setChecked] = useState(false);
  const [ownerAdharCard, setOwnerAdharCard] = useState([]);
  const [ownerImage, setOwnerImage] = useState([]);
  const [ownerDrivingLicense, setOwnerDrivingLicense] = useState([]);
  const [vehicleImages, setVehicleImages] = useState([]);
  const [vehicleInsurance, setVehicleInsurance] = useState([]);
  const [vehicleRC, setVehicleRC] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState(500);
  const [registerAmount, setRegisterAmount] = useState(null);

  const calcGST = (base) => {
    const b = parseFloat(parseFloat(base).toFixed(2));
    const gst = parseFloat(((b * GST_RATE) / 100).toFixed(2));
    return {
      baseAmount: b,
      gstAmount: gst,
      totalAmount: parseFloat((b + gst).toFixed(2)),
    };
  };

  const getVendorData = async () => {
    try {
      const vendor = await AsyncStorage.getItem("user");
      if (vendor) {
        const vendorData = JSON.parse(vendor);
        setVendorId(vendorData._id || vendorData.id || "");
      }
    } catch (error) {
      console.log("Error retrieving user data:", error);
    }
  };

  useEffect(() => {
    getVendorData();
    fetchRegisterFee();
  }, []);

  const fetchRegisterFee = async () => {
    try {
      const res = await AxiosService.get("payment/config?vehicleType=auto");
      if (res.status === 200) {
        const data = res.data;
        const cfg = data.config || {};
        
        const amount = 
          cfg.fixedRegisterAmount || 
          cfg.minRegisterAmount || 
          data.registrationFee || 
          data.fixedRegisterAmount || 
          2000;
          
        const adv = 
          cfg.advanceAmount != null ? cfg.advanceAmount : 
          data.advanceAmount != null ? data.advanceAmount : 
          500;

        setRegisterAmount(parseFloat(amount));
        setAdvanceAmount(parseFloat(adv));

        if (cfg.minPrice != null) setMinPrice(parseFloat(cfg.minPrice));
        if (cfg.maxPrice != null) setMaxPrice(parseFloat(cfg.maxPrice));
      } else {
        setRegisterAmount(2000);
        setAdvanceAmount(500);
      }
    } catch (err) {
      console.log("fetchRegisterFee error:", err.message);
      setRegisterAmount(2000);
      setAdvanceAmount(500);
    }
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
    if (minPrice !== null && val < minPrice) {
      setPricePerKmError(`Minimum allowed: ₹${minPrice}/km`);
    } else if (maxPrice !== null && val > maxPrice) {
      setPricePerKmError(`Maximum allowed: ₹${maxPrice}/km`);
    } else {
      setPricePerKmError("");
    }
  };

  const convertToBase64 = async (file) => {
    try {
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

  // ✅ FIXED: Accept all image types (JPG, PNG, HEIC, WebP, etc.) + PDF
  const PickDocument = async (setDocumentState, limit, currentDocuments) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        multiple: true,
      });

      if (result.canceled) {
        Alert.alert(
          "No Document Selected",
          "Please select at least one document."
        );
        return;
      }

      const pickedDocs = result.assets ? result.assets : [result];

      // ✅ FIXED: Accept any image mimeType, not just image/jpeg
      const validDocuments = pickedDocs.filter(
        (doc) =>
          doc.mimeType?.startsWith("image/") ||
          doc.mimeType === "application/pdf"
      );

      if (validDocuments.length > 0) {
        if (currentDocuments.length + validDocuments.length > limit) {
          Alert.alert(
            "Document Limit Exceeded",
            `You can only upload up to ${limit} document(s).`
          );
          return;
        }
        const base64Documents = await Promise.all(
          validDocuments.map(async (doc) => {
            const base64 = await convertToBase64(doc);
            return { ...doc, base64 };
          })
        );
        setDocumentState((prev) => [...prev, ...base64Documents]);
      } else {
        // ✅ FIXED: Updated alert message to reflect accepted types
        Alert.alert(
          "Invalid File Type",
          "Please select an image (JPG, PNG, etc.) or PDF file."
        );
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
            <Text style={styles.doc_name}>{name || "No name available"}</Text>
          )}
          <Pressable
            style={styles.remove_button}
            onPress={() =>
              setDocumentState((prev) => prev.filter((_, i) => i !== index))
            }
          >
            <Text style={styles.remove_button_text}>Remove</Text>
          </Pressable>
        </View>
      );
    });
  };

  const buildPayload = () => ({
    vendorId,
    vehicleCategory: "autos",
    vehicleType: "auto",
    vehicleMake,
    vehicleModel,
    licensePlate,
    pricePerDay,
    pricePerKm,
    fuelType,
    registerAmount,
    advanceAmount,
    ownerImage: ownerImage[0]?.base64 || null,
    ownerAdharCard: ownerAdharCard.map((doc) => doc.base64 || null),
    ownerDrivingLicense: ownerDrivingLicense.map((doc) => doc.base64 || null),
    vehicleImages: vehicleImages.map((img) => img.base64 || null),
    vehicleInsurance: vehicleInsurance.map((ins) => ins.base64 || null),
    vehicleRC: vehicleRC.map((rc) => rc.base64 || null),
  });

  const resetForm = () => {
    setVehicleMake("");
    setVehicleModel("");
    setLicensePlate("");
    setPricePerDay("");
    setPricePerKm("");
    setFuelType("");
    setPricePerKmError("");
    setOwnerAdharCard([]);
    setOwnerImage([]);
    setOwnerDrivingLicense([]);
    setVehicleImages([]);
    setVehicleInsurance([]);
    setVehicleRC([]);
    setChecked(false);
  };

  const handleSubmit = async () => {
    if (registerAmount === null) {
      Toast.show({
        type: "info",
        text1: "Fetching registration fee, please wait...",
      });
      return;
    }
    if (!isChecked) {
      Toast.show({
        type: "info",
        text1: "You have to agree the Terms & Conditions",
      });
      return;
    }
    if (
      !vehicleMake ||
      !vehicleModel ||
      !licensePlate ||
      !pricePerKm ||
      !fuelType
    ) {
      Toast.show({
        type: "error",
        text1: "Please fill all required fields",
      });
      return;
    }

    // Validate Year of Manufacture (vehicleMake)
    const currentYear = new Date().getFullYear();
    const makeYear = parseInt(vehicleMake, 10);
    if (!/^\d{4}$/.test(vehicleMake) || isNaN(makeYear) || makeYear < 1990 || makeYear > currentYear) {
      Toast.show({
        type: "error",
        text1: "Invalid Year of Manufacture",
        text2: `Year must be a 4-digit number between 1990 and ${currentYear}`,
      });
      return;
    }

    // Validate License Plate Format
    const licensePlateRegex = /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}$/i;
    if (!licensePlateRegex.test(licensePlate)) {
      Toast.show({
        type: "error",
        text1: "Invalid License Plate",
        text2: "Format should be like TN 01 GH 0000",
      });
      return;
    }

    // Validate Price per Km
    const kmVal = parseFloat(pricePerKm);
    if (isNaN(kmVal) || kmVal <= 0) {
      Toast.show({ type: "error", text1: "Enter a valid price per km" });
      return;
    }
    if (minPrice !== null && kmVal < minPrice) {
      Toast.show({
        type: "error",
        text1: `Price per km too low`,
        text2: `Minimum allowed for Auto is ₹${minPrice}/km`,
      });
      return;
    }
    if (maxPrice !== null && kmVal > maxPrice) {
      Toast.show({
        type: "error",
        text1: `Price per km too high`,
        text2: `Maximum allowed for Auto is ₹${maxPrice}/km`,
      });
      return;
    }

    // Validate Price per Day (if entered)
    if (pricePerDay) {
      const dayVal = parseFloat(pricePerDay);
      if (isNaN(dayVal) || dayVal <= 0) {
        Toast.show({
          type: "error",
          text1: "Invalid Price per Day",
          text2: "Price per day must be a positive number",
        });
        return;
      }
    }

    // Validate Document Uploads
    if (ownerImage.length !== 1) {
      Toast.show({
        type: "error",
        text1: "Vendor Image Required",
        text2: "Please upload exactly 1 vendor image",
      });
      return;
    }
    if (ownerAdharCard.length !== 2) {
      Toast.show({
        type: "error",
        text1: "Aadhar Card Required",
        text2: "Please upload both front and back of Aadhar Card",
      });
      return;
    }
    if (vehicleImages.length !== 5) {
      Toast.show({
        type: "error",
        text1: "Vehicle Images Required",
        text2: "Please upload exactly 5 vehicle images",
      });
      return;
    }
    if (ownerDrivingLicense.length !== 2) {
      Toast.show({
        type: "error",
        text1: "Driving License Required",
        text2: "Please upload both front and back of your driving license",
      });
      return;
    }
    if (vehicleInsurance.length !== 2) {
      Toast.show({
        type: "error",
        text1: "Insurance Required",
        text2: "Please upload exactly 2 insurance documents",
      });
      return;
    }
    if (vehicleRC.length !== 2) {
      Toast.show({
        type: "error",
        text1: "RC Book Required",
        text2: "Please upload both front and back of RC Book",
      });
      return;
    }

    setPaymentDetails(calcGST(registerAmount));
    setShowPaymentConfirm(true);
  };

  const handleConfirmPayment = async () => {
    setShowPaymentConfirm(false);
    setLoading(true);
    try {
      const payload = buildPayload();
      const res = await AxiosService.post(
        "payment/initiate-register-fee",
        payload
      );

      if (res.status === 200 && res.data.paymentRequired === false) {
        resetForm();
        Toast.show({
          type: "success",
          text1: "Vehicle registered successfully",
        });
        setTimeout(() => navigation.navigate("Vehicle Management"), 2000);
        return;
      }

      if (res.status === 200 && res.data.razorpayOrderId) {
        const data = res.data;
        const options = {
          description: "Vehicle Registration Fee",
          image: "https://i.imgur.com/3g7nmJC.png",
          currency: "INR",
          key: data.key_id,
          amount: Math.round(data.amount * 100),
          name: "AAT WORLD",
          order_id: data.razorpayOrderId,
          prefill: {
            name: data.vendorDetails?.name || "",
            email: data.vendorDetails?.email || "",
            contact: data.vendorDetails?.contact || "",
          },
          theme: { color: "#16a34a" },
        };

        RazorpayCheckout.open(options)
          .then(async (response) => {
            try {
              await AxiosService.post("payment/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              resetForm();
              Toast.show({
                type: "success",
                text1: "Payment successful! Vehicle submitted for approval.",
              });
              setTimeout(
                () => navigation.navigate("Vehicle Management"),
                2000
              );
            } catch (err) {
              Toast.show({ type: "error", text1: "Verification failed." });
            }
          })
          .catch((error) => {
            if (error.code === 2)
              Toast.show({ type: "info", text1: "Payment cancelled" });
            else
              Toast.show({
                type: "error",
                text1: "Payment failed",
                text2: error.description,
              });
          });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1:
          error.response?.data?.message || "Payment initiation failed.",
      });
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

  return (
    <SafeAreaView style={styles.main_container}>
      <Pressable
        style={styles.nav_container}
        onPress={() => navigation.navigate("BecomeVendor")}
      >
        <Icon name="left" size={30} />
      </Pressable>

      <View style={styles.content_container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.form_heading_container}>
            <Image
              source={require("../../assets/Images/auto.png")}
              style={styles.heading_img}
            />
            <Text style={styles.form_heading_txt}>Auto Registration Form</Text>
          </View>
          <Text style={styles.heading_txt}>
            Fill in your vehicle details to register with AAT
          </Text>

          {[
            {
              label: "Vendor Image",
              subText: "( minimum 1 image )",
              state: ownerImage,
              setter: setOwnerImage,
              limit: 1,
            },
            {
              label: "Vendor Aadhar card",
              subText: "( front and back )",
              state: ownerAdharCard,
              setter: setOwnerAdharCard,
              limit: 2,
            },
            {
              label: "Vehicle Image",
              subText: "( minimum 5 images )",
              state: vehicleImages,
              setter: setVehicleImages,
              limit: 5,
            },
            {
              label: "License",
              subText: "( front and back )",
              state: ownerDrivingLicense,
              setter: setOwnerDrivingLicense,
              limit: 2,
            },
            {
              label: "Insurance",
              subText: "( minimum 2 images )",
              state: vehicleInsurance,
              setter: setVehicleInsurance,
              limit: 2,
            },
            {
              label: "RC Book",
              subText: "( front and back )",
              state: vehicleRC,
              setter: setVehicleRC,
              limit: 2,
            },
          ].map(({ label, subText, state, setter, limit }) => (
            <View key={label} style={styles.input_field_container}>
              <Text style={styles.label}>
                {label} <Text style={styles.subText}>{subText}</Text>
              </Text>
              <Pressable
                style={styles.container}
                onPress={() => PickDocument(setter, limit, state)}
              >
                <View style={styles.upload_icon_wrap}>
                  <Image
                    source={require("../../assets/Images/file.png")}
                    style={styles.img}
                  />
                </View>
                <Text style={styles.sub_txt}>Tap to upload</Text>
                <Text style={styles.sub_txt_hint}>
                  JPG, PNG, PDF supported
                </Text>
              </Pressable>
              {renderDocument(state, setter)}
            </View>
          ))}

          <View style={styles.input_field_container}>
            <Text style={styles.label}>Vehicle Make Year</Text>
            <TextInput
              value={vehicleMake}
              onChangeText={(text) => {
                const year = text.replace(/[^0-9]/g, "");
                const currentYear = new Date().getFullYear();
                if (year.length <= 4) {
                  if (parseInt(year) > currentYear) {
                    Toast.show({
                      type: "error",
                      text1: `Year cannot be greater than ${currentYear}`,
                    });
                    setVehicleMake(currentYear.toString());
                  } else {
                    setVehicleMake(year);
                  }
                }
              }}
              style={styles.input_field}
              keyboardType="numeric"
              placeholder="Ex: 2020"
              maxLength={4}
            />
          </View>

          <View style={styles.input_field_container}>
            <Text style={styles.label}>Vehicle Model</Text>
            <TextInput
              style={styles.input_field}
              placeholder="Ex: Bajaj Auto"
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
          </View>

          <View style={styles.input_field_container}>
            <Text style={styles.label}>Vehicle Number</Text>
            <TextInput
              value={licensePlate}
              onChangeText={(text) =>
                setLicensePlate(text.toLocaleUpperCase())
              }
              placeholder="TN 01 GH 0000"
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
                pricePerKmError ? styles.input_error : null,
                !pricePerKmError && pricePerKm ? styles.input_valid : null,
              ]}
              placeholder={
                minPrice !== null && maxPrice !== null
                  ? `e.g. ${minPrice} – ${maxPrice}`
                  : "Enter price per km"
              }
            />
            {pricePerKmError ? (
              <Text style={styles.error_text}>{pricePerKmError}</Text>
            ) : pricePerKm && minPrice !== null && maxPrice !== null ? (
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

          <View style={styles.input_field_container}>
            <Text style={styles.label}>Fuel Type</Text>
            <Dropdown
              data={dropdownData}
              placeholder="Select fuel type"
              onSelect={(item) => setFuelType(item.value)}
            />
          </View>

          <View style={styles.CheakBoxsection}>
            <CheckboxWithLabel
              isChecked={isChecked}
              setChecked={setChecked}
              onTermsPress={() =>
                navigation.navigate("Terms and Conditions (T&C)")
              }
              onPrivacyPress={() => navigation.navigate("Privacy Policy")}
              onRefundPress={() => navigation.navigate("Refund Policy")}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.btn_container,
              (registerAmount === null || !!pricePerKmError) &&
              styles.btn_disabled,
            ]}
            activeOpacity={0.85}
            disabled={registerAmount === null || !!pricePerKmError}
          >
            {registerAmount === null ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.btn_txt}>Continue to Payment</Text>
                <Text style={styles.btn_sub_txt}>
                  ₹{(registerAmount * 1.18).toFixed(2)} total (incl. GST)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

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

      <Modal
        visible={showPaymentConfirm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentConfirm(false)}
      >
        <View style={styles.modal_overlay}>
          <View style={styles.modal_box}>
            <Text style={styles.modal_title}>Confirm Payment</Text>
            <Text style={styles.modal_subtitle}>Auto Registration Fee</Text>
            <View style={styles.modal_row}>
              <Text style={styles.modal_label}>Base Amount</Text>
              <Text style={styles.modal_value}>
                ₹{paymentDetails?.baseAmount?.toLocaleString()}
              </Text>
            </View>
            <View style={styles.modal_row}>
              <Text style={styles.modal_label}>GST (18%)</Text>
              <Text style={styles.modal_value}>
                ₹{paymentDetails?.gstAmount?.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.modal_row, styles.modal_total_row]}>
              <Text style={styles.modal_total_label}>Total Payable</Text>
              <Text style={styles.modal_total_value}>
                ₹{paymentDetails?.totalAmount?.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.modal_note}>
              You will be redirected to the Razorpay payment page. The vehicle
              will be submitted for admin approval after successful payment.
            </Text>
            <View style={styles.modal_btn_row}>
              <TouchableOpacity
                style={styles.modal_cancel_btn}
                onPress={() => setShowPaymentConfirm(false)}
              >
                <Text style={styles.modal_cancel_txt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modal_pay_btn}
                onPress={handleConfirmPayment}
              >
                <Text style={styles.modal_pay_txt}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

  </SafeAreaView>
);
};

export default AutoRegForm_screen;

const styles = StyleSheet.create({
  main_container: { backgroundColor: "#f7f8fa", flex: 1 },
  nav_container: {
    padding: 16,
    paddingTop: 10,
    backgroundColor: "#f7f8fa",
  },
  content_container: {
    backgroundColor: colors.white,
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  heading_txt: {
    textAlign: "center",
    fontWeight: "400",
    fontSize: 13,
    marginBottom: 24,
    color: "#888",
    marginTop: 4,
  },
  form_heading_container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 6,
  },
  heading_img: { width: 36, height: 36, resizeMode: "contain" },
  form_heading_txt: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  input_field_container: {
    backgroundColor: "#fafafa",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderColor: "#ebebeb",
    borderWidth: 1,
  },
  input_field: {
    borderColor: "#e0e0e0",
    borderWidth: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    fontSize: 14,
    color: "#1a1a1a",
  },
  input_error: { borderColor: "#ff4d4f", borderWidth: 1.5 },
  input_valid: { borderColor: "#52c41a", borderWidth: 1.5 },
  error_text: {
    color: "#ff4d4f",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "500",
  },
  valid_text: {
    color: "#52c41a",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "500",
  },
  price_range_hint: { fontSize: 11, color: "#888", fontWeight: "400" },
  img: {
    width: 28,
    height: 28,
    resizeMode: "contain",
    opacity: 0.5,
    marginBottom: 4,
  },
  upload_icon_wrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f0faf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  sub_txt: { fontSize: 13, fontWeight: "600", color: "#444" },
  sub_txt_hint: { fontSize: 11, color: "#aaa", marginTop: 2 },
  container: {
    alignItems: "center",
    borderColor: "#d4edda",
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fafffe",
  },
  btn_container: {
    backgroundColor: "#0B1A3D",
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 20,
    marginTop: 4,
    alignItems: "center",
    shadowColor: "#0B1A3D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btn_disabled: {
    backgroundColor: "#DBEAFE",
    shadowOpacity: 0,
    elevation: 0,
  },
  btn_txt: {
    textAlign: "center",
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  btn_sub_txt: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 10, color: "#333" },
  doc_container: { paddingTop: 10, alignItems: "center" },
  doc_name: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
    color: "#0B1A3D",
    backgroundColor: "#f0faf4",
    padding: 6,
    width: "100%",
    borderRadius: 8,
    borderColor: "#DBEAFE",
    borderWidth: 1,
  },
  image: {
    width: "100%",
    height: 180,
    resizeMode: "contain",
    borderRadius: 8,
  },
  doc_img_container: {
    width: "100%",
    borderRadius: 8,
    borderColor: "#DBEAFE",
    borderWidth: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    overflow: "hidden",
  },
  sub_heading_txt: {
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "500",
    color: "#777",
  },
  remove_button: {
    backgroundColor: "#ff4d4f",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  remove_button_text: {
    color: "white",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
  subText: { fontSize: 11, color: "#aaa", marginLeft: 4 },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerTextStyle: { color: colors.deep_blue },
  CheakBoxsection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modal_overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal_box: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modal_title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  modal_subtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  modal_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modal_label: { fontSize: 14, color: "#555" },
  modal_value: { fontSize: 14, fontWeight: "600", color: "#333" },
  modal_total_row: { borderBottomWidth: 0, paddingTop: 12, marginTop: 4 },
  modal_total_label: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.deep_blue || "#0B1A3D",
  },
  modal_total_value: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.deep_blue || "#0B1A3D",
  },
  modal_note: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 18,
  },
  modal_btn_row: { flexDirection: "row", gap: 12 },
  modal_cancel_btn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray,
    alignItems: "center",
  },
  modal_cancel_txt: { fontWeight: "600", color: "#555" },
  modal_pay_btn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.deep_blue || "#0B1A3D",
    alignItems: "center",
  },
  modal_pay_txt: { fontWeight: "700", color: colors.white, fontSize: 15 },
});