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
import AxiosService, { getCorrectImageUrl } from "../utils/AxioService";
  
  const CarouselSlider = ({
    data, // Array of images or other data to display
    autoPlay = true, // Enable/disable autoplay
    scrollAnimationDuration = 2000, // Speed of carousel scroll animation
    height, // Custom height of the carousel
    onSnapToItem, // Callback when item is snapped
  }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const carouselRef = useRef();
    const width = Dimensions.get("window").width;
  
    // Handle snapping of items and trigger external callback
    const handleSnapToItem = (index) => {
      setActiveIndex(index);
      if (onSnapToItem) {
        onSnapToItem(index); // Call the parent's callback if provided
      }
    };
  
    // Pagination dots
    const renderPagination = () => {
      return (
        <View style={styles.pagination}>
          {data.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dot, activeIndex === index && styles.activeDot]}
              onPress={() => carouselRef.current?.scrollTo({ index })}
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
          height={height || width / 2.5} // Default height if not provided
          data={data}
          renderItem={({ item }) => {
            const imageUri = getCorrectImageUrl(item);
            return (
              <View style={styles.img_container}>
                <Image source={{ uri: imageUri }} style={styles.carousel_img} />
              </View>
            );
          }}
          autoPlay={autoPlay}
          scrollAnimationDuration={scrollAnimationDuration}
          snapEnabled
          onSnapToItem={handleSnapToItem} // Use the handle function
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
      marginBottom: 25,
      marginTop: 10,
    },
    carousel_img: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
      borderRadius: 14,
    },
    img_container: {
      flex: 1,
      marginHorizontal: 15,
      marginVertical: 5,
      borderRadius: 14,
      backgroundColor: colors.white,
      elevation: 5,
      shadowColor: colors.deep_blue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
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
      marginHorizontal: 4,
      borderRadius: 3,
    },
    activeDot: {
      width: 18,
      height: 6,
      backgroundColor: colors.deep_blue,
      borderRadius: 3,
    },
  });
  