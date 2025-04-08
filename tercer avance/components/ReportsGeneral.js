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
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { PieChart } from "react-native-chart-kit";

const CACHE_DURATION = 5 * 60 * 1000;

const ReportsGeneral = () => {
  const [timeRange, setTimeRange] = useState("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTech, setSelectedTech] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageResolutionTime, setAverageResolutionTime] = useState(0);

  // Cache state
  const [dataCache, setDataCache] = useState({
    week: { data: null, timestamp: null, avgTime: 0 },
    month: { data: null, timestamp: null, avgTime: 0 },
    year: { data: null, timestamp: null, avgTime: 0 },
  });

  const fetchTechniciansWithTickets = async (range) => {
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
        setTechnicians(cachedItem.data);
        setAverageResolutionTime(cachedItem.avgTime);
        setLoading(false);
        return;
      }

      // Get all technicians
      const techsSnapshot = await getDocs(collection(db, "Technical"));
      const techsData = techsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fullName: `${doc.data().firstName} ${doc.data().lastName}`,
        ticketsResolved: 0,
        issueTypes: {},
        totalResolutionTime: 0,
      }));

      // Get completed tickets
      const ticketsQuery = query(
        collection(db, "Ticket"),
        where("status", "==", "Resolved"),
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);

      // Process tickets and assign to technicians
      let totalResolutionTimeAll = 0;
      let totalTicketsAll = 0;

      ticketsSnapshot.forEach((doc) => {
        const ticket = doc.data();
        const techIndex = techsData.findIndex(
          (t) => t.email === ticket.technicalEmail,
        );

        if (techIndex !== -1) {
          const tech = techsData[techIndex];
          tech.ticketsResolved += 1;

          // Count problem types
          tech.issueTypes[ticket.problemType] =
            (tech.issueTypes[ticket.problemType] || 0) + 1;

          // Calculate resolution time in hours
          if (ticket.dateCreated && ticket.dateFinished) {
            const created = ticket.dateCreated.toDate();
            const finished = ticket.dateFinished.toDate();
            const resolutionTime = (finished - created) / (1000 * 60 * 60); // in hours
            tech.totalResolutionTime += resolutionTime;
            totalResolutionTimeAll += resolutionTime;
            totalTicketsAll += 1;
          }
        }
      });

      // Calculate average resolution time
      let avgTime = 0;
      if (totalTicketsAll > 0) {
        avgTime = totalResolutionTimeAll / totalTicketsAll;
        setAverageResolutionTime(avgTime);
      }

      // Filter technicians with resolved tickets
      const techsWithTickets = techsData
        .filter((tech) => tech.ticketsResolved > 0)
        .map((tech) => ({
          ...tech,
          avgResolutionTime:
            tech.ticketsResolved > 0
              ? (tech.totalResolutionTime / tech.ticketsResolved).toFixed(2)
              : "N/A",
        }));

      // Update cache
      setDataCache((prev) => ({
        ...prev,
        [range]: {
          data: techsWithTickets,
          timestamp: Date.now(),
          avgTime: avgTime,
        },
      }));

      setTechnicians(techsWithTickets);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load technician data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechniciansWithTickets(timeRange);
  }, [timeRange]);

  const filteredTechs = technicians.filter(
    (tech) =>
      tech.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const prepareChartData = (tech) => {
    if (!tech || !tech.issueTypes) return null;

    const issueTypes = tech.issueTypes;
    const colors = [
      "#4b7bec",
      "#a55eea",
      "#fd9644",
      "#26de81",
      "#fc5c65",
      "#778ca3",
    ];

    // Convert issueTypes object to array format expected by PieChart
    const data = Object.keys(issueTypes).map((key, index) => ({
      name: key,
      count: issueTypes[key],
      color: colors[index % colors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    }));

    return data;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading technician reports...</Text>
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
          onPress={() => fetchTechniciansWithTickets(timeRange)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Technician Performance</Text>
        <Text style={styles.subtitle}>
          Avg. resolution time: {averageResolutionTime.toFixed(2)} hours
        </Text>
      </View>

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
          size={18}
          color="#7f8c8d"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by technician name or email..."
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

      {filteredTechs.length > 0 ? (
        <FlatList
          data={filteredTechs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.techCard}
              onPress={() => setSelectedTech(item)}
            >
              <View style={styles.techAvatar}>
                <Ionicons name="person" size={24} color="#4A90E2" />
              </View>
              <View style={styles.techInfo}>
                <Text style={styles.techName}>{item.fullName}</Text>
                <Text style={styles.techEmail}>{item.email}</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statBadge}>
                    {item.ticketsResolved} resolved
                  </Text>
                  <Text style={styles.statBadge}>
                    {item.avgResolutionTime} hrs avg
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#a5b1c2" />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={50} color="#a5b1c2" />
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No technicians found"
              : "No technicians with completed tickets"}
          </Text>
        </View>
      )}

      {/* Technician Details Modal */}
      <Modal
        visible={!!selectedTech}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedTech(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedTech?.fullName}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedTech(null)}
              >
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={16} color="#4A90E2" />
                  <Text style={styles.infoText}>{selectedTech?.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={16} color="#4A90E2" />
                  <Text style={styles.infoText}>
                    {selectedTech?.phone || "Not available"}
                  </Text>
                </View>
              </View>

              <View style={styles.statsSection}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {selectedTech?.ticketsResolved}
                  </Text>
                  <Text style={styles.statLabel}>Tickets Resolved</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {selectedTech?.avgResolutionTime}
                  </Text>
                  <Text style={styles.statLabel}>Avg. Hours per Ticket</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Problem Type Distribution</Text>
              {selectedTech?.issueTypes &&
              Object.keys(selectedTech.issueTypes).length > 0 ? (
                <>
                  <PieChart
                    data={prepareChartData(selectedTech)}
                    width={Dimensions.get("window").width - 60}
                    height={180}
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="count"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                  <View style={styles.legendContainer}>
                    {prepareChartData(selectedTech)?.map((item, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: item.color },
                          ]}
                        />
                        <Text style={styles.legendText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.noDataText}>
                  No problem type data available
                </Text>
              )}
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2f3542",
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 5,
  },
  timeFilterContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 10,
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
    borderRadius: 10,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    height: 45,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 14,
    color: "#2f3542",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  techCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  techAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8f0fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  techInfo: {
    flex: 1,
  },
  techName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2f3542",
  },
  techEmail: {
    fontSize: 13,
    color: "#7f8c8d",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  statBadge: {
    fontSize: 12,
    backgroundColor: "#f1f2f6",
    color: "#57606f",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 15,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    marginHorizontal: 20,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2f3542",
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#57606f",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#F5F9FF",
    borderRadius: 10,
    padding: 15,
    width: "48%",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2f3542",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2f3542",
    marginBottom: 15,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#57606f",
  },
  noDataText: {
    textAlign: "center",
    color: "#7f8c8d",
    marginVertical: 20,
  },
});

export default ReportsGeneral;
