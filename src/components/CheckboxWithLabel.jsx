import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Checkbox from 'expo-checkbox';
import { colors } from '../utils/constants';

const CheckboxWithLabel = ({ 
  isChecked, 
  setChecked, 
  label, 
  onTermsPress, 
  onPrivacyPress, 
  onRefundPress,
  customStyles 
}) => {
  return (
    <View style={[styles.checkboxSection, customStyles]}>
      <Checkbox
        style={styles.checkbox}
        value={isChecked}
        onValueChange={setChecked}
        color={isChecked ? "#006400" : undefined} // Replace with your `colors.dark_green` if needed
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Text style={[styles.text, { color: "#000" }]}>I agree </Text>
        <Text onPress={onTermsPress} style={styles.text}>Terms & Conditions, </Text>
        <Text onPress={onPrivacyPress} style={styles.text}>Privacy Policy, </Text>
        <Text onPress={onRefundPress} style={styles.text}>Refund Policy</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  checkboxSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  checkbox: {
    margin: 8,
  },
  text: {
    fontSize: 11,
    color: colors.blue ,
    fontWeight: "500",
  },
});

export default CheckboxWithLabel;
