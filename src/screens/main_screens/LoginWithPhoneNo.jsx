import React, { useState } from "react";
import {
  ScrollView,
  View,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../utils/constants";
import AxiosService from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import moment from "moment";

const LoginWithPhoneNo = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await AxiosService.post("vendor/sendLoginOtp", {
        phoneNumber,
      });

      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: res.data.message,
          
        });
        setTimeout(() => {
          navigation.navigate('Login OTP Verify',{phoneNumber})
        }, 2000);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response.data.message,
      });
    } finally {
      setLoading(false);
    }
  };

  
  console.log('dateee',moment(Date.now()).format());

  

  return (
    <ScrollView
      style={styles.main_container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content_container}>
        <Image
          source={require("../../assets/Images/AAT-logo.png")}
          style={styles.logo}
        />

        <Text style={styles.heading_txt}>
          Verify your Phone Number and login
        </Text>
        <Text style={styles.subText}>
          We have send you an One Time Password(OTP)on this mobile Number
        </Text>
        <Text
          style={[
            styles.subText,
            { marginTop: 10, textAlign: "start", width: "90%", marginTop: 50 },
          ]}
        >
          Enter mobile no.
        </Text>

        <View style={styles.input_container}>
          <View style={styles.country_code_container}>
            <Text style={styles.country_code}>+91</Text>
            <Image
              style={styles.flag}
              source={require("../../assets/Images/india_flag.jpg")}
            />
          </View>
          <View style={styles.Phone_Input}>
            <TextInput
              style={styles.input}
              placeholder="Enter your Phone Number"
              keyboardType="number-pad"
              value={phoneNumber}
              onChangeText={(value) => {
                const formattedValue = value
                  .replace(/[^0-9]/g, "")
                  .slice(0, 10);
                setPhoneNumber(formattedValue);
              }}
            />
          </View>
        </View>
        <Text style={styles.main_txt}>
          Don’t have an account?{" "}
          <Text
            style={styles.sub_txt}
            onPress={() => navigation.navigate("SignUp")}
          >
            Sign up
          </Text>
        </Text>
        <TouchableOpacity onPress={handleLogin} style={styles.btn_container}>
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.btn_txt}>Get OTP</Text>
          )}
        </TouchableOpacity>
        {/* <Text onPress={()=>navigation.navigate('Login OTP Verify')}>
          otp Screen
        </Text> */}
        <Image
          source={require("../../assets/Images/login-1.jpg")}
          style={styles.img}
        />
      </View>
      <Toast/>
    </ScrollView>
  );
};

export default LoginWithPhoneNo;

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
    height: "95%",
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
    fontWeight: "700",
    textAlign: "start",
  },
  subText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.dark_gray,
    marginLeft: 6,
    marginTop: 5,
  },
  input_container: {
    flexDirection: "row",
    gap: 10,
    // marginTop: 40,
  },
  country_code_container: {
    // backgroundColor:colors.light_gray,
    paddingHorizontal: 10,
    borderRadius: 5,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBlockColor: colors.gray,
    borderWidth: 1,
    borderLeftColor: colors.gray,
    borderRightColor: colors.gray,
    height:50
  },
  flag: {
    width: 20,
    height: 15,
    borderRadius: 2,
    marginLeft: 2,
  },
  Phone_Input: {
    // backgroundColor:colors.light_gray,
    padding: 5,
    height:50,
    borderRadius: 5,
    width: "70%",
    borderBlockColor: colors.gray,
    borderWidth: 1,
    borderLeftColor: colors.gray,
    borderRightColor: colors.gray,
  },
  btn_container: {
    backgroundColor: colors.red,
    width: "100%",
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 10,
    margin: 20,
  },
  btn_txt: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  main_txt: {
    color: colors.black,
    marginTop: 20,
  },
  sub_txt: {
    color: colors.blue,
    fontWeight: "500",
  },
  img: {
    width: "100%",
    height: 200,
    marginVertical: 20,
  },
});
