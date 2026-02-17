import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { colors } from "../utils/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import Icon1 from "react-native-vector-icons/AntDesign";
import AxiosService from "../utils/AxioService";
import Toast from "react-native-toast-message";

const ChangePasswordScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [newPasswordShow, setNewPasswordShow] = useState(true);
  const [confirmPasswordShow, setConfirmPasswordShow] = useState(true);
  const [oldPasswordShow, setOldPasswordShow] = useState(true);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const getVendorData = async () => {
      const vendor = await AsyncStorage.getItem("user");
      if (vendor) {
        setVendorId(JSON.parse(vendor)._id);
      }
    };
    getVendorData();
  }, []);

  const handleChangePassword = async () => {
    // basic validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      Toast.show({ type: "error", text1: "All fields are required" });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }

    setLoading(true);
    try {
      const res = await AxiosService.post("vendor/editPassword", {
        _id: vendorId,
        oldPassword,
        newPassword,
        confirmPassword,
      });

      if (res.status === 201) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        Toast.show({ type: "success", text1: "Password Changed Successfully" });
      }
    } catch (error) {
      if (error.response) {
        const { data } = error.response;
        Toast.show({ type: "error", text1: data.message || "Something went wrong" });
      } else {
        Toast.show({ type: "error", text1: "Network Error. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.light_gray }}>
      {/* Navigation Back */}
      <Pressable
        style={styles.nav_container}
        onPress={() => navigation.goBack()}
      >
        <Icon1 name="arrow-left" size={30} />
      </Pressable>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.main_container}>
          <Image source={require("../assets/Images/key.png")} style={styles.icon} />
          <Text style={styles.heading_txt}>Change Password</Text>

          <View style={styles.main_input_container}>
            <Text style={styles.lable}>Old Password</Text>
            <View style={styles.input_container}>
              <TextInput
                placeholder="Old Password"
                style={{ flex: 1 }}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={oldPasswordShow}
              />
              <Icon
                name={oldPasswordShow ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.dark_gray}
                onPress={() => setOldPasswordShow(!oldPasswordShow)}
              />
            </View>

            <Text style={styles.lable}>New Password</Text>
            <View style={styles.input_container}>
              <TextInput
                placeholder="New Password"
                style={{ flex: 1 }}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={newPasswordShow}
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
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={confirmPasswordShow}
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
            style={[styles.btn_container, loading && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.btn_txt}>Save Password</Text>
            )}
          </TouchableOpacity>
        </View>
        <Toast />
      </ScrollView>
    </View>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  nav_container: {
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: colors.light_gray,
    paddingBottom: 15,
  },
  main_container: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: -20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    alignItems: "center",
  },
  icon: { width: 80, height: 80 },
  heading_txt: { fontSize: 25, fontWeight: "600", marginVertical: 10, color: colors.dark_green },
  main_input_container: { width: "100%", marginTop: 20, gap: 7 },
  lable: { fontSize: 15, fontWeight: "500" },
  input_container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 18,
  },
  btn_container: {
    backgroundColor: colors.dark_green,
    width: "100%",
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  btn_txt: { color: colors.white, fontWeight: "500", textAlign: "center" },
});
