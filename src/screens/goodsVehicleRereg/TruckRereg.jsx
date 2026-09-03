import {
  Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity,
  TextInput, Image, Alert, ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { AntDesign as Icon } from "@expo/vector-icons";
import { colors } from "../../utils/constants";
import * as DocumentPicker from "expo-document-picker";
import AxiosService from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Spinner from "react-native-loading-spinner-overlay";
import { BlurView } from "expo-blur";
import Dropdown from "../../components/CustomDropdown";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import RazorpayCheckout from "react-native-razorpay";
import { EXPO_PUBLIC_RAZORPAY_KEY_ID } from "@env";

const GST_RATE = 18;

const TruckRereg = ({ navigation, route }) => {
  const { vehicle } = route.params;
  const [vendorId, setVendorId] = useState("");
  const [vehicleMake, setVehicleMake] = useState(vehicle.vehicleMake || "");
  const [vehicleModel, setVehicleModel] = useState(vehicle.vehicleModel || "");
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate || "");
  const [vehicleColor, setVehicleColor] = useState(vehicle.vehicleColor || "");
  const [milage, setMilage] = useState(vehicle.milage || "");
  const [pricePerDay, setPricePerDay] = useState(vehicle.pricePerDay?.toString() || "");
  const [pricePerKm, setPricePerKm] = useState(vehicle.pricePerKm?.toString() || "");
  const [fuelType, setFuelType] = useState(vehicle.fuelType || "");
  const [ton, setTon] = useState(vehicle.ton || "");
  const [size, setSize] = useState(vehicle.size || "");
  const [loading, setLoading] = useState(false);

  // Config & Payment state
  const [registerAmount, setRegisterAmount] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState(500);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [pricePerKmError, setPricePerKmError] = useState("");

  const calcGST = (base) => {
    const b = parseFloat(parseFloat(base).toFixed(2));
    const gst = parseFloat(((b * GST_RATE) / 100).toFixed(2));
    return {
      baseAmount: b,
      gstAmount: gst,
      totalAmount: parseFloat((b + gst).toFixed(2)),
    };
  };

  // Documents (Start empty, user must re-upload or we'd need to handle mixed local/remote)
  // For AAT, usually resubmission requires re-uploading documents to ensure they are correct this time.
  const [ownerAdharCard, setOwnerAdharCard] = useState([]);
  const [ownerImage, setOwnerImage] = useState([]);
  const [ownerDrivingLicense, setOwnerDrivingLicense] = useState([]);
  const [vehicleImages, setVehicleImages] = useState([]);
  const [vehicleInsurance, setVehicleInsurance] = useState([]);
  const [vehicleRC, setVehicleRC] = useState([]);

  useEffect(() => {
    getVendorData();
    fetchRegisterFee();
  }, []);

  const fetchRegisterFee = async () => {
    try {
      const res = await AxiosService.get("payment/config?vehicleType=truck");
      if (res.status === 200 && res.data.config) {
        const cfg = res.data.config;
        setRegisterAmount(parseFloat(cfg.fixedRegisterAmount || cfg.minRegisterAmount || 5000));
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
        const parsed = JSON.parse(vendor);
        setVendorId(parsed._id || parsed.id || "");
      }
    } catch (error) { console.log("Error retrieving user data:", error); }
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
    } catch (error) { console.error("Error converting file to base64:", error); return null; }
  };

  const PickDocument = async (setDocumentState, limit, currentDocuments) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "application/pdf"], multiple: true });
      if (result.canceled) return;
      const pickedDocs = result.assets ? result.assets : [result];
      const validDocuments = pickedDocs.filter(doc => doc.mimeType === "image/jpeg" || doc.mimeType === "application/pdf");
      if (validDocuments.length > 0) {
        if (currentDocuments.length + validDocuments.length > limit) {
          Alert.alert("Limit Exceeded", `Max ${limit} documents allowed.`);
          return;
        }
        const base64Documents = await Promise.all(validDocuments.map(async (doc) => ({ ...doc, base64: await convertToBase64(doc) })));
        setDocumentState((prev) => [...prev, ...base64Documents]);
      }
    } catch (error) { console.log("Error picking documents", error); }
  };

  const renderDocument = (documents, setDocumentState) => {
    if (!documents || documents.length === 0) return null;
    return documents.map((document, index) => (
      <View key={index} style={styles.doc_container}>
        <Text style={styles.sub_heading_txt}>Selected Document {index + 1}</Text>
        {document.mimeType?.startsWith("image/") ? (
          <View style={styles.doc_img_container}><Image source={{ uri: document.uri }} style={styles.image} /></View>
        ) : (
          <Text style={styles.doc_name}>{document.name}</Text>
        )}
        <TouchableOpacity style={styles.remove_button} onPress={() => setDocumentState((prev) => prev.filter((_, i) => i !== index))}>
          <Text style={styles.remove_button_text}>Remove</Text>
        </TouchableOpacity>
      </View>
    ));
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

  const handleSubmit = () => {
    if (!vehicleMake || !vehicleModel || !licensePlate || !pricePerKm || !fuelType || !ton || !size) {
      Toast.show({ type: "error", text1: "Please fill all required fields" });
      return;
    }

    if (ownerImage.length < 1 || ownerAdharCard.length < 2 || ownerDrivingLicense.length < 2 ||
        vehicleImages.length < 5 || vehicleInsurance.length < 2 || vehicleRC.length < 2) {
      Toast.show({ type: "error", text1: "Please upload all required documents" });
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
      const payload = {
        vendorId,
        vehicleId: vehicle._id,
        vehicleCategory: "trucks",
        vehicleMake,
        vehicleModel,
        licensePlate,
        vehicleColor,
        ton,
        size,
        pricePerDay,
        pricePerKm,
        fuelType,
        milage,
        registerAmount,
        advanceAmount,
        ownerImage: ownerImage[0].base64,
        ownerAdharCard: ownerAdharCard.map(d => d.base64),
        ownerDrivingLicense: ownerDrivingLicense.map(d => d.base64),
        vehicleImages: vehicleImages.map(d => d.base64),
        vehicleInsurance: vehicleInsurance.map(d => d.base64),
        vehicleRC: vehicleRC.map(d => d.base64),
      };

      const res = await AxiosService.post("payment/initiate-register-fee", payload);

      if (res.status === 200 && res.data.razorpayOrderId) {
        const options = {
          description: "AAT Truck Re-registration Fee",
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
        // Fallback or direct update if allowed
        const recreateRes = await AxiosService.post("/vendor/recreateTruck", payload);
        if (recreateRes.status === 201 || recreateRes.status === 200) {
          Toast.show({ type: "success", text1: "Truck resubmitted successfully" });
          setTimeout(() => navigation.goBack(), 2000);
        }
      }
    } catch (error) {
      console.error("Initiate error:", error);
      Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to initiate update." });
    } finally {
      setLoading(false);
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
        Toast.show({ type: "success", text1: "Payment successful! Truck resubmitted." });
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Payment verification failed." });
    } finally {
      setLoading(false);
    }
  };

  const dropdownData = [
    { label: "Petrol", value: "Petrol" }, { label: "Diesel", value: "Diesel" },
    { label: "CNG", value: "CNG" }, { label: "LPG", value: "LPG" },
    { label: "Electric batteries", value: "Electric batteries" },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.main_container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resubmit Truck Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.alertBox}>
          <Icon name="infocirlceo" size={16} color="#f57c00" />
          <Text style={styles.alertText}>Your previous submission was rejected. Please correct the details and re-upload all documents.</Text>
        </View>

        <Text style={styles.sectionTitle}>Vehicle Documents</Text>
        {[
          { label: "Owner Image", state: ownerImage, setter: setOwnerImage, limit: 1 },
          { label: "Aadhar Card (Front & Back)", state: ownerAdharCard, setter: setOwnerAdharCard, limit: 2 },
          { label: "Driving License (Front & Back)", state: ownerDrivingLicense, setter: setOwnerDrivingLicense, limit: 2 },
          { label: "Vehicle Images (5 required)", state: vehicleImages, setter: setVehicleImages, limit: 5 },
          { label: "Insurance Documents", state: vehicleInsurance, setter: setVehicleInsurance, limit: 2 },
          { label: "RC Book (Front & Back)", state: vehicleRC, setter: setVehicleRC, limit: 2 },
        ].map((item, index) => (
          <View key={index} style={styles.docInputContainer}>
            <Text style={styles.label}>{item.label}</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={() => PickDocument(item.setter, item.limit, item.state)}>
              <Icon name="clouduploado" size={32} color={colors.deep_blue} />
              <Text style={styles.uploadText}>Tap to upload</Text>
            </TouchableOpacity>
            {renderDocument(item.state, item.setter)}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Make Year</Text>
          <TextInput style={styles.input} value={vehicleMake} onChangeText={setVehicleMake} keyboardType="numeric" placeholder="e.g. 2022" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Model</Text>
          <TextInput style={styles.input} value={vehicleModel} onChangeText={setVehicleModel} placeholder="e.g. Ashok Leyland" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>License Plate</Text>
          <TextInput style={styles.input} value={licensePlate} onChangeText={setLicensePlate} autoCapitalize="characters" placeholder="e.g. TN 01 AB 1234" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tonnage (Kg)</Text>
          <TextInput style={styles.input} value={ton} onChangeText={setTon} keyboardType="numeric" placeholder="e.g. 5000" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Price per Km (₹){" "}
            {minPrice !== null && maxPrice !== null && (
              <Text style={styles.price_range_hint}>
                (Allowed: ₹{minPrice} – ₹{maxPrice})
              </Text>
            )}
          </Text>
          <TextInput
            style={[
              styles.input,
              pricePerKmError ? styles.inputError : pricePerKm && styles.inputValid,
            ]}
            value={pricePerKm}
            onChangeText={handlePricePerKmChange}
            keyboardType="numeric"
            placeholder={
              minPrice !== null ? `e.g. ${minPrice} – ${maxPrice}` : "e.g. 45"
            }
          />
          {pricePerKmError ? (
            <Text style={styles.errorText}>{pricePerKmError}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fuel Type</Text>
          <Dropdown data={dropdownData} placeholder="Select Fuel Type" onSelect={(item) => setFuelType(item.value)} />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading || !!pricePerKmError}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitButtonText}>Update & Pay Register Fee</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showPaymentConfirm}
        transparent
        animationType="slide"
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
    </SafeAreaView>
  </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  main_container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: "#eee" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 20 },
  alertBox: { flexDirection: "row", backgroundColor: "#fff3e0", padding: 12, borderRadius: 8, marginBottom: 24, alignItems: "center" },
  alertText: { fontSize: 12, color: "#e65100", flex: 1, marginLeft: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16, marginTop: 8, color: colors.deep_blue },
  docInputContainer: { marginBottom: 20 },
  uploadBox: { height: 100, borderStyle: "dashed", borderWidth: 1, borderColor: colors.deep_blue, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fff9" },
  uploadText: { marginTop: 8, fontSize: 12, color: colors.deep_blue, fontWeight: "500" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" },
  inputGroup: { marginBottom: 16 },
  input: { height: 48, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: "#333" },
  submitButton: { backgroundColor: colors.deep_blue, height: 56, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 24, marginBottom: 40 },
  submitButtonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  doc_container: { marginTop: 12, alignItems: "center", backgroundColor: "#f5f5f5", padding: 10, borderRadius: 8 },
  doc_img_container: { width: 120, height: 120, borderRadius: 8, overflow: "hidden" },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  doc_name: { fontSize: 12, color: colors.deep_blue, fontWeight: "500" },
  remove_button: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: "#ffebee", borderRadius: 4 },
  remove_button_text: { color: "#d32f2f", fontSize: 11, fontWeight: "600" },
  price_range_hint: { fontSize: 11, color: "#888", fontWeight: "400" },
  inputError: { borderColor: "#ff4d4f" },
  inputValid: { borderColor: "#52c41a" },
  errorText: { color: "#ff4d4f", fontSize: 11, marginTop: 4 },

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
});

export default TruckRereg;
