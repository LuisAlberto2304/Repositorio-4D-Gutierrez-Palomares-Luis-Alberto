import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { AuthContext } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlertModal from "./CustomAlertModal";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

const DevicesScreen = () => {
  const route = useRoute();
  const { item } = route.params || {};
  const [equipments, setEquipments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const navigation = useNavigation();
  const { userEmail } = useContext(AuthContext);
  const [loadingId, setLoadingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [backgroundUpdating, setBackgroundUpdating] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    isConfirmation: false,
  });

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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const loadFromCache = async () => {
    try {
      const [cachedData, cachedTimestamp] = await Promise.all([
        AsyncStorage.getItem("equipmentsCache"),
        AsyncStorage.getItem("equipmentsCacheTimestamp"),
      ]);

      if (cachedData && cachedTimestamp) {
        const now = Date.now();
        const lastUpdate = parseInt(cachedTimestamp, 10);

        if (now - lastUpdate < CACHE_DURATION) {
          const parsedData = JSON.parse(cachedData);
          setEquipments(parsedData);
          setFilteredEquipments(parsedData);

          const uniqueLocations = [
            ...new Set(parsedData.map((e) => e.location)),
          ].filter(Boolean);
          setLocations(uniqueLocations);
          return true;
        }
      }
    } catch (error) {
      console.error("Error loading cache:", error);
    }
    return false;
  };

  const fetchEquipments = async (forceRefresh = false) => {
    try {
      const now = Date.now();
      const shouldUseCache = !forceRefresh && (await loadFromCache());

      if (shouldUseCache) {
        setBackgroundUpdating(true);
      } else {
        setIsRefreshing(true);
      }

      // Construir la consulta base
      let activeQuery = collection(db, "EquipmentActive");

      // Si hay locationId, filtrar por ubicación
      if (item) {
        activeQuery = query(
          activeQuery,
          where("location", "==", item.nameLocal),
        );
      }

      const activeSnapshot = await getDocs(activeQuery);
      const activeEquipmentList = activeSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Resto de la lógica de consulta (tickets, etc.) permanece igual
      const ticketsQuery = query(
        collection(db, "Ticket"),
        where(
          "affectedEquipmentUID",
          "in",
          activeEquipmentList.map((eq) => eq.id),
        ),
      );
      const allTickets = await getDocs(ticketsQuery);

      const ticketsByEquipment = allTickets.docs.reduce((acc, doc) => {
        const data = doc.data();
        if (!acc[data.affectedEquipmentUID])
          acc[data.affectedEquipmentUID] = [];
        acc[data.affectedEquipmentUID].push({
          ...data,
          timestamp: new Date(
            data.dateCreated?.seconds * 1000 || data.dateCreated,
          ).getTime(),
        });
        return acc;
      }, {});

      const equipmentList = await Promise.all(
        activeEquipmentList.map(async (activeEq) => {
          const modelDoc = await getDoc(
            doc(db, "EquipmentActive", activeEq.model),
          );
          const equipmentName = modelDoc.exists()
            ? modelDoc.data().name
            : "Not available";

          const tickets = ticketsByEquipment[activeEq.id] || [];
          tickets.sort((a, b) => b.timestamp - a.timestamp);
          const latestTicket = tickets[0];

          return {
            ...activeEq,
            name: equipmentName,
            ticketCount: tickets.length,
            latestTicketDate: latestTicket?.dateCreated || null,
            formattedLatestDate: latestTicket
              ? formatDate(latestTicket.dateCreated)
              : "N/A",
          };
        }),
      );

      const uniqueLocations = [
        ...new Set(equipmentList.map((e) => e.location)),
      ].filter(Boolean);

      setEquipments(equipmentList);
      setFilteredEquipments(equipmentList);
      setLocations(uniqueLocations);

      await AsyncStorage.multiSet([
        ["equipmentsCache", JSON.stringify(equipmentList)],
        ["equipmentsCacheTimestamp", Date.now().toString()],
      ]);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      showAlert("Error", "Failed to load devices. Please try again.");
    } finally {
      setIsRefreshing(false);
      setBackgroundUpdating(false);
    }
  };

  const showAlert = (
    title,
    message,
    isConfirmation = false,
    onConfirm = () => setAlertVisible(false),
  ) => {
    setAlertContent({
      title,
      message,
      onConfirm,
      isConfirmation,
      onCancel: () => setAlertVisible(false),
    });
    setAlertVisible(true);
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const handleRefresh = async () => {
    await fetchEquipments(true);
  };

  const handleToggleEquipment = async (equipmentId) => {
    setLoadingId(equipmentId);
    try {
      const equipment = filteredEquipments.find((e) => e.id === equipmentId);
      const newStatus = equipment.status === "Active" ? "Inactive" : "Active";

      await updateDoc(doc(db, "EquipmentActive", equipmentId), {
        status: newStatus,
      });

      const updatedEquipments = equipments.map((item) =>
        item.id === equipmentId ? { ...item, status: newStatus } : item,
      );

      setEquipments(updatedEquipments);
      setFilteredEquipments(updatedEquipments);

      await AsyncStorage.setItem(
        "equipmentsCache",
        JSON.stringify(updatedEquipments),
      );
    } catch (error) {
      console.error("Error updating device:", error);
      showAlert("Error", "Failed to update device status.");
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    let filtered = equipments;

    if (searchQuery) {
      filtered = filtered.filter((equipment) =>
        equipment.equipmentId.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(
        (equipment) =>
          equipment.location?.toLowerCase() === selectedLocation.toLowerCase(),
      );
    }

    setFilteredEquipments(filtered);
  }, [searchQuery, selectedLocation, equipments]);

  const getEquipmentIcon = (type) => {
    const icons = {
      computadora: "desktop-outline",
      laptop: "laptop-outline",
      servidor: "server-outline",
      impresora: "print-outline",
      red: "wifi-outline",
      telefono: "phone-portrait-outline",
    };
    return icons[type?.toLowerCase()] || "hardware-chip-outline";
  };

  const getStatusColor = (status) => {
    return status === "Active" ? "#2ecc71" : "#e74c3c";
  };

  const renderButtonContent = (iconName, text) => {
    if (Platform.OS === "web") {
      return (
        <>
          <Ionicons name={iconName} size={18} color="#fff" />
          <Text style={styles.buttonText}>{text}</Text>
        </>
      );
    } else {
      return (
        <View style={styles.mobileButtonContent}>
          <Ionicons
            name={iconName}
            size={24}
            color="#fff"
            style={styles.mobileButtonIcon}
          />
          <Text style={styles.buttonText}>{text}</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {backgroundUpdating && (
        <View style={styles.backgroundUpdateIndicator}>
          <ActivityIndicator size="small" color="#1E3A8A" />
          <Text style={styles.backgroundUpdateText}>Updating data...</Text>
        </View>
      )}

      {/* Solo muestra buscador y filtro si NO hay item.nameLocal */}
      {!item?.nameLocal && (
        <>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search device by Device Name..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterContainer}>
              <Ionicons
                name="location-outline"
                size={18}
                color="#555"
                style={styles.filterIcon}
              />
              <Picker
                selectedValue={selectedLocation}
                style={styles.picker}
                dropdownIconColor="#555"
                onValueChange={(itemValue) =>
                  setSelectedLocation(itemValue === "all" ? "" : itemValue)
                }
              >
                <Picker.Item label="All locations" value="all" />
                {locations.map((loc) => (
                  <Picker.Item key={loc} label={loc} value={loc} />
                ))}
              </Picker>
            </View>
          </View>
        </>
      )}

      <FlatList
        data={filteredEquipments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#1E3A8A"]}
            tintColor="#1E3A8A"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isRefreshing ? "Loading..." : "No devices found"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name={getEquipmentIcon(item.type)}
                size={28}
                color="#FFC107"
                style={styles.equipmentIcon}
              />
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>{item.equipmentId}</Text>
              </View>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#777" />
                <Text style={styles.cardText}>
                  {item.location || "No location"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#777" />
                <Text style={styles.cardText}>
                  Last ticket:{" "}
                  <Text style={styles.cardText}>
                    {item.formattedLatestDate}
                  </Text>
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={16} color="#777" />
                <Text style={styles.cardText}>
                  Tickets:{" "}
                  <Text style={styles.cardText}>{item.ticketCount}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.componentsButton]}
                onPress={() =>
                  navigation.navigate("ComponentsScreen", {
                    equipmentId: item.id,
                  })
                }
              >
                {loadingId === item.id && Platform.OS !== "web" ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  renderButtonContent("hardware-chip-outline", "Components")
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  item.status === "Active"
                    ? styles.deactivateButton
                    : styles.activateButton,
                  loadingId === item.id && styles.disabledButton,
                ]}
                onPress={() => handleToggleEquipment(item.id)}
                disabled={loadingId === item.id}
              >
                {loadingId === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  renderButtonContent(
                    "power-outline",
                    item.status === "Active" ? "Desactivate" : "Activate",
                  )
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.ticketsButton]}
                onPress={() =>
                  navigation.navigate("TicketsScreen", {
                    equipmentId: item.id,
                    equipmentName: item.equipmentId,
                  })
                }
              >
                {renderButtonContent("chevron-forward", "Tickets")}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <CustomAlertModal
        visible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        onConfirm={alertContent.onConfirm}
        onCancel={alertContent.onCancel}
        isConfirmation={alertContent.isConfirmation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f5f7fa",
  },
  backgroundUpdateIndicator: {
    position: "absolute",
    top: 600,
    right: 125,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  backgroundUpdateText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#1E3A8A",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: "#333",
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
  searchIcon: {
    marginLeft: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  filterContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterIcon: {
    marginRight: 5,
  },
  picker: {
    flex: 1,
    height: 55,
    color: "#333",
    borderWidth: 0,
    fontFamily: "Poppins-Regular",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  equipmentIcon: {
    marginRight: 10,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#2c3e50",
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#7f8c8d",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardBody: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  cardText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#555",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E3A8A",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
  },
  componentsButton: {
    backgroundColor: "#2ecc71",
    marginRight: 10,
  },
  ticketsButton: {
    backgroundColor: "#1E3A8A",
  },
  buttonText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Poppins-SemiBold",
    marginLeft: Platform.OS === "web" ? 5 : 0,
  },
  emptyContainer: {
    flex: 1,
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
  activateButton: {
    backgroundColor: "#2ECC71",
    marginRight: 10,
  },
  deactivateButton: {
    backgroundColor: "#E74C3C",
    marginRight: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  mobileButtonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  mobileButtonIcon: {
    marginBottom: 4,
  },
});

export default DevicesScreen;
