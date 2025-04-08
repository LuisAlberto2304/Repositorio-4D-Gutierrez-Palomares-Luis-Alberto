import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const Reports = () => {
  const navigation = useNavigation();

  const reportOptions = [
    {
      title: "Technicians Performance",
      description: "View technician statistics",
      icon: "people",
      screen: "GeneralPerformance",
    },
    {
      title: "Locations Performance",
      description: "View statistics by location",
      icon: "business",
      screen: "LocationPerformance",
    },
    {
      title: "Devices Performance",
      description: "View statistics by device",
      icon: "hardware-chip",
      screen: "DevicePerformance",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Comprehensive performance insights</Text>
      </View>

      {reportOptions.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.sectionCard}
          onPress={() => navigation.navigate(option.screen)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={option.icon} size={24} color="#1E3A8A" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.sectionTitle}>{option.title}</Text>
            <Text style={styles.sectionDescription}>{option.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#a5b1c2" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2f3542",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#747d8c",
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    backgroundColor: "#e8f0fe",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2f3542",
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#7f8c8d",
  },
});

export default Reports;
