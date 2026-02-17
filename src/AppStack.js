import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useContext } from "react";
import { AuthContext } from "./screens/AuthContext";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import SignUpScreen from "./screens/SignUpScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import OtpInputScreen from "./screens/OtpInputScreen";
import NewPasswordScreen from "./screens/NewPasswordScreen";
import HomeScreen from "./screens/main_screens/HomeScreen";
import { colors } from "./utils/constants";
import Custom_drawer_style from "./utils/Custom_drawer_style";
import Menu_icon from "react-native-vector-icons/Entypo";
import Home_Icon from "react-native-vector-icons/Octicons";
import User_Icon from "react-native-vector-icons/Feather";
import Notify from "react-native-vector-icons/Ionicons";
import Icon from "react-native-vector-icons/AntDesign";
import ProfileScreen from "./screens/main_screens/ProfileScreen";
import VehicleManageScreen from "./screens/main_screens/VehicleManageScreen";
import SupportScreen from "./screens/main_screens/SupportScreen";
import BookingsScreen from "./screens/main_screens/BookingsScreen";
import Support_Icon from "react-native-vector-icons/FontAwesome5";
import EarningsScreen from "./screens/main_screens/EarningsScreen";
import NotificationScreen from "./screens/main_screens/NotificationScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";
import BecomeVendorScreen from "./screens/main_screens/BecomeVendorScreen";
import CarRegForm_screen from "./screens/passenger_vehicle_reg_form/CarRegForm_screen";
import AutoRegForm_screen from "./screens/passenger_vehicle_reg_form/AutoRegForm_screen";
import VanRegForm_screen from "./screens/passenger_vehicle_reg_form/VanRegForm_screen";
import BusRegForm_screen from "./screens/passenger_vehicle_reg_form/BusRegForm_screen";
import GoodsRegForm_screen from "./screens/goods_vehicle_reg_form/GoodsRegForm_screen";
import AutoBookingDetails_screen from "./screens/passenger_vehicle_booking/AutoBookingDetails_screen";
import PassengerVehicleView from "./screens/View_vehicleScreens/PassengerVehicleView";
import PassengerVehicleEdit from "./screens/Edit_vehicleScreens/PassengerVehicleEdit";
import GoodsVehicleView from "./screens/View_vehicleScreens/GoodsVehicleView";
import GoodsVehicleEdit from "./screens/Edit_vehicleScreens/GoodsVehicleEdit";
import CarReregForm from "./screens/passenger_vehicle_Rereg_form/CarReregForm";
import AutoReregForm from "./screens/passenger_vehicle_Rereg_form/AutoReregForm";
import VanReregForm from "./screens/passenger_vehicle_Rereg_form/VanReregForm";
import BusReregForm from "./screens/passenger_vehicle_Rereg_form/BusReregForm";
import TruckRereg from "./screens/goodsVehicleRereg/TruckRereg";
import TermsAndConditions from "./screens/TermsAndConditions";
import PrivacyPolicy from "./screens/PrivacyPolicy";
import RefunPolicy from "./screens/RefunPolicy";
import LoginWithPhoneNo from "./screens/main_screens/LoginWithPhoneNo";
import LoginOTPVerify from "./screens/main_screens/LoginOTPVerify";
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const AppStack = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Login"
    >
      {isAuthenticated ? (
        <Stack.Screen name="MainHome" component={HomeNavigation} />
      ) : (
        <>
        {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
        <Stack.Screen name="Login" component={LoginWithPhoneNo} />
        <Stack.Screen name="Login OTP Verify" component={LoginOTPVerify} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
      
      <Stack.Screen name="Reset_password" component={ResetPasswordScreen} />
      <Stack.Screen name="Otp" component={OtpInputScreen} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="BecomeVendor" component={BecomeVendorScreen} />
      {/* passenger vehicle registration form screens */}
      <Stack.Screen name="CarRegForm" component={CarRegForm_screen} />
      <Stack.Screen name="AutoRegForm" component={AutoRegForm_screen} />
      <Stack.Screen name="VanRegForm" component={VanRegForm_screen} />
      <Stack.Screen name="BusRegForm" component={BusRegForm_screen} />
      {/* goods vehicle registration form screen */}
      <Stack.Screen name="GoodsRegForm" component={GoodsRegForm_screen} />
      <Stack.Screen name="CarReregForm" component={CarReregForm} />
      {/* passenger vehicle booking details screen */}
      <Stack.Screen
        name="AutoBookingDetails"
        component={AutoBookingDetails_screen}
      />
      {/* vehicle view screens */}
      <Stack.Screen
        name="PassengerVehicleView"
        component={PassengerVehicleView}
      />
      <Stack.Screen name="GoodsVehicleView" component={GoodsVehicleView} /> 

      {/* vehicle edit screens */}
      <Stack.Screen
        name="PassengerVehicleEdit"
        component={PassengerVehicleEdit}
      />
      <Stack.Screen  name="TruckRereg" component={TruckRereg}/>
      <Stack.Screen name="AutoReregForm" component={AutoReregForm}/>
      <Stack.Screen name="VanReregForm" component={VanReregForm}/>
      <Stack.Screen name="BusReregForm" component={BusReregForm}/>
      <Stack.Screen name="GoodsVehicleEdit" component={GoodsVehicleEdit} />
      <Stack.Screen options={{
        headerShown:true
      }} name="Terms and Conditions (T&C)" component={TermsAndConditions}/>
       <Stack.Screen options={{
      headerShown:true
    }} name="Privacy Policy" component={PrivacyPolicy}/>
     <Stack.Screen options={{
      headerShown:true
    }} name="Refund Policy" component={RefunPolicy}/>
    
    </Stack.Navigator>
    
    
  );
};
// Drawer navigation
const HomeNavigation = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <Custom_drawer_style {...props} />}
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        drawerLabelStyle: {
          fontSize: 15,
          marginLeft: -22,
        },
        headerLeft: () => (
          <Menu_icon
            name="menu"
            size={30}
            style={{ marginLeft: 20 }}
            onPress={navigation.toggleDrawer}
          />
        ),
        drawerActiveBackgroundColor: colors.label_green,
        drawerActiveTintColor: colors.black,
        headerStyle: {
          backgroundColor: colors.light_gray,
        },
      })}
    >
      {/* home screen */}
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Home_Icon name="home" size={15} color={colors.black} />
          ),
        }}
      />
      {/* Profile screen */}
      <Drawer.Screen
        name="My Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color }) => <User_Icon name="user" size={15} />,
        }}
      />
      {/* Vehicle Management screen*/}
      <Drawer.Screen
        name="Vehicle Management"
        component={VehicleManageScreen}
        options={{
          drawerIcon: ({ color }) => <Support_Icon name="car" size={15} />,
        }}
      />

      {/* Bookings screen */}
      <Drawer.Screen
        name="My Bookings"
        component={BookingsScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Support_Icon name="clipboard-list" size={15} />
          ),
        }}
      />
      {/* Earnings screen*/}
      <Drawer.Screen
        name="My Earnings"
        component={EarningsScreen}
        options={{
          drawerIcon: ({ color }) => <Support_Icon name="coins" size={15} />,
        }}
      />
      {/* Notification Screen */}
      <Drawer.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          drawerIcon: ({ color }) => <Notify name="notifications" size={15} />,
        }}
      />
      {/* support screen */}
      {/* <Drawer.Screen
        name="Support"
        component={SupportScreen}
        options={{
          drawerIcon: ({ color }) => <Icon name="customerservice" size={15} />,
        }}
      /> */}
    </Drawer.Navigator>
  );
};

export default AppStack;

const styles = StyleSheet.create({});
