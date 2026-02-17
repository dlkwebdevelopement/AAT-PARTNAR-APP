import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { colors } from "../utils/constants";

const RefunPolicy = () => {
  return (
    <ScrollView style={styles.container}>
      {/* <Text style={styles.heading}>Terms and Conditions (T&amp;C)</Text> */}



      <Text style={styles.subHeading}>1. Refund Eligibility</Text>
      <Text style={styles.text}>
        - Overpayment of fees or commissions due to errors on the AAT platform.
      </Text>
      <Text style={styles.text}>
        - Genuine disputes between vendors and AAT related to payments or
        penalties.
      </Text>

      <Text style={styles.subHeading}>2. Refund Process</Text>
      <Text style={styles.text}>
        - Vendors must file a refund request via the AAT app or support portal.
      </Text>
      <Text style={styles.text}>
        - All requests will be reviewed and resolved within 7 business days.
      </Text>

      <Text style={styles.subHeading}>3. Non-Refundable Cases</Text>
      <Text style={styles.text}>
        - Penalties or fees incurred due to vendor violations of AAT policies.
      </Text>
      <Text style={styles.text}>
        - Payments for services rendered to customers are non-refundable unless
        otherwise specified.
      </Text>

      <Text style={styles.subHeading}>4. Dispute Resolution</Text>
      <Text style={[styles.text,{marginBottom:50}]}>
        - In the event of a dispute, vendors must provide valid evidence to
        support their claim. AAT retains the final authority to resolve disputes
        and process refunds.
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

export default RefunPolicy;
