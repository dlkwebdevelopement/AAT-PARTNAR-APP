import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from "react";
import { colors } from "../../utils/constants";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { tripData } from "../../Data/Trip_data";
import WeeklyEarnings from "../../components/Earnings/WeeklyEarnings";
import MonthlyEarnings from "../../components/Earnings/MonthlyEarnings";
import WithdrawalHistory from "../../components/Earnings/WithdrawalHistory";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import AxiosService from "../../utils/AxioService";

const EarningsScreen = () => {
  const [weeklyEarnings, setWeeklyEarnings] = useState(true);
  const [monthlyEarnings, setMonthlyEarnings] = useState(false);
  const [withdrawView, setWithdrawView] = useState(false);
  const [vendorName, setVendorName] = useState(""); // 👈 new state for vendor name
  const [earningsAmount, setEarningsAmount] = useState("");
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getVendorData();
  }, []);

  const handleWeeklyEarnings = () => {
    getVendorData();
    setWeeklyEarnings(true);
    setMonthlyEarnings(false);
    setWithdrawView(false);
  };
  const handleMonthlyEarnings = () => {
    getVendorData();
    setMonthlyEarnings(true);
    setWeeklyEarnings(false);
    setWithdrawView(false);
  };
  const handleWithdrawView = () => {
    getVendorData();
    setWithdrawView(true);
    setWeeklyEarnings(false);
    setMonthlyEarnings(false);
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
        setVendorName(res.data.user.userName);
      }

      // Fetch payment profile details to get withdrawable balance and total earnings
      const profileRes = await AxiosService.get(`/vendor-payment/get-payment-profile/${vendorId}`);
      if (profileRes.status === 200 && profileRes.data.success) {
        setPendingPayouts(profileRes.data.profile.paymentProfile.pendingPayouts || 0);
        setEarningsAmount(profileRes.data.profile.paymentProfile.totalEarnings || 0);
      }
    } catch (error) {
      console.log("Error retrieving user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (pendingPayouts <= 0) {
      Alert.alert('Info', 'You have no pending balance to withdraw.');
      return;
    }

    const vendorData = await AsyncStorage.getItem("user");
    if (!vendorData) return;
    const vendor = JSON.parse(vendorData);
    const vendorId = vendor._id;

    Alert.alert(
      'Request Payout',
      `Would you like to request a payout of ₹${parseFloat(pendingPayouts).toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await AxiosService.post('/vendor-payment/request-payout', {
                vendorId,
                amount: pendingPayouts,
              });
              const data = response.data;
              if (data.success) {
                Alert.alert('Success', 'Payout request submitted successfully.');
                getVendorData();
                setRefreshTrigger(prev => prev + 1);
              } else {
                Alert.alert('Error', data.message || 'Failed to request payout');
              }
            } catch (error) {
              console.log("Withdrawal request error:", error);
              Alert.alert('Error', error.response?.data?.message || 'Network error. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };


  // if (loading){
  //   return(
  //     <View>
  //       <ActivityIndicator color={colors.deep_blue} size="large"/>
  //     </View>
  //   )
  // }


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
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
        <View style={styles.earnings_cards_row}>
          {/* Total Earnings Card */}
          <View style={styles.earnings_card_small}>
            <Image
              source={require("../../assets/Images/total.png")}
              style={styles.card_icon_small}
            />
            <Text style={styles.card_label_small}>Total Earnings</Text>
            <Text style={styles.card_amount_small}>₹{parseFloat(earningsAmount || 0).toFixed(2)}</Text>
            </View>
        

          {/* Withdrawable Balance Card */}
          <View style={styles.earnings_card_small}>
            <Ionicons name="cash-outline" size={40} color={colors.deep_blue} style={styles.money_icon} />
            <Text style={styles.card_label_small}>Withdrawable</Text>
            <Text style={[styles.card_amount_small, { color: colors.deep_blue }]}>₹{parseFloat(pendingPayouts || 0).toFixed(2)}</Text>
            <Pressable style={styles.add_icon_btn} onPress={() => {/* TODO: add action */}}>
              <Ionicons name="add-circle-outline" size={24} color={colors.deep_blue} />
            </Pressable>
        </View>
          </View>
        {/* Request Payout button */}
        <Pressable
          style={[
            styles.withdraw_action_btn,
            pendingPayouts <= 0 && styles.disabled_withdraw_btn
          ]}
          onPress={handleWithdraw}
          disabled={pendingPayouts <= 0}
        >
          <Ionicons name="wallet" size={20} color={colors.white} />
          <Text style={styles.withdraw_action_txt}>Request Payout</Text>
        </Pressable>
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
              Week
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
              Month
            </Text>
          </Pressable>
          {/* Withdraw View button */}
          <Pressable
            style={[
              styles.btn_container,
              withdrawView && styles.selected_btn_container,
            ]}
            onPress={handleWithdrawView}
          >
            <Text
              style={[
                styles.btn_txt,
                withdrawView && styles.selected_btn_txt,
              ]}
            >
              Withdrawals
            </Text>
          </Pressable>
        </View>
        {/* heading text */}
        <Text style={styles.earnings_list_heading}>
          {weeklyEarnings 
            ? "Your Weekly Earnings" 
            : monthlyEarnings 
              ? "Your Monthly Earnings" 
              : "Your Withdrawal History"}
        </Text>
        {/* earnings data container */}
        {weeklyEarnings && <WeeklyEarnings />}
        {monthlyEarnings && <MonthlyEarnings />}
        {withdrawView && <WithdrawalHistory refreshTrigger={refreshTrigger} />}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

export default EarningsScreen;

const styles = StyleSheet.create({
  main_container: {
    backgroundColor: "#FAFAFA",
    flex: 1,
    padding: 15,
  },
  // heading container style
  heading_container: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    paddingBottom: hp(10),
    borderWidth: 0,
  },
  first_heading_txt: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.deep_blue,
  },
  second_heading_txt: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
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
    color: colors.deep_blue,
  },
  // slogan section style
  slogan_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F0F4FF",
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
    color: colors.deep_blue,
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
    flex: 1,
    marginHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 5,
    borderColor: colors.deep_blue,
    borderWidth: 1,
  },
  btn_txt: {
    color: colors.deep_blue,
    fontSize: 14,
    fontWeight: "600",
  },
  selected_btn_container: {
    backgroundColor: colors.deep_blue,
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
  // Side-by-side cards styles
  earnings_cards_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: wp(90),
    gap: 12,
  },
  earnings_card_small: {
    backgroundColor: colors.white,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    elevation: 3,
  },
  card_icon_small: {
    width: 40,
    height: 40,
    marginBottom: 6,
  },
  card_label_small: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.dark_gray,
    marginBottom: 4,
  },
  card_amount_small: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  money_icon: {
    marginBottom: 6,
    alignSelf: 'center',
  },
  add_icon_btn: {
    marginLeft: 8,
    alignSelf: 'center'
  },
  withdraw_action_btn: {
    flexDirection: 'row',
    backgroundColor: colors.deep_blue,
    width: '60%',
    alignSelf: 'center',
    gap: 8,
    marginTop: 12,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled_withdraw_btn: {
  // existing styles
    backgroundColor: colors.placeholder_gray || '#9E9E9E',
  },
  withdraw_action_txt: {
    color: colors.white,
    fontSize: 16,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});
