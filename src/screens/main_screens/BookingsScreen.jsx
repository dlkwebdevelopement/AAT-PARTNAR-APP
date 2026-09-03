import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from "react";
import { colors } from "../../utils/constants";
import UpcomingBookings from "../../components/Bookings/UpcomingBookings";
import PastBookings from "../../components/Bookings/PastBookings";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Icon from 'react-native-vector-icons/MaterialIcons';

const BookingsScreen = ()=> {
  const [current, setCurrent] = useState(true);
  const [history, setHistory] = useState(false);

  const handleCurrent = () => {
    setCurrent(true);
    setHistory(false);
  };
  
  const handleHistory = () => {
    setHistory(true);
    setCurrent(false);
  };

  return (
    <SafeAreaView style={styles.main_container}>
      {/* Toggle buttons with icons */}
      <View style={styles.Btn_main_container}>
        {/* Upcoming button */}
        <TouchableOpacity
          style={[styles.btn_container, current && styles.selected_btn]}
          onPress={handleCurrent}
          activeOpacity={0.8}
        >
          <Icon 
            name="upcoming" 
            size={22} 
            color={current ? colors.white : colors.deep_blue} 
            style={styles.btn_icon}
          />
          <Text style={[styles.btn_txt, current && styles.selected_btn_txt]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        {/* History button */}
        <TouchableOpacity
          style={[styles.btn_container, history && styles.selected_btn]}
          onPress={handleHistory}
          activeOpacity={0.8}
        >
          <Icon 
            name="history" 
            size={22} 
            color={history ? colors.white : colors.deep_blue} 
            style={styles.btn_icon}
          />
          <Text style={[styles.btn_txt, history && styles.selected_btn_txt]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {current && <UpcomingBookings />}
      {history && <PastBookings />}
    </SafeAreaView>
  );
};

export default BookingsScreen;

const styles = StyleSheet.create({
  main_container: {
    backgroundColor: "#FAFAFA",
    flex: 1,
    paddingTop: hp(2),
    paddingHorizontal: wp(4),
  },

  // Toggle button container
  Btn_main_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: wp(1.5),
    borderRadius: 15,
    gap: wp(2),
    marginBottom: hp(2),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Individual button
  btn_container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.light_gray || '#E0E0E0',
  },
  
  btn_icon: {
    marginRight: wp(2),
  },
  
  btn_txt: {
    fontSize: hp(1.8),
    fontWeight: "600",
    color: colors.deep_blue,
  },
  
  selected_btn: {
    backgroundColor: colors.deep_blue,
    borderColor: colors.deep_blue,
  },
  
  selected_btn_txt: {
    color: colors.white,
  },
});