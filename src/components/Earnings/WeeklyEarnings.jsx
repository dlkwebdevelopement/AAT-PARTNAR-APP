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
      <ActivityIndicator color={colors.dark_green} size= "large"/>
    </View>)
  }
  

  return (
    <View>
     {/* earnings data container */}
     {tripData?.map((item, index) => (
          <View key={index} style={styles.earnings_data_container}>
            <View style={{gap: 3 }}>
              <Text style={styles.date_txt}>{item.weekRange}</Text>
              <Text style={[styles.trip_count_txt]}>
                No of Trips : <Text>{item.bookings.length}</Text>
              </Text>
              <View style={{flexDirection:'row',gap:5}}>
              <Text style={[styles.trip_count_txt,{fontSize:12}]}>
               Payout Status :
              </Text>
              <Text style={ item.payoutDone?styles.payoutDone_Text : styles.payout_Pending}>
                {item.payoutDone?"Success":"Pending"}
              </Text>
              </View>
             
            </View>
            <View>
       <Text style={styles.trip_amount_txt}> ₹ {parseFloat(item.totalVendorPayment).toFixed(2)}</Text>
                   </View>
          </View>
        ))}
    </View>
  )
}

export default WeeklyEarnings

const styles = StyleSheet.create({
 
 
  earnings_data_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    marginVertical: 8,
    padding: 13,
    borderRadius: 10,
    elevation: 1,
  },
  date_txt: {
    fontSize: 14,
    fontWeight: "600",
  },
  trip_count_txt: {
    fontWeight: "500",
    color: colors.dark_gray,
    fontSize: 13.5,
  },
  trip_amount_txt: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark_green,
  },

  payoutDone_Text:{
    fontWeight: "500",
    color: colors.dark_green,
    fontSize: 13,
  },
  payout_Pending:{
    fontWeight: "500",
    color: colors.red,
    fontSize: 12,
  }
})