import React from "react";
import { View, Text, StyleSheet } from "react-native";

function FeedbackScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.textMain}>Feedback</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  textMain: {
    fontFamily: "Poppins-Bold",
    fontSize: 50,
    textAlign: "center",
    lineHeight: 46,
    margin: 20,
    paddingTop: 10,
    color: "#2E2E2E",
  },
});

export default FeedbackScreen;
