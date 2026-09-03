import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { tripData } from '../../Data/Trip_data'
import { colors } from '../../utils/constants'
import AxiosService from '../../utils/AxioService'
import AsyncStorage from '@react-native-async-storage/async-storage'

const WeeklyEarnings = () => {

  const [tripData,setTripdata]= useState([])
  const [vendorEarnings , setVedorEarnings] = useState('')
  const [loading , setLoading] = useState(false)

  useEffect(()=>{
    getTriopData()
  },[])

  
  const getTriopData = async () => {
    const vendorData = await AsyncStorage.getItem('user');
    const vendor = JSON.parse(vendorData);
    const vendorId = vendor._id;
    setVedorEarnings(vendor.totalEarnings)
    setLoading(true)
try {
  const res = await AxiosService.post('vendor/GetMontWithWeekPayouts',{vendorId} )
  
  if(res.status === 200){
    setTripdata(res.data.weeks)
    console.log("data",res.data.return)
  }
} catch (error) {
   console.log('Error retrieving user data:', error);
   
}finally{
  setLoading(false)
}
  }

  if(loading){
    return( <View>
      <ActivityIndicator color={colors.deep_blue} size= "large"/>
    </View>)
  }
  

  if (!tripData || tripData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No weekly earnings data available.</Text>
      </View>
    );
  }

  return (
    <View>
      {tripData?.map((item, index) => {
        const borderLeftColor = item.payoutDone ? (colors.deep_blue || '#2e7d32') : (colors.red || '#c62828');
        const statusLabel = item.payoutDone ? '✅ Success' : '⏳ Pending';
        const statusColor = item.payoutDone ? (colors.deep_blue || '#2e7d32') : (colors.red || '#c62828');

        return (
          <View key={index} style={[styles.history_card, { borderLeftColor }]}>
            <View style={styles.card_row}>
              <View>
                <Text style={styles.date_text}>{item.weekRange}</Text>
                <Text style={styles.trip_count_text}>
                  No of Trips: <Text style={{ fontWeight: '600' }}>{item.bookings.length}</Text>
                </Text>
              </View>
              <View style={styles.amount_col}>
                <Text style={[styles.amount_text, { color: statusColor }]}>
                  ₹{parseFloat(item.totalVendorPayment).toFixed(2)}
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
  );
};

export default WeeklyEarnings;

const styles = StyleSheet.create({
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
});