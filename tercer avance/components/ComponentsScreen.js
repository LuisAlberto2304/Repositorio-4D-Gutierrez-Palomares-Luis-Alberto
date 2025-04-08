import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const ComponentsScreen = ({ route }) => {
  const { equipmentId } = route.params;
  const [components, setComponents] = useState([]);
  const [peripherals, setPeripherals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      const dateObj = date?.seconds
        ? new Date(date.seconds * 1000)
        : new Date(date);
      if (isNaN(dateObj.getTime())) return "N/A";
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  useEffect(() => {
    const fetchEquipmentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener datos del equipo (EquipmentActive)
        const equipmentRef = doc(db, "EquipmentActive", equipmentId);
        const equipmentSnap = await getDoc(equipmentRef);

        if (!equipmentSnap.exists()) {
          throw new Error("Equipment not found");
        }

        const equipmentData = equipmentSnap.data();

        // 2. Procesar componentes
        const componentsData = [];
        if (equipmentData.components) {
          await Promise.all(
            Object.entries(equipmentData.components).map(
              async ([key, comp]) => {
                try {
                  // Buscar en la colección Component por name
                  const componentsRef = collection(db, "Component");
                  const q = query(
                    componentsRef,
                    where("name", "==", comp.name),
                  );
                  const querySnapshot = await getDocs(q);

                  if (!querySnapshot.empty) {
                    const componentDoc = querySnapshot.docs[0].data();
                    componentsData.push({
                      id: key,
                      name: comp.name || "N/A",
                      brandModel:
                        `${componentDoc.brand || "Generic"} ${componentDoc.model || ""}`.trim(),
                      serial: comp.serialNumber || "N/A",
                      installed: formatDate(comp.installationDate),
                      icon: "hardware-chip", // Icono único para componentes
                    });
                  } else {
                    // Si no se encuentra en Component, mostrar solo los datos básicos de EquipmentActive
                    componentsData.push({
                      id: key,
                      type: "N/A",
                      brandModel: "N/A",
                      serial: comp.serialNumber || "N/A",
                      installed: formatDate(comp.installationDate),
                      icon: "hardware-chip", // Icono único para componentes
                    });
                  }
                } catch (err) {
                  console.error(`Error fetching component ${comp.name}:`, err);
                  componentsData.push({
                    id: key,
                    type: "N/A",
                    brandModel: "N/A",
                    serial: comp.serialNumber || "N/A",
                    installed: formatDate(comp.installationDate),
                    icon: "hardware-chip", // Icono único para componentes
                  });
                }
              },
            ),
          );
        }
        setComponents(componentsData);

        // 3. Procesar periféricos
        const peripheralsData = [];
        if (equipmentData.peripherals) {
          await Promise.all(
            Object.entries(equipmentData.peripherals).map(
              async ([key, peripheral]) => {
                try {
                  // Buscar en la colección Component por name
                  const componentsRef = collection(db, "Component");
                  const q = query(
                    componentsRef,
                    where("name", "==", peripheral.name),
                  );
                  const querySnapshot = await getDocs(q);

                  if (!querySnapshot.empty) {
                    const peripheralDoc = querySnapshot.docs[0].data();
                    peripheralsData.push({
                      id: key,
                      name: peripheral.name || "N/A",
                      brandModel:
                        `${peripheralDoc.brand || "Generic"} ${peripheralDoc.model || ""}`.trim(),
                      serial: peripheral.serialNumber || "N/A",
                      installed: formatDate(peripheral.installationDate),
                      icon: "hardware-chip-outline", // Icono único para periféricos
                    });
                  } else {
                    // Si no se encuentra en Component, mostrar solo los datos básicos de EquipmentActive
                    peripheralsData.push({
                      id: key,
                      type: "N/A",
                      brandModel: "N/A",
                      serial: peripheral.serialNumber || "N/A",
                      installed: formatDate(peripheral.installationDate),
                      icon: "hardware-chip-outline", // Icono único para periféricos
                    });
                  }
                } catch (err) {
                  console.error(
                    `Error fetching peripheral ${peripheral.name}:`,
                    err,
                  );
                  peripheralsData.push({
                    id: key,
                    type: "N/A",
                    brandModel: "N/A",
                    serial: peripheral.serialNumber || "N/A",
                    installed: formatDate(peripheral.installationDate),
                    icon: "hardware-chip-outline", // Icono único para periféricos
                  });
                }
              },
            ),
          );
        }
        setPeripherals(peripheralsData);
      } catch (error) {
        console.error("Error fetching equipment data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentData();
  }, [equipmentId]);

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Ionicons
        name={item.icon}
        size={24}
        color={item.icon === "hardware-chip" ? "#5DADE2" : "#9B59B6"}
      />
      <View style={styles.itemInfo}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Name:</Text>
          <Text style={styles.detailValue}>{item.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Brand/Model:</Text>
          <Text style={styles.detailValue}>{item.brandModel}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Serial:</Text>
          <Text style={styles.detailValue}>{item.serial}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Installed:</Text>
          <Text style={styles.detailValue}>{item.installed}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5DADE2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={40} color="#e74c3c" />
        <Text style={styles.errorText}>Error loading data</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Components Section */}

      {components.length > 0 ? (
        <FlatList
          data={components}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No components found</Text>
        </View>
      )}

      {/* Peripherals Section */}
      <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Peripherals</Text>

      {peripherals.length > 0 ? (
        <FlatList
          data={peripherals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No peripherals found</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f7fa",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    marginBottom: 15,
    color: "#2c3e50",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: {
    marginLeft: 15,
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    width: 90,
    fontFamily: "Poppins-Bold",
  },
  detailValue: {
    marginLeft: 10,
    fontSize: 12,
    color: "#444",
    flex: 1,
    fontFamily: "Poppins-Regular",
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#95a5a6",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  errorText: {
    marginTop: 15,
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#e74c3c",
  },
  errorDetail: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#95a5a6",
    textAlign: "center",
  },
});

export default ComponentsScreen;
