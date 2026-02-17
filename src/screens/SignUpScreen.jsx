import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { colors } from "../utils/constants";
import Icon from "react-native-vector-icons/Ionicons";
import AxiosService from "../utils/AxioService";
import Toast from "react-native-toast-message";

const SignUpScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);
  const [form, setForm] = useState({
    userName: "",
    email: "",
    phoneNumber: "",
    // password: "",
    // confirmPassword: "",
  });

  const handleInputChange = (name, value) => {
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await AxiosService.post("vendor/vendorSignup", form);
      console.log("API response:", res);

      if (res.status === 201) {
        Toast.show({
          type: "success",
          text1: "Vendor Signup Successfully",
        });
        setForm({
          userName: "",
          email: "",
          phoneNumber: "",
          address: "",
          // password: "",
          // confirmPassword: "",
        });

        setTimeout(() => {
          navigation.navigate("Login");
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
      } else {
        console.log("Network error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.main_container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content_container}>
        {/* logo */}
        <Image
          source={require("../assets/Images/AAT-logo.png")}
          style={styles.logo}
        />

        {/* heading */}
        <Text style={styles.heading_txt}>Sign Up</Text>

        {/* Username Input */}
        <View style={styles.input_container}>
          <TextInput
            placeholder="Username"
            placeholderTextColor="#000"
            value={form.userName}
            onChangeText={(value) => handleInputChange("userName", value)}
            style={{ width: "95%" }}
          />
        </View>

        {/* Email Input */}
        <View style={styles.input_container}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#000"
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => handleInputChange("email", value)}
            style={{ width: "95%" }}
          />
        </View>

        {/* Phone Number Input */}
        <View style={styles.input_container}>
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#000"
            value={form.phoneNumber}
            onChangeText={(value) => {
              const formattedValue = value.replace(/[^0-9]/g, "").slice(0, 10);
              handleInputChange("phoneNumber", formattedValue);
            }}
            keyboardType={"number-pad"}
            style={{ width: "95%" }}
          />
        </View>

        {/* Address Input */}
        {/* Uncomment if needed
        <View style={styles.input_container}>
          <TextInput
            placeholder="Address"
            placeholderTextColor="#000"
            value={form.address}
            onChangeText={(value) => handleInputChange("address", value)}
            style={{ width: "95%" }}
          />
        </View>
        */}

        {/* Password Input */}
        {/* Uncomment if needed
        <View style={styles.input_container}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#000"
            style={{ width: "95%" }}
            secureTextEntry={showPassword}
            value={form.password}
            onChangeText={(value) => handleInputChange("password", value)}
          />
          <Icon
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={colors.dark_gray}
            onPress={() => setShowPassword(!showPassword)}
          />
        </View>
        */}

        {/* Confirm Password Input */}
        {/* Uncomment if needed
        <View style={styles.input_container}>
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#000"
            style={{ width: "95%" }}
            secureTextEntry={showConfirmPassword}
            value={form.confirmPassword}
            onChangeText={(value) =>
              handleInputChange("confirmPassword", value)
            }
          />
          <Icon
            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={colors.dark_gray}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </View>
        */}

        {/* Sign Up Button */}
        <TouchableOpacity onPress={handleSubmit} style={styles.btn_container}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.btn_txt}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <Text style={styles.main_txt}>
          Already have an account?
          <Text
            style={styles.sub_txt}
            onPress={() => navigation.navigate("Login")}
          >
            {" "}
            Login
          </Text>
        </Text>

        {/* Decorative Image */}
        <Image
          source={require("../assets/Images/login-1.jpg")}
          style={styles.img}
        />
      </View>
      <Toast />
    </ScrollView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  main_container: {
    backgroundColor: colors.very_light_green,
    height: "100%",
    paddingHorizontal: 15,
    paddingVertical: 45,
  },
  content_container: {
    display: "flex",
    alignItems: "center",
    backgroundColor: colors.white,
    height: "100%",
    width: "100%",
    padding: 20,
    borderRadius: 20,
    gap: 5,
  },
  logo: {
    width: 200,
    height: 200,
    marginTop: -20,
  },
  heading_txt: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 20,
    color: colors.dark_green,
  },
  input_container: {
    paddingHorizontal: 15,
    borderColor: colors.gray,
    borderWidth: 1,
    width: "100%",
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 45,
  },
  btn_container: {
    backgroundColor: colors.red,
    width: "40%",
    paddingVertical: 10,
    borderRadius: 10,
    margin: 10,
  },
  btn_txt: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "600",
    alignSelf: "center",
  },
  main_txt: {
    color: colors.dark_gray,
  },
  sub_txt: {
    color: colors.black,
    fontWeight: "500",
  },
  img: {
    width: "100%",
    height: 150,
    marginBottom: 40,
    marginTop: 10,
  },
});
