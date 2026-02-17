import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useContext, useState } from "react";
import { colors } from "../utils/constants";
import Icon from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import AxiosService from "../utils/AxioService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext";

const LoginScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState("");

  const { login } = useContext(AuthContext); // Access the login function from AuthContext

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Email and Password are required",
      });
    }
    try {
      const res = await AxiosService.post("vendor/vendorLogin", {
        email,
        password,
      });

      if (res.status === 201) {
        Toast.show({
          type: "success",
          text1: "Login Successfully",
        });
        login(res.data.token);

        await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } catch (error) {
      if (error.response) {
        Toast.show({
          type: "error",
          text1: error.response.data.message,
        });
      } else if (error.message) {
        Toast.show({
          type: "error",
          text1: error.message,
        });
      } else {
        console.log("An unexpected error occurred. Please try again");
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
      {/* content container */}
      <View style={styles.content_container}>
        {/* logo */}
        <Image
          source={require("../assets/Images/AAT-logo.png")}
          style={styles.logo}
        />
        {/* heading */}
        <Text style={styles.heading_txt}>Sign In</Text>
        {/* input fields */}
        {/* email */}
        <View style={styles.input_container}>
          <TextInput
            textContentType="emailAddress"
            value={email}
            autoCapitalize="none"
            onChangeText={setEmail}
            placeholder="Email Address"
            style={{ width: "95%" }}
          />
        </View>
        {/* password */}
        <View style={styles.input_container}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            style={{ width: "95%" }}
            secureTextEntry={showPassword}
          />
          <Icon
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={colors.dark_gray}
            onPress={() => setShowPassword(!showPassword)}
          />
        </View>
        {/* button */}
        <TouchableOpacity style={styles.btn_container} onPress={handleLogin}>
          <Text style={styles.btn_txt}>Sign In</Text>
        </TouchableOpacity>
        {/* forget password */}
        <Text style={styles.main_txt}>
          Forgot password?{" "}
          <Text
            style={styles.sub_txt}
            // onPress={() => navigation.navigate("NewPassword")}

            onPress={() => navigation.navigate("Reset_password")}
          >
            Reset
          </Text>
        </Text>
        {/* sign up */}
        <Text style={styles.main_txt}>
          Don’t have an account?{" "}
          <Text
            style={styles.sub_txt}
            onPress={() => navigation.navigate("SignUp")}
          >
            Sign up
          </Text>
        </Text>
        {/* image */}
        <Image
          source={require("../assets/Images/login-1.jpg")}
          style={styles.img}
        />
      </View>
      <Toast />
    </ScrollView>
    //   {/* </View> */}
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  main_container: {
    backgroundColor: colors.very_light_green,
    height: "100%",
    paddingHorizontal: 15,
    paddingVertical: 45,
    display: "flex",
    flex: 1,
  },
  content_container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
  },
  heading_txt: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 20,
    color: colors.dark_green,
  },
  input_container: {
    paddingHorizontal: 15,
    // paddingVertical: 5,
    borderColor: colors.gray,
    borderWidth: 1,
    width: "100%",
    borderRadius: 5,
    marginBottom: 10,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height:45
  },
  btn_container: {
    backgroundColor: colors.red,
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 10,
    margin: 10,
  },
  btn_txt: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "600",
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
    height: 200,
    marginVertical: 20,
  },
});

