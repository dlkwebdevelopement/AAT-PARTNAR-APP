import React, { useState } from "react";
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
} from "react-native";
import { colors } from "../../utils/constants";
import Icon from "react-native-vector-icons/Ionicons";
import AxiosService from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

const LoginWithPhoneNo = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!phoneNumber) {
      setError("Phone number is required");
      return;
    }
    if (phoneNumber.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await AxiosService.post("vendor/sendLoginOtp", {
        phoneNumber,
      });

      if (res.status === 200 || res.status === 201) {
        navigation.navigate('Login OTP Verify', { phoneNumber });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to send OTP. Please try again.";
      setError(errMsg);
      Toast.show({
        type: "error",
        text1: errMsg,
      });
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
                source={require("../../../assets/Aatpartner.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.content_container}>
            <Text style={styles.heading_txt}>Welcome Back</Text>
            <Text style={styles.subText}>
              Verify your Phone Number to securely login to your vendor account.
            </Text>

            {/* Phone Number Input */}
            <View style={styles.input_wrapper}>
              <Text style={styles.input_label}>Mobile Number</Text>
              <View style={[
                styles.unified_input_container,
                error ? styles.input_error_border : null
              ]}>
                <View style={styles.country_code_section}>
                  <Image
                    style={styles.flag}
                    source={require("../../assets/Images/india_flag.jpg")}
                  />
                  <Text style={styles.country_code}>+91</Text>
                  <Icon name="chevron-down" size={16} color="#9CA3AF" />
                  <View style={styles.vertical_divider} />
                </View>
                <TextInput
                  keyboardType="numeric"
                  value={phoneNumber}
                  onChangeText={(value) => {
                    const formattedValue = value.replace(/[^0-9]/g, "").slice(0, 10);
                    setPhoneNumber(formattedValue);
                    setError("");
                  }}
                  placeholder="98765 43210"
                  placeholderTextColor="#9CA3AF"
                  style={styles.phone_input_field}
                />
                <Icon name="call-outline" size={20} color="#9CA3AF" style={{ marginRight: 15 }} />
              </View>
              {error ? <Text style={styles.error_txt}>{error}</Text> : null}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              onPress={handleLogin}
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
                    <Text style={styles.btn_txt}>GET OTP</Text>
                    <Icon name="arrow-forward" size={20} color={colors.white} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.main_txt}>
              Don’t have an account?{" "}
              <Text
                style={styles.sub_txt}
                onPress={() => navigation.navigate("SignUp")}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default LoginWithPhoneNo;

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
  input_error_border: {
    borderColor: colors.red,
    backgroundColor: "#FEF2F2",
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
  error_txt: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    marginLeft: 4,
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
    textAlign: "center",
  },
  sub_txt: {
    color: colors.deep_blue,
    fontWeight: "700",
  },
});
