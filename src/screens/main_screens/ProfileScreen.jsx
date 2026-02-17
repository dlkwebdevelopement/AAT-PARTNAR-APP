import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useContext } from "react";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../utils/constants";
import { AuthContext } from "../AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import Location from "react-native-vector-icons/FontAwesome6";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);

  const [vendorId, setVendorId] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [profileImg, setProfileImg] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (!user) return;
      const vendor = JSON.parse(user);
      setVendorId(vendor._id);

      const res = await AxiosService.post("vendor/getVendorById", { vendorId: vendor._id });
      if (res.status === 200) {
        const vendorData = res.data.user;
        const phone = String(vendorData.phoneNumber).slice(2);
        setUserName(vendorData.userName);
        setEmail(vendorData.email);
        setPhoneNumber(phone);
        setAddress(vendorData.address);
        setProfileImg(vendorData.profileImg);
      }
    } catch (error) {
      console.log("Error fetching profile:", error.message);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({ type: "error", text1: "Permission to access gallery denied!" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setProfileImg(result.assets[0].uri);
    }
  };

  const handlePhoneChange = (text) => {
    if (/[^0-9]/.test(text)) {
      Toast.show({ type: "error", text1: "Phone number must contain only digits" });
      return;
    }
    setPhoneNumber(text);
  };

  const handleEditProfile = async () => {
    setLoading(true);

    if (!profileImg) {
      Toast.show({ type: "error", text1: "Please select an image first" });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("vendorId", vendorId);
    formData.append("userName", userName);
    formData.append("email", email);
    formData.append("phoneNumber", phoneNumber);
    formData.append("address", address);

    if (imageUri) {
      const fileName = imageUri.split("/").pop();
      const fileType = fileName.split(".").pop();
      formData.append("profileImg", {
        uri: imageUri,
        name: fileName,
        type: `image/${fileType}`,
      });
    } else {
      formData.append("profileImg", profileImg);
    }

    try {
      const res = await AxiosService.post("vendor/editVendorProfile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 201) {
        Toast.show({ type: "success", text1: "Profile updated successfully!" });
        getUserData();
      } else {
        Toast.show({ type: "error", text1: "Failed to update profile" });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: error?.response?.data?.message || error.message });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getUserData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.main_container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.user_profile_main_container}>
        <View>
          <Image
            source={profileImg ? { uri: profileImg } : require("../../assets/Images/pro-pic.png")}
            style={styles.profile_pic}
          />
          <Pressable style={styles.edit_icon_container} onPress={pickImage}>
            <Image source={require("../../assets/Images/edit-icon.png")} style={styles.edit_icon} />
          </Pressable>
        </View>
        <View style={styles.user_info_container}>
          <Text style={styles.username_txt}>{userName}</Text>
          <Text style={styles.useremail_txt}>{email}</Text>
          <View style={styles.user_location_container}>
            <Location name="location-dot" color={colors.dark_gray} />
            <Text style={styles.useremail_txt}>{address}</Text>
          </View>
        </View>
      </View>

      <View style={styles.user_info_edit_main_container}>
        <Text style={styles.label}>Name</Text>
        <TextInput value={userName} style={styles.input_fields} onChangeText={setUserName} />
        <Text style={styles.label}>Email</Text>
        <TextInput value={email} style={styles.input_fields} onChangeText={setEmail} />
        <Text style={styles.label}>Phone Number</Text>
        <TextInput value={phoneNumber} style={styles.input_fields} onChangeText={handlePhoneChange} maxLength={10} />
        <Text style={styles.label}>Address</Text>
        <TextInput value={address} style={styles.input_fields} onChangeText={setAddress} />

        <TouchableOpacity style={styles.save_btn_container} onPress={handleEditProfile}>
          {loading ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.save_btn_txt}>Save changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout_btn_container} onPress={logout}>
          <Feather name="power" size={18} color={colors.white} />
          <Text style={styles.logout_btn_txt}>Log out</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  main_container: { backgroundColor: colors.light_gray },
  user_profile_main_container: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: colors.white, paddingVertical: 20 },
  profile_pic: { width: wp(27), height: hp(12), borderRadius: 100, resizeMode: "cover" },
  edit_icon: { width: 30, height: 30 },
  edit_icon_container: { position: "absolute", right: 10, bottom: 0, borderColor: colors.gray, borderWidth: 1, backgroundColor: colors.white, borderRadius: 100 },
  user_info_container: { paddingLeft: wp(7), width: "70%" },
  username_txt: { fontSize: hp(2.8), fontWeight: "700" },
  useremail_txt: { fontSize: hp(1.6), fontWeight: "500", color: colors.dark_gray },
  user_location_container: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  user_info_edit_main_container: { paddingHorizontal: 15, paddingTop: 20, backgroundColor: colors.light_gray, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  input_fields: { flex: 1, height: 37, fontSize: 15, backgroundColor: colors.white, paddingHorizontal: 10, borderRadius: 7, marginBottom: 20, borderWidth: 0.3, borderColor: colors.dark_gray },
  save_btn_container: { backgroundColor: colors.dark_green, padding: 10, marginBottom: hp(1), borderRadius: 7 },
  save_btn_txt: { color: colors.white, textAlign: "center", fontWeight: "600", fontSize: 16 },
  logout_btn_container: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.black, padding: 10, marginTop: hp(3), borderRadius: 7, gap: 10, marginBottom: hp(5) },
  logout_btn_txt: { fontSize: 16, fontWeight: "600", color: colors.white },
});
