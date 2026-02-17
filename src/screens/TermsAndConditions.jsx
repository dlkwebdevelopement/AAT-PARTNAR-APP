import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { colors } from "../utils/constants";

const TermsAndConditions = () => {
  return (
    <ScrollView style={styles.container}>
      {/* <Text style={styles.heading}>Terms and Conditions (T&amp;C)</Text> */}

      <Text style={styles.subHeading}>1. Acceptance of Terms</Text>
      <Text style={styles.text}>
        - By registering as a vendor on the AAT platform, you agree to adhere to
        these terms and conditions. Any violations may lead to account
        suspension or termination.
      </Text>

      <Text style={styles.subHeading}>2. Eligibility</Text>
      <Text style={styles.text}>
        - Vendors must provide valid and accurate information during
        registration. Businesses must comply with all local legal requirements
        to operate.
      </Text>

      <Text style={styles.subHeading}>3. Service Agreement</Text>
      <Text style={styles.text}>
        - Vendors on the AAT platform agree to provide timely, professional, and
        safe services to customers.
      </Text>
      <Text style={styles.text}>
        - AAT reserves the right to monitor and review vendor activities to
        ensure adherence to service quality standards.
      </Text>

      <Text style={styles.subHeading}>4. Fees and Payments</Text>
      <Text style={styles.text}>
        - A commission fee, as agreed upon during registration, will be deducted
        from vendor earnings.
      </Text>
      <Text style={styles.text}>
        - Payment settlements will be made weekly/monthly (specify timing) and
        are subject to the resolution of any outstanding disputes.
      </Text>

      <Text style={styles.subHeading}>5. Vendor Responsibilities</Text>
      <Text style={styles.text}>
        - Ensure that vehicles, equipment, and personnel meet required safety
        and operational standards.
      </Text>
      <Text style={styles.text}>
        - Maintain all necessary licenses, permits, and certifications.
      </Text>

      <Text style={styles.subHeading}>6. Prohibited Activities</Text>
      <Text style={styles.text}>
        - Vendors must not engage in fraudulent activities, provide false
        information, or misuse the AAT platform.
      </Text>
      <Text style={styles.text}>
        - Violations of local laws or these terms may result in immediate
        account suspension or termination.
      </Text>

      <Text style={styles.subHeading}>7. Liability</Text>
      <Text style={styles.text}>
        - AAT is not responsible for damages, losses, or disputes arising
        between vendors and customers. Vendors operate independently and bear
        sole responsibility for their actions.
      </Text>

      <Text style={styles.subHeading}>8. Termination</Text>
      <Text style={styles.text}>
        - AAT reserves the right to suspend or terminate vendor accounts for
        non-compliance with these terms or for poor service performance.
      </Text>

    
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
    marginBottom:10
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

export default TermsAndConditions;
