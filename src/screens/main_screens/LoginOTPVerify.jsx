import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useRef, useState, useContext, useEffect } from "react";
import { colors } from "../../utils/constants";
import Icon from "react-native-vector-icons/Ionicons";
import { OtpInput } from "react-native-otp-entry";

import AxiosService from "../../utils/AxioService";
import { AuthContext } from "../AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

const LoginOTPVerify = ({ navigation, route }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState("");
  const otpInputRef = useRef(null);
  
  // Safe check if route.params exists
  const phoneNumber = route?.params?.phoneNumber || "";
  const { login } = useContext(AuthContext);

  const handleResendOTP = async () => {
    try {
      const res = await AxiosService.post("vendor/sendLoginOtp", { phoneNumber });
      if (res.status === 200) {
        triggerNotification("A new OTP has been resent to your phone.");
        setCountdown(120);
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP. Please try again.");
    }
  };

  useEffect(() => {
    let interval = null;
    if (countdown > 0) {
      interval = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const triggerNotification = (text) => {
    setNotificationText(text);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };
    
  const handleOtpSubmit = async () => {
    if (!otp) {
      setError("Verification code is required");
      return;
    }
    if (otp.length !== 4) {
      setError("Verification code must be exactly 4 digits");
      return;
    }
    setError("");
    setLoading(true);
    const numericOtp = parseInt(otp);
    try {
      const res = await AxiosService.post("vendor/verifyOtp", {
        phoneNumber,
        otp:numericOtp,
      });

      await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
      await login(res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP code. Please try again.");
    }
    finally{
      setLoading(false);
    }
  };

  const handleOtp = (text) => {
    setOtp(text);
    if (otp.length > 0) {
      setError("");
    }
  };

  return (
    <LinearGradient
      colors={["#EFF6FF", "#DBEAFE"]}
      style={styles.main_container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Simulated Push Notification Banner */}
          {showNotification && (
            <View style={styles.push_notification_container}>
              <View style={styles.push_notification_header}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image source={require("../../../assets/Aatpartner.png")} style={styles.push_logo} />
                  <Text style={styles.push_title}>AAT Notification</Text>
                </View>
                <Text style={styles.push_time_text}>now</Text>
              </View>
              <Text style={styles.push_body_text}>{notificationText}</Text>
            </View>
          )}

          {/* nav container */}
          <TouchableOpacity
            style={styles.nav_container}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={28} color={colors.deep_blue} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll_content}
          >
            {/* Header Section (Logo) */}
            <View style={styles.header_section}>
              <View style={styles.logo_container}>
                <Image
                  source={require("../../../assets/Aatpartner.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Main Content */}
            <View style={styles.content_container}>
              <Text style={styles.heading_txt}>Verify Code</Text>
              
              <Text style={styles.subText}>
                Enter the 4 digit number from the sms we sent to <Text style={{fontWeight: '700', color: colors.deep_blue}}>+91 {phoneNumber}</Text>
              </Text>

              {/* OTP Input Fields */}
              <View style={styles.otp_wrapper}>
                <OtpInput
                  ref={otpInputRef}
                  numberOfDigits={4}
                  focusColor={colors.deep_blue}
                  onTextChange={handleOtp}
                  disabled={false}
                  theme={{
                    pinCodeContainerStyle: {
                      backgroundColor: "#F8FAFC",
                      width: 58,
                      height: 58,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: "#E2E8F0",
                    },
                    pinCodeTextStyle: {
                      fontSize: 22,
                      fontWeight: "700",
                      color: colors.deep_blue,
                    },
                    focusedPinCodeContainerStyle: {
                      borderColor: colors.deep_blue,
                      borderWidth: 2,
                    },
                    filledPinCodeContainerStyle: {
                      borderColor: colors.deep_blue,
                      borderWidth: 1.5,
                    },
                  }}
                />
                {error ? <Text style={styles.error_txt}>{error}</Text> : null}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                onPress={handleOtpSubmit}
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
                      <Text style={styles.btn_txt}>VERIFY</Text>
                      <Icon name="checkmark-circle-outline" size={20} color={colors.white} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Resend Code Section */}
              <View style={styles.resend_container}>
                <Text style={styles.main_txt}>Haven't received code? </Text>
                {countdown > 0 ? (
                  <Text style={styles.disabled_sub_txt}>Resend in {formatTime(countdown)}</Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOTP}>
                    <Text style={styles.main_sub_txt}>Resend now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LoginOTPVerify;

const styles = StyleSheet.create({
  main_container: {
    flex: 1,
  },
  scroll_content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 50,
    justifyContent: "center",
  },
  nav_container: {
    position: 'absolute',
    top: 10,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 50,
  },
  header_section: {
    alignItems: "center",
    marginBottom: 10,
    marginTop: 60,
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
    fontSize: 28,
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
    marginBottom: 35,
    paddingHorizontal: 10,
  },
  otp_wrapper: {
    width: "90%",
    alignItems: "center",
    marginBottom: 10,
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
  error_txt: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 15,
    textAlign: "center",
  },
  resend_container: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 35,
    justifyContent: "center",
  },
  main_txt: {
    fontSize: 15,
    fontWeight: "500",
    color: "#64748B",
  },
  main_sub_txt: {
    color: colors.deep_blue,
    fontWeight: "700",
    fontSize: 15,
  },
  disabled_sub_txt: {
    color: "#9CA3AF",
    fontWeight: "600",
    fontSize: 15,
  },
  push_notification_container: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  push_notification_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  push_logo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  push_title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  push_time_text: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  push_body_text: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
    lineHeight: 18,
  },
});
