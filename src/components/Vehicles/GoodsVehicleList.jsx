import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { colors } from "../../utils/constants";
import { TouchableOpacity } from "react-native";
import Fontaswome from "react-native-vector-icons/FontAwesome";
import Antdesign from "react-native-vector-icons/AntDesign";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import smallTruckImg  from "../../assets/Images/under1-ton.jpg";
import mediumTruckImg from "../../assets/Images/XL-truck.png";
import largeTruckImg  from "../../assets/Images/below-20-ton.png";
import XLTruckImg     from "../../assets/Images/moreThen20-ton.png";
import Icon  from "react-native-vector-icons/MaterialIcons";
import Icon2 from "react-native-vector-icons/MaterialCommunityIcons";
import ToggleSwitch from "toggle-switch-react-native";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

const GoodsVehicleList = () => {
  const [refreshing, setRefreshing]               = useState(false);
  const [loading, setLoading]                     = useState(true);
  const [vehicleData, setVehicleData]             = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filtered, setFiltered]                   = useState("all");
  const [isOn, setIson]                           = useState({});
  const navigation = useNavigation();

  const getVehicles = async () => {
    const vendor     = await AsyncStorage.getItem("user");
    const vendorData = JSON.parse(vendor);
    const vendorId   = vendorData._id;
    try {
      const res = await AxiosService.get(`vendor/getAllVehiclesByVendor/${vendorId}`);
      const vehicleDatas = res.data.vehicles.filter(
        (data) => data.categoryType === "goods"
      );
      setVehicleData(vehicleDatas);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      Toast.show({ type: "error", text1: "Failed to load vehicles", text2: "Please pull down to refresh" });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(React.useCallback(() => { getVehicles(); }, []));

  const onDelete = async (vehicleId) => {
    const vendor     = await AsyncStorage.getItem("user");
    const vendorData = JSON.parse(vendor);
    const vendorId   = vendorData._id;
    try {
      setLoading(true);
      const res = await AxiosService.delete(`admin/deleteVehicle/${vendorId}/${vehicleId}`);
      if (res.status === 200) {
        Toast.show({ type: "success", text1: "Vehicle Deleted Successfully" });
        getVehicles();
      }
    } catch (error) {
      Toast.show({ type: "error", text1: error.response?.data?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await getVehicles(); setRefreshing(false); };

  const filteredData = filtered === "all"
    ? vehicleData
    : vehicleData.filter((vehicle) => vehicle.vehicleApprovedByAdmin === filtered);

  const handleFilterChange = (filter) => { setFiltered(filter); setShowFilterDropdown(false); };

  const handleNavigation = (item) => {
    navigation.navigate("TruckRereg", { vehicle: item });
  };

  useEffect(() => {
    if (vehicleData?.length > 0) {
      setIson((prevState) => {
        const initialState = {};
        vehicleData.forEach((item) => {
          initialState[item._id] = prevState[item._id] ?? item.vehicleIsOnline;
        });
        return initialState;
      });
    }
  }, [vehicleData]);

  const isToggleSwitch = (id) => {
    setIson((prevState) => {
      const newState = { ...prevState, [id]: !prevState[id] };
      handleVehicleAvailable(id, newState[id]);
      return newState;
    });
  };

  const handleVehicleAvailable = async (vehicleId, status) => {
    const vendor     = await AsyncStorage.getItem("user");
    const vendordata = JSON.parse(vendor);
    const vendorId   = vendordata._id;
    try {
      const res = await AxiosService.post("vendor/vehicleAvailableStatus", { vendorId, vehicleId, status });
      if (res.status === 200) Toast.show({ type: "success", text1: res.data.message });
    } catch (error) {
      Toast.show({ type: "error", text1: error.response?.data?.message || "An error occurred" });
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved": return styles.statusApproved;
      case "pending":  return styles.statusPending;
      case "rejected": return styles.statusRejected;
      default:         return styles.statusDefault;
    }
  };

  // ─────────────────────────────────────────────────────────────
  const renderHeader = () => <View style={styles.headerContainer} />;

  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <TouchableOpacity
        style={styles.filterMainButton}
        onPress={() => setShowFilterDropdown(!showFilterDropdown)}
      >
        <Icon name="filter-list" size={22} color={colors.deep_blue} />
        <Text style={styles.filterMainText}>
          Filter: {filtered.charAt(0).toUpperCase() + filtered.slice(1)}
        </Text>
        <Icon
          name={showFilterDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={22} color={colors.dark_gray}
        />
      </TouchableOpacity>

      {showFilterDropdown ? (
        <View style={styles.filterDropdown}>
          {[
            { value: "all",      label: "All Vehicles", iconComp: <Fontaswome name="list"  size={16} color={filtered === "all"      ? colors.white : colors.black} /> },
            { value: "approved", label: "Approved",     iconComp: <Fontaswome name="check" size={16} color={filtered === "approved" ? colors.white : colors.black} /> },
            { value: "pending",  label: "Pending",      iconComp: <Icon2 name="timer-sand" size={16} color={filtered === "pending"  ? colors.white : colors.black} /> },
            { value: "rejected", label: "Rejected",     iconComp: <Icon name="cancel"      size={16} color={filtered === "rejected" ? colors.white : colors.black} /> },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.filterOption, filtered === opt.value && styles.filterOptionActive]}
              onPress={() => handleFilterChange(opt.value)}
            >
              {opt.iconComp}
              <Text style={[styles.filterOptionText, filtered === opt.value && styles.filterOptionTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image source={require("../../assets/Images/no-truck-list.jpg")} style={styles.emptyStateImage} />
      <Text style={styles.emptyStateTitle}>No Vehicles Available</Text>
      <Text style={styles.emptyStateSubtitle}>
        It looks like you haven't added any vehicles yet. Click the add vehicle button to add a new vehicle!
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddVehicle")}>
        <Icon name="add" size={20} color={colors.white} />
        <Text style={styles.addButtonText}>Add Vehicle</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVehicleCard = ({ item }) => {
    const imageSrc =
      item.goodsType === "Small"  ? smallTruckImg  :
      item.goodsType === "Medium" ? mediumTruckImg :
      item.goodsType === "Large"  ? largeTruckImg  :
      item.goodsType === "XL"     ? XLTruckImg     : mediumTruckImg;

    const isApproved = item.vehicleApprovedByAdmin === "approved";
    const isPending  = item.vehicleApprovedByAdmin === "pending";
    const isRejected = item.vehicleApprovedByAdmin === "rejected";

    return (
      <View style={styles.vehicleCard}>
        {/* Header */}
        <View style={styles.vehicleCardHeader}>
          <View style={[styles.statusBadge, getStatusStyle(item.vehicleApprovedByAdmin)]}>
            <Text style={styles.statusText}>
              {isApproved ? "✓ Approved"
                : isPending  ? "⏳ Pending"
                : isRejected ? "✗ Rejected"
                : "Unknown"}
            </Text>
          </View>
          <View style={styles.goodsTypeBadge}>
            <Icon name="local-shipping" size={14} color={colors.deep_blue} />
            <Text style={styles.goodsTypeText}>{item.goodsType}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.vehicleCardBody}>
          <Image source={imageSrc} style={styles.vehicleImage} />
          <View style={styles.vehicleInfo}>
            <View style={styles.infoRow}>
              <Icon name="badge" size={16} color={colors.dark_gray} />
              <Text style={styles.infoLabel}>Reg No:</Text>
              <Text style={styles.infoValue}>{item.licensePlate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="model-training" size={16} color={colors.dark_gray} />
              <Text style={styles.infoLabel}>Model:</Text>
              <Text style={styles.infoValue}>{item.vehicleModel}</Text>
            </View>
            {item.ton ? (
              <View style={styles.infoRow}>
                <Icon name="fitness-center" size={16} color={colors.dark_gray} />
                <Text style={styles.infoLabel}>Tonnage:</Text>
                <Text style={styles.infoValue}>{item.ton} kg</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.vehicleCardFooter}>
          {/* Toggle — approved only */}
          {isApproved ? (
            <View style={styles.toggleContainer}>
              <ToggleSwitch
                isOn={isOn[item._id] || false}
                onColor="#4CAF50"
                offColor="#9E9E9E"
                label=""
                size="medium"
                onToggle={() => isToggleSwitch(item._id)}
              />
              <Text style={[styles.toggleLabel,
                isOn[item._id] ? styles.toggleLabelAvailable : styles.toggleLabelUnavailable]}>
                {isOn[item._id] ? "● Available" : "○ Unavailable"}
              </Text>
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("PassengerVehicleView", { vehicle: item })}
            >
              <Fontaswome name="eye" size={16} color={colors.deep_blue} />
              <Text style={styles.actionButtonText}>View</Text>
            </TouchableOpacity>

            {/* Edit — approved and pending */}
            {(isApproved || isPending) ? (
              <TouchableOpacity
                style={[styles.actionButton, isApproved ? styles.editButton : styles.editButtonPending]}
                onPress={() => navigation.navigate("GoodsVehicleEdit", { vehicle: item })}
              >
                <Fontaswome name="pencil" size={16} color={isApproved ? colors.white : colors.deep_blue} />
                <Text style={[styles.actionButtonText, isApproved ? styles.editButtonText : styles.editButtonPendingText]}>
                  Edit
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* Rejected — delete or re-register */}
            {isRejected ? (
              item.registerAmountRefund === true ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => onDelete(item._id)}
                >
                  <Antdesign name="delete" size={16} color={colors.red} />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.registerButton]}
                  onPress={() => handleNavigation(item)}
                >
                  <Fontaswome name="edit" size={16} color={colors.blue} />
                  <Text style={[styles.actionButtonText, styles.registerButtonText]}>
                    Register Again
                  </Text>
                </TouchableOpacity>
              )
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.deep_blue} />
        <Text style={styles.loadingText}>Loading your vehicles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {vehicleData.length > 0 ? (
        <>
          {renderFilterSection()}
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item._id}
            renderItem={renderVehicleCard}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.deep_blue]}
                tintColor={colors.deep_blue}
              />
            }
            ListEmptyComponent={
              <View style={styles.noResultsContainer}>
                <Icon name="search-off" size={50} color={colors.light_gray} />
                <Text style={styles.noResultsText}>No vehicles match the selected filter</Text>
                <TouchableOpacity style={styles.clearFilterButton} onPress={() => handleFilterChange("all")}>
                  <Text style={styles.clearFilterText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      ) : (
        renderEmptyState()
      )}

      <Toast />
    </View>
  );
};

export default GoodsVehicleList;

const styles = StyleSheet.create({
  container            : { flex: 1, backgroundColor: "#F5F7FA" },
  loadingContainer     : { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F7FA" },
  loadingText          : { marginTop: 10, fontSize: 16, color: colors.dark_gray, fontWeight: "500" },
  headerContainer      : { backgroundColor: colors.white, paddingHorizontal: wp(5), paddingVertical: hp(2), borderBottomWidth: 1, borderBottomColor: "#E0E0E0" },
  filterSection        : { paddingHorizontal: wp(5), paddingVertical: hp(1.5), backgroundColor: colors.white, marginBottom: 10, zIndex: 1000 },
  filterMainButton     : { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F5", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: "#E0E0E0" },
  filterMainText       : { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: "500", color: colors.dark_gray },
  filterDropdown       : { position: "absolute", top: 60, right: wp(5), left: wp(5), backgroundColor: colors.white, borderRadius: 10, padding: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 2000 },
  filterOption         : { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, marginVertical: 2, backgroundColor: "#F5F5F5" },
  filterOptionActive   : { backgroundColor: colors.deep_blue },
  filterOptionText     : { marginLeft: 10, fontSize: 14, fontWeight: "500", color: colors.black },
  filterOptionTextActive: { color: colors.white },
  listContainer        : { paddingHorizontal: wp(5), paddingBottom: hp(10) },
  vehicleCard          : { backgroundColor: colors.white, borderRadius: 15, marginBottom: 15, padding: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: "#F0F0F0" },
  vehicleCardHeader    : { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  statusBadge          : { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusApproved       : { backgroundColor: "#EFF6FF" },
  statusPending        : { backgroundColor: "#FFF3E0" },
  statusRejected       : { backgroundColor: "#FFEBEE" },
  statusDefault        : { backgroundColor: "#F5F5F5" },
  statusText           : { fontSize: 12, fontWeight: "600" },
  goodsTypeBadge       : { flexDirection: "row", alignItems: "center", backgroundColor: "#F0F7FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
  goodsTypeText        : { fontSize: 12, fontWeight: "600", color: colors.deep_blue },
  vehicleCardBody      : { flexDirection: "row", marginBottom: 15, backgroundColor: "#F8F9FA", borderRadius: 12, padding: 10 },
  vehicleImage         : { width: 100, height: 80, resizeMode: "contain", marginRight: 15 },
  vehicleInfo          : { flex: 1, justifyContent: "center" },
  infoRow              : { flexDirection: "row", alignItems: "center", marginBottom: 8, flexWrap: "wrap" },
  infoLabel            : { fontSize: 13, color: colors.dark_gray, marginLeft: 6, marginRight: 4, fontWeight: "500", width: 55 },
  infoValue            : { fontSize: 13, color: colors.black, fontWeight: "600", flex: 1 },
  vehicleCardFooter    : { borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingTop: 14 },
  toggleContainer      : { flexDirection: "row", alignItems: "center", marginBottom: 14, backgroundColor: "#F8F9FA", padding: 10, borderRadius: 30 },
  toggleLabel          : { marginLeft: 10, fontSize: 14, fontWeight: "600" },
  toggleLabelAvailable : { color: "#4CAF50" },
  toggleLabelUnavailable: { color: "#9E9E9E" },
  actionButtons        : { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  actionButton         : { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#E8E8E8" },
  actionButtonText     : { marginLeft: 6, fontSize: 13, fontWeight: "600", color: colors.dark_gray },
  editButton           : { backgroundColor: colors.deep_blue, borderColor: colors.deep_blue },
  editButtonText       : { color: colors.white },
  editButtonPending    : { backgroundColor: colors.white, borderColor: colors.deep_blue, borderWidth: 1.5 },
  editButtonPendingText: { color: colors.deep_blue },
  deleteButton         : { backgroundColor: "#FFEBEE", borderColor: "#FFCDD2" },
  deleteButtonText     : { color: colors.red },
  registerButton       : { backgroundColor: "#E3F2FD", borderColor: "#BBDEFB" },
  registerButtonText   : { color: colors.blue },
  emptyStateContainer  : { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: wp(10), backgroundColor: "#F5F7FA", minHeight: hp(70) },
  emptyStateImage      : { width: wp(70), height: hp(30), resizeMode: "contain", marginBottom: 20 },
  emptyStateTitle      : { fontSize: 24, fontWeight: "700", color: colors.deep_blue, marginBottom: 10, textAlign: "center" },
  emptyStateSubtitle   : { fontSize: 14, color: colors.dark_gray, textAlign: "center", marginBottom: 20, lineHeight: 20 },
  addButton            : { flexDirection: "row", alignItems: "center", backgroundColor: colors.deep_blue, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25, elevation: 3 },
  addButtonText        : { color: colors.white, fontSize: 16, fontWeight: "600", marginLeft: 8 },
  noResultsContainer   : { alignItems: "center", justifyContent: "center", paddingVertical: hp(10), backgroundColor: colors.white, borderRadius: 20, marginTop: 20, paddingHorizontal: wp(8) },
  noResultsText        : { fontSize: 16, color: colors.dark_gray, marginTop: 10, marginBottom: 15, textAlign: "center", fontWeight: "500" },
  clearFilterButton    : { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.deep_blue, borderRadius: 20 },
  clearFilterText      : { color: colors.white, fontSize: 14, fontWeight: "600" },
});