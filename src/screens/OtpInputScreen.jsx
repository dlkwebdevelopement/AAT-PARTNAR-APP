import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useRef, useState, useEffect } from "react";
import safe_area_style from "../utils/safe_area_style";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { colors } from "../utils/constants";
import Icon1 from "react-native-vector-icons/AntDesign";
import { OtpInput } from "react-native-otp-entry";
import Toast from "react-native-toast-message";
import AxiosService from "../utils/AxioService";

const OtpInputScreen = ({ navigation, route }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpInputRef = useRef(null);
  const { email } = route.params || {};
  
  // Timer and Push Notification States
  const [countdown, setCountdown] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState("");

  console.log("OtpInputScreen loaded with route params:", route.params);

  useEffect(() => {
    // Show initial simulated push notification popup on screen load
    triggerNotification(`Verification code sent to ${email || "your email"}. Please check your inbox.`);
  }, []);

  useEffect(() => {
    let interval = null;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const triggerNotification = (text) => {
    setNotificationText(text);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleOtpChange = (text) => {
    setOtp(text);
    if (text.trim().length > 0) setError("");
  };

  const handleOtpSubmit = async () => {
    if (otp.trim().length !== 4) {
      setError("Please enter a valid 4-digit code");
      return;
    }

    try {
      setLoading(true);
      const res = await AxiosService.post("vendor/validatePin", {
        email,
        resetPin: otp,
      });

      if (res.status === 201) {
        setOtp("");
        Toast.show({
          type: "success",
          text1: res.data.message,
          text2: "You can now reset your password",
        });

        setTimeout(() => {
          navigation.navigate("NewPassword", { resetPin: otp, email });
        }, 1500);
      }
    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;
        const message =
          data?.message || (status === 500 ? "Internal Server Error" : "Unknown error");
        Toast.show({ type: "error", text1: message });
      } else {
        Toast.show({
          type: "error",
          text1: "Network Error. Please check your connection.",
        });
      }
      otpInputRef.current?.clear();
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (loading || countdown > 0) return;
    console.log("Resend OTP requested for email:", email);
    try {
      setLoading(true);
      const res = await AxiosService.post("vendor/forgotPassword", { email });
      console.log("Resend OTP response status:", res.status, "data:", res.data);
      if (res.status === 201) {
        // Success popup message
        Toast.show({
          type: "success",
          text1: "OTP Resent Successfully",
          text2: "A new PIN has been dispatched to your email address.",
        });

        // Trigger OTP Screen push notification popup
        triggerNotification("A new verification PIN was resent to your email.");

        // Start 2-minute cooldown
        setCountdown(120);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      if (err.response) {
        console.error("Resend OTP error response status:", err.response.status, "data:", err.response.data);
      }
      const message = err.response?.data?.message || "Network error, try again.";
      Toast.show({ type: "error", text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={safe_area_style.android_safe_area}>
      {/* Simulated Push Notification Banner */}
      {showNotification && (
        <View style={styles.push_notification_container}>
          <View style={styles.push_notification_header}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("../../assets/Aatpartner.png")}
                style={styles.push_logo}
              />
              <Text style={styles.push_title}>AAT Notification</Text>
            </View>
            <Text style={styles.push_time_text}>now</Text>
          </View>
          <Text style={styles.push_body_text}>{notificationText}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable
          style={styles.nav_container}
          onPress={() => navigation.navigate("Reset_password")}
        >
          <Icon1 name="left" size={30} />
        </Pressable>

        <View style={styles.main_container}>
          <Image
            source={require("../assets/Images/otp-img.jpg")}
            style={styles.img}
          />

          <Text style={styles.heading_txt}>Enter the Verification Code</Text>
          <Text style={styles.sub_txt}>
            Enter the 4-digit number sent to your email
          </Text>

          <View style={styles.otp_container}>
            <OtpInput
              ref={otpInputRef}
              numberOfDigits={4}
              focusColor={colors.deep_blue}
              onTextChange={handleOtpChange}
              disabled={false}
              theme={{
                pinCodeContainerStyle: {
                  backgroundColor: colors.white,
                  width: 45,
                  height: 45,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.gray,
                },
                pinCodeTextStyle: { fontSize: 18, fontWeight: "600" },
                filledPinCodeContainerStyle: { borderWidth: 1, borderColor: colors.deep_blue },
              }}
            />
            {error ? <Text style={styles.error_txt}>{error}</Text> : null}
          </View>

          <Pressable style={styles.btn_container} onPress={handleOtpSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.btn_txt}>Submit</Text>
            )}
          </Pressable>

          <View style={styles.resend_container}>
            <Text style={styles.main_txt}>Haven't received code? </Text>
            {countdown > 0 ? (
              <Text style={styles.disabled_sub_txt}>Resend in {formatTime(countdown)}</Text>
            ) : (
              <Pressable onPress={handleResendOTP}>
                <Text style={styles.main_sub_txt}>Resend now</Text>
              </Pressable>
            )}
          </View>

          <Toast />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OtpInputScreen;

const styles = StyleSheet.create({
  main_container: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  img: { width: wp(40), height: hp(22), marginTop: 20 },
  heading_txt: {
    fontSize: 22,
    fontWeight: "600",
    marginVertical: 10,
    textAlign: "center",
  },
  sub_txt: { textAlign: "center", fontSize: 14, color: colors.dark_gray },
  nav_container: { alignItems: "flex-start", padding: 20 },
  otp_container: { width: "80%", alignItems: "center", marginVertical: 20 },
  btn_container: {
    backgroundColor: colors.red,
    width: "100%",
    padding: 12,
    borderRadius: 5,
    marginVertical: 15,
  },
  btn_txt: { textAlign: "center", color: colors.white, fontSize: 16, fontWeight: "600" },
  error_txt: { color: colors.red, fontSize: 12, marginTop: 5 },
  main_txt: { fontSize: 14, fontWeight: "500" },
  main_sub_txt: { color: colors.red },
  disabled_sub_txt: {
    color: colors.dark_gray,
    fontWeight: "600",
  },
  // Simulated Push Notification Styles
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
  resend_container: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "center",
  },
});
