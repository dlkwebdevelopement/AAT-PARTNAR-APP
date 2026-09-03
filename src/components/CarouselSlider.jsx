import {
  StyleSheet,
  View,
  Dimensions,
  Image,
} from "react-native";
import React from "react";

const CarouselSlider = () => {
  const width = Dimensions.get("window").width;

  return (
    <View style={styles.main_container}>
      <View style={[styles.fan_container, { width: width - 30 }]}>
        
        {/* Left Image (Tilted Left) */}
        <Image 
          source={require("../assets/Images/carousel-1.jpg")} 
          style={[styles.fan_img, styles.img_left]} 
        />

        {/* Right Image (Tilted Right) */}
        <Image 
          source={require("../assets/Images/carousel-3.jpg")} 
          style={[styles.fan_img, styles.img_right]} 
        />

        {/* Center Image (Top Layer) */}
        <Image 
          source={require("../assets/Images/carousel-2.jpg")} 
          style={[styles.fan_img, styles.img_center]} 
        />
        
      </View>
    </View>
  );
};

export default CarouselSlider;

const styles = StyleSheet.create({
  main_container: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  fan_container: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  fan_img: {
    position: "absolute",
    borderRadius: 16,
    resizeMode: "cover",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  img_left: {
    width: "45%",
    height: "80%",
    left: "5%",
    transform: [{ rotate: "-12deg" }],
    zIndex: 1,
  },
  img_right: {
    width: "45%",
    height: "80%",
    right: "5%",
    transform: [{ rotate: "12deg" }],
    zIndex: 1,
  },
  img_center: {
    width: "50%",
    height: "95%",
    zIndex: 2,
  },
});
