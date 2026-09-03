import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import safe_area_style from "../utils/safe_area_style";
import { colors } from "../utils/constants";
import Back_icon from "react-native-vector-icons/FontAwesome6";
import AxiosService from "../utils/AxioService";
import Toast from "react-native-toast-message";

const ResetPasswordScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // Handle input changes
  const handleEmail = (text) => {
    setEmail(text);
    if (text.trim().length > 0) setError("");
  };

  // Reset password API call
  const handleResetpassword = async () => {
    if (email.trim() === "") {
      setError("Email cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const res = await AxiosService.post("vendor/forgotPassword", { email });

      if (res.status === 201) {
        setEmail("");
        Toast.show({
          type: "success",
          text1: "PIN sent to your email",
          text2: "It will expire in 3 minutes",
        });

        setTimeout(() => {
          navigation.navigate("Otp", { email });
        }, 1500);
      }
    } catch (err) {
      if (err.response) {
        const { data } = err.response;
        Toast.show({
          type: "error",
          text1: data?.message || "Something went wrong",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Network Error. Please check your connection.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={safe_area_style.android_safe_area}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.main_container}>
          {/* Icon */}
          <Image
            source={require("../assets/Images/key.png")}
            style={styles.icon}
          />

          {/* Heading */}
          <Text style={styles.heading_txt}>Forgot Password?</Text>

          {/* Subtext */}
          <Text style={styles.sub_txt}>
            No worries, we'll send you reset instructions
          </Text>

          {/* Email Input */}
          <View style={styles.main_input_container}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.input_container}>
              <TextInput
                placeholder="Enter your email"
                inputMode="email"
                autoCapitalize="none"
                onChangeText={handleEmail}
                value={email}
              />
            </View>
            {error ? <Text style={styles.error_txt}>{error}</Text> : null}
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={styles.btn_container}
            onPress={handleResetpassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.btn_txt}>Reset password</Text>
            )}
          </TouchableOpacity>

          {/* Back to login */}
          <Pressable
            style={styles.nav_container}
            onPress={() => navigation.navigate("Login")}
          >
            <Back_icon
              name="arrow-left-long"
              size={24}
              color={colors.dark_gray}
            />
            <Text style={styles.back_txt}>Back to log in</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  main_container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  icon: { width: 80, height: 80 },
  main_input_container: {
    width: "100%",
    marginTop: 20,
    marginBottom: 15,
  },
  input_container: {
    borderColor: colors.gray,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 6,
    height: 45,
    justifyContent: "center",
  },
  heading_txt: {
    fontSize: 25,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 7,
  },
  sub_txt: {
    color: colors.dark_gray,
    fontSize: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 5,
  },
  btn_container: {
    backgroundColor: colors.red,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  btn_txt: {
    textAlign: "center",
    color: colors.white,
    fontWeight: "500",
  },
  nav_container: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    justifyContent: "center",
  },
  back_txt: {
    color: colors.dark_gray,
    marginLeft: 8,
  },
  error_txt: {
    color: colors.red,
    fontSize: 12,
    marginTop: 5,
  },
});
