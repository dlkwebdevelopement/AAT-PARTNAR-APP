import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import React, { useRef, useState } from "react";
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
  const { email } = route.params;

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
    try {
      setLoading(true);
      const res = await AxiosService.post("vendor/forgotPassword", { email });
      if (res.status === 201) {
        Toast.show({
          type: "success",
          text1: "PIN sent to your email",
          text2: "It will expire in 3 minutes",
        });
      }
    } catch (err) {
      const message = err.response?.data?.message || "Network error, try again.";
      Toast.show({ type: "error", text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={safe_area_style.android_safe_area}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable
          style={styles.nav_container}
          onPress={() => navigation.navigate("Reset_password")}
        >
          <Icon1 name="arrow-left" size={30} />
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
              focusColor={colors.dark_green}
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
                filledPinCodeContainerStyle: { borderWidth: 1, borderColor: colors.dark_green },
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

          <Text style={styles.main_txt}>
            Haven't received code?{" "}
            <Text style={styles.main_sub_txt} onPress={handleResendOTP}>
              Resend now
            </Text>
          </Text>

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
});
