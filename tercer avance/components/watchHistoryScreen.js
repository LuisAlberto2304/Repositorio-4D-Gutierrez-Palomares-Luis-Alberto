import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRoute } from "@react-navigation/native";

const isWeb = Platform.OS === "web";
const windowWidth = Dimensions.get("window").width;

const WatchHistoryScreen = ({ navigation }) => {
  const { userEmail, userType } = useContext(AuthContext);
  const route = useRoute();
  const { item } = route.params || {};
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        let q;

        if (item) {
          // Consulta para tickets de la sucursal específica
          q = query(
            collection(db, "Ticket"),
            where("location", "==", item.nameLocal),
          );
        } else if (userEmail) {
          // Consulta original (tickets del usuario)
          q = query(
            collection(db, "Ticket"),
            where("employeeEmail", "==", userEmail),
          );
        } else {
          return;
        }

        const querySnapshot = await getDocs(q);
        const ticketsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTickets(ticketsData);
        setFilteredTickets(ticketsData);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        Alert.alert("Error", "Failed to load tickets.");
      }
    };

    fetchTickets();
  }, [userEmail, item]);

  useEffect(() => {
    filterAndSortTickets();
  }, [searchText, statusFilter, sortOrder, tickets]);

  const filterAndSortTickets = () => {
    let filtered = [...tickets];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (ticket) => ticket.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((ticket) =>
        ticket.ticketId?.toString().includes(searchText),
      );
    }

    // Apply sorting locally
    filtered.sort((a, b) => {
      // Handle different date formats (timestamp, seconds, or already converted)
      const getDateValue = (ticket) => {
        if (!ticket.dateCreated) return 0;
        if (ticket.dateCreated.toDate)
          return ticket.dateCreated.toDate().getTime();
        if (ticket.dateCreated.seconds)
          return ticket.dateCreated.seconds * 1000;
        return new Date(ticket.dateCreated).getTime() || 0;
      };

      const dateA = getDateValue(a);
      const dateB = getDateValue(b);

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredTickets(filtered);
  };

  const formatFirestoreDate = (date) => {
    if (!date) return "Not specified";
    if (date.toDate) return date.toDate().toLocaleString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleString();
    return date;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "#10B981";
      case "resolved":
        return "rgb(184 184 184)";
      case "denied":
        return "#EF4444";
      default:
        return "#FF0000";
    }
  };

  return (
    <View style={styles.container}>
      {/* Sección de búsqueda y filtros (siempre visible) */}
      <View style={styles.controlsContainer}>
        {/* Search Container (se mantiene igual) */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#1E3A8A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets by No.Ticket..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#95A5A6"
          />
        </View>

        {/* Filter Row - Se adapta automáticamente */}
        <View style={styles.filterRow}>
          <View style={styles.filterBox}>
            <Picker
              selectedValue={statusFilter}
              onValueChange={setStatusFilter}
              style={styles.picker}
              dropdownIconColor="#1E3A8A"
            >
              <Picker.Item label="All Statuses" value="all" />
              <Picker.Item label="Open" value="open" />
              <Picker.Item label="Resolved" value="resolved" />
              <Picker.Item label="Denied" value="denied" />
            </Picker>
          </View>

          <View style={styles.filterBox}>
            <Picker
              selectedValue={sortOrder}
              onValueChange={setSortOrder}
              style={[styles.picker, { color: "#1E3A8A" }]}
              dropdownIconColor="#1E3A8A"
            >
              <Picker.Item label="Newest First" value="newest" />
              <Picker.Item label="Oldest First" value="oldest" />
            </Picker>
          </View>
        </View>
      </View>

      {/* Lista de tickets o estado vacío */}
      {filteredTickets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ellipsis-horizontal" size={50} color="#A0C4FF" />
          <Text style={styles.noTickets}>No tickets found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.ticketItem}
              onPress={() =>
                navigation.navigate("TicketChat", { ticket: item })
              }
            >
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketId}>#{item.ticketId}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status || "Open") },
                  ]}
                >
                  <Text style={styles.statusText}>{item.status || "Open"}</Text>
                </View>
              </View>

              <Text style={styles.ticketTitle}>{item.problemType}</Text>
              <Text style={styles.ticketDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.technicalInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color="#6B8CAE" />
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Technician: </Text>
                    {item.technicalName || "Not assigned"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={16} color="#6B8CAE" />
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Created: </Text>
                    {formatFirestoreDate(item.dateCreated) || "Not specified"}
                  </Text>
                </View>

                {item.dateFinished && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#6B8CAE"
                    />
                    <Text style={styles.infoText}>
                      <Text style={styles.infoLabel}>Completed:</Text>
                      {formatFirestoreDate(item.dateFinished)}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons name="build" size={16} color="#6B8CAE" />
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Equipment: </Text>
                    {item.affectedEquipment}
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
    padding: 15,
    backgroundColor: "#F8F9FA",
  },
  controlsContainer: {
    marginBottom: 20,
    flexDirection: isWeb && windowWidth > 768 ? "row" : "column",
    gap: 12,
    alignItems: isWeb ? "center" : "stretch",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: isWeb ? 10 : 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flex: isWeb ? 2 : undefined,
  },
  filterRow: {
    flexDirection: isWeb ? "row" : "row",
    gap: 10,
    flex: isWeb ? 3 : undefined,
  },
  filterBox: {
    height: 55,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFF",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flex: isWeb ? 1 : 1,
  },
  picker: {
    borderWidth: isWeb ? 0 : 0,
    height: 55,
    backgroundColor: "#FFF",
    fontFamily: "Poppins-Semibold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noTickets: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#94A3B8",
    marginTop: 10,
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  ticketItem: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#1E3A8A",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketId: {
    color: "#64748B",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    marginLeft: 4,
  },
  ticketTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
    marginBottom: 8,
    lineHeight: 22,
  },
  ticketDescription: {
    color: "#475569",
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    marginBottom: 12,
    lineHeight: 20,
  },
  technicalInfo: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontFamily: "Poppins-SemiBold",
    color: "#475569",
    fontSize: 13,
  },
  infoText: {
    color: "#64748B",
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    marginLeft: 6,
    flexShrink: 1,
  },
});

export default WatchHistoryScreen;
