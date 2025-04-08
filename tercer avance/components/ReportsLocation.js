import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import PieChartComponent from "../hooks/usePieChart";

const CACHE_DURATION = 5 * 60 * 60 * 1000;

const ReportsLocation = () => {
  const [timeRange, setTimeRange] = useState("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache state
  const [dataCache, setDataCache] = useState({
    week: { data: null, timestamp: null },
    month: { data: null, timestamp: null },
    year: { data: null, timestamp: null },
  });

  const fetchLocationReports = async (range) => {
    try {
      setLoading(true);
      setError(null);

      // Check if cached data is still valid
      const cachedItem = dataCache[range];
      if (
        cachedItem.data &&
        cachedItem.timestamp &&
        Date.now() - cachedItem.timestamp < CACHE_DURATION
      ) {
        setLocations(cachedItem.data);
        setLoading(false);
        return;
      }

      // 1. Get all locations first
      const locationsSnapshot = await getDocs(collection(db, "Location"));
      const locationsData = locationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        ticketsRequested: 0,
        issueTypes: new Map(),
        technicians: new Map(),
        lastTicketDate: null,
      }));

      // 2. Calculate date range
      const { fromDate, toDate } = getDateRange(range);

      // 3. Get completed tickets in that range
      const ticketsQuery = query(
        collection(db, "Ticket"),
        where("status", "==", "Resolved"),
      );

      const ticketsSnapshot = await getDocs(ticketsQuery);

      // 4. Process tickets and assign to locations
      ticketsSnapshot.forEach((doc) => {
        const ticket = doc.data();
        const locationIndex = locationsData.findIndex(
          (l) => l.nameLocal === ticket.location,
        );

        if (locationIndex !== -1) {
          const location = locationsData[locationIndex];
          location.ticketsRequested += 1;

          // Register last ticket date
          const ticketDate = ticket.dateFinished.toDate();
          if (
            !location.lastTicketDate ||
            ticketDate > location.lastTicketDate
          ) {
            location.lastTicketDate = ticketDate;
          }

          // Count problem types
          const problemType = ticket.problemType;
          location.issueTypes.set(
            problemType,
            (location.issueTypes.get(problemType) || 0) + 1,
          );

          // Register technicians
          if (ticket.technicalName) {
            location.technicians.set(
              ticket.technicalName,
              (location.technicians.get(ticket.technicalName) || 0) + 1,
            );
          }
        }
      });

      // 5. Process data for visualization
      const processedLocations = locationsData
        .filter((location) => location.ticketsRequested > 0)
        .map((location) => {
          // Find most active technician
          let topTechnician = { name: "N/A", tickets: 0 };
          location.technicians.forEach((tickets, name) => {
            if (tickets > topTechnician.tickets) {
              topTechnician = { name, tickets };
            }
          });

          return {
            ...location,
            lastTicketDate: location.lastTicketDate
              ? formatDate(location.lastTicketDate)
              : "N/A",
            issueTypes: Array.from(location.issueTypes.entries()).map(
              ([type, count]) => ({ type, count }),
            ),
            topTechnician,
          };
        });

      // Update cache
      setDataCache((prev) => ({
        ...prev,
        [range]: {
          data: processedLocations,
          timestamp: Date.now(),
        },
      }));

      setLocations(processedLocations);
    } catch (err) {
      console.error("Error fetching location reports:", err);
      setError("Error loading branch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationReports(timeRange);
  }, [timeRange]);

  // Helper function to format dates
  const formatDate = (date) => {
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Function to calculate date range
  const getDateRange = (range = timeRange) => {
    const now = new Date();
    const fromDate = new Date();

    switch (range) {
      case "week":
        fromDate.setDate(now.getDate() - 7);
        break;
      case "month":
        fromDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        fromDate.setDate(now.getDate() - 7);
    }

    return { fromDate, toDate: now };
  };

  const filteredLocations = locations.filter((location) =>
    location.nameLocal.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading branch reports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="warning" size={40} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchLocationReports(timeRange)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports by Branch</Text>

      <View style={styles.timeFilterContainer}>
        <TouchableOpacity
          style={[
            styles.timeFilterButton,
            timeRange === "week" && styles.timeFilterButtonActive,
          ]}
          onPress={() => setTimeRange("week")}
        >
          <Text
            style={[
              styles.timeFilterButtonText,
              timeRange === "week" && styles.timeFilterButtonTextActive,
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeFilterButton,
            timeRange === "month" && styles.timeFilterButtonActive,
          ]}
          onPress={() => setTimeRange("month")}
        >
          <Text
            style={[
              styles.timeFilterButtonText,
              timeRange === "month" && styles.timeFilterButtonTextActive,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeFilterButton,
            timeRange === "year" && styles.timeFilterButtonActive,
          ]}
          onPress={() => setTimeRange("year")}
        >
          <Text
            style={[
              styles.timeFilterButtonText,
              timeRange === "year" && styles.timeFilterButtonTextActive,
            ]}
          >
            Year
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#7F7F7F"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search branch..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#7F7F7F" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView style={styles.locationsContainer}>
        {filteredLocations.length > 0 ? (
          filteredLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.locationCard}
              onPress={() => setSelectedLocation(location)}
            >
              <View style={styles.locationIcon}>
                <Ionicons name="business-outline" size={24} color="#4A90E2" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.nameLocal}</Text>
                <Text style={styles.locationDetails}>
                  {location.settlement}, {location.state}
                </Text>
              </View>
              <View style={styles.locationStats}>
                <View style={styles.ticketBadge}>
                  <Text style={styles.ticketBadgeText}>
                    {location.ticketsRequested}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#999" />
            <Text style={styles.noResultsText}>
              {searchQuery
                ? "No branches match your search"
                : "No branches with completed tickets"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Location Details Modal */}
      <Modal
        visible={!!selectedLocation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedLocation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedLocation?.nameLocal}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedLocation?.settlement}, {selectedLocation?.state}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedLocation(null)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    {selectedLocation?.street}, {selectedLocation?.settlement}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    {selectedLocation?.openingHours}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    {selectedLocation?.phoneNumber}
                  </Text>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {selectedLocation?.ticketsRequested}
                  </Text>
                  <Text style={styles.statLabel}>Total Tickets</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {selectedLocation?.lastTicketDate || "N/A"}
                  </Text>
                  <Text style={styles.statLabel}>Last Ticket</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Problem Distribution</Text>
              {selectedLocation?.issueTypes?.length > 0 ? (
                <View style={styles.pieChartContainer}>
                  <PieChartComponent
                    data={selectedLocation.issueTypes}
                    height={200}
                  />
                </View>
              ) : (
                <Text style={styles.noDataText}>No problem data available</Text>
              )}

              <Text style={styles.sectionTitle}>Top Technician</Text>
              <View style={styles.techCard}>
                <Text style={styles.techName}>
                  {selectedLocation?.topTechnician?.name}
                </Text>
                <Text style={styles.techTickets}>
                  {selectedLocation?.topTechnician?.tickets} resolved tickets
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F8F9FA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  timeFilterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 4,
  },
  timeFilterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  timeFilterButtonActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeFilterButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  timeFilterButtonTextActive: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: "#333",
  },
  locationsContainer: {
    flex: 1,
  },
  locationCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  locationIcon: {
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  locationDetails: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  locationStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketBadge: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  ticketBadgeText: {
    color: "#F44336",
    fontSize: 12,
    fontWeight: "600",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    color: "#999",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "85%",
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    paddingHorizontal: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  statCard: {
    backgroundColor: "#F5F9FF",
    borderRadius: 8,
    padding: 12,
    width: "48%",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 12,
  },
  pieChartContainer: {
    height: 200,
    marginVertical: 8,
  },
  techCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  techName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  techTickets: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  noDataText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 20,
  },
});

export default ReportsLocation;
