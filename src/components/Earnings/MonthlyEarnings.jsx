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

      const response = await AxiosService.post("/vendor/getvendorPayouts", { vendorId });

      if (response.status === 200) {
        setPayouts(response.data.vendor);
        console.log("Response data:", response.data.vendor);
      } else {
        console.error("Unexpected response status:", response.status);
      }
    } catch (error) {
      console.error("Error retrieving user data:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View>
        <ActivityIndicator color={colors.deep_blue} size="large" />
      </View>
    );
  }

  // Empty state handling for monthly earnings
  if (!payouts || payouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No monthly earnings data available.</Text>
      </View>
    );
  }

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

  return (
    <View>
      {payouts.map((item, index) => (
        <View key={index}>
          <TouchableOpacity
            key={index}
            style={styles.btn_container}
            onPress={() => handleDetails(index)}
          >
            <Text style={styles.month_txt}>{getMonthYearName(item.month)}</Text>
            <Text style={styles.amount_txt}>₹{parseFloat(item.totalMonthlyVendorPayment).toFixed(2)}</Text>
          </TouchableOpacity>
          {showDetails === index && (
            <View style={styles.weekly_data_container}>
              {item.weeks.map((data, idx) => {
                const borderLeftColor = data.payoutDone ? (colors.deep_blue || '#2e7d32') : (colors.red || '#c62828');
                const statusLabel = data.payoutDone ? '✅ Success' : '⏳ Pending';
                const statusColor = data.payoutDone ? (colors.deep_blue || '#2e7d32') : (colors.red || '#c62828');

                return (
                  <View key={idx} style={[styles.history_card, { borderLeftColor }]}>
                    <View style={styles.card_row}>
                      <View>
                        <Text style={styles.date_text}>{data.weekRange}</Text>
                        <Text style={styles.trip_count_text}>
                          No of Trips: <Text style={{ fontWeight: '600' }}>{data.bookings ? data.bookings.length : 0}</Text>
                        </Text>
                      </View>
                      <View style={styles.amount_col}>
                        <Text style={[styles.amount_text, { color: statusColor }]}>
                          ₹{parseFloat(data.totalVendorPayment).toFixed(2)}
                        </Text>
                        <Text style={[styles.status_text, { color: statusColor }]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
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
    padding: 14,
    marginVertical: 6,
    borderRadius: 10,
    elevation: 1.5,
    borderLeftWidth: 4,
    borderLeftColor: colors.deep_blue,
  },
  month_txt: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
  },
  amount_txt: {
    fontSize: 16,
    color: colors.deep_blue,
    fontWeight: "700",
  },
  weekly_data_container: {
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: colors.light_gray,
    marginVertical: 4,
  },
  history_card: {
    backgroundColor: colors.white,
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
    elevation: 1.5,
    borderLeftWidth: 4,
  },
  card_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date_text: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  trip_count_text: {
    fontSize: 12,
    color: colors.dark_gray,
    marginTop: 4,
    fontWeight: '500',
  },
  amount_col: {
    alignItems: 'flex-end',
  },
  amount_text: {
    fontSize: 16,
    fontWeight: '700',
  },
  status_text: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    elevation: 1,
    marginVertical: 10,
  },
  emptyText: {
    color: colors.dark_gray,
    fontSize: 14,
    fontWeight: '500',
  },
});
