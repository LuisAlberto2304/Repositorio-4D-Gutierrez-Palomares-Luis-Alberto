import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const usePerformanceCard = ({ title, subtitle, icon, onPress }) => {
  const getIcon = () => {
    switch (icon) {
      case "person":
        return <Ionicons name="person" size={24} color="#3498db" />;
      case "location":
        return <Ionicons name="location" size={24} color="#e74c3c" />;
      case "hardware-chip":
        return <Ionicons name="hardware-chip" size={24} color="#2ecc71" />;
      default:
        return <Ionicons name="information-circle" size={24} color="#9b59b6" />;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>{getIcon()}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  arrowContainer: {
    marginLeft: 8,
  },
});

export default usePerformanceCard;
