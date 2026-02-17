import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import React, { useState, useRef } from "react";
import Carousel from "react-native-reanimated-carousel";
import { colors } from "../utils/constants";
import { configureReanimatedLogger,ReanimatedLogLevel } from "react-native-reanimated";

const CarouselSlider = () => {
  const [activeIndex, setactiveIndex] = useState(0);
  const carouselRef = useRef();
  const width = Dimensions.get("window").width;

  const images = [
    { image: require("../assets/Images/carousel-1.jpg") },
    { image: require("../assets/Images/carousel-2.jpg") },
    { image: require("../assets/Images/carousel-3.jpg") },
  ];
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false, 
  });

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.dot, activeIndex === index && styles.activeDot]}
            onPress={() => carouselRef.current.scrolltoindex(index)}
          />
        ))}
      </View>
    );
  };
  return (
    <View style={styles.main_container}>
      <Carousel
        ref={carouselRef}
        width={width}
        height={width / 2.5}
        data={images}
        renderItem={({ item }) => (
          <View style={styles.img_container}>
            <Image source={item.image} style={styles.carousel_img} />
          </View>
        )}
        autoPlay
        scrollAnimationDuration={2000}
        snapEnabled
        onSnapToItem={(index) => setactiveIndex(index)}
      />
      {renderPagination()}
    </View>
  );
};

export default CarouselSlider;

const styles = StyleSheet.create({
  main_container: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    marginTop: 5,
  },
  carousel_img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  img_container: {
    marginHorizontal: 1,
    overflow: "hidden",
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: -15,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: colors.gray,
    marginHorizontal: 3,
    borderRadius: 100,
  },
  activeDot: {
    width: 12,
    height: 6,
    backgroundColor: colors.light_green,
  },
});
