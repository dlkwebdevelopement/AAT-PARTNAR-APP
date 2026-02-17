import { StyleSheet, Platform, StatusBar } from "react-native";

export default StyleSheet.create({
  safe_area: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
});
