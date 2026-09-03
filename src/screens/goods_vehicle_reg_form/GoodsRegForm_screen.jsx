import {
  Pressable, ScrollView, StyleSheet, Text, View, SafeAreaView, TouchableOpacity,
  TextInput, Image, Alert, ActivityIndicator, Modal, Platform, KeyboardAvoidingView
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import React, { useState, useEffect } from "react";
import { AntDesign as Icon } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { validateRequired, validatePositiveNumber } from "../../utils/validation";
import { colors } from "../../utils/constants";
import * as DocumentPicker from "expo-document-picker";
import AxiosService from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Spinner from "react-native-loading-spinner-overlay";
import { BlurView } from "expo-blur";
import Dropdown from "../../components/CustomDropdown";
import CheckboxWithLabel from "../../components/CheckboxWithLabel";
import { WebView } from 'react-native-webview';
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcon from "react-native-vector-icons/MaterialCommunityIcons";
import FeatherIcon from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from 'react-native-linear-gradient';

import { EXPO_PUBLIC_RAZORPAY_KEY_ID } from "@env";

const GST_RATE = 18;

const GoodsRegForm_screen = ({ navigation, route }) => {
  const { type } = route.params;
  const [vendorId, setVendorId] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleColorError, setVehicleColorError] = useState("");
  const [milage, setMilage] = useState("");
  const [milageError, setMilageError] = useState("");
  const [vehicleMakeError, setVehicleMakeError] = useState("");
  const [vehicleModelError, setVehicleModelError] = useState("");
  const [licensePlateError, setLicensePlateError] = useState("");
  const [fuelTypeError, setFuelTypeError] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [pricePerDayError, setPricePerDayError] = useState("");
  const [pricePerKm, setPricePerKm] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [ton, setTon] = useState("");
  const [tonError, setTonError] = useState("");
  const [size, setSize] = useState("");
  const [goodsType, setGoodsType] = useState(type);
  const [isChecked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initiateError, setInitiateError] = useState('');

  // Config state
  const [registerAmount, setRegisterAmount] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState(null);
  const [configId, setConfigId] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [pricePerKmError, setPricePerKmError] = useState("");
  const [sizeError, setSizeError] = useState("");

  // Payment modal state
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayData, setRazorpayData] = useState(null);
  const [internalPaymentId, setInternalPaymentId] = useState(null);

  // Documents
  const [ownerAdharCard, setOwnerAdharCard] = useState([]);
  const [ownerImage, setOwnerImage] = useState([]);
  const [ownerDrivingLicense, setOwnerDrivingLicense] = useState([]);
  const [vehicleImages, setVehicleImages] = useState([]);
  const [vehicleInsurance, setVehicleInsurance] = useState([]);
  const [vehicleRC, setVehicleRC] = useState([]);

  const calcGST = (base) => {
    const b = parseFloat(parseFloat(base).toFixed(2));
    const gst = parseFloat(((b * GST_RATE) / 100).toFixed(2));
    return { baseAmount: b, gstAmount: gst, totalAmount: parseFloat((b + gst).toFixed(2)) };
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

  const fetchRegisterFee = async () => {
    try {
      const res = await AxiosService.get("payment/config?vehicleType=truck");
      if (res.status === 200 && res.data.config) {
        const cfg = res.data.config;
        const amount = cfg.fixedRegisterAmount ?? cfg.minRegisterAmount ?? 2000;
        setRegisterAmount(parseFloat(amount));
        setAdvanceAmount(cfg.advanceAmount != null ? parseFloat(cfg.advanceAmount) : 500);
        setConfigId(cfg._id || null);
        if (cfg.minPrice != null) setMinPrice(parseFloat(cfg.minPrice));
        if (cfg.maxPrice != null) setMaxPrice(parseFloat(cfg.maxPrice));
      } else { setRegisterAmount(2000); setAdvanceAmount(500); }
    } catch (err) { console.log("fetchRegisterFee error:", err.message); setRegisterAmount(2000); setAdvanceAmount(500); }
  };

  useEffect(() => { getVendorData(); fetchRegisterFee(); }, []);

  const handlePricePerKmChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    setPricePerKm(cleaned);
    if (!cleaned) { setPricePerKmError(""); return; }
    const val = parseFloat(cleaned);
    if (isNaN(val)) { setPricePerKmError("Enter a valid number"); return; }
    if (minPrice !== null && val < minPrice) setPricePerKmError(`Minimum allowed: ₹${minPrice}/km`);
    else if (maxPrice !== null && val > maxPrice) setPricePerKmError(`Maximum allowed: ₹${maxPrice}/km`);
    else setPricePerKmError("");
  };

  const convertToBase64 = async (file) => {
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
    } catch (error) { console.error("Error converting file to base64:", error); return null; }
  };

  const PickDocument = async (setDocumentState, limit, currentDocuments) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"], multiple: true });
      if (result.canceled) { Alert.alert("No Document Selected", "Please select at least one document."); return; }
      const pickedDocs = result.assets ? result.assets : [result];
      const validDocuments = pickedDocs.filter(doc => doc.mimeType.startsWith("image/") || doc.mimeType === "application/pdf");
      if (validDocuments.length > 0) {
        if (currentDocuments.length + validDocuments.length > limit) { Alert.alert("Document Limit Exceeded", `You can only upload up to ${limit} document(s).`); return; }
        const base64Documents = await Promise.all(validDocuments.map(async (doc) => ({ ...doc, base64: await convertToBase64(doc) })));
        setDocumentState((prev) => [...prev, ...base64Documents]);
      } else { Alert.alert("Invalid File Type", "Please select a valid file type."); }
    } catch (error) { console.log("Error picking documents", error); }
  };

  const renderDocument = (documents, setDocumentState) => {
    if (!documents || documents.length === 0) return null;
    return documents.map((document, index) => {
      const { uri, mimeType, name } = document;
      return (
        <View key={index} style={styles.documentCard}>
          <View style={styles.documentCardHeader}>
            <View style={styles.documentBadge}>
              <Text style={styles.documentBadgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.documentCardTitle} numberOfLines={1}>
              {name || `Document ${index + 1}`}
            </Text>
            <TouchableOpacity onPress={() => setDocumentState((prev) => prev.filter((_, i) => i !== index))}>
              <MaterialIcon name="close" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
          {mimeType?.startsWith("image/") ? (
            <Image source={{ uri }} style={styles.documentPreview} />
          ) : (
            <View style={styles.documentPdfIcon}>
              <FeatherIcon name="file-text" size={32} color="#1E3A8A" />
              <Text style={styles.documentPdfText}>PDF</Text>
            </View>
          )}
        </View>
      );
    });
  };

  const buildPayload = () => ({
    vendorId,
    vehicleCategory: "trucks",
    vehicleMake,
    vehicleModel,
    licensePlate,
    vehicleColor,
    ton: parseFloat(ton) || 0,
    size,
    goodsType,
    pricePerDay: parseFloat(pricePerDay) || 0,
    pricePerKm: parseFloat(pricePerKm) || 0,
    fuelType,
    milage: parseFloat(milage) || 0,
    registerAmount: registerAmount ?? 2000,
    advanceAmount,
    ownerImage: ownerImage[0]?.base64 || null,
    ownerAdharCard: ownerAdharCard.map(doc => doc.base64 || null),
    ownerDrivingLicense: ownerDrivingLicense.map(doc => doc.base64 || null),
    vehicleImages: vehicleImages.map(img => img.base64 || null),
    vehicleInsurance: vehicleInsurance.map(ins => ins.base64 || null),
    vehicleRC: vehicleRC.map(rc => rc.base64 || null),
  });

  const resetForm = () => {
    setVehicleMake(""); setVehicleModel(""); setLicensePlate(""); setVehicleColor("");
    setTon(""); setSize(""); setPricePerDay(""); setPricePerKm(""); setFuelType(""); setMilage("");
    setPricePerKmError(""); setChecked(false);
    setOwnerAdharCard([]); setOwnerImage([]); setOwnerDrivingLicense([]);
    setVehicleImages([]); setVehicleInsurance([]); setVehicleRC([]);
  };

  const handleSubmit = async () => {
    if (!validateRequired(vehicleMake, setVehicleMakeError, "Vehicle Make Year")) return;
    if (!validateRequired(vehicleModel, setVehicleModelError, "Vehicle Model")) return;
    if (!validateRequired(licensePlate, setLicensePlateError, "License Plate")) return;
    if (!validateRequired(pricePerKm, setPricePerKmError, "Price per Km")) return;
    if (!validateRequired(fuelType, setFuelTypeError, "Fuel Type")) return;
    if (!validateRequired(size, setSizeError, "Vehicle Size")) return;
    if (!validateRequired(pricePerDay, setPricePerDayError, "Price per Day")) return;
    if (!validatePositiveNumber(pricePerDay, setPricePerDayError, "Price per Day", 0)) return;
    if (!validateRequired(milage, setMilageError, "Milage")) return;
    if (!validatePositiveNumber(milage, setMilageError, "Milage", 0)) return;
    if (!validateRequired(ton, setTonError, "Tonnage Capacity")) return;
    if (!validatePositiveNumber(ton, setTonError, "Tonnage Capacity", 0)) return;
    if (!validateRequired(vehicleColor, setVehicleColorError, "Vehicle Color")) return;
    // Document validation: ensure required files are uploaded
    if (ownerImage.length < 1) {
      setInitiateError('Vendor image is required (minimum 1).');
      return;
    }
    if (ownerAdharCard.filter(Boolean).length < 2) {
      setInitiateError('Aadhar card images are required (front and back).');
      return;
    }
    if (ownerDrivingLicense.filter(Boolean).length < 2) {
      setInitiateError('Driving license images are required (front and back).');
      return;
    }
    if (vehicleImages.filter(Boolean).length < 5) {
      setInitiateError('Vehicle images are required (minimum 5).');
      return;
    }
    if (vehicleInsurance.filter(Boolean).length < 2) {
      setInitiateError('Vehicle insurance documents are required (minimum 2).');
      return;
    }
    if (vehicleRC.filter(Boolean).length < 2) {
      setInitiateError('Vehicle RC documents are required (minimum 2).');
      return;
    }
    setInitiateError('');
    const tonValue = Number(ton);
    if (goodsType === "Small" && (tonValue < 500 || tonValue > 1000)) { Toast.show({ type: "info", text1: "Tonnage must be between 500 kg and 1000 kg", text2: "This category is only for 500 kg to 1000 kg" }); return; }
    else if (goodsType === "Medium" && (tonValue < 1000 || tonValue > 10000)) { Toast.show({ type: "info", text1: "Tonnage must be between 1000 kg and 10000 kg", text2: "This category is only for 1000 kg to 10,000 kg" }); return; }
    else if (goodsType === "Large" && (tonValue < 10000 || tonValue > 20000)) { Toast.show({ type: "info", text1: "Tonnage must be between 10000 kg and 20000 kg", text2: "This category is only for 10000 kg to 20,000 kg" }); return; }
    else if (goodsType === "XL" && tonValue < 20000) { Toast.show({ type: "info", text1: "Tonnage must be 20000 kg or above", text2: "This category is only for more than 20000 kg" }); return; }

    if (registerAmount === null) { Toast.show({ type: "info", text1: "Fetching registration fee, please wait..." }); return; }
    if (!isChecked) { Toast.show({ type: "info", text1: "You have to agree the Terms & Conditions" }); return; }
    if (!vehicleMake || !vehicleModel || !licensePlate || !pricePerKm || !fuelType) { Toast.show({ type: "error", text1: "Please fill all required fields" }); return; }

    const kmVal = parseFloat(pricePerKm);
    if (isNaN(kmVal) || kmVal <= 0) { Toast.show({ type: "error", text1: "Enter a valid price per km" }); return; }
    if (minPrice !== null && kmVal < minPrice) { Toast.show({ type: "error", text1: "Price per km too low", text2: `Minimum allowed for Truck is ₹${minPrice}/km` }); return; }
    if (maxPrice !== null && kmVal > maxPrice) { Toast.show({ type: "error", text1: "Price per km too high", text2: `Maximum allowed for Truck is ₹${maxPrice}/km` }); return; }

    setPaymentDetails(calcGST(registerAmount));
    setShowPaymentConfirm(true);
  };

  const handleConfirmPayment = async () => {
    if (!RazorpayCheckout) {
      Toast.show({
        type: "error",
        text1: "Razorpay module not found.",
        text2: "Please ensure you are using a Development Build, not Expo Go.",
      });
      return;
    }
    setShowPaymentConfirm(false);
    setLoading(true);
    setInitiateError('');
    try {
      const res = await AxiosService.post("payment/initiate-register-fee", buildPayload());

      if (res.status === 200 && res.data.paymentRequired === false) {
        resetForm();
        Toast.show({ type: "success", text1: "Vehicle registered successfully" });
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
            contact: data.vendorDetails?.contact || ""
          },
          theme: { color: "#1E3A8A" }
        };

        RazorpayCheckout.open(options)
          .then((response) => { verifyPayment(response); })
          .catch((error) => {
            console.log("Razorpay Error:", error);
            if (error.code === 2) {
              Toast.show({ type: "info", text1: "Payment cancelled" });
            } else {
              Toast.show({ type: "error", text1: "Payment failed", text2: error.description });
            }
          });
      }
    } catch (error) {
      console.log('Initiate payment error data:', error.response?.data);
      setInitiateError(error.response?.data?.message || 'Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayMessage = async (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "SUCCESS") {
        setShowRazorpay(false);
        await verifyPayment(msg.data);
      } else if (msg.type === "CANCELLED") {
        setShowRazorpay(false);
        Toast.show({ type: "info", text1: "Payment cancelled" });
      }
    } catch (e) {
      console.log("Razorpay Message Error:", e);
    }
  };

  const getRazorpayHtml = () => {
    if (!razorpayData) return "";
    const { key_id, amount, razorpayOrderId, vendorDetails } = razorpayData;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body style="background-color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh;">
          <div style="text-align: center; font-family: sans-serif; color: #666;">
            <p>Initiating Secure Payment...</p>
          </div>
          <script>
            var options = {
              "key": "${key_id}",
              "amount": "${Math.round(amount * 100)}",
              "currency": "INR",
              "name": "AAT WORLD",
              "description": "Goods Vehicle Registration Fee",
              "order_id": "${razorpayOrderId}",
              "handler": function (response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'SUCCESS',
                  data: response
                }));
              },
              "prefill": {
                "name": "${vendorDetails?.name || ""}",
                "email": "${vendorDetails?.email || ""}",
                "contact": "${vendorDetails?.contact || ""}"
              },
              "theme": { "color": "#1E3A8A" },
              "modal": {
                "ondismiss": function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CANCELLED' }));
                }
              }
            };
            var rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response){
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'FAILED', data: response.error }));
            });
            rzp.open();
          </script>
        </body>
      </html>
    `;
  };

  const verifyPayment = async (data) => {
    setLoading(true);
    try {
      const verifyRes = await AxiosService.post("payment/verify", {
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        paymentId: internalPaymentId,
      });

      if (verifyRes.status === 200) {
        resetForm();
        Toast.show({ type: "success", text1: "Payment successful! Vehicle submitted for approval." });
        setTimeout(() => navigation.navigate("Vehicle Management"), 2000);
      }
    } catch (error) {
      console.error("Verify error:", error);
      Toast.show({ type: "error", text1: "Payment verification failed. Please contact support." });
    } finally {
      setLoading(false);
    }
  };

  const dropdownData = [
    { label: "Petrol", value: "Petrol" }, { label: "Diesel", value: "Diesel" },
    { label: "CNG", value: "CNG" }, { label: "LPG", value: "LPG" },
    { label: "Electric batteries", value: "Electric batteries" },
  ];
  const sizeOptions = [
    { label: "Small (≤ 1 t)", value: "small" },
    { label: "Medium (1 t – 5 t)", value: "medium" },
    { label: "Large (5 t – 10 t)", value: "large" },
    { label: "XL (≥ 10 t)", value: "xl" },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => navigation.navigate("BecomeVendor")}
          >
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register Truck</Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <LinearGradient
                colors={['#0F172A', '#1E293B', '#1E3A8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <View style={styles.heroContent}>
                  <MaterialCommunityIcon name="truck-fast" size={48} color="#FFFFFF" />
                  <Text style={styles.heroTitle}>Register Your Truck</Text>
                  <Text style={styles.heroSubtitle}>
                    Fill in your vehicle details to register with AAT
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Info Banner */}
            {advanceAmount !== null && (
              <View style={styles.infoBanner}>
                <MaterialCommunityIcon name="information" size={20} color="#1E3A8A" />
                <Text style={styles.infoBannerText}>
                  Customers will pay ₹{advanceAmount} advance (+GST) when booking your truck.
                </Text>
              </View>
            )}

            {/* Document Upload Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documents Required</Text>
              <Text style={styles.sectionSubtitle}>Upload all required documents for verification</Text>

              {[
                { label: "Vendor Image", icon: "account", subText: "min 1", state: ownerImage, setter: setOwnerImage, limit: 1 },
                { label: "Vendor Aadhar Card", icon: "card-account-details", subText: "front & back", state: ownerAdharCard, setter: setOwnerAdharCard, limit: 2 },
                { label: "Vehicle Images", icon: "image-multiple", subText: "min 5", state: vehicleImages, setter: setVehicleImages, limit: 5 },
                { label: "Driving License", icon: "card-account-details", subText: "front & back", state: ownerDrivingLicense, setter: setOwnerDrivingLicense, limit: 2 },
                { label: "Vehicle Insurance", icon: "shield-check", subText: "min 2", state: vehicleInsurance, setter: setVehicleInsurance, limit: 2 },
                { label: "RC Book", icon: "book", subText: "front & back", state: vehicleRC, setter: setVehicleRC, limit: 2 },
              ].map(({ label, icon, subText, state, setter, limit }) => (
                <View key={label} style={styles.uploadCard}>
                  <View style={styles.uploadCardHeader}>
                    <MaterialCommunityIcon name={icon} size={20} color="#1E3A8A" />
                    <Text style={styles.uploadCardTitle}>{label}</Text>
                    <View style={styles.uploadBadge}>
                      <Text style={styles.uploadBadgeText}>{subText}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => PickDocument(setter, limit, state)}
                    activeOpacity={0.7}
                  >
                    <FeatherIcon name="upload" size={20} color="#6B7280" />
                    <Text style={styles.uploadButtonText}>Upload {label}</Text>
                  </TouchableOpacity>
                  {renderDocument(state, setter)}
                </View>
              ))}
            </View>

            {/* Vehicle Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
              <Text style={styles.sectionSubtitle}>Provide your vehicle information</Text>

              {/* Vehicle Make Year */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialIcon name="calendar-today" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>Vehicle Make Year</Text>
                </View>
                <TextInput
                  value={vehicleMake}
                  onChangeText={(text) => {
                    const year = text.replace(/[^0-9]/g, "");
                    const currentYear = new Date().getFullYear();
                    if (year.length <= 4) {
                      if (parseInt(year) > currentYear) {
                        Toast.show({ type: "error", text1: `Year cannot be greater than ${currentYear}` });
                        setVehicleMake(currentYear.toString());
                      } else setVehicleMake(year);
                    }
                  }}
                  style={[styles.input, vehicleMakeError && styles.inputError]}
                  keyboardType="numeric"
                  placeholder="Enter vehicle make year"
                  placeholderTextColor="#9CA3AF"
                  maxLength={4}
                />
                {vehicleMakeError && <Text style={styles.errorText}>{vehicleMakeError}</Text>}
              </View>

              {/* Vehicle Model */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialIcon name="directions-car" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>Vehicle Model</Text>
                </View>
                <TextInput
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                  style={[styles.input, vehicleModelError && styles.inputError]}
                  placeholder="Enter vehicle model"
                  placeholderTextColor="#9CA3AF"
                />
                {vehicleModelError && <Text style={styles.errorText}>{vehicleModelError}</Text>}
              </View>

              {/* Vehicle Number */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialIcon name="badge" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>Vehicle Number</Text>
                </View>
                <TextInput
                  value={licensePlate}
                  onChangeText={(text) => setLicensePlate(text.toLocaleUpperCase())}
                  style={[styles.input, licensePlateError && styles.inputError]}
                  placeholder="Enter license plate number"
                  placeholderTextColor="#9CA3AF"
                />
                {licensePlateError && <Text style={styles.errorText}>{licensePlateError}</Text>}
              </View>

              {/* Vehicle Color */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialIcon name="color-lens" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>Vehicle Color</Text>
                </View>
                <TextInput
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                  style={[styles.input, vehicleColorError && styles.inputError]}
                  placeholder="Enter vehicle color"
                  placeholderTextColor="#9CA3AF"
                />
                {vehicleColorError && <Text style={styles.errorText}>{vehicleColorError}</Text>}
              </View>

              {/* Price Per Km */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialCommunityIcon name="currency-inr" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>
                    Price per Km
                    {minPrice !== null && maxPrice !== null && (
                      <Text style={styles.inputHint}> (₹{minPrice} – ₹{maxPrice}/km)</Text>
                    )}
                  </Text>
                </View>
                <TextInput
                  keyboardType="numeric"
                  value={pricePerKm}
                  onChangeText={handlePricePerKmChange}
                  style={[
                    styles.input,
                    pricePerKmError ? styles.inputError : (pricePerKm && styles.inputValid)
                  ]}
                  placeholder={minPrice !== null && maxPrice !== null ? `₹${minPrice} – ₹${maxPrice}` : "Enter price per km"}
                  placeholderTextColor="#9CA3AF"
                />
                {pricePerKmError
                  ? <Text style={styles.errorText}>{pricePerKmError}</Text>
                  : pricePerKm && minPrice !== null && (
                    <View style={styles.validWrapper}>
                      <FeatherIcon name="check-circle" size={14} color="#10B981" />
                      <Text style={styles.validText}>Within allowed range</Text>
                    </View>
                  )
                }
              </View>

              {/* Price Per Day */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialCommunityIcon name="currency-inr" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>Price per Day</Text>
                </View>
                <TextInput
                  keyboardType="numeric"
                  value={pricePerDay}
                  onChangeText={setPricePerDay}
                  style={[styles.input, pricePerDayError && styles.inputError]}
                  placeholder="Enter price per day"
                  placeholderTextColor="#9CA3AF"
                />
                {pricePerDayError && <Text style={styles.errorText}>{pricePerDayError}</Text>}
              </View>

              {/* Tonnage */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialCommunityIcon name="weight" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>Tonnage Capacity (Kg)</Text>
                </View>
                <TextInput
                  keyboardType="numeric"
                  value={ton}
                  onChangeText={(text) => {
                    let filteredText = text.replace(/[^0-9]/g, "");
                    if (goodsType === "Small" && Number(filteredText) > 1000) filteredText = "1000";
                    else if (goodsType === "Medium" && Number(filteredText) > 10000) filteredText = "10000";
                    else if (goodsType === "Large" && Number(filteredText) > 20000) filteredText = "20000";
                    setTon(filteredText);
                  }}
                  style={[styles.input, tonError && styles.inputError]}
                  placeholder="Enter capacity in kg"
                  placeholderTextColor="#9CA3AF"
                />
                {tonError && <Text style={styles.errorText}>{tonError}</Text>}
              </View>

              {/* Vehicle Size */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialIcon name="straighten" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>Vehicle Size</Text>
                </View>
                <Dropdown
                  data={sizeOptions}
                  placeholder="Select vehicle size"
                  onSelect={(item) => { setSize(item.value); setSizeError(""); }}
                />
                {sizeError && <Text style={styles.errorText}>{sizeError}</Text>}
              </View>

              {/* Goods Type */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialCommunityIcon name="package-variant" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>Goods Type</Text>
                </View>
                <View style={styles.inputDisabled}>
                  <Text style={styles.inputDisabledText}>{goodsType}</Text>
                </View>
              </View>

              {/* Mileage */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialCommunityIcon name="speedometer" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>Mileage (kmpl)</Text>
                </View>
                <TextInput
                  keyboardType="numeric"
                  value={milage}
                  onChangeText={setMilage}
                  style={[styles.input, milageError && styles.inputError]}
                  placeholder="Enter mileage"
                  placeholderTextColor="#9CA3AF"
                />
                {milageError && <Text style={styles.errorText}>{milageError}</Text>}
              </View>

              {/* Fuel Type */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelWrapper}>
                  <MaterialCommunityIcon name="fuel" size={18} color="#1E3A8A" />
                  <Text style={styles.inputLabel}>Fuel Type</Text>
                </View>
                <Dropdown
                  data={dropdownData}
                  placeholder="Select fuel type"
                  onSelect={(item) => { setFuelType(item.value); setFuelTypeError(""); }}
                />
                {fuelTypeError && <Text style={styles.errorText}>{fuelTypeError}</Text>}
              </View>
            </View>

            {/* Terms & Conditions */}
            <View style={styles.termsSection}>
              <CheckboxWithLabel
                isChecked={isChecked}
                setChecked={setChecked}
                onTermsPress={() => navigation.navigate("Terms and Conditions (T&C)")}
                onPrivacyPress={() => navigation.navigate("Privacy Policy")}
                onRefundPress={() => navigation.navigate("Refund Policy")}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                (registerAmount === null || !!pricePerKmError || !!pricePerDayError || !!milageError || !!tonError || !!vehicleColorError) && styles.submitButtonDisabled
              ]}
              activeOpacity={0.8}
              disabled={registerAmount === null || !!pricePerKmError || !!pricePerDayError || !!milageError || !!tonError || !!vehicleColorError}
            >
              <LinearGradient
                colors={['#0F172A', '#1E293B', '#1E3A8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {registerAmount === null ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcon name="payment" size={22} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Continue to Payment</Text>
                    <View style={styles.submitBadge}>
                      <Text style={styles.submitBadgeText}>₹{(registerAmount * 1.18).toFixed(0)}</Text>
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {initiateError && (
              <View style={styles.errorBanner}>
                <MaterialIcon name="error-outline" size={20} color="#EF4444" />
                <Text style={styles.errorBannerText}>{initiateError}</Text>
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Loading Overlay */}
        {loading && (
          <BlurView style={styles.loadingOverlay} intensity={100}>
            <Spinner color="#1E3A8A" visible={loading} textStyle={styles.spinnerText} />
          </BlurView>
        )}

        {/* Payment Confirmation Modal */}
        <Modal
          visible={showPaymentConfirm}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPaymentConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrapper}>
                  <MaterialIcon name="payment" size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.modalTitle}>Confirm Payment</Text>
                <Text style={styles.modalSubtitle}>Goods Vehicle Registration Fee</Text>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Base Amount</Text>
                  <Text style={styles.modalValue}>₹{paymentDetails?.baseAmount?.toLocaleString()}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>GST (18%)</Text>
                  <Text style={styles.modalValue}>₹{paymentDetails?.gstAmount?.toFixed(2)}</Text>
                </View>
                <View style={[styles.modalRow, styles.modalTotalRow]}>
                  <Text style={styles.modalTotalLabel}>Total Payable</Text>
                  <Text style={styles.modalTotalValue}>₹{paymentDetails?.totalAmount?.toFixed(2)}</Text>
                </View>

                {advanceAmount !== null && (
                  <View style={styles.modalInfoBox}>
                    <MaterialCommunityIcon name="information" size={18} color="#F59E0B" />
                    <Text style={styles.modalInfoText}>
                      Customers also pay a ₹{advanceAmount} advance (+GST) when booking your truck.
                    </Text>
                  </View>
                )}

                <View style={styles.modalNoteWrapper}>
                  <FeatherIcon name="shield" size={16} color="#1E3A8A" />
                  <Text style={styles.modalNote}>
                    You will be redirected to the Razorpay payment page.
                  </Text>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowPaymentConfirm(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalPayButton}
                  onPress={handleConfirmPayment}
                >
                  <LinearGradient
                    colors={['#0F172A', '#1E293B', '#1E3A8A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalPayGradient}
                  >
                    <MaterialIcon name="check-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.modalPayText}>Pay Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Razorpay WebView Modal */}
        <Modal
          visible={showRazorpay}
          animationType="slide"
          onRequestClose={() => setShowRazorpay(false)}
        >
          <SafeAreaView style={styles.webviewContainer}>
            <View style={styles.webviewHeader}>
              <TouchableOpacity onPress={() => setShowRazorpay(false)}>
                <Ionicons name="close" size={28} color="#1E3A8A" />
              </TouchableOpacity>
              <Text style={styles.webviewTitle}>
                <MaterialIcon name="lock" size={20} color="#1E3A8A" /> Secure Payment
              </Text>
              <View style={{ width: 28 }} />
            </View>
            <WebView
              source={{ html: getRazorpayHtml() }}
              onMessage={handleRazorpayMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              style={styles.webview}
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color="#1E3A8A" />
                  <Text style={styles.webviewLoadingText}>Loading Secure Checkout...</Text>
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>

        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default GoodsRegForm_screen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Hero
  heroSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  heroGradient: {
    padding: 24,
    minHeight: 140,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textAlign: 'center',
  },
  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  // Section
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  // Upload Card
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  uploadCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  uploadBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  uploadBadgeText: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: '#F9FAFB',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Document Cards
  documentCard: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  documentBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  documentCardTitle: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  documentPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 8,
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  documentPdfIcon: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  documentPdfText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // Input
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  inputValid: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputDisabledText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  validWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  validText: {
    fontSize: 12,
    color: '#10B981',
  },
  // Terms
  termsSection: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  // Submit Button
  submitButton: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  submitBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  submitBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  bottomSpacer: {
    height: 20,
  },
  // Loading
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerText: {
    color: '#1E3A8A',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalTotalRow: {
    borderBottomWidth: 0,
    paddingTop: 14,
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  modalInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  modalNoteWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  modalNote: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalPayButton: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalPayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalPayText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // WebView
  webviewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  webviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  webviewLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});