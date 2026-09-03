import { StyleSheet, Text, View, Dimensions } from "react-native";
import React from "react";
import { FontAwesome5, MaterialIcons, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../utils/constants";
import Carousel from "react-native-reanimated-carousel";
import { infoData } from "../Data/Info_data";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

const { width } = Dimensions.get("window");

const StepsCarousel = () => {
  const renderIcon = (family, name) => {
    if (family === "Ionicons") return <Ionicons name={name} size={28} color={colors.deep_blue} />;
    if (family === "MaterialIcons") return <MaterialIcons name={name} size={28} color={colors.deep_blue} />;
    if (family === "FontAwesome5") return <FontAwesome5 name={name} size={26} color={colors.deep_blue} />;
    return null;
  };

  return (
    //   steps carousel main container
    <View style={styles.main_container}>
      {/* heading text */}
      <View style={styles.heading_container}>
        <View style={styles.tag_container}>
          <Ionicons name="information-circle" size={20} color={colors.white} />
          <Text style={styles.steps_main_heading_txt}>
            Vendor Enrollment Process
          </Text>
        </View>
      </View>
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
            <View style={styles.icon_container}>
              {renderIcon(item.iconFamily, item.iconName)}
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
    padding: 15,
    overflow: "hidden",
    width: "100%",
  },
  heading_container: {
    alignItems: "center",
    marginBottom: 15,
  },
  tag_container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.deep_blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  steps_main_heading_txt: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  //   carousel styling
  main_carousel_container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    width: wp(84),
    justifyContent: "center",
    backgroundColor: "transparent",
    flexWrap: "wrap",
    height: 100,
    gap:10,
  },
  icon_container: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
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
    // color:colors.deep_blue
  },
  desc_txt: {
    color: colors.dark_gray,
    fontSize: 12,
  },
});
