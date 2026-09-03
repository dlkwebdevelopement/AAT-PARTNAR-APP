import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from "react-native";
import React, { useState } from "react";
import { colors } from "../utils/constants";
import Icon from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import AxiosService from "../utils/AxioService";
import { LinearGradient } from "expo-linear-gradient";

const SignUpScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userName: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({
    userName: "",
    phoneNumber: "",
  });

  // Referral code state
  const [referralCode, setReferralCode] = useState("");
  const [showReferralModal, setShowReferralModal] = useState(false);

  const handleInputChange = (name, value) => {
    setForm({
      ...form,
      [name]: value,
    });
    // Clear error for the current field as the user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async () => {
    let isValid = true;
    const newErrors = {
      userName: "",
      phoneNumber: "",
    };

    // 1. Username Validation
    const userNameTrimmed = form.userName.trim();
    if (!userNameTrimmed) {
      newErrors.userName = "Username is required";
      isValid = false;
    } else if (userNameTrimmed.length < 3) {
      newErrors.userName = "Username must be at least 3 characters long";
      isValid = false;
    }

    // 2. Phone Number Validation
    const phoneTrimmed = form.phoneNumber.trim();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneTrimmed) {
      newErrors.phoneNumber = "Phone number is required";
      isValid = false;
    } else if (phoneTrimmed.length !== 10) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits";
      isValid = false;
    } else if (!phoneRegex.test(phoneTrimmed)) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      const errorMsg = newErrors.userName || newErrors.phoneNumber;
      Toast.show({
        type: "error",
        text1: errorMsg,
      });
      return;
    }

    // Build payload
    const payload = {
      userName: form.userName,
      phoneNumber: form.phoneNumber,
    };
    if (referralCode.trim()) {
      payload.referredByCode = referralCode.trim().toUpperCase();
    }

    setLoading(true);
    try {
      const res = await AxiosService.post("vendor/signup", payload);
      console.log("API response:", res);

      if (res.status === 201) {
        Toast.show({
          type: "success",
          text1: "Vendor Signup Successfully ",
        });

        setForm({ userName: "", phoneNumber: "" });
        setReferralCode("");

        setTimeout(() => {
          navigation.replace("Login");
        }, 2000);
      }
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        switch (status) {
          case 400:
          case 409:
            Toast.show({
              type: "error",
              text1: data.message,
            });
            break;
          case 500:
            Toast.show({
              type: "error",
              text1: "Internal Server Error. Please try again later.",
            });
            break;
          default:
            Toast.show({
              type: "error",
              text1: "An unknown error occurred.",
            });
        }
      } else if (error.message) {
        Toast.show({
          type: "error",
          text1: error.message,
        });
        console.log("error", error);
      } else {
        console.log("An unexpected error occurred. Please try again");
        Toast.show({
          type: "error",
          text1: "An unexpected error occurred.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={["#EFF6FF", "#DBEAFE"]}
        style={styles.main_container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll_content}
        >
          {/* Header Section (Logo) */}
          <View style={styles.header_section}>
            <View style={styles.logo_container}>
              <Image
                source={require("../../assets/Aatpartner.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.content_container}>
            <Text style={styles.heading_txt}>
              Create Account
            </Text>

            <Text style={styles.subText}>
              Sign up to get started and manage your vehicles instantly.
            </Text>

            {/* Username Input */}
            <View style={styles.input_wrapper}>
              <Text style={styles.input_label}>Username</Text>
              <View style={[
                styles.unified_input_container,
                errors.userName ? styles.input_error_border : null
              ]}>
                <Icon name="person-outline" size={20} color="#9CA3AF" style={{ marginLeft: 15 }} />
                <TextInput
                  value={form.userName}
                  keyboardType="default"
                  onChangeText={(value) => handleInputChange("userName", value)}
                  placeholder="Enter username"
                  placeholderTextColor="#9CA3AF"
                  style={styles.text_input_field}
                />
              </View>
              {errors.userName ? <Text style={styles.error_txt}>{errors.userName}</Text> : null}
            </View>

            {/* Phone Number Input */}
            <View style={styles.input_wrapper}>
              <Text style={styles.input_label}>Mobile Number</Text>
              <View style={[
                styles.unified_input_container,
                errors.phoneNumber ? styles.input_error_border : null
              ]}>
                <View style={styles.country_code_section}>
                  <Image
                    style={styles.flag}
                    source={require("../assets/Images/india_flag.jpg")}
                  />
                  <Text style={styles.country_code}>+91</Text>
                  <Icon name="chevron-down" size={16} color="#9CA3AF" />
                  <View style={styles.vertical_divider} />
                </View>
                <TextInput
                  keyboardType="numeric"
                  value={form.phoneNumber}
                  onChangeText={(value) => {
                    const formattedValue = value.replace(/[^0-9]/g, "").slice(0, 10);
                    handleInputChange("phoneNumber", formattedValue);
                  }}
                  placeholder="98765 43210"
                  placeholderTextColor="#9CA3AF"
                  style={styles.phone_input_field}
                />
                <Icon name="call-outline" size={20} color="#9CA3AF" style={{ marginRight: 15 }} />
              </View>
              {errors.phoneNumber ? <Text style={styles.error_txt}>{errors.phoneNumber}</Text> : null}
            </View>

            {/* Referral Code Toggle */}
            <TouchableOpacity
              onPress={() => setShowReferralModal(true)}
              style={styles.referralToggleContainer}
            >
              <Text style={styles.referralToggle}>
                Have a referral code? <Text style={styles.referralToggleLink}>Enter here</Text>
              </Text>
            </TouchableOpacity>

            {referralCode ? (
              <View style={styles.appliedCodeContainer}>
                <Text style={styles.appliedCodeText}>Code applied: {referralCode}</Text>
                <TouchableOpacity onPress={() => setReferralCode("")}>
                  <Text style={styles.removeCode}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Action Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.8}
              style={{ width: "80%", marginTop: 25, alignSelf: "center" }}
            >
              <LinearGradient
                colors={["#3B82F6", colors.deep_blue]}
                style={styles.btn_container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Text style={styles.btn_txt}>SIGN UP</Text>
                    <Icon name="arrow-forward" size={20} color={colors.white} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.main_txt}>
              Already have an account?{" "}
              <Text
                style={styles.sub_txt}
                onPress={() => navigation.navigate("Login")}
              >
                Login
              </Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Referral Code Modal */}
      <Modal
        visible={showReferralModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Referral Code</Text>
            <Text style={styles.modalSubText}>Get a discount on your registration fee!</Text>
            <View style={styles.modalInputWrapper}>
              <Icon name="pricetag-outline" size={20} color="#9CA3AF" style={{ marginLeft: 15 }} />
              <TextInput
                style={styles.text_input_field}
                placeholder="e.g. AAT-AB1234"
                placeholderTextColor="#9CA3AF"
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowReferralModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  const trimmed = referralCode.trim().toUpperCase();
                  setReferralCode(trimmed);
                  setShowReferralModal(false);
                  if (trimmed) Toast.show({ type: "success", text1: "Referral code applied!" });
                }}
              >
                <LinearGradient colors={["#3B82F6", colors.deep_blue]} style={styles.modalApplyButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.modalApplyText}>APPLY</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  main_container: {
    flex: 1,
  },
  scroll_content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 50,
    justifyContent: "center",
  },
  header_section: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo_container: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.deep_blue,
    marginBottom: 5,
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  content_container: {
    alignItems: "center",
    width: "100%",
    padding: 25,
    paddingVertical: 15,
  },
  heading_txt: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    color: colors.deep_blue,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  input_wrapper: {
    width: "100%",
    marginBottom: 20,
  },
  input_label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    marginLeft: 4,
  },
  unified_input_container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 58,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },
  text_input_field: {
    flex: 1,
    height: "100%",
    fontSize: 17,
    fontWeight: "600",
    color: colors.deep_blue,
    paddingHorizontal: 15,
    letterSpacing: 0.5,
  },
  country_code_section: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 15,
    gap: 6,
  },
  country_code: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.deep_blue,
  },
  flag: {
    width: 24,
    height: 16,
    borderRadius: 3,
  },
  vertical_divider: {
    width: 1.5,
    height: 24,
    backgroundColor: "#E2E8F0",
    marginLeft: 10,
  },
  phone_input_field: {
    flex: 1,
    height: "100%",
    fontSize: 17,
    fontWeight: "600",
    color: colors.deep_blue,
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  btn_container: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 50,
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  btn_txt: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 1.5,
  },
  main_txt: {
    color: "#64748B",
    marginTop: 35,
    fontSize: 15,
    fontWeight: "500",
  },
  sub_txt: {
    color: colors.deep_blue,
    fontWeight: "700",
  },
  input_error_border: {
    borderColor: colors.red,
    backgroundColor: "#FEF2F2",
  },
  error_txt: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    marginLeft: 4,
  },

  // Referral styles
  referralToggleContainer: { alignSelf: "center", marginTop: -5, marginBottom: 5 },
  referralToggle: { color: colors.dark_gray, fontSize: 14 },
  referralToggleLink: { color: colors.deep_blue, fontWeight: "600" },
  appliedCodeContainer: { flexDirection: "row", alignItems: "center", alignSelf: "center", marginBottom: 5 },
  appliedCodeText: { color: colors.deep_blue, fontSize: 14, fontWeight: "500" },
  removeCode: { color: colors.red, marginLeft: 10, fontSize: 14, fontWeight: "600" },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11, 26, 61, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "88%",
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 25,
    alignItems: "center",
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    color: colors.deep_blue,
    letterSpacing: -0.5,
  },
  modalSubText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 25,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 55,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  modalApplyButton: {
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  modalApplyText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1,
  },
});