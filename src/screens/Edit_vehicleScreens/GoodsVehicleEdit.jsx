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
} from "react-native";
import React, { useState, useEffect } from "react";
import { AntDesign as Icon } from "@expo/vector-icons";
import Icon2 from "react-native-vector-icons/MaterialIcons";
import { colors } from "../../utils/constants";
import AxiosService, { getCorrectImageUrl } from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Spinner from "react-native-loading-spinner-overlay";
import { BlurView } from "expo-blur";
import Dropdown from "../../components/CustomDropdown";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";

// ─────────────────────────────────────────────────────────────
// Static vehicle images
// ─────────────────────────────────────────────────────────────
const VEHICLE_IMAGES = {
  car: require("../../assets/Images/car5.png"),
  auto: require("../../assets/Images/auto.png"),
  van: require("../../assets/Images/van.png"),
  bus: require("../../assets/Images/bus.png"),
  truck: require("../../assets/Images/XL-truck.png"),
};

// ─────────────────────────────────────────────────────────────
// Route map — which backend edit route per subCategory
// All require: PUT vendor/edit{Type}/:vendorId/:vehicleId
// with multipart files
// ─────────────────────────────────────────────────────────────
const EDIT_ROUTE = {
  car: "editCar",
  auto: "editAuto",
  van: "editVan",
  bus: "editBus",
  truck: "editTruck",
};

// ─────────────────────────────────────────────────────────────
// Document uploader row (same style as reg forms)
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Shows existing server images + lets vendor upload replacements
// existingUrls: string[]  — URLs already saved on server
// state / setter          — newly picked local files
// ─────────────────────────────────────────────────────────────
const DocUploader = ({ label, subText, state, setter, limit, existingUrls = [], onRemoveExisting }) => {
  const pickDoc = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
        multiple: true,
      });
      if (result.type === "cancel") return;
      const picked = result.assets ? result.assets : [result];
      const valid = picked.filter(d => d.mimeType?.startsWith("image/") || d.mimeType === "application/pdf");
      if (valid.length === 0) { Alert.alert("Invalid File", "Select JPG, PNG or PDF"); return; }
      const totalAfter = existingUrls.length + state.length + valid.length;
      if (totalAfter > limit) {
        Alert.alert("Limit Exceeded", `Max ${limit} file(s) allowed. Remove existing ones first.`); return;
      }
      const withB64 = await Promise.all(valid.map(async (doc) => {
        try {
          const response = await fetch(doc.uri);
          const blob = await response.blob();
          const b64 = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
          });
          return { ...doc, base64: b64 };
        } catch { return { ...doc, base64: null }; }
      }));
      setter(prev => [...prev, ...withB64]);
    } catch (e) { console.log("DocPicker error:", e); }
  };

  return (
    <View style={styles.input_field_container}>
      <Text style={styles.label}>
        {label} <Text style={styles.subText}>{subText}</Text>
      </Text>

      {/* ── Existing images already on server ── */}
      {existingUrls.length > 0 ? (
        <View style={styles.existing_section}>
          <Text style={styles.existing_label}>Current files on server:</Text>
          <View style={styles.existing_grid}>
            {existingUrls.map((url, i) => (
              <View key={i} style={styles.existing_item}>
                <Image
                  source={{ uri: url }}
                  style={styles.existing_img}
                  resizeMode="cover"
                />
                <Pressable
                  style={styles.existing_remove}
                  onPress={() => onRemoveExisting && onRemoveExisting(i)}
                >
                  <Text style={styles.existing_remove_txt}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── Upload new files ── */}
      <Pressable style={styles.upload_container} onPress={pickDoc}>
        <Image source={require("../../assets/Images/file.png")} style={styles.img} />
        <Text style={styles.sub_txt}>
          {existingUrls.length > 0 ? "Tap to add / replace files" : "Tap to upload"}
        </Text>
        <Text style={styles.sub_txt_hint}>JPG · PNG · PDF supported</Text>
      </Pressable>

      {/* ── Newly picked files ── */}
      {state.map((doc, i) => (
        <View key={i} style={styles.doc_container}>
          <Text style={styles.sub_heading_txt}>New File {i + 1}</Text>
          {doc.mimeType?.startsWith("image/") ? (
            <View style={styles.doc_img_container}>
              <Image source={{ uri: doc.uri }} style={styles.doc_image} />
            </View>
          ) : (
            <Text style={styles.doc_name}>{doc.name || "No name available"}</Text>
          )}
          <Pressable
            style={styles.remove_button}
            onPress={() => setter(prev => prev.filter((_, idx) => idx !== i))}
          >
            <Text style={styles.remove_button_text}>Remove</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
const VehicleEdit = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const vehicle = route.params?.vehicle || {};
  const sub = vehicle.subCategory || "car";
  const isCar = sub === "car";
  const isVan = sub === "van";
  const isBus = sub === "bus";
  const isTruck = sub === "truck";

  // ── Text fields ───────────────────────────────────────────
  const [vehicleMake, setVehicleMake] = useState(String(vehicle.vehicleMake || ""));
  const [vehicleModel, setVehicleModel] = useState(vehicle.vehicleModel || "");
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate || "");
  const [vehicleColor, setVehicleColor] = useState(vehicle.vehicleColor || "");
  const [milage, setMilage] = useState(String(vehicle.milage || ""));
  const [pricePerDay, setPricePerDay] = useState(String(vehicle.pricePerDay || ""));
  const [pricePerKm, setPricePerKm] = useState(String(vehicle.pricePerKm || ""));
  const [fuelType, setFuelType] = useState(vehicle.fuelType || "");
  const [pricePerKmError, setPricePerKmError] = useState("");
  const [vehicleType, setVehicleType] = useState(vehicle.vehicleType || "");
  const [numberOfSeats, setNumberOfSeats] = useState(String(vehicle.numberOfSeats || vehicle.seatingCapacity || ""));
  const [ac, setAc] = useState(vehicle.ac || "");
  const [ton, setTon] = useState(String(vehicle.ton || ""));
  const [size, setSize] = useState(vehicle.size || "");
  const [goodsType, setGoodsType] = useState(vehicle.goodsType || "");

  // ── Document states (newly picked local files) ────────────
  const [ownerImage, setOwnerImage] = useState([]);
  const [ownerAdharCard, setOwnerAdharCard] = useState([]);
  const [ownerDrivingLicense, setOwnerDrivingLicense] = useState([]);
  const [vehicleImages, setVehicleImages] = useState([]);
  const [vehicleInsurance, setVehicleInsurance] = useState([]);
  const [vehicleRC, setVehicleRC] = useState([]);

  // ── Existing server image URLs (prefilled from vehicle data) ─
  const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(getCorrectImageUrl);
  const [exOwnerImage, setExOwnerImage] = useState(toArr(vehicle.ownerImage));
  const [exOwnerAdharCard, setExOwnerAdharCard] = useState(toArr(vehicle.ownerAdharCard));
  const [exOwnerDrivingLicense, setExOwnerDrivingLicense] = useState(toArr(vehicle.ownerDrivingLicense));
  const [exVehicleImages, setExVehicleImages] = useState(toArr(vehicle.vehicleImages));
  const [exVehicleInsurance, setExVehicleInsurance] = useState(toArr(vehicle.vehicleInsurance));
  const [exVehicleRC, setExVehicleRC] = useState(toArr(vehicle.vehicleRC));

  // helper: remove one existing URL by index
  const removeEx = (setter) => (i) => setter(prev => prev.filter((_, idx) => idx !== i));

  // ── Config + UI ───────────────────────────────────────────
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [loading, setLoading] = useState(false);

  const vehicleLabel = sub.charAt(0).toUpperCase() + sub.slice(1);
  const vehicleImg = VEHICLE_IMAGES[sub] || VEHICLE_IMAGES.car;

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await AxiosService.get(`payment/config?vehicleType=${sub}`);
        if (res.status === 200 && res.data.config) {
          const cfg = res.data.config;
          if (cfg.minPrice != null) setMinPrice(parseFloat(cfg.minPrice));
          if (cfg.maxPrice != null) setMaxPrice(parseFloat(cfg.maxPrice));
        }
      } catch { }
    };
    fetchConfig();
  }, []);

  const handlePricePerKmChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    setPricePerKm(cleaned);
    if (!cleaned) { setPricePerKmError(""); return; }
    const val = parseFloat(cleaned);
    if (isNaN(val)) { setPricePerKmError("Enter a valid number"); return; }
    if (minPrice !== null && val < minPrice) setPricePerKmError(`Minimum: ₹${minPrice}/km`);
    else if (maxPrice !== null && val > maxPrice) setPricePerKmError(`Maximum: ₹${maxPrice}/km`);
    else setPricePerKmError("");
  };

  // ── Validate ──────────────────────────────────────────────
  const validate = () => {
    if (!vehicleModel.trim()) { Toast.show({ type: "error", text1: "Vehicle model is required" }); return false; }
    if (!vehicleMake.trim()) { Toast.show({ type: "error", text1: "Vehicle make year required" }); return false; }
    if (!licensePlate.trim()) { Toast.show({ type: "error", text1: "License plate is required" }); return false; }
    if (!pricePerKm.trim()) { Toast.show({ type: "error", text1: "Price per km is required" }); return false; }
    if (!fuelType.trim()) { Toast.show({ type: "error", text1: "Fuel type is required" }); return false; }
    if (pricePerKmError) { Toast.show({ type: "error", text1: pricePerKmError }); return false; }

    // Files are optional for text-only update (updateVehicleFields)
    // They are only needed when vendor explicitly uploads new documents

    return true;
  };

  // ── Build JSON payload (text-only, no files) ─────────────
  // Used when vendor changes only text fields without uploading new documents
  const buildTextPayload = (vendorId) => {
    const base = {
      vendorId,
      vehicleModel: vehicleModel.trim(),
      vehicleMake: vehicleMake.trim(),
      licensePlate: licensePlate.trim().toUpperCase(),
      vehicleColor: vehicleColor.trim(),
      fuelType: fuelType.trim(),
      milage: parseFloat(milage) || 0,
      pricePerKm: parseFloat(pricePerKm) || 0,
      pricePerDay: parseFloat(pricePerDay) || 0,
    };
    if (isCar) return { ...base, vehicleType, numberOfSeats: parseInt(numberOfSeats) || 0 };
    if (isVan) return { ...base, numberOfSeats: parseInt(numberOfSeats) || 0 };
    if (isBus) return { ...base, numberOfSeats: parseInt(numberOfSeats) || 0, ac: ac.trim() };
    if (isTruck) return { ...base, ton: parseFloat(ton) || 0, size: size.trim(), goodsType: goodsType.trim() };
    return base;
  };

  // ── Build FormData (multipart, with files) ─────────────────
  // Used when vendor uploads new document files
  // Requires ALL file minimums to be met (backend enforces counts)
  const buildFormData = () => {
    const fd = new FormData();

    // Text fields
    fd.append("vehicleModel", vehicleModel.trim());
    fd.append("vehicleMake", vehicleMake.trim());
    fd.append("licensePlate", licensePlate.trim().toUpperCase());
    fd.append("vehicleColor", vehicleColor.trim());
    fd.append("fuelType", fuelType.trim());
    fd.append("milage", milage);
    fd.append("pricePerKm", pricePerKm);
    fd.append("pricePerDay", pricePerDay);

    if (isCar) {
      fd.append("vehicleType", vehicleType);
      fd.append("numberOfSeats", numberOfSeats);
    }
    if (isVan) {
      fd.append("numberOfSeats", numberOfSeats);
    }
    if (isBus) {
      fd.append("numberOfSeats", numberOfSeats);
      fd.append("ac", ac.trim());
    }
    if (isTruck) {
      fd.append("ton", ton);
      fd.append("size", size.trim());
      fd.append("goodsType", goodsType.trim());
    }

    // Files — newly picked local files (actual file objects)
    const appendFile = (field, doc) => {
      fd.append(field, {
        uri: doc.uri,
        type: doc.mimeType || "image/jpeg",
        name: doc.name || `${field}.jpg`,
      });
    };
    // Existing server URLs that were NOT removed — send as strings
    // so backend knows to keep them
    const appendExisting = (field, urls) => {
      urls.forEach(url => fd.append(field, url));
    };

    // Owner image
    if (ownerImage.length > 0) ownerImage.forEach(d => appendFile("ownerImage", d));
    else appendExisting("ownerImage", exOwnerImage);

    // Aadhar
    if (ownerAdharCard.length > 0) ownerAdharCard.forEach(d => appendFile("ownerAdharCard", d));
    else appendExisting("ownerAdharCard", exOwnerAdharCard);

    // Driving license
    if (ownerDrivingLicense.length > 0) ownerDrivingLicense.forEach(d => appendFile("ownerDrivingLicense", d));
    else appendExisting("ownerDrivingLicense", exOwnerDrivingLicense);

    // Vehicle images
    if (vehicleImages.length > 0) vehicleImages.forEach(d => appendFile("vehicleImages", d));
    else appendExisting("vehicleImages", exVehicleImages);

    // Insurance
    if (vehicleInsurance.length > 0) vehicleInsurance.forEach(d => appendFile("vehicleInsurance", d));
    else appendExisting("vehicleInsurance", exVehicleInsurance);

    // RC
    if (vehicleRC.length > 0) vehicleRC.forEach(d => appendFile("vehicleRC", d));
    else appendExisting("vehicleRC", exVehicleRC);

    return fd;
  };

  // ── Submit ─────────────────────────────────────────────────
  // ── Check if vendor uploaded any new files ──────────────────
  const hasNewFiles = () =>
    ownerImage.length > 0 || ownerAdharCard.length > 0 ||
    ownerDrivingLicense.length > 0 || vehicleImages.length > 0 ||
    vehicleInsurance.length > 0 || vehicleRC.length > 0;

  // ── Validate new files meet minimums (only when files uploaded) ──
  const validateFiles = () => {
    const totalOwnerImg = exOwnerImage.length + ownerImage.length;
    const totalAadhar = exOwnerAdharCard.length + ownerAdharCard.length;
    const totalLicense = exOwnerDrivingLicense.length + ownerDrivingLicense.length;
    const totalVehImgs = exVehicleImages.length + vehicleImages.length;
    const totalInsurance = exVehicleInsurance.length + vehicleInsurance.length;
    const totalRC = exVehicleRC.length + vehicleRC.length;

    if (totalOwnerImg < 1) { Toast.show({ type: "error", text1: "Owner image required (min 1)" }); return false; }
    if (totalAadhar < 2) { Toast.show({ type: "error", text1: "Aadhar card required (front & back)" }); return false; }
    if (totalLicense < 2) { Toast.show({ type: "error", text1: "Driving license required (front & back)" }); return false; }
    if (totalVehImgs < 5) { Toast.show({ type: "error", text1: "Min 5 vehicle images required" }); return false; }
    if (totalInsurance < 2) { Toast.show({ type: "error", text1: "Insurance docs required (min 2)" }); return false; }
    if (totalRC < 2) { Toast.show({ type: "error", text1: "RC book required (front & back)" }); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // If vendor uploaded new files → use multipart editCar/editAuto etc.
    // If no new files → use JSON-only updateVehicleFields (text fields only)
    if (hasNewFiles() && !validateFiles()) return;

    try {
      setLoading(true);
      const vendor = await AsyncStorage.getItem("user");
      const vendorData = JSON.parse(vendor);
      const vendorId = vendorData._id;

      let res;

      if (hasNewFiles()) {
        // ── PATH A: files uploaded → multipart to editCar/editAuto/etc. ──
        // Backend requires ALL files (min counts must be met)
        const editRoute = EDIT_ROUTE[sub] || "editCar";
        const fd = buildFormData();
        res = await AxiosService.put(
          `vendor/${editRoute}/${vendorId}/${vehicle._id}`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        // ── PATH B: no new files → JSON-only text update ──
        // Uses updateVehicleFields endpoint (add to vendorController.js)
        const payload = buildTextPayload(vendorId);
        res = await AxiosService.put(
          `vendor/updateVehicleFields/${vendorId}/${vehicle._id}`,
          payload
        );
      }

      if (res.status === 200 || res.status === 201) {
        Toast.show({ type: "success", text1: `${vehicleLabel} updated!` });
        setTimeout(() => navigation.goBack(), 1400);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Something went wrong";
      console.log("[VehicleEdit] error:", error.response?.status, msg);
      Toast.show({ type: "error", text1: "Update failed", text2: msg, visibilityTime: 5000 });
    } finally { setLoading(false); }
  };

  const fuelTypeData = [
    { label: "Petrol", value: "Petrol" },
    { label: "Diesel", value: "Diesel" },
    { label: "CNG", value: "CNG" },
    { label: "LPG", value: "LPG" },
    { label: "Hybrid", value: "Hybrid" },
    { label: "Electric batteries", value: "Electric batteries" },
  ];
  const carTypeData = [
    { label: "SUV", value: "car" },
    { label: "Hatchback", value: "car" },
    { label: "Sedan", value: "car" },
  ];

  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.main_container} edges={["top", "bottom"]}>
      <Pressable style={styles.nav_container} onPress={() => navigation.goBack()}>
        <Icon name="left" size={30} />
      </Pressable>

      <View style={styles.content_container}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Heading */}
          <View style={styles.form_heading_container}>
            <Image source={vehicleImg} style={styles.heading_img} />
            <Text style={styles.form_heading_txt}>Edit {vehicleLabel}</Text>
          </View>
          <Text style={styles.heading_txt}>
            Update details · Upload all documents
          </Text>

          {/* Status banner */}
          <View style={[styles.status_banner,
          vehicle.vehicleApprovedByAdmin === "approved" ? styles.banner_approved : styles.banner_pending]}>
            <Icon2
              name={vehicle.vehicleApprovedByAdmin === "approved" ? "check-circle" : "hourglass-empty"}
              size={16}
              color={vehicle.vehicleApprovedByAdmin === "approved" ? "#16a34a" : "#ff9800"}
            />
            <Text style={[styles.status_banner_txt,
            { color: vehicle.vehicleApprovedByAdmin === "approved" ? "#16a34a" : "#ff9800" }]}>
              {vehicle.vehicleApprovedByAdmin === "approved" ? "✓ Approved" : "⏳ Pending"}
              {"  ·  ID: #"}{String(vehicle._id || "").slice(-8).toUpperCase()}
            </Text>
          </View>

          {/* ── DOCUMENTS ── */}
          <DocUploader label="Owner Image" subText="( min 1 )" state={ownerImage} setter={setOwnerImage} limit={1} existingUrls={exOwnerImage} onRemoveExisting={removeEx(setExOwnerImage)} />
          <DocUploader label="Aadhar Card" subText="( front & back )" state={ownerAdharCard} setter={setOwnerAdharCard} limit={2} existingUrls={exOwnerAdharCard} onRemoveExisting={removeEx(setExOwnerAdharCard)} />
          <DocUploader label="Driving License" subText="( front & back )" state={ownerDrivingLicense} setter={setOwnerDrivingLicense} limit={2} existingUrls={exOwnerDrivingLicense} onRemoveExisting={removeEx(setExOwnerDrivingLicense)} />
          <DocUploader label="Vehicle Images" subText="( min 5 images )" state={vehicleImages} setter={setVehicleImages} limit={5} existingUrls={exVehicleImages} onRemoveExisting={removeEx(setExVehicleImages)} />
          <DocUploader label="Insurance" subText="( min 2 )" state={vehicleInsurance} setter={setVehicleInsurance} limit={2} existingUrls={exVehicleInsurance} onRemoveExisting={removeEx(setExVehicleInsurance)} />
          <DocUploader label="RC Book" subText="( front & back )" state={vehicleRC} setter={setVehicleRC} limit={2} existingUrls={exVehicleRC} onRemoveExisting={removeEx(setExVehicleRC)} />

          {/* ── VEHICLE MAKE YEAR ── */}
          <View style={styles.input_field_container}>
            <Text style={styles.label}>Vehicle Make Year</Text>
            <TextInput
              value={vehicleMake}
              onChangeText={(text) => {
                const year = text.replace(/[^0-9]/g, "");
                const currentYear = new Date().getFullYear();
                if (year.length <= 4) {
                  if (parseInt(year) > currentYear) {
                    Toast.show({ type: "error", text1: `Year cannot exceed ${currentYear}` });
                    setVehicleMake(currentYear.toString());
                  } else setVehicleMake(year);
                }
              }}
              style={styles.input_field} keyboardType="numeric" placeholder="Ex: 2020" maxLength={4}
            />
          </View>

          {/* ── CAR TYPE ── */}
          {isCar ? (
            <View style={styles.input_field_container}>
              <Text style={styles.label}>Vehicle Type</Text>
              <Dropdown data={carTypeData} placeholder={vehicleType || "Select vehicle type"} onSelect={(item) => setVehicleType(item.value)} />
            </View>
          ) : null}

          {/* ── MODEL ── */}
          <View style={styles.input_field_container}>
            <Text style={styles.label}>Vehicle Model *</Text>
            <TextInput value={vehicleModel} onChangeText={setVehicleModel} style={styles.input_field} placeholder="Ex: Toyota" />
          </View>

          {/* ── LICENSE PLATE ── */}
          <View style={styles.input_field_container}>
            <Text style={styles.label}>Vehicle Number *</Text>
            <TextInput value={licensePlate} onChangeText={(t) => setLicensePlate(t.toLocaleUpperCase())} placeholder="TN 01 GH 0000" style={styles.input_field} />
          </View>

          {/* ── COLOR ── */}
          <View style={styles.input_field_container}>
            <Text style={styles.label}>Vehicle Color</Text>
            <TextInput value={vehicleColor} onChangeText={setVehicleColor} style={styles.input_field} />
          </View>

          {/* ── SEATS ── */}
          {(isCar || isVan || isBus) ? (
            <View style={styles.input_field_container}>
              <Text style={styles.label}>No of Seats</Text>
              <TextInput value={numberOfSeats} onChangeText={setNumberOfSeats} keyboardType="number-pad" style={styles.input_field} />
            </View>
          ) : null}

          {/* ── AC ── */}
          {isBus ? (
            <View style={styles.input_field_container}>
              <Text style={styles.label}>AC</Text>
              <TextInput value={ac} onChangeText={setAc} style={styles.input_field} placeholder="Yes or No" />
            </View>
          ) : null}

          {/* ── TRUCK FIELDS ── */}
          {isTruck ? (
            <>
              <View style={styles.input_field_container}>
                <Text style={styles.label}>Tonnage Capacity (Kg)</Text>
                <TextInput
                  keyboardType="numeric" value={ton}
                  onChangeText={(text) => {
                    let v = text.replace(/[^0-9]/g, "");
                    if (goodsType === "Small" && Number(v) > 1000) v = "1000";
                    if (goodsType === "Medium" && Number(v) > 10000) v = "10000";
                    if (goodsType === "Large" && Number(v) > 20000) v = "20000";
                    setTon(v);
                  }}
                  style={styles.input_field} placeholder="Ex: 1000"
                />
              </View>
              <View style={styles.input_field_container}>
                <Text style={styles.label}>Vehicle Size</Text>
                <TextInput value={size} onChangeText={setSize} style={styles.input_field} placeholder="Ex: 7ft × 4ft × 5ft" />
              </View>
              <View style={styles.input_field_container}>
                <Text style={styles.label}>Goods Type</Text>
                <TextInput value={goodsType} style={styles.input_field} editable={false} />
              </View>
            </>
          ) : null}

          {/* ── PRICE PER KM ── */}
          <View style={styles.input_field_container}>
            <Text style={styles.label}>
              Price per Km *{"  "}
              {minPrice !== null && maxPrice !== null ? (
                <Text style={styles.price_range_hint}>(₹{minPrice} – ₹{maxPrice}/km)</Text>
              ) : null}
            </Text>
            <TextInput
              keyboardType="numeric" value={pricePerKm} onChangeText={handlePricePerKmChange}
              style={[styles.input_field, pricePerKmError ? styles.input_error : (pricePerKm ? styles.input_valid : null)]}
              placeholder={minPrice !== null && maxPrice !== null ? `e.g. ${minPrice} – ${maxPrice}` : "Enter price per km"}
            />
            {pricePerKmError ? (
              <Text style={styles.error_text}>{pricePerKmError}</Text>
            ) : (pricePerKm && minPrice !== null ? (
              <Text style={styles.valid_text}>✓ Within allowed range</Text>
            ) : null)}
          </View>

          {/* ── PRICE PER DAY ── */}
          <View style={styles.input_field_container}>
            <Text style={styles.label}>Price per Day</Text>
            <TextInput keyboardType="numeric" value={pricePerDay} onChangeText={setPricePerDay} style={styles.input_field} />
          </View>

          {/* ── MILEAGE ── */}
          <View style={styles.input_field_container}>
            <Text style={styles.label}>Mileage</Text>
            <TextInput keyboardType="number-pad" value={milage} onChangeText={setMilage} style={styles.input_field} />
          </View>

          {/* ── FUEL TYPE ── */}
          <View style={styles.input_field_container}>
            <Text style={styles.label}>Fuel Type *</Text>
            <Dropdown data={fuelTypeData} placeholder={fuelType || "Select fuel type"} onSelect={(item) => setFuelType(item.value)} />
          </View>

          {/* ── SUBMIT ── */}
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.btn_container, (loading || !!pricePerKmError) && styles.btn_disabled]}
            activeOpacity={0.85}
            disabled={loading || !!pricePerKmError}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.btn_txt}>Save Changes</Text>
                <Text style={styles.btn_sub_txt}>{hasNewFiles() ? "Files will be re-uploaded" : "Text fields only · no file re-upload"}</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>

        <Toast />
        {loading ? (
          <BlurView style={styles.absolute} intensity={150}>
            <Spinner color={colors.deep_blue} visible={loading} textStyle={styles.spinnerTextStyle} />
          </BlurView>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default VehicleEdit;

const styles = StyleSheet.create({
  main_container: { backgroundColor: colors.light_gray, flex: 1 },
  nav_container: { padding: 15, paddingTop: 10 },
  content_container: { backgroundColor: colors.white, flex: 1, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 15, paddingTop: 10 },
  form_heading_container: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 },
  heading_img: { width: 50, height: 50, resizeMode: "contain" },
  form_heading_txt: { fontSize: 17, fontWeight: "700" },
  heading_txt: { textAlign: "center", fontWeight: "500", fontSize: 13, marginBottom: 16, color: "#888", marginTop: 4 },
  status_banner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18, borderWidth: 1 },
  banner_approved: { backgroundColor: "#F0F4FF", borderColor: "#bbf7d0" },
  banner_pending: { backgroundColor: "#fff8e1", borderColor: "#ffe082" },
  status_banner_txt: { fontSize: 13, fontWeight: "600" },
  // Upload
  upload_container: { alignItems: "center", borderColor: colors.deep_blue, borderWidth: 1.5, borderStyle: "dashed", paddingVertical: 14, borderRadius: 12, backgroundColor: "#fafffe", gap: 4 },
  img: { width: 36, height: 36, resizeMode: "contain", opacity: 0.6 },
  sub_txt: { fontSize: 13, fontWeight: "600", color: colors.dark_gray },
  sub_txt_hint: { fontSize: 11, color: "#aaa" },
  doc_container: { paddingTop: 10, alignItems: "center" },
  doc_name: { fontSize: 13, textAlign: "center", fontWeight: "500", color: colors.deep_blue, backgroundColor: "#f0faf4", padding: 6, width: "100%", borderRadius: 8, borderColor: "#DBEAFE", borderWidth: 1 },
  doc_image: { width: 100, height: 100, resizeMode: "contain", borderRadius: 8 },
  doc_img_container: { width: "100%", borderRadius: 8, borderColor: colors.deep_blue, borderWidth: 1, backgroundColor: colors.white, alignItems: "center", overflow: "hidden" },
  sub_heading_txt: { marginBottom: 4, fontSize: 12, fontWeight: "500", color: "#777" },
  remove_button: { backgroundColor: "#ff4d4f", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
  remove_button_text: { color: "white", textAlign: "center", fontSize: 11, fontWeight: "600" },
  subText: { fontSize: 12, color: "gray" },
  // Input
  input_field_container: { backgroundColor: "#FAFAFA", padding: 10, borderRadius: 10, marginBottom: 20, borderColor: colors.light_gray, borderWidth: 1 },
  input_field: { borderColor: colors.gray, borderWidth: 1, flex: 1, height: 40, borderRadius: 8, padding: 10, backgroundColor: colors.white },
  input_error: { borderColor: "#ff4d4f", borderWidth: 1.5 },
  input_valid: { borderColor: "#52c41a", borderWidth: 1.5 },
  error_text: { color: "#ff4d4f", fontSize: 12, marginTop: 5, fontWeight: "500" },
  valid_text: { color: "#52c41a", fontSize: 12, marginTop: 5, fontWeight: "500" },
  price_range_hint: { fontSize: 11, color: "#888", fontWeight: "400" },
  label: { fontSize: 15, fontWeight: "500", marginBottom: 10 },
  // Button
  btn_container: { backgroundColor: colors.deep_blue, width: "100%", paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, marginBottom: 30, marginTop: 4, alignItems: "center", shadowColor: colors.deep_blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  btn_disabled: { backgroundColor: "#DBEAFE", shadowOpacity: 0, elevation: 0 },
  btn_txt: { textAlign: "center", color: colors.white, fontWeight: "700", fontSize: 16 },
  btn_sub_txt: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2, fontWeight: "500" },
  absolute: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  spinnerTextStyle: { color: colors.deep_blue },
  // Existing server images grid
  existing_section: { marginBottom: 10 },
  existing_label: { fontSize: 12, color: "#888", fontWeight: "500", marginBottom: 6 },
  existing_grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  existing_item: { position: "relative", width: 80, height: 80 },
  existing_img: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: colors.deep_blue },
  existing_remove: { position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: "#ff4d4f", alignItems: "center", justifyContent: "center", elevation: 3 },
  existing_remove_txt: { color: "#fff", fontSize: 10, fontWeight: "700" },
});