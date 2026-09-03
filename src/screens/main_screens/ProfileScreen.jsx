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
  Modal,
  Alert,
  Clipboard,
  Share,
  SafeAreaView,
  Dimensions,
  Animated,
  Easing,
  Platform,
  PermissionsAndroid,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../utils/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService, { getCorrectImageUrl } from "../../utils/AxioService";
import Toast from "react-native-toast-message";
import Location from "react-native-vector-icons/FontAwesome6";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "@env";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";

const isValidProfileImage = (img) => {
  if (!img) return false;
  if (typeof img !== "string") return false;
  const cleanImg = img.trim().toLowerCase();
  if (cleanImg === "" || cleanImg === "undefined" || cleanImg === "null") return false;
  if (cleanImg.endsWith("/undefined") || cleanImg.endsWith("/null")) return false;
  return true;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Professional Card Component
const Card = ({ children, style, elevation = 2, ...props }) => (
  <View style={[styles.card, { elevation }, style]} {...props}>
    {children}
  </View>
);

// Professional Button Component
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  outlined = false,
  rounded = false,
  loading = false,
  disabled = false,
  onPress,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    const variants = {
      primary: { bg: colors.deep_blue, color: '#FFFFFF', border: colors.deep_blue },
      secondary: { bg: '#6c757d', color: '#FFFFFF', border: '#6c757d' },
      success: { bg: '#28a745', color: '#FFFFFF', border: '#28a745' },
      danger: { bg: '#dc3545', color: '#FFFFFF', border: '#dc3545' },
      warning: { bg: '#ffc107', color: '#000000', border: '#ffc107' },
      yellow: { bg: '#FBBF24', color: colors.deep_blue, border: '#FBBF24' },
      info: { bg: '#17a2b8', color: '#FFFFFF', border: '#17a2b8' },
      light: { bg: '#f8f9fa', color: '#212529', border: '#f8f9fa' },
      dark: { bg: '#343a40', color: '#FFFFFF', border: '#343a40' },
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 12 },
      md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 14 },
      lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 16 },
    };
    return sizes[size] || sizes.md;
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyle = [
    styles.button,
    {
      backgroundColor: outlined ? 'transparent' : variantStyles.bg,
      borderColor: variantStyles.border,
      borderWidth: outlined ? 2 : 0,
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      borderRadius: 30,
      opacity: disabled ? 0.6 : 1,
    },
    style,
  ];

  const textStyle = [
    styles.buttonText,
    {
      color: outlined ? variantStyles.bg : variantStyles.color,
      fontSize: sizeStyles.fontSize,
    },
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={outlined ? variantStyles.bg : variantStyles.color} />
      ) : (
        <Text style={textStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

// Professional Input Component
const Input = ({
  label,
  error,
  icon,
  iconRight,
  helperText,
  containerStyle,
  ...props
}) => (
  <View style={[styles.inputContainer, containerStyle]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <View style={[
      styles.inputWrapper,
      error && styles.inputError
    ]}>
      {icon && <View style={styles.inputIconLeft}>{icon}</View>}
      <TextInput
        style={[
          styles.input,
          icon && styles.inputWithIconLeft,
          iconRight && styles.inputWithIconRight,
        ]}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {iconRight && <View style={styles.inputIconRight}>{iconRight}</View>}
    </View>
    {error && <Text style={styles.inputErrorText}>{error}</Text>}
    {helperText && <Text style={styles.inputHelperText}>{helperText}</Text>}
  </View>
);

// Professional Modal Component
const ProfessionalModal = ({ visible, onClose, title, children, size = 'md' }) => {
  const getSize = () => {
    const sizes = {
      sm: { maxWidth: 400, padding: 20 },
      md: { maxWidth: 500, padding: 24 },
      lg: { maxWidth: 600, padding: 28 },
      full: { maxWidth: '90%', padding: 24 },
    };
    return sizes[size] || sizes.md;
  };

  const sizeStyles = getSize();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { maxWidth: sizeStyles.maxWidth, padding: sizeStyles.padding }
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <View style={styles.modalTitleIcon}>
                <MaterialCommunityIcons name="account" size={20} color={colors.deep_blue} />
              </View>
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalDivider} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const contentMaxWidth = isTablet ? 640 : undefined;



  // Profile state
  const [vendorId, setVendorId] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [profileImg, setProfileImg] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Referral state
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [referralLoading, setReferralLoading] = useState(false);

  const SERVER_URL = API_BASE_URL || "https://worldofaat.com";



  useEffect(() => {
    getUserData();
  }, []);

  useEffect(() => {
    if (vendorId) {
      fetchReferralInfo();
    }
  }, [vendorId]);

  const getUserData = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (!user) return;
      const vendor = JSON.parse(user);
      if (!vendor || !vendor._id) return;
      setVendorId(vendor._id);

      const res = await AxiosService.post("vendor/getVendorById", { vendorId: vendor._id });
      if (res.status === 200 && res.data.user) {
        const vendorData = res.data.user;
        const phone = vendorData.phoneNumber ? String(vendorData.phoneNumber).slice(2) : "";
        setUserName(vendorData.userName || "");
        setEmail(vendorData.email || "");
        setPhoneNumber(phone);
        setAddress(vendorData.address || "");
        setProfileImg(vendorData.profileImg || "");
        await AsyncStorage.setItem("user", JSON.stringify(vendorData));
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to load profile" });
    }
  };

  const fetchReferralInfo = async () => {
    if (!vendorId) return;
    try {
      setReferralLoading(true);
      const res = await AxiosService.get(`vendor/getReferralInfo?vendorId=${vendorId}`);
      if (res.data && res.data.success !== false) {
        setReferralCode(res.data.referralCode || "");
        setReferralCount(res.data.referralCount || 0);
      } else {
        const safeName = userName ? userName.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : "";
        const safePhone = phoneNumber ? phoneNumber.slice(-4) : "";
        setReferralCode(safeName && safePhone ? `AAT-${safeName}${safePhone}` : "");
        setReferralCount(0);
      }
    } catch (error) {
      console.log("Referral info not available yet");
      if (vendorId) {
        const safeName = userName ? userName.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : "";
        const safePhone = phoneNumber ? phoneNumber.slice(-4) : "";
        setReferralCode(safeName && safePhone ? `AAT-${safeName}${safePhone}` : "");
      }
    } finally {
      setReferralLoading(false);
    }
  };

  const handleCopyReferralCode = () => {
    if (referralCode) {
      Clipboard.setString(referralCode);
      Toast.show({ type: "success", text1: "Referral code copied!" });

    }
  };

  const handleShareReferralCode = async () => {
    if (!referralCode) return;
    try {
      const message = `✨ Join me on AAT using my referral code: ${referralCode}! 🚗\n\nDownload the app now!`;
      await Share.share({
        message: message,
        title: "Share Referral Code",
      });
    } catch (error) {
      console.log("Error sharing referral code:", error);
    }
  };

  const getFileInfo = async (uri) => {
    try {
      const fileInfo = {
        size: 0,
        name: uri.split("/").pop() || "profile.jpg",
      };
      try {
        const response = await fetch(uri, { method: 'HEAD' });
        const contentLength = response.headers.get('Content-Length');
        if (contentLength) {
          fileInfo.size = parseInt(contentLength, 10);
        }
      } catch (e) {
        console.log("Could not get file size, continuing...");
      }
      return fileInfo;
    } catch (error) {
      console.error("Error getting file info:", error);
      return null;
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: "Gallery Permission",
            message: "App needs access to your gallery to upload profile picture",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Toast.show({ type: "error", text1: "Permission to access gallery denied!" });
          return;
        }
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Toast.show({ type: "error", text1: "Permission to access gallery denied!" });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setImageUri(selectedAsset.uri);
        setProfileImg(selectedAsset.uri);
        Toast.show({ type: "success", text1: "Image selected successfully!" });
      } else {
        Toast.show({ type: "info", text1: "No image selected" });
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to pick image: " + (error.message || "Unknown error")
      });
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs access to your camera to take profile picture",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Toast.show({ type: "error", text1: "Camera permission denied!" });
          return;
        }
      } else {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Toast.show({ type: "error", text1: "Camera permission denied!" });
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setImageUri(selectedAsset.uri);
        setProfileImg(selectedAsset.uri);
        Toast.show({ type: "success", text1: "Photo captured successfully!" });
      }
    } catch (error) {
      console.error("Camera error:", error);
      Toast.show({ type: "error", text1: "Failed to take photo" });
    }
  };

  const renderImagePickerOptions = () => {
    Alert.alert(
      "Upload Profile Picture",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: handleTakePhoto,
        },
        {
          text: "Choose from Gallery",
          onPress: pickImage,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
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
    try {
      const formData = new FormData();
      formData.append("vendorId", vendorId);
      formData.append("userName", userName);
      formData.append("email", email);
      formData.append("phoneNumber", phoneNumber);
      formData.append("address", address);

      if (imageUri) {
        const fileInfo = await getFileInfo(imageUri);
        if (fileInfo) {
          if (fileInfo.size > 5 * 1024 * 1024) {
            Toast.show({ type: "error", text1: "Image size should be less than 5MB" });
            setLoading(false);
            return;
          }

          const fileName = imageUri.split("/").pop() || "profile.jpg";
          const fileType = fileName.split(".").pop()?.toLowerCase() || "jpg";

          const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
          if (!validTypes.includes(fileType)) {
            Toast.show({ type: "error", text1: "Invalid file type. Please upload JPG, PNG, or GIF" });
            setLoading(false);
            return;
          }

          formData.append("profileImg", {
            uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
            name: `profile_${Date.now()}.${fileType}`,
            type: `image/${fileType}`,
          });
        } else {
          Toast.show({ type: "error", text1: "Failed to process image" });
          setLoading(false);
          return;
        }
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Toast.show({ type: "error", text1: "Authentication failed" });
        setLoading(false);
        return;
      }

      const activeUrl = AxiosService.defaults.baseURL;
      const response = await fetch(`${activeUrl}/vendor/editVendorProfile`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await response.json();
      if (response.status === 201 || response.status === 200) {
        Toast.show({ type: "success", text1: "Profile updated successfully!" });
        setImageUri(null);
        await getUserData();
        setShowEditProfileModal(false);
      } else {
        Toast.show({ type: "error", text1: resData.message || "Failed to update profile" });
      }
    } catch (error) {
      console.error("Edit profile error:", error);
      Toast.show({
        type: "error",
        text1: error.message || "Failed to update profile"
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getUserData();
    if (vendorId) {
      await fetchReferralInfo();
    }
    setRefreshing(false);
  };

  const handleNavigateToReferral = () => {
    try {
      navigation.navigate("Referral");
    } catch (error) {
      Toast.show({
        type: "info",
        text1: "Referral screen coming soon!"
      });
    }
  };

  const renderEditProfileModal = () => (
    <ProfessionalModal
      visible={showEditProfileModal}
      onClose={() => setShowEditProfileModal(false)}
      title="Edit Profile"
      size="md"
    >
      <View style={styles.modalBody}>
        <Input
          label="Full Name"
          value={userName}
          onChangeText={setUserName}
          placeholder="Enter your full name"
          icon={<Feather name="user" size={18} color="#9CA3AF" />}
        />

        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<MaterialCommunityIcons name="email" size={18} color="#9CA3AF" />}
        />

        <Input
          label="Phone Number"
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          maxLength={10}
          icon={<MaterialCommunityIcons name="phone" size={18} color="#9CA3AF" />}
        />

        <Input
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Enter your address"
          multiline
          numberOfLines={3}
          icon={<MaterialCommunityIcons name="map-marker" size={18} color="#9CA3AF" />}
          containerStyle={styles.addressInputContainer}
        />

        <Button
          variant="primary"
          size="lg"
          rounded
          loading={loading}
          onPress={handleEditProfile}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
      </View>
    </ProfessionalModal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <View style={styles.container}>
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.deep_blue}
                colors={[colors.deep_blue]}
              />
            }
          >
            <View style={[styles.contentWrapper, { maxWidth: contentMaxWidth }]}>
              {/* Profile Header Card */}
              <View style={styles.profileHeaderContainer}>
                  <View style={styles.profileImageContainer}>
                    <Image
                      source={
                        imageUri ?
                          { uri: imageUri } :
                          isValidProfileImage(profileImg) ? {
                            uri: profileImg.startsWith("file://") ||
                              profileImg.startsWith("content://") ||
                              profileImg.startsWith("assets-library://")
                              ? profileImg
                              : getCorrectImageUrl(profileImg),
                          } : require("../../../assets/Aatpartner.png")
                      }
                      style={styles.profileImage}
                    />
                    <TouchableOpacity
                      style={styles.profileImageEditBtn}
                      onPress={renderImagePickerOptions}
                      activeOpacity={0.7}
                    >
                      <View style={styles.editIconContainer}>
                        <MaterialCommunityIcons name="camera" size={16} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{userName || "Your Name"}</Text>
                    <Text style={styles.profileEmail}>{email || "your@email.com"}</Text>
                    <View style={styles.profileLocation}>
                      <MaterialCommunityIcons name="map-marker" size={14} color="#6B7280" />
                      <Text style={styles.profileLocationText}>{address || "Add your location"}</Text>
                    </View>
                    <View style={styles.referralInlineContainer}>
                      <MaterialCommunityIcons name="account-group" size={14} color="#6B7280" />
                      <Text style={styles.referralInlineText}>{referralLoading ? "..." : `${referralCount} Referrals`}</Text>
                    </View>
                  </View>
              </View>

              {/* Stats Cards */}
              {/* Referral Card */}
              <View>
                <Card style={styles.referralCard}>
                  <LinearGradient
                    colors={[colors.deep_blue, colors.deep_blue]}
                    style={styles.referralCardGradient}
                  >
                    <View style={styles.referralHeader}>
                      <View style={styles.referralBadgeContainer}>
                        <MaterialCommunityIcons name="gift-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.referralBadgeText}>Refer & Earn</Text>
                      </View>
                      <View style={styles.referralCountContainer}>
                        <Ionicons name="people" size={16} color="#FFFFFF" />
                        <Text style={styles.referralCountText}>
                          {referralLoading ? "..." : `${referralCount} referred`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.referralCodeContainer}>
                      <Text style={styles.referralCodeLabel}>Your Referral Code</Text>
                      <View style={styles.referralCodeDisplay}>
                        <Text style={styles.referralCodeValue}>
                          {referralLoading ? "..." : referralCode || "------"}
                        </Text>

                      </View>
                    </View>

                    <View style={styles.referralActions}>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={handleCopyReferralCode}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="content-copy" size={16} color={colors.deep_blue} />
                        <Text style={styles.copyButtonText}>Copy Code</Text>
                      </TouchableOpacity>
                      <Button
                        variant="light"
                        size="md"
                        rounded
                        onPress={handleShareReferralCode}
                        style={styles.shareButton}
                      >
                        <MaterialCommunityIcons name="share-variant" size={16} color={colors.deep_blue} />
                        <Text style={styles.shareButtonText}>Share Code</Text>
                      </Button>
                    </View>


                  </LinearGradient>
                </Card>
              </View>

              {/* Personal Information Card */}
              <View>
                <Card style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <View style={styles.infoCardTitleContainer}>
                      <MaterialCommunityIcons name="account" size={20} color={colors.deep_blue} />
                      <Text style={styles.infoCardTitle}>Personal Information</Text>
                    </View>
                  </View>

                  {[
                    { icon: "account", label: "Full Name", value: userName || "N/A" },
                    { icon: "email", label: "Email Address", value: email || "N/A" },
                    { icon: "phone", label: "Phone Number", value: phoneNumber ? `+91 ${phoneNumber}` : "N/A" },
                    { icon: "map-marker", label: "Address", value: address || "N/A" },
                  ].map((item, index) => (
                    <View key={index} style={[
                      styles.infoRow,
                      index === 3 && styles.infoRowLast
                    ]}>
                      <View style={styles.infoIconContainer}>
                        <MaterialCommunityIcons name={item.icon} size={18} color={colors.deep_blue} />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>{item.label}</Text>
                        <Text style={styles.infoValue}>{item.value}</Text>
                      </View>
                    </View>
                  ))}

                  <Button
                    variant="primary"
                    size="md"
                    rounded
                    onPress={() => setShowEditProfileModal(true)}
                    style={styles.editProfileFullBtn}
                  >
                    <MaterialCommunityIcons name="account-edit" size={18} color="#FFFFFF" />
                    <Text style={styles.editProfileFullBtnText}>Edit Profile</Text>
                  </Button>
                </Card>
              </View>
            </View>
          </ScrollView>
        </View>

        {renderEditProfileModal()}
        <Toast />
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingBottom: hp(5),
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    paddingHorizontal: wp(4),
  },

  // Header Styles
  headerSection: {
    paddingVertical: hp(1.5),
  },
  greetingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingText: {
    fontSize: Math.min(hp(1.5), 13),
    color: "#6B7280",
    fontWeight: "500",
  },
  userGreetingName: {
    fontSize: Math.min(hp(2.5), 22),
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 2,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  // Profile Header Container
  profileHeaderContainer: {
    padding: wp(5),
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: Math.min(wp(35), 140),
    height: Math.min(wp(35), 140),
    borderRadius: 100,
    borderWidth: 4,
    borderColor: colors.deep_blue,
  },
  profileImageEditBtn: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  editIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.deep_blue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    alignItems: "center",
    width: "100%",
  },
  profileName: {
    fontSize: Math.min(hp(2.2), 20),
    fontWeight: "700",
    color: "#1F2937",
  },
  profileEmail: {
    fontSize: Math.min(hp(1.5), 13),
    color: "#6B7280",
    marginTop: 2,
  },
  profileLocation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    gap: 6,
  },
  referralInlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    gap: 6,
  },
  referralInlineText: {
    fontSize: Math.min(hp(1.3), 12),
    color: "#6B7280",
    fontWeight: "600",
  },
  profileLocationText: {
    fontSize: Math.min(hp(1.3), 12),
    color: "#6B7280",
    flexShrink: 1,
  },
  editProfileBtn: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignSelf: "center",
  },
  editProfileBtnText: {
    color: colors.deep_blue,
    fontSize: Math.min(hp(1.3), 12),
    fontWeight: "600",
    marginLeft: 4,
  },

  // Stats Cards
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(2),
    gap: wp(3),
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    padding: wp(4),
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: Math.min(hp(2.2), 20),
    fontWeight: "700",
    color: colors.deep_blue,
  },
  statLabel: {
    fontSize: Math.min(hp(1.3), 12),
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 2,
  },

  // Referral Card
  referralCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: hp(2),
    borderWidth: 0,
  },
  referralCardGradient: {
    padding: wp(5),
  },
  referralHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  referralBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  referralBadgeText: {
    color: "#FFFFFF",
    fontSize: Math.min(hp(1.5), 13),
    fontWeight: "700",
  },
  referralCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  referralCountText: {
    color: "#FFFFFF",
    fontSize: Math.min(hp(1.3), 12),
    fontWeight: "600",
  },
  referralCodeContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 16,
  },
  referralCodeLabel: {
    fontSize: Math.min(hp(1.2), 11),
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  referralCodeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  referralCodeValue: {
    fontSize: Math.min(hp(2.6), 24),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  copyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBBF24", // vibrant yellow
    paddingVertical: 12,
    borderRadius: 30,
    gap: 6,
  },
  copyButtonText: {
    color: colors.deep_blue,
    fontSize: Math.min(hp(1.3), 12),
    fontWeight: "800",
  },
  referralActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    paddingVertical: 12,
  },
  shareButtonText: {
    color: colors.deep_blue,
    fontWeight: "700",
    marginLeft: 8,
  },
  referralFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  referralFooterText: {
    color: "#FFFFFF",
    fontSize: Math.min(hp(1.4), 13),
    fontWeight: "600",
    opacity: 0.9,
  },

  // Information Card
  infoCard: {
    borderRadius: 20,
    padding: wp(5),
    marginTop: hp(2),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoCardHeader: {
    marginBottom: 16,
  },
  infoCardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoCardTitle: {
    fontSize: Math.min(hp(1.9), 17),
    fontWeight: "700",
    color: "#1F2937",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: Math.min(hp(1.15), 11),
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: Math.min(hp(1.6), 15),
    color: "#1F2937",
    fontWeight: "500",
    marginTop: 2,
  },
  editProfileFullBtn: {
    marginTop: 16,
    paddingVertical: 14,
    width: "60%",
    alignSelf: "center",
  },
  editProfileFullBtnText: {
    color: "#FFFFFF",
    fontSize: Math.min(hp(1.6), 15),
    fontWeight: "600",
    marginLeft: 8,
  },

  // Card Component
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Button Component
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: "600",
    textAlign: "center",
  },

  // Input Component
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: Math.min(hp(1.2), 11),
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: Math.min(hp(1.6), 15),
    color: "#1F2937",
    minHeight: 48,
  },
  inputWithIconLeft: {
    paddingLeft: 8,
  },
  inputWithIconRight: {
    paddingRight: 8,
  },
  inputIconLeft: {
    paddingLeft: 12,
  },
  inputIconRight: {
    paddingRight: 12,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  inputErrorText: {
    color: "#EF4444",
    fontSize: Math.min(hp(1.2), 12),
    marginTop: 4,
  },
  inputHelperText: {
    color: "#6B7280",
    fontSize: Math.min(hp(1.2), 12),
    marginTop: 4,
  },
  addressInputContainer: {
    marginBottom: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: Math.min(hp(2.2), 20),
    fontWeight: "700",
    color: "#1F2937",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  modalBody: {
    paddingBottom: 8,
  },
  saveButton: {
    marginTop: 8,
  },
});

