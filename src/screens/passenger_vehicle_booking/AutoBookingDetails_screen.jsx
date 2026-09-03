import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Image,
  Linking,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  ToastAndroid,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import * as Location from 'expo-location';
import { colors } from "../../utils/constants";
import Icon from "react-native-vector-icons/AntDesign";
import Icon2 from "react-native-vector-icons/MaterialIcons";
import Icon3 from "react-native-vector-icons/FontAwesome6";
import Icon4 from "react-native-vector-icons/MaterialCommunityIcons";
import Icon5 from "react-native-vector-icons/Feather";
import Icon6 from "react-native-vector-icons/Ionicons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { TouchableOpacity } from "react-native";
import carImg from "../../assets/Images/car5.png";
import autoImg from "../../assets/Images/auto.png";
import vanImg from "../../assets/Images/van.png";
import busImg from "../../assets/Images/bus.png";
import smallTruckImg from "../../assets/Images/under1-ton.jpg";
import mediumTruckImg from "../../assets/Images/XL-truck.png";
import largeTruckImg from "../../assets/Images/below-20-ton.png";
import XLTruckImg from "../../assets/Images/moreThen20-ton.png";
import AxiosService from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import Navigateicon from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBaseCharges } from "../../utils/BaseChargeContext";

const API_KEY = "AIzaSyBwgknRJiqNR7SHEY2j68RVsMy5OOgU70I";

const AutoBookingDetails_screen = ({ navigation, route }) => {
  const { baseCharges } = useBaseCharges();
  const getBaseCharge = (subCategory) => {
    if (!subCategory) return 0;
    return baseCharges?.[subCategory.toLowerCase()] || 0;
  };

  const [modalshow, setmodalshow] = useState(false);
  const [totalFare, setTotalFare] = useState();
  const [vendorRejectedReason, setVendorRejectedReason] = useState("");
  const [vendorApprovedStatus, setVendorApprovedStatus] = useState("");
  const [paymentMethod, setPamentMethod] = useState(null);
  const [pickupCoordinates, setPickupCoordinates] = useState(null);
  const [dropCoordinates, setDropCoordinates] = useState(null);
  const { bookingDetails: initialBookingDetails } = route.params;
  const [bookingDetails, setBookingDetails] = useState(initialBookingDetails);
  const [otp, setOtp] = useState();
  const [loading, setLoading] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(new Date(bookingDetails.pickupDate));
  
  const [showDropEditModal, setShowDropEditModal] = useState(false);
  const [newDropLocation, setNewDropLocation] = useState("");
  const [updatingDrop, setUpdatingDrop] = useState(false);
  const [predictions, setPredictions] = useState([]);

  const handleDropLocationChange = async (text) => {
    setNewDropLocation(text);
    if (text.length > 2) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${API_KEY}&components=country:in`;
        const res = await axios.get(url);
        if (res.data.status === 'OK') {
          setPredictions(res.data.predictions);
        } else {
          setPredictions([]);
        }
      } catch (error) {
        setPredictions([]);
      }
    } else {
      setPredictions([]);
    }
  };

  const handleUpdateDropLocation = async () => {
    if (!newDropLocation.trim()) {
      Toast.show({ type: "info", text1: "Please enter a drop location", position: "top" });
      return;
    }
    setUpdatingDrop(true);
    try {
      const res = await AxiosService.post("vendor/updateDropLocation", {
        bookingId: bookingDetails._id,
        dropLocation: newDropLocation,
      });
      if (res.status === 200) {
        setBookingDetails({ ...bookingDetails, dropLocation: newDropLocation });
        Toast.show({ type: "success", text1: "Drop location updated successfully", position: "top" });
        setShowDropEditModal(false);
        handleSetLocations();
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Failed to update drop location",
        position: "top",
      });
    } finally {
      setUpdatingDrop(false);
    }
  };

  const handleSOS = async () => {
    try {
      setSosLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        ToastAndroid.show('Location permission needed for SOS', ToastAndroid.LONG);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      
      const userStr = await AsyncStorage.getItem('user');
      const vendorId = userStr ? JSON.parse(userStr)._id : null;
      if (!vendorId) {
        ToastAndroid.show('Vendor ID not found', ToastAndroid.SHORT);
        return;
      }

      const res = await AxiosService.post('vendor/trigger-sos', {
        vendorId,
        lat,
        lng
      });
      if (res.status === 201) {
        ToastAndroid.show('SOS Alert Sent!', ToastAndroid.LONG);
      }
    } catch (error) {
      console.log('SOS Error', error);
      ToastAndroid.show('Failed to trigger SOS', ToastAndroid.SHORT);
    } finally {
      setSosLoading(false);
    }
  };
  const [show, setShow] = useState(false);
  const [modalForComplete, setModalForComplete] = useState(false);
  const [isMapsLoading, setIsMapsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);

  // UPI QR Code states
  const [showUpiQrModal, setShowUpiQrModal] = useState(false);
  const [vendorUpiDetails, setVendorUpiDetails] = useState([]);
  const [selectedUpi, setSelectedUpi] = useState(null);
  const [upiLoading, setUpiLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Server URL constant - Use your actual server URL
  const SERVER_URL = "https://worldofaat.com";
  const fmtNum = (n) => parseFloat(n || 0).toFixed(2);

  let vehicleimg;
  const defaultTruckImg = XLTruckImg;

  // Auto-populate total fare when component mounts for pending bookings
  useEffect(() => {
    if (bookingDetails.vendorApprovedStatus === "pending") {
      const calculatedFare = calculateTotalFare();
      if (calculatedFare > 0) {
        setTotalFare(calculatedFare.toString());
      }
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await AxiosService.get(`vendor/getBookingById/${bookingDetails._id}`);
      if (res.data.booking) {
        setBookingDetails(res.data.booking);
      }
    } catch (error) {
      console.log("Error refreshing booking:", error);
    } finally {
      setRefreshing(false);
    }
  }, [bookingDetails._id]);

  // Fixed: Changed useFocusElement to useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      handleSetLocations();
      onRefresh(); // Refresh data when screen is focused
    }, [onRefresh])
  );

  // Fetch vendor UPI details when needed
  const fetchVendorUpiDetails = async () => {
    try {
      setUpiLoading(true);
      const vendorId = bookingDetails.vehicleDetails.vendorId;
      const res = await AxiosService.get(`vendor/payment/get-payment-profile/${vendorId}`);
      if (res.data.success) {
        const upiDetails = res.data.profile.paymentProfile.upiDetails || [];
        console.log("Fetched UPI Details:", upiDetails);
        setVendorUpiDetails(upiDetails);

        // Auto-select default UPI if available
        const defaultUpi = upiDetails.find(upi => upi.isDefault);
        if (defaultUpi) {
          setSelectedUpi(defaultUpi);
        } else if (upiDetails.length > 0) {
          setSelectedUpi(upiDetails[0]);
        }
      }
    } catch (error) {
      console.log("Error fetching UPI details:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load payment options",
      });
    } finally {
      setUpiLoading(false);
    }
  };

  // Function to get full QR code URL - FIXED VERSION
  const getFullQrUrl = (qrCodeUrl) => {
    if (!qrCodeUrl) return null;

    console.log("Original QR URL from API:", qrCodeUrl);

    // If it's a full URL with worldofaat.com, replace it with local server
    if (qrCodeUrl.includes('worldofaat.com')) {
      // Extract the path after the domain
      const pathParts = qrCodeUrl.split('/uploads/');
      if (pathParts.length > 1) {
        const fileName = pathParts[1];
        // Clean the filename (remove any extra slashes)
        const cleanFileName = fileName.replace(/^\/+/, '');
        const cleanUrl = `${SERVER_URL}/uploads/${cleanFileName}`;
        console.log("Replaced worldofaat.com URL with:", cleanUrl);
        return cleanUrl;
      }
    }

    // If it's already a full URL with correct domain, use it as is
    if (qrCodeUrl.startsWith('http')) {
      // Remove any duplicate slashes
      const cleanUrl = qrCodeUrl.replace(/([^:]\/)\/+/g, '$1');
      console.log("Cleaned existing URL:", cleanUrl);
      return cleanUrl;
    }

    // For relative paths, construct URL with server
    const cleanPath = qrCodeUrl.startsWith('/') ? qrCodeUrl : `/${qrCodeUrl}`;
    const fullUrl = `${SERVER_URL}${cleanPath}`;
    console.log("Constructed URL from relative path:", fullUrl);
    return fullUrl;
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const onChange = (event, selectedDate) => {
    setShow(false);
    if (selectedDate) {
      setDate(selectedDate);
      handleReturnDateUpdate(selectedDate);
    }
  };

  const handleReturnDateUpdate = async (selectedDate) => {
    try {
      const res = await AxiosService.post("vendor/updateReturndate", {
        bookingId: bookingDetails._id,
        vendorId: bookingDetails.vehicleDetails.vendorId,
        vehicleId: bookingDetails.vehicleDetails.foundVehicle._id,
        date: selectedDate,
      });
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: res.data.message,
        });
        setTimeout(() => {
          navigation.navigate("MainHome", { screen: "My Bookings" });
        }, 1000);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response?.message || error.message || "Something went wrong",
        position: "top",
      });
    }
  };

  const handlePhone = (num) => {
    Linking.openURL(`tel:${num}`);
  };

  const BookingApproval = async (ApprovedStatus) => {
    setLoading(true);
    const bookingId = bookingDetails._id;

    if (bookingDetails?.vehicleDetails?.foundVehicle?.subCategory === "truck" && !totalFare) {
      Toast.show({
        type: "info",
        text1: "Please enter the total amount",
        position: "top",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await AxiosService.post("vendor/vendorBookingApproval", {
        bookingId,
        vendorApprovedStatus: ApprovedStatus || vendorApprovedStatus,
        vendorRejectedReason,
        totalFare: totalFare || bookingDetails?.totalFare,
      });
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: res.data.message,
          position: "top",
        });
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || error.message || "Something went wrong",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const startRide = async () => {
    setLoading(true);
    const bookingId = bookingDetails._id;

    try {
      const res = await AxiosService.post("vendor/VendorStartTrip", {
        bookingId,
        otp,
      });
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: res.data.message,
          position: "top",
        });
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || error.message || "Something went wrong",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const RejectModelOpen = () => {
    setVendorApprovedStatus("rejected");
    setmodalshow(true);
  };

  const RejectModelClose = () => {
    setVendorApprovedStatus("");
    setVendorRejectedReason("");
    setmodalshow(false);
  };

  const showAlert = () => {
    Alert.alert(
      "Confirm Ride",
      "Are you sure you want to confirm this ride?",
      [
        {
          text: "Cancel",
          onPress: () => setVendorApprovedStatus(""),
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => {
            setVendorApprovedStatus("approved");
            BookingApproval("approved");
          },
          style: "default",
        },
      ],
      { cancelable: false }
    );
  };

  const completeRide = async () => {
    setLoading(true);
    const bookingId = bookingDetails._id;
    try {
      const res = await AxiosService.post("vendor/vendorCompleteRide", {
        bookingId,
        paymentMethod,
      });
      if (res.status === 200) {
        setModalForComplete(false);
        Toast.show({
          type: "success",
          text1: res.data.message,
          position: "top",
        });
        updateVendorPaymentDetials();
        setTimeout(() => {
          navigation.navigate("MainHome");
        }, 2000);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || error.message || "Something went wrong",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVendorPaymentDetials = async () => {
    try {
      await AxiosService.post("vendor/getVendorBookingsByMonthAndWeek", {
        vendorId: bookingDetails.vehicleDetails.vendorId,
      });
    } catch (error) {
      console.log(error.response?.data?.message);
    }
  };

  // UPI Payment Functions
  const handleUpiPayment = async () => {
    setLoading(true);
    try {
      // Here you would integrate with your payment gateway
      Toast.show({
        type: "success",
        text1: "Payment initiated successfully",
        text2: "Please complete payment in your UPI app",
      });

      // Simulate payment processing
      setTimeout(() => {
        setShowUpiQrModal(false);
        setLoading(false);
        // Optionally mark payment as complete
        setPamentMethod("online");
      }, 2000);

    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Payment failed",
      });
      setLoading(false);
    }
  };

  const subCategoryImageMap = {
    car: carImg,
    auto: autoImg,
    van: vanImg,
    bus: busImg,
    truck: {
      Small: smallTruckImg,
      Medium: mediumTruckImg,
      Large: largeTruckImg,
      XL: XLTruckImg,
    },
  };

  const { subCategory, goodsType } = bookingDetails.vehicleDetails.foundVehicle;

  if (subCategory === "truck" && goodsType) {
    vehicleimg = subCategoryImageMap[subCategory][goodsType] || defaultTruckImg;
  } else {
    vehicleimg = subCategoryImageMap[subCategory] || defaultTruckImg;
  }

  const refundAdvance = async () => {
    try {
      const res = await AxiosService.post("vendor/vendorAdvanceRefund", {
        bookingId: bookingDetails._id,
      });
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: res.data.message,
          position: "top",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || error.message || "Something went wrong",
        position: "top",
      });
    }
  };

  const geocodeAddress = async (address) => {
    const apiKey = API_KEY;
    const baseUrl = "https://maps.googleapis.com/maps/api/geocode/json";

    try {
      const response = await axios.get(baseUrl, {
        params: {
          address: address,
          key: apiKey,
        },
      });

      if (response.data.status === "OK") {
        return response.data.results[0].geometry.location;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const handleSetLocations = async () => {
    const chennaiCoordinates = {
      latitude: 13.0485716,
      longitude: 80.2081229
    };

    const pickupLocation = await geocodeAddress(bookingDetails?.pickupLocation);
    const dropLocation = await geocodeAddress(bookingDetails.dropLocation);

    setPickupCoordinates(pickupLocation ? {
      latitude: pickupLocation.lat,
      longitude: pickupLocation.lng,
    } : chennaiCoordinates);

    setDropCoordinates(dropLocation ? {
      latitude: dropLocation.lat,
      longitude: dropLocation.lng,
    } : {
      latitude: chennaiCoordinates.latitude + 0.05,
      longitude: chennaiCoordinates.longitude + 0.05
    });
  };

  const openGoogleMaps = async () => {
    setIsMapsLoading(true);

    try {
      const startLat = pickupCoordinates?.latitude || 13.0485716;
      const startLng = pickupCoordinates?.longitude || 80.2081229;
      const endLat = dropCoordinates?.latitude || 13.082680;
      const endLng = dropCoordinates?.longitude || 80.270721;

      const url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=driving`;

      const googleMapsAppUrl = `comgooglemaps://?daddr=${endLat},${endLng}&saddr=${startLat},${startLng}&directionsmode=driving`;

      const googleMapsAppSupported = await Linking.canOpenURL(googleMapsAppUrl);

      if (googleMapsAppSupported) {
        await Linking.openURL(googleMapsAppUrl);
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      try {
        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          bookingDetails.pickupLocation + ' to ' + bookingDetails.dropLocation
        )}`;
        await Linking.openURL(fallbackUrl);
      } catch (fallbackError) {
        Toast.show({
          type: "error",
          text1: "Cannot Open Maps",
          text2: "Please install Google Maps app",
          position: "top",
        });
      }
    } finally {
      setIsMapsLoading(false);
    }
  };

  const calculateTotalFare = () => {
    try {
      if (bookingDetails.totalFare > 0) {
        return bookingDetails.totalFare;
      }

      let calculatedFare = 0;
      const subCat = bookingDetails.vehicleDetails.foundVehicle.subCategory;
      const baseChargeAmt = getBaseCharge(subCat);

      if (bookingDetails.tripType === "One Day Trip" && bookingDetails.totalKm) {
        const pricePerKm = bookingDetails.vehicleDetails.foundVehicle.pricePerKm || 0;
        calculatedFare = baseChargeAmt + parseInt(bookingDetails.totalKm) * pricePerKm;
      }

      if (bookingDetails.tripType === "Round Trip" && bookingDetails.totalDays) {
        const pricePerDay = bookingDetails.vehicleDetails.foundVehicle.pricePerDay || 0;
        calculatedFare = baseChargeAmt + bookingDetails.totalDays * pricePerDay;
      }

      if (calculatedFare > 0 && bookingDetails.advanceAmount > 0) {
        calculatedFare += bookingDetails.advanceAmount;
      }

      return calculatedFare > 0 ? calculatedFare : 0;
    } catch (error) {
      return 0;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.orange;
      case 'approved': return colors.green;
      case 'ongoing': return colors.blue;
      case 'completed': return colors.deep_blue;
      case 'cancelled': return colors.red;
      default: return colors.gray;
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calculate base fare for breakdown
  const calculateBaseFare = () => {
    if (bookingDetails.tripType === "One Day Trip" && bookingDetails.totalKm) {
      return parseInt(bookingDetails.totalKm) * (bookingDetails.vehicleDetails.foundVehicle.pricePerKm || 0);
    }
    if (bookingDetails.tripType === "Round Trip" && bookingDetails.totalDays) {
      return bookingDetails.totalDays * (bookingDetails.vehicleDetails.foundVehicle.pricePerDay || 0);
    }
    return 0;
  };

  // Render UPI QR Payment Modal with dynamic vendor QR
  const renderUpiQrModal = () => (
    <Modal
      visible={showUpiQrModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowUpiQrModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.qrModalContent]}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setShowUpiQrModal(false)}
          >
            <Icon name="close" size={24} color={colors.dark_gray} />
          </TouchableOpacity>
          <View style={styles.qrHeader}>
            <Icon4 name="qrcode-scan" size={40} color={colors.deep_blue} />
            <Text style={styles.modalTitle}>UPI Payment</Text>
            <Text style={styles.modalSubtitle}>Scan QR code to pay</Text>
          </View>

          {upiLoading ? (
            <View style={styles.qrLoadingContainer}>
              <ActivityIndicator size="large" color={colors.deep_blue} />
              <Text style={styles.qrLoadingText}>Loading payment options...</Text>
            </View>
          ) : (
            <>
              {/* Amount Display */}
              <View style={styles.amountDisplay}>
                <Text style={styles.amountLabel}>Amount to Pay</Text>
                <Text style={styles.amountValue}>
                  ₹{fmtNum(paymentAmount || bookingDetails.remainingPayment || calculateTotalFare())}
                </Text>
              </View>

              {/* UPI Selection - If multiple UPI IDs exist */}
              {vendorUpiDetails.length > 1 && (
                <>
                  <Text style={styles.sectionLabel}>Select UPI ID</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.upiListContainer}
                  >
                    {vendorUpiDetails.map((upi) => (
                      <TouchableOpacity
                        key={upi._id}
                        style={[
                          styles.upiCard,
                          selectedUpi?._id === upi._id && styles.upiCardSelected
                        ]}
                        onPress={() => setSelectedUpi(upi)}
                      >
                        <Icon4
                          name="qrcode"
                          size={20}
                          color={selectedUpi?._id === upi._id ? colors.white : colors.deep_blue}
                        />
                        <View style={styles.upiInfo}>
                          <Text style={[
                            styles.upiId,
                            selectedUpi?._id === upi._id && styles.upiTextSelected
                          ]}>
                            {upi.upiId}
                          </Text>
                        </View>
                        {upi.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* QR Code Display - Dynamically from selected UPI */}
              {selectedUpi && (
                <View style={styles.qrContainer}>
                  {selectedUpi.qrCodeUrl ? (
                    <>
                      <Image
                        source={{ uri: getFullQrUrl(selectedUpi.qrCodeUrl) }}
                        style={styles.qrImage}
                        resizeMode="contain"
                        onLoadStart={() => console.log("Loading QR image from:", getFullQrUrl(selectedUpi.qrCodeUrl))}
                        onLoad={() => console.log("QR image loaded successfully")}
                        onError={(error) => {
                          console.log("Error loading QR image:", error.nativeEvent.error);
                          Toast.show({
                            type: "error",
                            text1: "Failed to load QR code",
                            text2: "Please try again",
                          });
                        }}
                      />

                      <View style={styles.upiDetails}>
                        <View style={styles.upiDetailRow}>
                          <Text style={styles.upiDetailLabel}>UPI ID:</Text>
                          <Text style={styles.upiDetailValue}>{selectedUpi.upiId}</Text>
                        </View>
                        <View style={styles.upiDetailRow}>
                          <Text style={styles.upiDetailLabel}>Name:</Text>
                          <Text style={styles.upiDetailValue}>{selectedUpi.accountHolderName}</Text>
                        </View>
                      </View>

                      <Text style={styles.qrInstruction}>
                        Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)
                      </Text>
                    </>
                  ) : (
                    <View style={styles.noQrContainer}>
                      <Icon4 name="qrcode-off" size={50} color={colors.dark_gray} />
                      <Text style={styles.noQrText}>QR code not available for this UPI ID</Text>
                    </View>
                  )}
                </View>
              )}

              {/* If no UPI IDs found */}
              {vendorUpiDetails.length === 0 && !upiLoading && (
                <View style={styles.noUpiContainer}>
                  <Icon4 name="alert-circle" size={50} color={colors.orange} />
                  <Text style={styles.noUpiText}>No UPI IDs found</Text>
                  <Text style={styles.noUpiSubtext}>
                    Vendor has not added any UPI payment method
                  </Text>
                </View>
              )}

              {/* Payment Instructions - Only show if QR is available */}
              {selectedUpi?.qrCodeUrl && (
                <View style={styles.instructionsContainer}>
                  <View style={styles.instructionItem}>
                    <Icon4 name="numeric-1-circle" size={20} color={colors.deep_blue} />
                    <Text style={styles.instructionText}>Open any UPI app</Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Icon4 name="numeric-2-circle" size={20} color={colors.deep_blue} />
                    <Text style={styles.instructionText}>Scan this QR code</Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Icon4 name="numeric-3-circle" size={20} color={colors.deep_blue} />
                    <Text style={styles.instructionText}>Enter amount and pay</Text>
                  </View>
                </View>
              )}

              {/* Payment Button - Only show if QR is available */}
              {selectedUpi?.qrCodeUrl && (
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={handleUpiPayment}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Icon4 name="check-circle" size={20} color={colors.white} />
                      <Text style={styles.payButtonText}>I've Completed Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUpiQrModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <StatusBar backgroundColor={colors.deep_blue} barStyle="light-content" />
      <View style={[styles.headerGradient, { backgroundColor: colors.deep_blue }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon4 name="arrow-left" size={28} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 28 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(bookingDetails.tripStatus) }]} />
              <Text style={styles.statusText}>
                {bookingDetails.tripStatus?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.bookingId}>
              #{String(bookingDetails._id).slice(-8).toUpperCase()}
            </Text>
          </View>
          <View style={styles.tripTypeBadge}>
            <Icon4 name="map-marker-distance" size={16} color={colors.white} />
            <Text style={styles.tripTypeText}>{bookingDetails.tripType}</Text>
          </View>
        </View>

        {/* Vehicle Card */}
        <TouchableOpacity
          style={styles.vehicleCard}
          onPress={() => toggleSection('vehicle')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon4 name="truck" size={22} color={colors.deep_blue} />
              <Text style={styles.cardTitle}>Vehicle Details</Text>
            </View>
            <Icon name={expandedSection === 'vehicle' ? 'up' : 'down'} size={16} color={colors.dark_gray} />
          </View>

          {(expandedSection === 'vehicle' || !expandedSection) && (
            <View style={styles.vehicleContent}>
              <View style={styles.vehicleImageContainer}>
                <Image source={vehicleimg} style={styles.vehicleImage} />
              </View>
              <View style={styles.vehicleInfo}>
                <View style={styles.infoRow}>
                  <Icon4 name="rename-box" size={16} color={colors.deep_blue} />
                  <Text style={styles.infoLabel}>Model:</Text>
                  <Text style={styles.infoValue}>{bookingDetails.vehicleDetails.foundVehicle.vehicleModel}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon4 name="credit-card" size={16} color={colors.deep_blue} />
                  <Text style={styles.infoLabel}>Number:</Text>
                  <Text style={styles.infoValue}>{bookingDetails.vehicleDetails.foundVehicle.licensePlate}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon4 name="currency-inr" size={16} color={colors.deep_blue} />
                  <Text style={styles.infoLabel}>Price/Km:</Text>
                  <Text style={styles.infoValue}>₹{bookingDetails.vehicleDetails.foundVehicle.pricePerKm}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon4 name="calendar-clock" size={16} color={colors.deep_blue} />
                  <Text style={styles.infoLabel}>Price/Day:</Text>
                  <Text style={styles.infoValue}>₹{bookingDetails.vehicleDetails.foundVehicle.pricePerDay}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon4 name="map-marker-distance" size={16} color={colors.deep_blue} />
                  <Text style={styles.infoLabel}>Total Km:</Text>
                  <Text style={styles.infoValue}>{parseInt(bookingDetails.totalKm).toFixed(2)} Km</Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Location Card */}
        <TouchableOpacity
          style={styles.locationCard}
          onPress={() => toggleSection('location')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon3 name="location-dot" size={22} color={colors.deep_blue} />
              <Text style={styles.cardTitle}>Location Details</Text>
            </View>
            <Icon name={expandedSection === 'location' ? 'up' : 'down'} size={16} color={colors.dark_gray} />
          </View>

          {(expandedSection === 'location' || !expandedSection) && (
            <View style={styles.locationContent}>
              <View style={styles.locationItem}>
                <View style={styles.locationIconContainer}>
                  <Icon4 name="map-marker-radius" size={20} color={colors.deep_blue} />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Pickup Location</Text>
                  <Text style={styles.locationAddress}>{bookingDetails.pickupLocation}</Text>
                </View>
              </View>

              <View style={styles.locationDivider}>
                <Icon4 name="arrow-down" size={20} color={colors.deep_blue} />
              </View>

              <View style={[styles.locationItem, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                  <View style={styles.locationIconContainer}>
                    <Icon4 name="map-marker" size={20} color={colors.red} />
                  </View>
                  <View style={[styles.locationTextContainer, { flex: 1, paddingRight: 10 }]}>
                    <Text style={styles.locationLabel}>Drop Location</Text>
                    <Text style={styles.locationAddress}>{bookingDetails.dropLocation}</Text>
                  </View>
                </View>
                {(bookingDetails.tripStatus !== "completed" && bookingDetails.tripStatus !== "cancelled") && (
                  <TouchableOpacity onPress={() => {
                    setNewDropLocation(bookingDetails.dropLocation || "");
                    setShowDropEditModal(true);
                  }}>
                    <Icon5 name="edit" size={20} color={colors.deep_blue} style={{ padding: 5 }} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={openGoogleMaps}
                disabled={isMapsLoading}
                style={styles.mapButton}
              >
                {isMapsLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Icon6 name="navigate" size={22} color={colors.white} />
                    <Text style={styles.mapButtonText}>Get Directions</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* Customer Card */}
        <TouchableOpacity
          style={styles.customerCard}
          onPress={() => toggleSection('customer')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon4 name="account" size={22} color={colors.deep_blue} />
              <Text style={styles.cardTitle}>Customer Details</Text>
            </View>
            <Icon name={expandedSection === 'customer' ? 'up' : 'down'} size={16} color={colors.dark_gray} />
          </View>

          {(expandedSection === 'customer' || !expandedSection) && (
            <View style={styles.customerContent}>
              <View style={styles.customerInfoRow}>
                <Image
                  source={require("../../assets/Images/pro-pic.png")}
                  style={styles.customerAvatar}
                />
                <View style={styles.customerDetails}>
                  <Text style={styles.customerName}>{bookingDetails.customer.customerName}</Text>
                  <Text style={styles.customerAddress}>{bookingDetails.customer.customerAddress}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handlePhone(`+${bookingDetails.customer.customerPhoneNumber}`)}
              >
                <Icon3 name="phone" size={18} color={colors.white} />
                <Text style={styles.callButtonText}>
                  {bookingDetails.customer.customerPhoneNumber}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.fareCard}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setShowFareBreakdown(!showFareBreakdown)}
            activeOpacity={0.7}
          >
            <View style={styles.cardTitleContainer}>
              <Icon4 name="currency-inr" size={22} color={colors.deep_blue} />
              <Text style={styles.cardTitle}>Fare Details</Text>
            </View>
            <Icon name={showFareBreakdown ? 'up' : 'down'} size={16} color={colors.dark_gray} />
          </TouchableOpacity>

          <View style={styles.fareContent}>
            {/* Always show total fare prominently */}
            <View style={styles.totalFareContainer}>
              <Text style={styles.totalFareLabel}>Total Amount</Text>
              <Text style={styles.totalFareAmount}>
                ₹{fmtNum(bookingDetails.totalFare > 0 ? bookingDetails.totalFare : calculateTotalFare())}
              </Text>
            </View>

            {/* Fare breakdown - collapsible */}
            {showFareBreakdown && (
              <View style={styles.fareBreakdown}>
                {bookingDetails.advanceAmount > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Advance Paid</Text>
                    <Text style={styles.fareValue}>₹{fmtNum(bookingDetails.advanceAmount)}</Text>
                  </View>
                )}

                {bookingDetails.vehicleDetails.foundVehicle.pricePerKm > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Price per Km</Text>
                    <Text style={styles.fareValue}>₹{fmtNum(bookingDetails.vehicleDetails.foundVehicle.pricePerKm)}</Text>
                  </View>
                )}

                {bookingDetails.totalKm > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Total Distance</Text>
                    <Text style={styles.fareValue}>{parseInt(bookingDetails.totalKm).toFixed(2)} Km</Text>
                  </View>
                )}

                {bookingDetails.vehicleDetails.foundVehicle.pricePerDay > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Price per Day</Text>
                    <Text style={styles.fareValue}>₹{fmtNum(bookingDetails.vehicleDetails.foundVehicle.pricePerDay)}</Text>
                  </View>
                )}

                {bookingDetails.tripType === "Round Trip" && bookingDetails.totalDays > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Total Days</Text>
                    <Text style={styles.fareValue}>{bookingDetails.totalDays} Days</Text>
                  </View>
                )}

                {bookingDetails.vendorApprovedStatus === "approved" &&
                  !bookingDetails.customerPayedOnline &&
                  bookingDetails.remainingPayment > 0 && (
                    <View style={styles.fareRow}>
                      <Text style={styles.fareLabel}>Remaining Payment</Text>
                      <Text style={styles.fareValue}>₹{fmtNum(bookingDetails.remainingPayment)}</Text>
                    </View>
                  )}

                {bookingDetails.penaltyAmount !== 0 && (
                  <View style={[styles.fareRow, styles.penaltyRow]}>
                    <Text style={styles.fareLabel}>Penalty</Text>
                    <Text style={styles.penaltyValue}>₹{fmtNum(bookingDetails.penaltyAmount)}</Text>
                  </View>
                )}

                <View style={styles.fareDivider} />

                <View style={[styles.fareRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    ₹{fmtNum(bookingDetails.totalFare > 0 ? bookingDetails.totalFare : calculateTotalFare())}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Date Selection for Trucks */}
        {bookingDetails.returnDate === null &&
          bookingDetails.vehicleDetails.foundVehicle.subCategory === "truck" && (
            <View style={styles.dateCard}>
              <Text style={styles.dateTitle}>Vehicle Return Date</Text>
              <Text style={styles.dateSubtitle}>Please specify when the vehicle will be available</Text>
              <TouchableOpacity onPress={showDatepicker} style={styles.dateButton}>
                <Icon4 name="calendar" size={20} color={colors.deep_blue} />
                <Text style={styles.dateButtonText}>
                  {date ? date.toDateString() : "Select Date"}
                </Text>
              </TouchableOpacity>
              {date && (
                <Text style={styles.dateNote}>Once selected, date cannot be changed</Text>
              )}
            </View>
          )}

        {show && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChange}
            minimumDate={bookingDetails.pickupDate ? new Date(bookingDetails.pickupDate) : new Date()}
          />
        )}

        {/* Amount Input Fields - Auto-populated with calculated total */}
        {(bookingDetails.vendorApprovedStatus === "pending" || 
          bookingDetails.vendorApprovedStatus === "advance_pending") &&
          bookingDetails.tripStatus !== "cancelled" && 
          bookingDetails.vehicleDetails.foundVehicle.subCategory === "truck" && (
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Enter Total Amount</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={totalFare ? totalFare.toString() : fmtNum(calculateTotalFare())}
                  onChangeText={setTotalFare}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.light_gray}
                />
              </View>
              {/* Show breakdown of how total is calculated */}
              <View style={styles.amountBreakdown}>
                <Text style={styles.breakdownTitle}>Fare Breakdown:</Text>
                <Text style={styles.breakdownText}>
                  Base Fare: ₹{fmtNum(calculateBaseFare())}
                </Text>
                {bookingDetails.advanceAmount > 0 && (
                  <Text style={styles.breakdownText}>
                    Advance Paid: ₹{fmtNum(bookingDetails.advanceAmount)}
                  </Text>
                )}
                <View style={styles.breakdownDivider} />
                <Text style={styles.breakdownTotal}>
                  Total: ₹{fmtNum(calculateTotalFare())}
                </Text>
              </View>
            </View>
          )}

        {/* OTP Input for Auto/Car */}
        {bookingDetails.tripStatus === "start" &&
          (bookingDetails.vehicleDetails.foundVehicle.subCategory === "auto" ||
            bookingDetails.vehicleDetails.foundVehicle.subCategory === "car") && (
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Enter OTP to Start Ride</Text>
              <View style={styles.inputContainer}>
                <Icon4 name="lock" size={20} color={colors.deep_blue} />
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  style={styles.input}
                  placeholder="Enter OTP"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.light_gray}
                  maxLength={6}
                />
              </View>
            </View>
          )}

        {/* Action Buttons */}
        {(bookingDetails.vendorApprovedStatus === "pending" || 
          bookingDetails.vendorApprovedStatus === "advance_pending") &&
          bookingDetails.tripStatus !== "cancelled" && (
            <View style={styles.actionButtons}>
              {bookingDetails.vendorApprovedStatus === "advance_pending" && (
                <View style={[
                  styles.advanceInfoCard,
                  bookingDetails.advancePaidOnline && { backgroundColor: "#F0F4FF", borderColor: colors.deep_blue }
                ]}>
                  <Icon4 
                    name={bookingDetails.advancePaidOnline ? "check-circle" : "clock-outline"} 
                    size={20} 
                    color={bookingDetails.advancePaidOnline ? colors.deep_blue : colors.orange} 
                  />
                  <Text style={[
                    styles.advanceInfoText,
                    bookingDetails.advancePaidOnline && { color: colors.deep_blue }
                  ]}>
                    {bookingDetails.advancePaidOnline ? "Customer Advance Payment Received" : "Waiting for Customer Advance Payment"}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                onPress={showAlert}
                style={[styles.actionButton, styles.confirmButton]}
                disabled={loading}
              >
                {loading && vendorApprovedStatus !== "rejected" ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Icon4 name="check-circle" size={20} color={colors.white} />
                    <Text style={styles.actionButtonText}>Confirm Ride</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.redCancelButton]}
                onPress={RejectModelOpen}
                disabled={loading}
              >
                <Icon2 name="cancel" size={20} color={colors.white} />
                <Text style={styles.actionButtonText}>Cancel Ride</Text>
              </TouchableOpacity>
            </View>
          )}

        {(bookingDetails.vendorApprovedStatus === "approved" || bookingDetails.vendorApprovedStatus === "advance_pending") &&
          bookingDetails.tripStatus === "start" && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={startRide}
                style={[styles.actionButton, styles.startButton]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Icon6 name="play" size={22} color={colors.white} />
                    <Text style={styles.actionButtonText}>Start Ride</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.redCancelButton]}
                onPress={RejectModelOpen}
                disabled={loading}
              >
                <Icon2 name="cancel" size={20} color={colors.white} />
                <Text style={styles.actionButtonText}>Cancel Ride</Text>
              </TouchableOpacity>
            </View>
          )}

        {bookingDetails.vendorApprovedStatus === "approved" &&
          bookingDetails.tripStatus === "ongoing" && (
            <TouchableOpacity
              onPress={() => {
                setModalForComplete(true);
                setPaymentAmount(bookingDetails.remainingPayment || calculateTotalFare());
                fetchVendorUpiDetails(); // Fetch UPI details when completing ride
              }}
              style={[styles.fullWidthButton, styles.completeButton]}
            >
              <Icon4 name="check-circle" size={22} color={colors.white} />
              <Text style={styles.fullWidthButtonText}>Complete Ride</Text>
            </TouchableOpacity>
          )}

        {/* REPORT CUSTOMER BUTTON - Yellow Bootstrap Style */}
        <TouchableOpacity
          onPress={() => navigation.navigate("MainHome", { 
            screen: "Report an Issue", 
            params: { bookingId: bookingDetails._id } 
          })}
          style={[styles.bootstrapButton, styles.btnWarning]}
        >
          <Icon2 name="report-problem" size={22} color={colors.dark_gray} />
          <Text style={styles.btnWarningText}>Report Customer</Text>
        </TouchableOpacity>

        {/* SOS BUTTON - Danger Bootstrap Style */}
        <TouchableOpacity
          onPress={handleSOS}
          disabled={sosLoading}
          style={[styles.bootstrapButton, styles.btnDanger]}
        >
          {sosLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Icon3 name="tower-broadcast" size={22} color={colors.white} />
              <Text style={styles.btnDangerText}>SOS Emergency</Text>
            </>
          )}
        </TouchableOpacity>

        {!bookingDetails.advanceRefund &&
          bookingDetails.tripStatus === "cancelled" && (
            <TouchableOpacity
              onPress={refundAdvance}
              style={[styles.fullWidthButton, styles.refundButton]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Icon4 name="cash-refund" size={22} color={colors.white} />
                  <Text style={styles.fullWidthButtonText}>Refund Advance</Text>
                </>
              )}
            </TouchableOpacity>
          )}

        {/* Cancelled Booking Info */}
        {bookingDetails.tripStatus === "cancelled" && (
          <View style={styles.cancelledCard}>
            <Icon4 name="alert-circle" size={30} color={colors.red} />
            <Text style={styles.cancelledTitle}>Booking Cancelled</Text>
            <Text style={styles.cancelledText}>
              Cancelled By: {bookingDetails.customerCancelled ? "Customer" : "Vendor"}
            </Text>
            <Text style={styles.cancelledText}>
              Refund Status: {bookingDetails.advanceRefund ? "Refunded" : "Not Refunded"}
            </Text>
          </View>
        )}

        {/* Payment Success Message */}
        {(bookingDetails?.advancePaidOnline || bookingDetails?.customerPayedOnline) && (
          <View style={styles.successCard}>
            <Image
              style={styles.successIcon}
              source={require("../../assets/Images/check.png")}
            />
            <Text style={styles.successText}>Payment Successful!</Text>
          </View>
        )}
      </ScrollView>

      {/* Cancellation Reason Modal */}
      <Modal
        transparent={true}
        visible={modalshow}
        onRequestClose={RejectModelClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={RejectModelClose}
            >
              <Icon name="close" size={24} color={colors.dark_gray} />
            </TouchableOpacity>

            <Icon4 name="alert-circle" size={50} color={colors.red} />
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for cancellation</Text>

            <TextInput
              value={vendorRejectedReason}
              onChangeText={setVendorRejectedReason}
              placeholder="Enter reason here..."
              style={styles.modalInput}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={colors.light_gray}
            />

            <TouchableOpacity
              onPress={() => BookingApproval("rejected")}
              style={[styles.modalButton, { backgroundColor: colors.red }]}
              disabled={loading || !vendorRejectedReason}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.modalButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        transparent={true}
        visible={modalForComplete}
        onRequestClose={() => setModalForComplete(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalForComplete(false)}
            >
              <Icon name="close" size={24} color={colors.dark_gray} />
            </TouchableOpacity>

            <Image
              source={require("../../assets/Images/payment_Method.png")}
              style={styles.paymentImage}
            />
            <Text style={styles.modalTitle}>Complete Ride</Text>
            <Text style={styles.modalSubtitle}>Select payment method</Text>

            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === "online" && styles.paymentOptionActive
                ]}
                onPress={() => {
                  setPamentMethod("online");
                  setModalForComplete(false);
                  setShowUpiQrModal(true);
                }}
              >
                <Icon4
                  name="qrcode-scan"
                  size={24}
                  color={paymentMethod === "online" ? colors.white : colors.dark_gray}
                />
                <Text style={[
                  styles.paymentOptionText,
                  paymentMethod === "online" && styles.paymentOptionTextActive
                ]}>
                  UPI Payment
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === "cash" && styles.paymentOptionActive
                ]}
                onPress={() => setPamentMethod("cash")}
              >
                <Icon4
                  name="cash"
                  size={24}
                  color={paymentMethod === "cash" ? colors.white : colors.dark_gray}
                />
                <Text style={[
                  styles.paymentOptionText,
                  paymentMethod === "cash" && styles.paymentOptionTextActive
                ]}>
                  Cash Payment
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={completeRide}
              style={[
                styles.modalButton,
                !paymentMethod && styles.modalButtonDisabled
              ]}
              disabled={!paymentMethod || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.modalButtonText}>Complete Ride</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UPI QR Payment Modal */}
      {renderUpiQrModal()}

      {/* Edit Drop Location Modal */}
      <Modal
        transparent={true}
        visible={showDropEditModal}
        onRequestClose={() => setShowDropEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '90%' }]}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDropEditModal(false)}
            >
              <Icon name="close" size={24} color={colors.dark_gray} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Icon4 name="map-marker-path" size={40} color={colors.deep_blue} />
              <Text style={styles.modalTitle}>Edit Drop Location</Text>
            </View>

            <TextInput
              value={newDropLocation}
              onChangeText={handleDropLocationChange}
              placeholder="Enter new drop location"
              style={[styles.modalInput, { minHeight: 60 }]}
              placeholderTextColor={colors.light_gray}
            />
            
            {predictions.length > 0 && (
              <ScrollView style={{ maxHeight: 150, width: '100%', backgroundColor: colors.white, borderRadius: 8, marginTop: 5, elevation: 3 }}>
                {predictions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                    onPress={() => {
                      setNewDropLocation(item.description);
                      setPredictions([]);
                    }}
                  >
                    <Text style={{ color: colors.dark_gray, fontSize: 13 }}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowDropEditModal(false);
                  setPredictions([]);
                }}
                style={[styles.modalButton, { backgroundColor: colors.light_gray, flex: 1 }]}
                disabled={updatingDrop}
              >
                <Text style={[styles.modalButtonText, { color: colors.dark_gray }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdateDropLocation}
                style={[styles.modalButton, { flex: 1 }]}
                disabled={updatingDrop || !newDropLocation}
              >
                {updatingDrop ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 40,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    backgroundColor: colors.light_gray,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark_gray,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark_gray,
  },
  tripTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.deep_blue,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tripTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
  },
  advanceInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    gap: 10,
    width: '100%',
  },
  advanceInfoText: {
    fontSize: 14,
    color: '#9a3412',
    fontWeight: '600',
    flex: 1,
  },
  vehicleCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fareCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark_gray,
  },
  vehicleContent: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 15,
  },
  vehicleImageContainer: {
    backgroundColor: "#F0F4FF",
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImage: {
    width: wp(25),
    height: 90,
    resizeMode: 'contain',
  },
  vehicleInfo: {
    flex: 1,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark_gray,
    width: 70,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    flex: 1,
  },
  locationContent: {
    marginTop: 15,
    gap: 10,
  },
  locationItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F4FF",
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.deep_blue,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.dark_gray,
    lineHeight: 20,
  },
  locationDivider: {
    alignItems: 'center',
    paddingLeft: 18,
  },
  mapButton: {
    backgroundColor: colors.deep_blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  customerContent: {
    marginTop: 15,
  },
  customerInfoRow: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.light_gray,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.dark_gray,
  },
  callButton: {
    backgroundColor: colors.deep_blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  fareContent: {
    marginTop: 15,
  },
  totalFareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#F0F4FF",
    padding: 15,
    borderRadius: 10,
  },
  totalFareLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark_gray,
  },
  totalFareAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.deep_blue,
  },
  fareBreakdown: {
    marginTop: 15,
    padding: 10,
    backgroundColor: colors.light_gray + '40',
    borderRadius: 10,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark_gray,
  },
  fareValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  penaltyRow: {
    backgroundColor: colors.red + '10',
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  penaltyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.red,
  },
  fareDivider: {
    height: 1,
    backgroundColor: colors.gray,
    marginVertical: 8,
  },
  totalRow: {
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.deep_blue,
  },
  dateCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 5,
  },
  dateSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.dark_gray,
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: "#F0F4FF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.deep_blue,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark_gray,
  },
  dateNote: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.orange,
    marginTop: 10,
    fontStyle: 'italic',
  },
  inputCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark_gray,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.deep_blue,
    marginRight: 5,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    paddingHorizontal: 10,
  },
  amountBreakdown: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#F0F4FF",
    borderRadius: 10,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.deep_blue,
    marginBottom: 8,
  },
  breakdownText: {
    fontSize: 13,
    color: colors.dark_gray,
    marginBottom: 4,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.gray,
    marginVertical: 8,
  },
  breakdownTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.deep_blue,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  confirmButton: {
    backgroundColor: colors.deep_blue,
  },
  redCancelButton: {
    backgroundColor: colors.red,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  // Bootstrap Style Buttons
  bootstrapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  // Warning Button (Yellow)
  btnWarning: {
    backgroundColor: '#ffc107',
    borderColor: '#ffc107',
  },
  btnWarningText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
  },
  // Danger Button (Red)
  btnDanger: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  btnDangerText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  // Other buttons
  fullWidthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  startButton: {
    backgroundColor: colors.blue,
  },
  completeButton: {
    backgroundColor: colors.deep_blue,
  },
  refundButton: {
    backgroundColor: colors.orange,
  },
  fullWidthButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  cancelledCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.red,
  },
  cancelledTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.red,
    marginTop: 10,
    marginBottom: 5,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark_gray,
    marginBottom: 3,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.deep_blue + '20',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  successIcon: {
    width: 20,
    height: 20,
  },
  successText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.deep_blue,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginTop: 10,
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.dark_gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    minHeight: 100,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    fontWeight: '400',
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.gray,
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
    backgroundColor: colors.deep_blue,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  paymentImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  paymentOptions: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionActive: {
    backgroundColor: colors.deep_blue,
    borderColor: colors.deep_blue,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark_gray,
  },
  paymentOptionTextActive: {
    color: colors.white,
  },

  // UPI QR Modal Styles
  qrModalContent: {
    maxHeight: hp(80),
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  qrLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  qrLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.dark_gray,
  },
  amountDisplay: {
    backgroundColor: "#F0F4FF",
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.dark_gray,
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.deep_blue,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  upiListContainer: {
    marginBottom: 20,
    maxHeight: 80,
  },
  upiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 10,
    minWidth: wp(50),
  },
  upiCardSelected: {
    backgroundColor: colors.deep_blue,
    borderColor: colors.deep_blue,
  },
  upiInfo: {
    flex: 1,
  },
  upiId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  upiTextSelected: {
    color: colors.white,
  },
  defaultBadge: {
    backgroundColor: colors.blue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.white,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  qrImage: {
    width: wp(50),
    height: wp(50),
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  upiDetails: {
    width: '100%',
    marginBottom: 15,
    padding: 10,
    backgroundColor: colors.light_gray + '40',
    borderRadius: 10,
  },
  upiDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  upiDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark_gray,
    width: 50,
  },
  upiDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    flex: 1,
  },
  qrInstruction: {
    fontSize: 12,
    color: colors.dark_gray,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 15,
    backgroundColor: colors.light_gray + '30',
    borderRadius: 10,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: colors.dark_gray,
    flex: 1,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.deep_blue,
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark_gray,
  },
  noUpiContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noUpiText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark_gray,
    marginTop: 10,
  },
  noUpiSubtext: {
    fontSize: 14,
    color: colors.dark_gray,
    marginTop: 5,
    textAlign: 'center',
  },
  noQrContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noQrText: {
    fontSize: 14,
    color: colors.dark_gray,
    marginTop: 10,
  },
});

export default AutoBookingDetails_screen;