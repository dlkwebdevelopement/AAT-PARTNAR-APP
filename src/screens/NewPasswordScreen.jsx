import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import safe_area_style from "../utils/safe_area_style";
import { colors } from "../utils/constants";
import Icon from "react-native-vector-icons/Ionicons";
import Icon1 from "react-native-vector-icons/AntDesign";
import AxiosService from "../utils/AxioService";
import Toast from "react-native-toast-message";

const NewPasswordScreen = ({ navigation, route }) => {
  const [newPasswordShow, setNewPasswordShow] = useState(true);
  const [confirmPasswordShow, setConfirmPasswordShow] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPin, email } = route.params;

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({ type: "error", text1: "Please fill all fields." });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match." });
      return;
    }

    try {
      setLoading(true);
      const res = await AxiosService.post("vendor/resetPassword", {
        email,
        resetPin,
        newPassword,
        confirmPassword,
      });

      if (res.status === 201) {
        setNewPassword("");
        setConfirmPassword("");
        Toast.show({
          type: "success",
          text1: res.data.message,
        });
        setTimeout(() => {
          navigation.navigate("Login");
        }, 2000);
      }
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        const message =
          data?.message ||
          (status === 500 ? "Internal Server Error" : "Unknown error");
        Toast.show({ type: "error", text1: message });
      } else {
        Toast.show({
          type: "error",
          text1: "Network error. Check your connection.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={safe_area_style.android_safe_area}>
      {/* Navigation back */}
      <Pressable
        style={styles.nav_container}
        onPress={() => navigation.goBack()}
      >
        <Icon1 name="arrow-left" size={30} />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.main_container}>
          <Image
            source={require("../assets/Images/key.png")}
            style={styles.icon}
          />
          <Text style={styles.heading_txt}>Reset Password</Text>

          <View style={styles.main_input_container}>
            <Text style={styles.lable}>New Password</Text>
            <View style={styles.input_container}>
              <TextInput
                placeholder="New Password"
                style={{ flex: 1 }}
                secureTextEntry={newPasswordShow}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Icon
                name={newPasswordShow ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.dark_gray}
                onPress={() => setNewPasswordShow(!newPasswordShow)}
              />
            </View>

            <Text style={styles.lable}>Confirm Password</Text>
            <View style={styles.input_container}>
              <TextInput
                placeholder="Confirm Password"
                style={{ flex: 1 }}
                secureTextEntry={confirmPasswordShow}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Icon
                name={confirmPasswordShow ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.dark_gray}
                onPress={() => setConfirmPasswordShow(!confirmPasswordShow)}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.btn_container}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.btn_txt}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

export default NewPasswordScreen;

const styles = StyleSheet.create({
  main_container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  icon: { width: 80, height: 80 },
  main_input_container: { width: "100%", marginTop: 20, marginBottom: 15 },
  input_container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderColor: colors.gray,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 18,
  },
  heading_txt: { fontSize: 25, fontWeight: "600", marginVertical: 10 },
  lable: { fontSize: 15, fontWeight: "500" },
  btn_container: {
    backgroundColor: colors.red,
    width: "100%",
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  btn_txt: { color: colors.white, fontWeight: "500", textAlign: "center" },
  nav_container: { paddingTop: 40, paddingHorizontal: 20, paddingBottom: 15 },
});
