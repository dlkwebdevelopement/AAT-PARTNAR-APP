import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { colors } from "../../utils/constants";
import AxiosService from "../../utils/AxioService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

const VehicleManageScreen = () => {
  const navigation = useNavigation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getVehicles();
  }, []);

  const getVehicles = async () => {
    setLoading(true);
    try {
      const user = await AsyncStorage.getItem("user");
      if (!user) return;
      const vendor = JSON.parse(user);
      const res = await AxiosService.post("vehicle/getVehiclesByVendor", { vendorId: vendor._id });
      if (res.status === 200) {
        setVehicles(res.data.vehicles || []);
      }
    } catch (error) {
      Toast.show({ type: "error", text1: error?.response?.data?.message || error.message });
    } finally {
      setLoading(false);
    }
  };

  const renderVehicleItem = ({ item }) => (
    <TouchableOpacity style={styles.vehicle_item_container} onPress={() => navigation.navigate("VehicleDetails", { vehicleId: item._id })}>
      <Image source={{ uri: item.vehicleImg || "" }} style={styles.vehicle_img} />
      <View style={styles.vehicle_info}>
        <Text style={styles.vehicle_name}>{item.vehicleName}</Text>
        <Text style={styles.vehicle_model}>{item.vehicleModel}</Text>
        <Text style={styles.vehicle_number}>{item.vehicleNumber}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loading_container}>
        <ActivityIndicator size="large" color={colors.dark_green} />
      </View>
    );
  }

  return (
    <View style={styles.main_container}>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item._id}
        renderItem={renderVehicleItem}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={<Text style={styles.empty_txt}>No vehicles found.</Text>}
      />
      <Toast />
    </View>
  );
};

export default VehicleManageScreen;

const styles = StyleSheet.create({
  main_container: { flex: 1, backgroundColor: colors.light_gray },
  vehicle_item_container: { flexDirection: "row", backgroundColor: colors.white, padding: 15, borderRadius: 10, marginBottom: 15, alignItems: "center" },
  vehicle_img: { width: 80, height: 80, borderRadius: 10, resizeMode: "cover" },
  vehicle_info: { marginLeft: 15, flex: 1 },
  vehicle_name: { fontSize: 16, fontWeight: "700" },
  vehicle_model: { fontSize: 14, color: colors.dark_gray },
  vehicle_number: { fontSize: 12, color: colors.gray },
  loading_container: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty_txt: { textAlign: "center", marginTop: 20, fontSize: 16, color: colors.dark_gray },
});
