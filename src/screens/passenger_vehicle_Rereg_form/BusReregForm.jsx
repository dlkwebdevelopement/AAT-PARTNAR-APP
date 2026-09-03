import {
  Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Modal, Alert
} from "react-native";
import React, { useState, useEffect } from "react";
import { AntDesign as Icon } from "@expo/vector-icons";
import { colors } from "../../utils/constants";
import * as DocumentPicker from "expo-document-picker";
import AxiosService from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_RAZORPAY_KEY_ID } from "@env";
import RazorpayCheckout from "react-native-razorpay";
import Dropdown from "../../components/CustomDropdown";

const GST_RATE = 18;

const BusReregForm = ({ navigation, route }) => {
  const { vehicle } = route.params;
  const [vendorId, setVendorId] = useState("");
  const [vehicleMake, setVehicleMake] = useState(vehicle.vehicleMake || "");
  const [vehicleModel, setVehicleModel] = useState(vehicle.vehicleModel || "");
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate || "");
  const [vehicleColor, setVehicleColor] = useState(vehicle.vehicleColor || "");
  const [numberOfSeats, setNumberOfSeats] = useState(vehicle.numberOfSeats?.toString() || "");
  const [milage, setMilage] = useState(vehicle.milage || "");
  const [pricePerDay, setPricePerDay] = useState(vehicle.pricePerDay?.toString() || "");
  const [pricePerKm, setPricePerKm] = useState(vehicle.pricePerKm?.toString() || "");
  const [fuelType, setFuelType] = useState(vehicle.fuelType || "");
  const [ac, setAc] = useState(vehicle.ac || "Non-AC");
  const [loading, setLoading] = useState(false);

  // Config & Payment state
  const [registerAmount, setRegisterAmount] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState(1000);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [pricePerKmError, setPricePerKmError] = useState("");

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

  const getVendorData = async () => {
    try {
      const vendor = await AsyncStorage.getItem("user");
      if (vendor) {
        const parsed = JSON.parse(vendor);
        setVendorId(parsed._id || parsed.id || "");
      }
    } catch (error) { console.log("Error retrieving user data:", error); }
  };

  const fetchRegisterFee = async () => {
    try {
      const res = await AxiosService.get("payment/config?vehicleType=bus");
      if (res.status === 200 && res.data.config) {
        const cfg = res.data.config;
        setRegisterAmount(parseFloat(cfg.fixedRegisterAmount || cfg.minRegisterAmount || 5000));
        setAdvanceAmount(cfg.advanceAmount != null ? parseFloat(cfg.advanceAmount) : 1000);
        if (cfg.minPrice != null) setMinPrice(parseFloat(cfg.minPrice));
        if (cfg.maxPrice != null) setMaxPrice(parseFloat(cfg.maxPrice));
      }
    } catch (err) { console.log("fetchRegisterFee error:", err.message); }
  };

  const calcGST = (base) => {
    const b = parseFloat(parseFloat(base).toFixed(2));
    const gst = parseFloat(((b * GST_RATE) / 100).toFixed(2));
    return { baseAmount: b, gstAmount: gst, totalAmount: parseFloat((b + gst).toFixed(2)) };
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
    } catch (error) { console.error("Base64 error:", error); return null; }
  };

  const PickDocument = async (setDocumentState, limit, currentDocuments) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "application/pdf"], multiple: true });
      if (result.canceled) return;
      const pickedDocs = result.assets ? result.assets : [result];
      const validDocs = pickedDocs.filter(doc => doc.mimeType === "image/jpeg" || doc.mimeType === "application/pdf");
      if (validDocs.length > 0) {
        if (currentDocuments.length + validDocs.length > limit) {
          Alert.alert("Limit Exceeded", `Max ${limit} allowed.`); return;
        }
        const base64Docs = await Promise.all(validDocs.map(async (doc) => ({ ...doc, base64: await convertToBase64(doc) })));
        setDocumentState((prev) => [...prev, ...base64Docs]);
      }
    } catch (error) { console.log("Picker error:", error); }
  };

  const handlePricePerKmChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    setPricePerKm(cleaned);
    if (!cleaned) { setPricePerKmError(""); return; }
    const val = parseFloat(cleaned);
    if (isNaN(val)) { setPricePerKmError("Invalid number"); return; }
    if (minPrice !== null && val < minPrice) setPricePerKmError(`Min: ₹${minPrice}/km`);
    else if (maxPrice !== null && val > maxPrice) setPricePerKmError(`Max: ₹${maxPrice}/km`);
    else setPricePerKmError("");
  };

  const handleSubmit = () => {
    if (!vehicleMake || !vehicleModel || !licensePlate || !pricePerKm || !fuelType || !numberOfSeats) {
      Toast.show({ type: "error", text1: "Fill all required fields" }); return;
    }
    if (ownerImage.length < 1 || ownerAdharCard.length < 2 || ownerDrivingLicense.length < 2 ||
        vehicleImages.length < 5 || vehicleInsurance.length < 2 || vehicleRC.length < 2) {
      Toast.show({ type: "error", text1: "Upload all documents" }); return;
    }
    if (pricePerKmError) { Toast.show({ type: "error", text1: pricePerKmError }); return; }
    setPaymentDetails(calcGST(registerAmount));
    setShowPaymentConfirm(true);
  };

  const handleConfirmPayment = async () => {
    setShowPaymentConfirm(false);
    setLoading(true);
    try {
      const payload = {
        vendorId, vehicleId: vehicle._id, vehicleCategory: "buses",
        vehicleMake, vehicleModel, licensePlate, vehicleColor, numberOfSeats, milage, pricePerDay, pricePerKm, fuelType, ac,
        registerAmount, advanceAmount,
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
          description: "Bus Re-registration",
          key: EXPO_PUBLIC_RAZORPAY_KEY_ID,
          amount: Math.round(res.data.amount * 100),
          name: "AAT",
          order_id: res.data.razorpayOrderId,
          prefill: { email: res.data.vendorDetails?.email, contact: res.data.vendorDetails?.contact, name: res.data.vendorDetails?.name },
          theme: { color: colors.deep_blue },
        };
        RazorpayCheckout.open(options).then(verifyPayment).catch(() => Toast.show({ type: "error", text1: "Payment cancelled" }));
      }
    } catch (err) { Toast.show({ type: "error", text1: "Failed to initiate" }); }
    finally { setLoading(false); }
  };

  const verifyPayment = async (data) => {
    setLoading(true);
    try {
      const res = await AxiosService.post("payment/verify", {
        razorpay_order_id: data.razorpay_order_id, razorpay_payment_id: data.razorpay_payment_id, razorpay_signature: data.razorpay_signature,
      });
      if (res.status === 200) {
        Toast.show({ type: "success", text1: "Bus resubmitted!" });
        setTimeout(() => navigation.navigate("Vechicle Management"), 2000);
      }
    } catch { Toast.show({ type: "error", text1: "Verification failed" }); }
    finally { setLoading(false); }
  };

  const renderDocument = (docs, setter) => docs.map((d, i) => (
    <View key={i} style={styles.doc_container}>
      <Image source={{ uri: d.uri }} style={styles.image} />
      <TouchableOpacity onPress={() => setter(prev => prev.filter((_, idx) => idx !== i))} style={styles.remove_btn}><Text style={styles.remove_txt}>Remove</Text></TouchableOpacity>
    </View>
  ));

  return (
    <View style={styles.main_container}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Icon name="left" size={24} /></TouchableOpacity><Text style={styles.headerTitle}>Resubmit Bus</Text><View style={{width:24}}/></View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Documents</Text>
        {[
          { label: "Owner Photo", state: ownerImage, setter: setOwnerImage, limit: 1 },
          { label: "Aadhar", state: ownerAdharCard, setter: setOwnerAdharCard, limit: 2 },
          { label: "License", state: ownerDrivingLicense, setter: setOwnerDrivingLicense, limit: 2 },
          { label: "Bus Images (5)", state: vehicleImages, setter: setVehicleImages, limit: 5 },
          { label: "Insurance", state: vehicleInsurance, setter: setVehicleInsurance, limit: 2 },
          { label: "RC Book", state: vehicleRC, setter: setVehicleRC, limit: 2 },
        ].map((item, idx) => (
          <View key={idx} style={styles.inputGroup}>
            <Text style={styles.label}>{item.label}</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={() => PickDocument(item.setter, item.limit, item.state)}><Icon name="clouduploado" size={24} color={colors.deep_blue} /><Text>Upload</Text></TouchableOpacity>
            {renderDocument(item.state, item.setter)}
          </View>
        ))}
        <Text style={styles.sectionTitle}>Details</Text>
        <TextInput style={styles.input} value={vehicleMake} onChangeText={setVehicleMake} placeholder="Make Year" />
        <TextInput style={styles.input} value={vehicleModel} onChangeText={setVehicleModel} placeholder="Model" />
        <TextInput style={styles.input} value={licensePlate} onChangeText={setLicensePlate} placeholder="Number Plate" />
        <TextInput style={styles.input} value={numberOfSeats} onChangeText={setNumberOfSeats} placeholder="Seats" keyboardType="numeric" />
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price/Km {minPrice && `(₹${minPrice}-₹${maxPrice})`}</Text>
          <TextInput style={[styles.input, pricePerKmError && styles.inputError]} value={pricePerKm} onChangeText={handlePricePerKmChange} keyboardType="numeric" />
          {pricePerKmError ? <Text style={styles.errorText}>{pricePerKmError}</Text> : null}
        </View>
        <Dropdown data={[{ label: "Diesel", value: "Diesel" }, { label: "CNG", value: "CNG" }]} onSelect={i => setFuelType(i.value)} placeholder="Fuel Type" />
        <Dropdown data={[{ label: "AC", value: "AC" }, { label: "Non-AC", value: "Non-AC" }]} onSelect={i => setAc(i.value)} placeholder="AC/Non-AC" />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}><Text style={styles.submitBtnTxt}>Update & Pay</Text></TouchableOpacity>
      </ScrollView>
      <Modal visible={showPaymentConfirm} transparent animationType="slide"><View style={styles.modal_overlay}><View style={styles.modal_box}>
        <Text style={styles.modal_title}>Payment Confirmation</Text>
        <Text>Total: ₹{paymentDetails?.totalAmount}</Text>
        <TouchableOpacity style={styles.pay_btn} onPress={handleConfirmPayment}><Text style={styles.pay_txt}>Confirm & Pay</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setShowPaymentConfirm(false)}><Text>Cancel</Text></TouchableOpacity>
      </View></View></Modal>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  main_container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#eee" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 10, color: colors.deep_blue },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5 },
  uploadBox: { height: 80, borderStyle: "dashed", borderWidth: 1, borderColor: colors.deep_blue, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fff9" },
  input: { height: 45, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 10, marginBottom: 10 },
  inputError: { borderColor: "red" },
  errorText: { color: "red", fontSize: 12 },
  submitBtn: { backgroundColor: colors.deep_blue, height: 50, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 20 },
  submitBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  doc_container: { marginTop: 10, alignItems: "center", backgroundColor: "#f5f5f5", padding: 10, borderRadius: 8 },
  image: { width: 80, height: 80, borderRadius: 5 },
  remove_btn: { backgroundColor: "red", padding: 5, borderRadius: 5, marginTop: 5 },
  remove_txt: { color: "#fff", fontSize: 10 },
  modal_overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modal_box: { backgroundColor: "#fff", width: "80%", borderRadius: 20, padding: 20, alignItems: "center" },
  modal_title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  pay_btn: { backgroundColor: colors.deep_blue, padding: 12, borderRadius: 10, width: "100%", alignItems: "center", marginVertical: 10 },
  pay_txt: { color: "#fff", fontWeight: "bold" }
});

export default BusReregForm;
