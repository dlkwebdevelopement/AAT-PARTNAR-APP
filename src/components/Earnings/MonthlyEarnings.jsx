import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { months } from "../../Data/Months";
import { colors } from "../../utils/constants";
import { tripData } from "../../Data/Trip_data";
import AxiosService from "../../utils/AxioService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MonthlyEarnings = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDetails = (index) => {
    setShowDetails(showDetails === index ? null : index);
  };

  useEffect(() => {
    getvendorMonthlyPayouts();
  }, []);

  const getvendorMonthlyPayouts = async () => {
    setLoading(true);
    try {
      const vendorData = await AsyncStorage.getItem("user");
      if (!vendorData) {
        console.error("No vendor data found in AsyncStorage");
        return;
      }

      const vendor = JSON.parse(vendorData);
      const vendorId = vendor._id;

      setLoading(true);
      const response = await AxiosService.post("/vendor/getvendorPayouts", {
        vendorId,
      });

      if (response.status === 200) {
        setPayouts(response.data.vendor);
        console.log("Response data:", response.data.vendor);
      } else {
        console.error("Unexpected response status:", response.status);
      }
    } catch (error) {
      console.error(
        "Error retrieving user data:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const getMonthYearName = (monthYear) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const [month, year] = monthYear.split("-");

    const monthName = monthNames[parseInt(month, 10) - 1];

    return `${monthName}-${year}`;
  };

  if (loading) {
    return (
      <View>
        <ActivityIndicator color={colors.dark_green} size="large" />
      </View>
    );
  }

  return (
    <View>
      {payouts.map((item, index) => (
        <View key={index}>
          <TouchableOpacity
            key={index}
            style={styles.btn_container}
            onPress={() => handleDetails(index)}
          >
            {/* month name */}
            <Text style={styles.month_txt}>{getMonthYearName(item.month)}</Text>
            {/* monthly earnings */}
            <Text style={styles.amount_txt}>
              ₹{parseFloat(item.totalMonthlyVendorPayment).toFixed(2)}
            </Text>
          </TouchableOpacity>
          {showDetails === index && (
            <View style={styles.weekly_data_container}>
              {/* earnings data container */}
              {item.weeks.map((data, index) => (
                // earnings list main container
                <View key={index} style={styles.earnings_data_container}>
                  {/* date and trips count section */}
                  <View style={{ gap: 3 }}>
                    {/* date */}
                    <Text style={styles.date_txt}>{data.weekRange}</Text>
                    {/* trips count */}
                    <Text style={styles.trip_count_txt}>
                      No of Trips : <Text>{item.weeks.length}</Text>
                    </Text>
                    <Text style={styles.trip_count_txt}>
                      Payout Status :{" "}
                      <Text
                        style={
                          data.payoutDone
                            ? { color: colors.dark_green }
                            : { color: colors.red }
                        }
                      >
                        {data.payoutDone ? "Success" : "Pending"}
                      </Text>
                    </Text>
                  </View>
                  {/* amount section */}
                  <View>
                    <Text style={styles.trip_amount_txt}>
                      ₹{parseFloat(data.totalVendorPayment).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

export default MonthlyEarnings;

const styles = StyleSheet.create({
  btn_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: 10,
    paddingVertical: 15,
    marginVertical: 10,
    borderRadius: 10,
    elevation: 1,
  },
  month_txt: {
    fontSize: 16,
    fontWeight: "600",
  },
  amount_txt: {
    fontSize: 16,
    color: colors.dark_green,
    fontWeight: "700",
  },
  // weekly list data style
  earnings_data_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: 10,
    marginBottom: 2,
    borderRadius: 5,
  },
  date_txt: {
    fontSize: 14,
    fontWeight: "600",
  },
  trip_count_txt: {
    fontWeight: "500",
    color: colors.dark_gray,
    fontSize: 12,
  },
  trip_amount_txt: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark_green,
    marginTop: 20,
  },
});
