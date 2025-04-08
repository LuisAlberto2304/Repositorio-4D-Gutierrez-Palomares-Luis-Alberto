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
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FontAwesome } from "@expo/vector-icons";
import CustomAlertModal from "./CustomAlertModal";

const LocationDelete = () => {
  const [locations, setLocations] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {}, // Función vacía por defecto
    onCancel: () => setAlertVisible(false), // Cierra por defecto
    isConfirmation: false, // Booleano, no con "="
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
        setAlertContent({
          title: "Error: Getting Locations",
          message:
            "Sorry, something went wrong, please exit and re-enter the current screen.",
          onConfirm: () => setAlertVisible(false),
          isConfirmation: false,
        });
        setAlertVisible(true);
      }
    };

    fetchLocations();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = (location) => {
    setSelectedLocation(location);
    try {
      setAlertContent({
        title: "Confirmation",
        message: "Are you sure you want to mark this location as deleted?",
        onConfirm: () => {
          setAlertVisible(false);

          setAlertContent({
            title: "Final Confirmation",
            message:
              "This will mark the location as 'Deleted'. Are you absolutely sure?",
            onConfirm: async () => {
              if (!selectedLocation) return;

              try {
                // Actualizar el documento en lugar de eliminarlo
                await updateDoc(doc(db, "Location", selectedLocation.id), {
                  status: "Deleted",
                  updatedAt: serverTimestamp(), // Registrar fecha de actualización
                });

                // Actualizar el estado local
                setLocations(
                  locations.filter((loc) => loc.id !== selectedLocation.id),
                );

                // Mostrar mensaje de éxito
                setAlertContent({
                  title: "Success",
                  message: "Location has been marked as deleted",
                  onConfirm: () => setAlertVisible(false),
                  isConfirmation: false,
                });
                setAlertVisible(true);
              } catch (error) {
                console.error("Error updating location:", error);
                setAlertContent({
                  title: "Error",
                  message:
                    "Failed to update location status. Please try again.",
                  onConfirm: () => setAlertVisible(false),
                  isConfirmation: false,
                });
                setAlertVisible(true);
              }
            },
            onCancel: () => setAlertVisible(false),
            isConfirmation: true,
          });
          setAlertVisible(true);
        },
        onCancel: () => setAlertVisible(false),
        isConfirmation: true,
      });
      setAlertVisible(true);
    } catch (error) {
      console.error("Error in delete confirmation:", error);
      setAlertContent({
        title: "Error",
        message: "An error occurred during the confirmation process.",
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
          <Text style={styles.title}>Locations</Text>

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
                    <Text style={styles.infoLabel}>Settlement:</Text>
                    <Text style={styles.infoText}>{location.settlement}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address:</Text>
                    <Text style={styles.infoText}>{location.street}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone Number:</Text>
                    <Text style={styles.infoText}>{location.phoneNumber}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Working Hours:</Text>
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
                    <Text style={styles.infoLabel}>Registered Since:</Text>
                    <Text style={styles.infoText}>{location.dateRegister}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(location)}
                  >
                    <Text style={styles.deleteButtonText}>Delete Location</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
        <CustomAlertModal
          visible={alertVisible}
          title={alertContent.title}
          message={alertContent.message}
          onConfirm={alertContent.onConfirm} // Función de confirmación
          onCancel={alertContent.onCancel} // Función de cancelación
          isConfirmation={alertContent.isConfirmation} // Modo
        />
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
  deleteButton: {
    marginTop: 15,
    backgroundColor: "#ff4444",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
  },
  warningModalContainer: {
    alignItems: "center",
  },
  warningIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  warningModalText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    color: "#ff4444",
    fontWeight: "bold",
  },
  warningModalSubtext: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  deleteButtonModal: {
    backgroundColor: "#ff4444",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default LocationDelete;
