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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import carImg   from "../../assets/Images/car5.png";
import busImg   from "../../assets/Images/bus.png";
import autoImg  from "../../assets/Images/auto.png";
import vanImg   from "../../assets/Images/van.png";
import goodsImg from "../../assets/Images/XL-truck.png";
import Icon     from "react-native-vector-icons/MaterialIcons";
import Icon2    from "react-native-vector-icons/MaterialCommunityIcons";
import Antdesign from "react-native-vector-icons/AntDesign";
import Toast    from "react-native-toast-message";
import ToggleSwitch from "toggle-switch-react-native";

const { width } = Dimensions.get("window");

const PassengerVehicleList = () => {
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
        (data) => data.categoryType === "Passengers"
      );
      setVehicleData(vehicleDatas);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      Toast.show({ type: "error", text1: "Failed to load vehicles", text2: "Please pull down to refresh" });
    } finally {
      setLoading(false);
    }
  };

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

  useFocusEffect(React.useCallback(() => { getVehicles(); }, []));

  const onRefresh = async () => { setRefreshing(true); await getVehicles(); setRefreshing(false); };

  const filteredData = filtered === "all"
    ? vehicleData
    : vehicleData.filter((vehicle) => vehicle.vehicleApprovedByAdmin === filtered);

  const handleFilterChange = (filter) => { setFiltered(filter); setShowFilterDropdown(false); };

  const handleNavigation = (item) => {
    if (item.subCategory === "car")       navigation.navigate("CarReregForm",  { vehicle: item });
    else if (item.subCategory === "auto") navigation.navigate("AutoReregForm", { vehicle: item });
    else if (item.subCategory === "bus")  navigation.navigate("BusReregForm",  { vehicle: item });
    else                                  navigation.navigate("VanReregForm",  { vehicle: item });
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

  const getVehicleIcon = (subCategory) => {
    switch (subCategory) {
      case "car":  return "directions-car";
      case "auto": return "pedal-bike";
      case "van":  return "local-shipping";
      case "bus":  return "directions-bus";
      default:     return "directions-car";
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Sub-renders
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
          Filter by: {filtered.charAt(0).toUpperCase() + filtered.slice(1)}
        </Text>
        <Icon
          name={showFilterDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={22}
          color={colors.dark_gray}
        />
      </TouchableOpacity>

      {showFilterDropdown ? (
        <View style={styles.filterDropdown}>
          {[
            { value: "all",      label: "All Vehicles", iconComp: <Fontaswome name="list"   size={16} color={filtered === "all"      ? colors.white : colors.black} /> },
            { value: "approved", label: "Approved",     iconComp: <Fontaswome name="check"  size={16} color={filtered === "approved" ? colors.white : colors.black} /> },
            { value: "pending",  label: "Pending",      iconComp: <Icon2 name="timer-sand"  size={16} color={filtered === "pending"  ? colors.white : colors.black} /> },
            { value: "rejected", label: "Rejected",     iconComp: <Icon name="cancel"       size={16} color={filtered === "rejected" ? colors.white : colors.black} /> },
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
      <Image
        source={require("../../assets/Images/no-car-list.jpg")}
        style={styles.emptyStateImage}
      />
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
      item.subCategory === "car"   ? carImg   :
      item.subCategory === "auto"  ? autoImg  :
      item.subCategory === "van"   ? vanImg   :
      item.subCategory === "bus"   ? busImg   :
      item.subCategory === "truck" ? goodsImg : carImg;

    const isApproved = item.vehicleApprovedByAdmin === "approved";
    const isRejected = item.vehicleApprovedByAdmin === "rejected";

    return (
      <View style={styles.vehicleCard}>
        {/* Card Header */}
        <View style={styles.vehicleCardHeader}>
          <View style={[styles.statusBadge, getStatusStyle(item.vehicleApprovedByAdmin)]}>
            <Text style={styles.statusText}>
              {isApproved ? "✓ Approved"
                : item.vehicleApprovedByAdmin === "pending" ? "⏳ Pending"
                : isRejected ? "✗ Rejected"
                : "Unknown"}
            </Text>
          </View>
          <View style={styles.vehicleTypeBadge}>
            <Icon name={getVehicleIcon(item.subCategory)} size={14} color={colors.deep_blue} />
            <Text style={styles.vehicleTypeText}>
              {item.subCategory?.charAt(0).toUpperCase() + item.subCategory?.slice(1)}
            </Text>
          </View>
        </View>

        {/* Card Body */}
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
            {item.seatingCapacity ? (
              <View style={styles.infoRow}>
                <Icon name="people" size={16} color={colors.dark_gray} />
                <Text style={styles.infoLabel}>Seats:</Text>
                <Text style={styles.infoValue}>{item.seatingCapacity}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Card Footer */}
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

            {/* Edit button — approved AND pending vehicles */}
            {isApproved || item.vehicleApprovedByAdmin === "pending" ? (
              <TouchableOpacity
                style={[styles.actionButton, isApproved ? styles.editButton : styles.editButtonPending]}
                onPress={() => navigation.navigate("PassengerVehicleEdit", { vehicle: item })}
              >
                <Fontaswome name="pencil" size={16} color={isApproved ? colors.white : colors.deep_blue} />
                <Text style={[styles.actionButtonText, isApproved ? styles.editButtonText : styles.editButtonPendingText]}>
                  Edit
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* Rejected actions — Delete if refunded, Re-register if not */}
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

  // ─────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────
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
                <Icon name="search-off" size={60} color={colors.light_gray} />
                <Text style={styles.noResultsText}>No vehicles match the selected filter</Text>
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => handleFilterChange("all")}
                >
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

export default PassengerVehicleList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.dark_gray,
    fontWeight: "500",
  },
  headerContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.deep_blue,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.dark_gray,
    fontWeight: "400",
  },
  headerBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: "center",
  },
  headerCount: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.deep_blue,
  },
  headerCountLabel: {
    fontSize: 11,
    color: colors.dark_gray,
    fontWeight: "500",
  },
  filterSection: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    backgroundColor: colors.white,
    marginBottom: 12,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filterMainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  filterMainText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
    color: colors.dark_gray,
  },
  filterDropdown: {
    position: "absolute",
    top: 65,
    right: wp(5),
    left: wp(5),
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2000,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 2,
    backgroundColor: "#F8F9FA",
  },
  filterOptionActive: {
    backgroundColor: colors.deep_blue,
  },
  filterOptionText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "500",
    color: colors.black,
  },
  filterOptionTextActive: {
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(12),
  },
  vehicleCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  vehicleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 30,
  },
  statusApproved: { backgroundColor: "#EFF6FF" },
  statusPending:  { backgroundColor: "#FFF8E1" },
  statusRejected: { backgroundColor: "#FFEBEE" },
  statusDefault:  { backgroundColor: "#F5F5F5" },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  vehicleTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  vehicleTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.deep_blue,
  },
  vehicleCardBody: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 12,
  },
  vehicleImage: {
    width: 100,
    height: 80,
    resizeMode: "contain",
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 13,
    color: colors.dark_gray,
    marginLeft: 8,
    marginRight: 6,
    fontWeight: "500",
    width: 45,
  },
  infoValue: {
    fontSize: 14,
    color: colors.black,
    fontWeight: "600",
    flex: 1,
  },
  vehicleCardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#F8F9FA",
    padding: 10,
    borderRadius: 30,
  },
  toggleLabel: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  toggleLabelAvailable:   { color: "#4CAF50" },
  toggleLabelUnavailable: { color: "#9E9E9E" },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: colors.dark_gray,
  },
  deleteButton:       { backgroundColor: "#FFEBEE", borderColor: "#FFCDD2" },
  deleteButtonText:   { color: colors.red },
  editButton:         { backgroundColor: colors.deep_blue, borderColor: colors.deep_blue },
  editButtonText:     { color: colors.white },
  editButtonPending:  { backgroundColor: colors.white, borderColor: colors.deep_blue, borderWidth: 1.5 },
  editButtonPendingText: { color: colors.deep_blue },
  registerButton:     { backgroundColor: "#E3F2FD", borderColor: "#BBDEFB" },
  registerButtonText: { color: colors.blue },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(8),
    backgroundColor: "#F8F9FA",
    minHeight: hp(70),
  },
  emptyStateImage: {
    width: wp(70),
    height: hp(25),
    resizeMode: "contain",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.deep_blue,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: colors.dark_gray,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    opacity: 0.8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.deep_blue,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 3,
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(12),
    backgroundColor: colors.white,
    borderRadius: 20,
    marginTop: 20,
    paddingHorizontal: wp(8),
  },
  noResultsText: {
    fontSize: 16,
    color: colors.dark_gray,
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },
  clearFilterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.deep_blue,
    borderRadius: 30,
    elevation: 2,
  },
  clearFilterText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
});