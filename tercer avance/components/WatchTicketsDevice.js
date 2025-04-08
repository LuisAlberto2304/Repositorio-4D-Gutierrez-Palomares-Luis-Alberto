import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY_PREFIX = "deviceTickets_";
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache duration

const TicketsScreen = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();
  const { equipmentId, equipmentName } = route.params;

  const fetchTickets = async (forceRefresh = false) => {
    try {
      setRefreshing(true);

      const cacheKey = `${CACHE_KEY_PREFIX}${equipmentId}`;
      const now = Date.now();

      // Try to load from cache if not forcing refresh
      if (!forceRefresh) {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        const cachedTimestamp = await AsyncStorage.getItem(
          `${cacheKey}_timestamp`,
        );

        if (
          cachedData &&
          cachedTimestamp &&
          now - parseInt(cachedTimestamp) < CACHE_DURATION
        ) {
          const parsedData = JSON.parse(cachedData);
          setTickets(parsedData.tickets);
          setDeviceInfo(parsedData.deviceInfo || { name: equipmentName });
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // Fetch fresh data from Firestore
      const ticketsQuery = query(
        collection(db, "Ticket"),
        where("affectedEquipmentUID", "==", equipmentId),
      );
      const deviceQuery = query(
        collection(db, "EquipmentActive"),
        where("id", "==", equipmentId),
      );

      const [ticketsSnapshot, deviceSnapshot] = await Promise.all([
        getDocs(ticketsQuery),
        getDocs(deviceQuery),
      ]);

      const ticketList = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ticketId:
          doc.data().ticketId || `T-${doc.id.slice(0, 6).toUpperCase()}`,
        ...doc.data(),
      }));

      const deviceData = deviceSnapshot.docs[0]?.data() || {
        name: equipmentName,
      };

      // Update cache
      const cacheData = {
        tickets: ticketList,
        deviceInfo: deviceData,
        timestamp: now,
      };

      await AsyncStorage.multiSet([
        [cacheKey, JSON.stringify(cacheData)],
        [`${cacheKey}_timestamp`, now.toString()],
      ]);

      setTickets(ticketList);
      setDeviceInfo(deviceData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [equipmentId]);

  const handleRefresh = () => {
    fetchTickets(true); // Force refresh
  };

  const handleViewDetails = (ticket) => {
    navigation.navigate("Ticket Details", { ticket });
  };

  const formatDate = (date) => {
    if (!date) return "No date";
    try {
      const dateObj = date?.seconds
        ? new Date(date.seconds * 1000)
        : new Date(date);
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#e74c3c";
      case "medium":
        return "#f39c12";
      case "low":
        return "#2ecc71";
      default:
        return "#95a5a6";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "#2ecc71";
      case "in progress":
        return "#3498db";
      case "closed":
        return "#95a5a6";
      default:
        return "#7f8c8d";
    }
  };

  return (
    <View style={styles.container}>
      {deviceInfo && (
        <View style={styles.header}>
          <Ionicons name="hardware-chip-outline" size={24} color="#1E3A8A" />
          <Text style={styles.deviceTitle}>
            {equipmentName || "Unknown Device"}
          </Text>
          <Text style={styles.ticketCount}>{tickets.length} ticket(s)</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={styles.loader} />
      ) : tickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyText}>No tickets found for this device</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#1E3A8A"]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.ticketCard}
              onPress={() => handleViewDetails(item)}
            >
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketNumber}>#{item.ticketId}</Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(item.status) },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {item.status || "Unknown"}
                  </Text>
                </View>
              </View>

              <Text style={styles.ticketTitle}>
                {item.problemType || "No problem type"}
              </Text>
              <Text style={styles.ticketDescription}>
                {item.description || "No description provided"}
              </Text>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={14} color="#7f8c8d" />
                  <Text style={styles.detailText}>
                    {formatDate(item.dateCreated)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color="#7f8c8d"
                  />
                  <Text
                    style={[
                      styles.detailText,
                      { color: getPriorityColor(item.priority) },
                    ]}
                  >
                    {item.priority || "No priority"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  deviceTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
    marginLeft: 8,
    flex: 1,
  },
  ticketCount: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#95a5a6",
    marginTop: 16,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    margin: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "#7f8c8d",
    textTransform: "capitalize",
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  ticketDescription: {
    fontSize: 14,
    color: "#34495e",
    marginBottom: 12,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 13,
    marginLeft: 6,
    color: "#7f8c8d",
    textTransform: "capitalize",
  },
});

export default TicketsScreen;
