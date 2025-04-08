import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FontAwesome } from "@expo/vector-icons";

const LocationSeeAll = () => {
  const [locations, setLocations] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Location"));
        const locationsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLocations(locationsData);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Nuestras Locaciones</Text>

          {locations.map((location) => (
            <View key={location.id} style={styles.accordionItem}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => toggleExpand(location.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.locationName}>{location.nameLocal}</Text>
                <View style={styles.iconContainer}>
                  <FontAwesome
                    name={expandedId === location.id ? "minus" : "plus"}
                    size={20}
                    color="#333"
                  />
                </View>
              </TouchableOpacity>

              {expandedId === location.id && (
                <View style={styles.accordionContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Estado:</Text>
                    <Text style={styles.infoText}>{location.state}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Colonia:</Text>
                    <Text style={styles.infoText}>{location.settlement}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Dirección:</Text>
                    <Text style={styles.infoText}>{location.street}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Teléfono:</Text>
                    <Text style={styles.infoText}>{location.phoneNumber}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Horario:</Text>
                    <Text style={styles.infoText}>{location.openingHours}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Estado:</Text>
                    <Text
                      style={[
                        styles.infoText,
                        location.status === "Open"
                          ? styles.statusOpen
                          : styles.statusClosed,
                      ]}
                    >
                      {location.status}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Registrado desde:</Text>
                    <Text style={styles.infoText}>{location.dateRegister}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  accordionItem: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  accordionContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: "bold",
    color: "#555",
    width: "40%",
  },
  infoText: {
    flex: 1,
    color: "#333",
    textAlign: "right",
  },
  statusOpen: {
    color: "green",
  },
  statusClosed: {
    color: "red",
  },
});

export default LocationSeeAll;
