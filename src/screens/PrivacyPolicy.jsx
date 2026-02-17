import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { colors } from "../utils/constants";

const PrivacyPolicy = () => {
  return (
    <ScrollView style={styles.container}>
      {/* <Text style={styles.heading}>Terms and Conditions (T&amp;C)</Text> */}


      {/* <Text style={styles.heading}>Privacy Policy</Text> */}

      <Text style={styles.subHeading}>1. Data Collection</Text>
      <Text style={styles.text}>
        - AAT collects vendor information such as name, contact details,
        business registration, and banking details during registration.
      </Text>
      <Text style={styles.text}>
        - Operational data such as trip history, customer feedback, and payment
        transactions will also be recorded.
      </Text>

      <Text style={styles.subHeading}>2. Data Usage</Text>
      <Text style={styles.text}>
        - To facilitate vendor-customer matching and improve platform services.
      </Text>
      <Text style={styles.text}>
        - For administrative purposes, including payments and compliance
        monitoring.
      </Text>

      <Text style={styles.subHeading}>3. Data Sharing</Text>
      <Text style={styles.text}>
        - Customer data will be shared with vendors only for service purposes.
      </Text>
      <Text style={styles.text}>
        - Data may be shared with legal authorities if required by law.
      </Text>

      <Text style={styles.subHeading}>4. Data Security</Text>
      <Text style={styles.text}>
        - AAT employs advanced security measures to protect vendor data.
      </Text>
      <Text style={styles.text}>
        - Vendors are responsible for safeguarding their login credentials and
        account information.
      </Text>

      <Text style={styles.subHeading}>5. Rights</Text>
      <Text style={styles.text}>
        - Vendors can request data access, correction, or deletion by contacting
        AAT support.
      </Text>

     
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
    marginLeft:15
  },
  horizontalLine:{
    borderBottomColor:colors.gray,
    borderBottomWidth:1,
    marginVertical:20
  }
});

export default PrivacyPolicy;
