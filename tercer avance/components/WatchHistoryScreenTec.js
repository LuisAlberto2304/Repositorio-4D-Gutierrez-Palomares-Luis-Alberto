import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

const WatchHistoryScreenTec = () => {
  const { userEmail } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("dateCreated"); // 'dateCreated' or 'status'
  const [sortDirection, setSortDirection] = useState("desc"); // 'asc' or 'desc'
  const navigation = useNavigation();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        if (!userEmail) {
          setLoading(false);
          return;
        }

        const ticketsRef = collection(db, "Ticket");
        const ticketsQuery = query(
          ticketsRef,
          where("technicalEmail", "==", userEmail),
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);

        const ticketsList = [];
        ticketsSnapshot.forEach((doc) => {
          ticketsList.push({ id: doc.id, ...doc.data() });
        });

        setTickets(ticketsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setLoading(false);
      }
    };

    fetchTickets();
  }, [userEmail]);

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

  const handleViewDetails = (ticket) => {
    navigation.navigate("Ticket Details", { ticket });
  };

  const toggleSortBy = () => {
    setSortBy((prev) => (prev === "dateCreated" ? "status" : "dateCreated"));
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getSortedTickets = () => {
    return [...tickets].sort((a, b) => {
      // Sort by date
      if (sortBy === "dateCreated") {
        const dateA = a.dateCreated?.seconds
          ? new Date(a.dateCreated.seconds * 1000)
          : new Date(a.dateCreated);
        const dateB = b.dateCreated?.seconds
          ? new Date(b.dateCreated.seconds * 1000)
          : new Date(b.dateCreated);
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
      // Sort by status
      else {
        const statusA = a.status || "";
        const statusB = b.status || "";
        return sortDirection === "asc"
          ? statusA.localeCompare(statusB)
          : statusB.localeCompare(statusA);
      }
    });
  };

  const renderStatusBadge = (status) => {
    const statusColors = {
      Open: "#e3f9e5",
      Resolved: "#F3F3F3",
      Denied: "#f8d7da",
    };

    const textColors = {
      Open: "#10B981",
      Resolved: "rgb(184 184 184)",
      Denied: "#EF4444",
    };

    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusColors[status] || "#e2e3e5" },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: textColors[status] || "#383d41" },
          ]}
        >
          {status?.toUpperCase() || "UNKNOWN"}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Sorting Controls */}
      <View style={styles.sortContainer}>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSortBy}>
          <Text style={styles.sortButtonText}>
            Sort by: {sortBy === "dateCreated" ? "Date" : "Status"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={toggleSortDirection}
        >
          <Ionicons
            name={sortDirection === "asc" ? "arrow-up" : "arrow-down"}
            size={16}
            color="#2c3e50"
          />
          <Text style={styles.sortButtonText}>
            {sortDirection === "asc" ? "Ascending" : "Descending"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
      ) : tickets.length > 0 ? (
        <FlatList
          data={getSortedTickets()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.ticketCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.ticketTitle}>Ticket #{item.ticketId}</Text>
                {renderStatusBadge(item.status)}
              </View>

              <Text style={styles.descriptionText}>{item.description}</Text>

              <View style={styles.infoRow}>
                <Ionicons name="desktop-outline" size={16} color="#7f8c8d" />
                <Text style={styles.infoText}>
                  Equipment: {item.affectedEquipment}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#7f8c8d" />
                <Text style={styles.infoText}>
                  Employee: {item.employeeName}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#7f8c8d" />
                <Text style={styles.infoText}>Location: {item.location}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
                <Text style={styles.infoText}>
                  Created: {formatDate(item.dateCreated)}
                </Text>
              </View>

              {item.dateFinished && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color="#7f8c8d"
                  />
                  <Text style={styles.infoText}>
                    Completed: {formatDate(item.dateFinished)}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => handleViewDetails(item)}
              >
                <Text style={styles.detailsButtonText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#3498db" />
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyText}>No assigned tickets found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  loader: {
    marginTop: 40,
  },
  listContainer: {
    paddingBottom: 20,
  },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#2c3e50",
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#495057",
    marginBottom: 12,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#34495e",
    marginLeft: 8,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: 8,
  },
  detailsButtonText: {
    color: "#3498db",
    fontFamily: "Poppins-SemiBold",
    marginRight: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#7f8c8d",
    marginTop: 12,
  },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortButtonText: {
    marginLeft: 4,
    color: "#2c3e50",
    fontFamily: "Poppins-Medium",
  },
});

export default WatchHistoryScreenTec;
