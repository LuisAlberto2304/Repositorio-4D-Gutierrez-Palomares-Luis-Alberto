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
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FontAwesome } from "@expo/vector-icons";
import CustomAlertModal from "./CustomAlertModal";

const LocationDesactivity = () => {
  const [locations, setLocations] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    isConfirmation: false,
  });

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

  const handleDeactivate = (location) => {
    setAlertContent({
      title: "Confirm Deactivation",
      message: `Are you sure you want to deactivate the ${location.nameLocal} location?`,
      onConfirm: () => confirmDeactivation(location),
      onCancel: () => setAlertVisible(false),
      isConfirmation: true,
    });
    setAlertVisible(true);
  };

  const confirmDeactivation = async (location) => {
    try {
      const locationRef = doc(db, "Location", location.id);
      await updateDoc(locationRef, {
        status: "Denied",
      });

      // Update local state
      setLocations(
        locations.map((loc) =>
          loc.id === location.id ? { ...loc, status: "Denied" } : loc,
        ),
      );

      setAlertContent({
        title: "Success",
        message: "The location has been successfully deactivated",
        onConfirm: () => setAlertVisible(false),
        isConfirmation: false,
      });
      setAlertVisible(true);
    } catch (error) {
      console.error("Error updating location:", error);
      setAlertContent({
        title: "Error",
        message:
          "An error occurred while deactivating the location. Please try again.",
        onConfirm: () => setAlertVisible(false),
        isConfirmation: false,
      });
      setAlertVisible(true);
    }
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
          <Text style={styles.title}>Our Locations</Text>

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
                    <Text style={styles.infoLabel}>State:</Text>
                    <Text style={styles.infoText}>{location.state}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Neighborhood:</Text>
                    <Text style={styles.infoText}>{location.settlement}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address:</Text>
                    <Text style={styles.infoText}>{location.street}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoText}>{location.phoneNumber}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Schedule:</Text>
                    <Text style={styles.infoText}>{location.openingHours}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
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
                    <Text style={styles.infoLabel}>Registered since:</Text>
                    <Text style={styles.infoText}>{location.dateRegister}</Text>
                  </View>

                  {location.status === "Open" && (
                    <TouchableOpacity
                      style={styles.deactivateButton}
                      onPress={() => handleDeactivate(location)}
                    >
                      <Text style={styles.deactivateButtonText}>
                        Deactivate
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <CustomAlertModal
        visible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        onConfirm={alertContent.onConfirm}
        onCancel={alertContent.onCancel}
        isConfirmation={alertContent.isConfirmation}
      />
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
  deactivateButton: {
    marginTop: 15,
    backgroundColor: "#ff4444",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  deactivateButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default LocationDesactivity;
