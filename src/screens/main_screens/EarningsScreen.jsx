import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator
} from "react-native";
import React, { useEffect, useState } from "react";
import { colors } from "../../utils/constants";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { tripData } from "../../Data/Trip_data";
import WeeklyEarnings from "../../components/Earnings/WeeklyEarnings";
import MonthlyEarnings from "../../components/Earnings/MonthlyEarnings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";

const EarningsScreen = () => {
  const [weeklyEarnings, setWeeklyEarnings] = useState(true);
  const [monthlyEarnings, setMonthlyEarnings] = useState(false);
  const [vendorName, setVendorName] = useState(""); // 👈 new state for vendor name
  const [earningsAmount, setEarningsAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getVendorData();
  }, []);

  const handleWeeklyEarnings = () => {
    getVendorData();
    setWeeklyEarnings(true);
    setMonthlyEarnings(false);
  };
  const handleMonthlyEarnings = () => {
    getVendorData();
    setMonthlyEarnings(true);
    setWeeklyEarnings(false);
  };

  const getVendorData = async () => {
    const vendorData = await AsyncStorage.getItem("user");
    if (!vendorData) {
      console.error("No vendor data found in AsyncStorage");
      return;
    }
    const vendor = JSON.parse(vendorData);
    const vendorId = vendor._id;

    setLoading(true);
    try {
      const res = await AxiosService.post("vendor/getVendorById", { vendorId });
      if (res.status === 200) {
        setEarningsAmount(res.data.user.totalEarnings);
        setVendorName(res.data.user.userName); // 👈 set vendor name here
      }
    } catch (error) {
      console.log("Error retrieving user data:", error);
    } finally {
      setLoading(false);
    }
  };


  // if (loading){
  //   return(
  //     <View>
  //       <ActivityIndicator color={colors.dark_green} size="large"/>
  //     </View>
  //   )
  // }


  return (
    <ScrollView
      style={styles.main_container}
      showsVerticalScrollIndicator={false}
    >
      {/* header section */}
      {/* heading container section*/}
      <View style={styles.heading_container}>
        <Text style={styles.first_heading_txt}>Welcome!</Text>
        <Text style={styles.second_heading_txt}>
          Hello {vendorName} - Your Earnings
        </Text>
      </View>
      {/* earnings container section*/}
      <View style={styles.earnings_main_container}>
        {/* earnings container */}
        <View style={styles.earnings_container}>
          {/* icon */}
          <Image
            source={require("../../assets/Images/total.png")}
            style={styles.icon}
          />
          {/* total earnings heading text */}
          <Text style={styles.total_earnings_heading_txt}>Total Earnings</Text>
          {/* total amount text */}
          <Text style={styles.heading_amount_txt}>₹{parseFloat(earningsAmount).toFixed(2)}</Text>
        </View>
      </View>
      {/* slogan section */}
      <View style={styles.slogan_container}>
        {/* image */}
        <Image
          source={require("../../assets/Images/coin.png")}
          style={styles.coin_img}
        />
        <Text style={styles.slogan_txt}>
          Drive hard, earn more turn miles into money!
        </Text>
      </View>
      {/*weekly earnings information list section*/}
      <View style={styles.earnings_list_main_container}>
        {/* Buttons container */}
        <View style={styles.btn_main_container}>
          {/* weekly view button */}
          <Pressable
            style={[
              styles.btn_container,
              weeklyEarnings && styles.selected_btn_container,
            ]}
            onPress={handleWeeklyEarnings}
          >
            <Text
              style={[
                styles.btn_txt,
                weeklyEarnings && styles.selected_btn_txt,
              ]}
            >
              Week View
            </Text>
          </Pressable>
          {/* Month view button */}
          <Pressable
            style={[
              styles.btn_container,
              monthlyEarnings && styles.selected_btn_container,
            ]}
            onPress={handleMonthlyEarnings}
          >
            <Text
              style={[
                styles.btn_txt,
                monthlyEarnings && styles.selected_btn_txt,
              ]}
            >
              Month View
            </Text>
          </Pressable>
        </View>
        {/* heading text */}
        <Text style={styles.earnings_list_heading}>
          {weeklyEarnings ? "Your Weekly Earnings" : "Your Monthly Earnings"}
        </Text>
        {/* earnings data container */}
        {weeklyEarnings && <WeeklyEarnings />}
        {monthlyEarnings && <MonthlyEarnings />}
      </View>
    </ScrollView>
  );
};

export default EarningsScreen;

const styles = StyleSheet.create({
  main_container: {
    backgroundColor: colors.white,
    flex: 1,
    padding: 15,
  },
  // heading container style
  heading_container: {
    backgroundColor: colors.very_light_green,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    paddingBottom: hp(10),
    borderWidth: 0.3,
    borderColor: colors.light_green,
  },
  first_heading_txt: {
    fontSize: 20,
    fontWeight: "700",
  },
  second_heading_txt: {
    fontSize: 17,
    fontWeight: "600",
  },
  // earnings container section style
  earnings_main_container: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(-8),
  },
  earnings_container: {
    backgroundColor: colors.white,
    width: wp(80),
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    elevation: 3,
  },
  icon: {
    width: 65,
    height: 65,
  },
  total_earnings_heading_txt: {
    fontSize: 20,
    fontWeight: "500",
    marginVertical: 10,
  },
  heading_amount_txt: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.dark_green,
  },
  // slogan section style
  slogan_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.light_purple,
    marginVertical: 20,
    padding: 4,
    borderRadius: 5,
  },
  coin_img: {
    width: 27,
    height: 23,
  },
  slogan_txt: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.black,
  },
  // button styles
  btn_main_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 8,
    borderColor: colors.gray,
    borderWidth: 0.3,
    marginBottom: 15,
  },
  btn_container: {
    width: wp(40),
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 5,
    borderColor: colors.dark_green,
    borderWidth: 1,
  },
  btn_txt: {
    color: colors.dark_green,
    fontSize: 15,
    fontWeight: "600",
  },
  selected_btn_container: {
    backgroundColor: colors.dark_green,
  },
  selected_btn_txt: {
    color: colors.white,
  },
  // earnings list style
  earnings_list_heading: {
    fontSize: 15,
    fontWeight: "700",
    borderBottomColor: colors.gray,
    borderBottomWidth: 1,
    paddingBottom: 5,
    marginBottom: 5,
  },
  earnings_list_main_container: {
    borderRadius: 10,
    backgroundColor: colors.light_gray,
    padding: 10,
    marginBottom: 50,
  },
});
