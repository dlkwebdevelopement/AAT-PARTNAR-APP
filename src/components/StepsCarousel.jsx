import { StyleSheet, Text, View, Dimensions, Image } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { colors } from "../utils/constants";
import Carousel from "react-native-reanimated-carousel";
import { infoData } from "../Data/Info_data";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

const { width } = Dimensions.get("window");

const StepsCarousel = () => {
  return (
    //   steps carousel main container
    <View style={styles.main_container}>
      {/* heading text */}
      <Text style={styles.steps_main_heading_txt}>
        Vendor Enrollment Process
      </Text>
      {/* carousel */}
      <Carousel
        width={width}
        height={110}
        loop
        snapEnabled
        autoPlay={true}
        scrollAnimationDuration={4000}
        
        data={infoData}
        renderItem={({ item }) => (
          <View style={styles.main_carousel_container}>
            {/* image container */}
            <View style={styles.img_container}>
              <Image source={item.img} style={styles.img} />
            </View>
            {/* description section */}
            <View style={styles.desc_container}>
              <Text style={styles.step_text}>{item.step}</Text>
              <Text style={styles.heading_txt}>{item.heading}</Text>
              <Text style={styles.desc_txt}>{item.desc}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default StepsCarousel;

const styles = StyleSheet.create({
  main_container: {
    marginVertical: 20,
    backgroundColor: colors.very_light_gray,
    padding: 15,
    overflow: "hidden",
    borderRadius: 10,
    width: "100%",
    borderWidth:0.5,
    borderColor:colors.dark_green
  },
  steps_main_heading_txt: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    color:colors.black
  },
  //   carousel styling
  main_carousel_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    width: wp(84),
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
    flexWrap: "wrap",
    height: 100,
    gap:10,
    borderWidth:0.3,
    borderColor:colors.dark_gray
  },
//   img_container:{
//     borderWidth:1,
//     borderColor:colors.dark_green,
//     padding:5,
//     borderRadius:5,
//     width:50,
//     height:50,
//     alignItems:'center',
//     justifyContent:'center'
//   },
  img: {
    width: 50,
    height: 50,
  },
  desc_container: {
    width: wp(60),
    gap: 5,
  },
  step_text: {
    fontSize: 16,
    fontWeight: "700",
    // color:colors.red
  },
  heading_txt: {
    fontSize: 14,
    fontWeight: "600",
    // color:colors.dark_green
  },
  desc_txt: {
    color: colors.dark_gray,
    fontSize: 12,
  },
});
