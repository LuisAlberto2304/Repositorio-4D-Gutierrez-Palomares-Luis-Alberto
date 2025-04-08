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
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { PieChart } from "react-native-chart-kit";
import { TabView, TabBar, SceneMap } from "react-native-tab-view";

const CACHE_DURATION = 5 * 60 * 1000;

const ReportsDevice = () => {
  const [timeRange, setTimeRange] = useState("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deviceTickets, setDeviceTickets] = useState([]);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "details", title: "Details" },
    { key: "tickets", title: "Tickets" },
    { key: "stats", title: "Stats" },
  ]);

  // Tab scenes
  const renderScene = SceneMap({
    details: () => renderDetailsTab(),
    tickets: () => renderTicketsTab(),
    stats: () => renderStatsTab(),
  });

  const [dataCache, setDataCache] = useState({
    week: { data: null, timestamp: null },
    month: { data: null, timestamp: null },
    year: { data: null, timestamp: null },
  });

  const fetchData = async (range) => {
    try {
      setLoading(true);

      // Check if cached data is still valid
      const cachedItem = dataCache[range];
      if (
        cachedItem.data &&
        cachedItem.timestamp &&
        Date.now() - cachedItem.timestamp < CACHE_DURATION
      ) {
        setDevices(cachedItem.data);
        setError(null);
        setLoading(false);
        return;
      }

      // Get tickets for selected period
      const { fromDate, toDate } = getDateRange(range);
      const ticketsQuery = query(
        collection(db, "Ticket"),
        where("status", "==", "Resolved"),
      );

      const ticketsSnapshot = await getDocs(ticketsQuery);
      const ticketsData = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        equipmentId: doc.data().affectedEquipmentUID,
      }));

      // Process devices with issues
      const devicesWithIssues = {};

      ticketsData.forEach((ticket) => {
        if (!ticket.equipmentId) return;

        if (!devicesWithIssues[ticket.equipmentId]) {
          devicesWithIssues[ticket.equipmentId] = {
            ticketCount: 0,
            issues: new Set(),
            lastTicketDate: null,
            ticketIds: [],
            problemTypes: {},
          };
        }

        devicesWithIssues[ticket.equipmentId].ticketCount += 1;
        devicesWithIssues[ticket.equipmentId].issues.add(ticket.problemType);
        devicesWithIssues[ticket.equipmentId].ticketIds.push(ticket.id);

        // Count problem types for stats
        if (
          !devicesWithIssues[ticket.equipmentId].problemTypes[
            ticket.problemType
          ]
        ) {
          devicesWithIssues[ticket.equipmentId].problemTypes[
            ticket.problemType
          ] = 0;
        }
        devicesWithIssues[ticket.equipmentId].problemTypes[
          ticket.problemType
        ] += 1;

        const ticketDate = ticket.dateFinished.toDate();
        if (
          !devicesWithIssues[ticket.equipmentId].lastTicketDate ||
          ticketDate > devicesWithIssues[ticket.equipmentId].lastTicketDate
        ) {
          devicesWithIssues[ticket.equipmentId].lastTicketDate = ticketDate;
        }
      });

      // Get device details
      const devicesData = [];

      for (const [equipmentId, deviceData] of Object.entries(
        devicesWithIssues,
      )) {
        const deviceDoc = await getDoc(doc(db, "EquipmentActive", equipmentId));

        if (deviceDoc.exists()) {
          const device = deviceDoc.data();
          devicesData.push({
            id: equipmentId,
            equipmentId: device.equipmentId,
            branchName: device.location || "Unknown",
            model: `${device.brand} ${device.model}`,
            type: device.type,
            serialNumber: device.serialNumber,
            status: device.status,
            ticketCount: deviceData.ticketCount,
            mainIssue: Array.from(deviceData.issues).join(", "),
            lastTicketDate: deviceData.lastTicketDate,
            components: device.components
              ? Object.values(device.components)
              : [],
            peripherals: device.peripherals
              ? Object.values(device.peripherals)
              : [],
            ticketIds: deviceData.ticketIds,
            problemTypes: deviceData.problemTypes,
          });
        }
      }

      // Update cache
      setDataCache((prev) => ({
        ...prev,
        [range]: {
          data: devicesData,
          timestamp: Date.now(),
        },
      }));

      setDevices(devicesData);
      setError(null);
    } catch (err) {
      console.error("Error fetching device reports:", err);
      setError("Error loading device reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange]);

  const fetchDeviceTickets = async (ticketIds) => {
    try {
      const tickets = [];
      for (const ticketId of ticketIds) {
        const ticketDoc = await getDoc(doc(db, "Ticket", ticketId));
        if (ticketDoc.exists()) {
          tickets.push({
            id: ticketId,
            ...ticketDoc.data(),
            dateCreated: ticketDoc
              .data()
              .dateCreated.toDate()
              .toLocaleDateString(),
            dateFinished: ticketDoc
              .data()
              .dateFinished.toDate()
              .toLocaleDateString(),
          });
        }
      }
      setDeviceTickets(tickets);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const fromDate = new Date();

    switch (timeRange) {
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

  const filteredDevices = devices.filter(
    (device) =>
      device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDevicePress = (device) => {
    setSelectedDevice(device);
    setIndex(0); // Reset to first tab
    fetchDeviceTickets(device.ticketIds);
  };

  // Render tabs
  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Basic Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Model</Text>
            <Text style={styles.infoValue}>{selectedDevice?.model}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{selectedDevice?.type}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Serial</Text>
            <Text style={styles.infoValue}>{selectedDevice?.serialNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{selectedDevice?.branchName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text
              style={[
                styles.infoValue,
                selectedDevice?.status === "Active"
                  ? styles.statusActive
                  : styles.statusInactive,
              ]}
            >
              {selectedDevice?.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Components */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>
          Components ({selectedDevice?.components?.length || 0})
        </Text>
        {selectedDevice?.components?.length > 0 ? (
          <FlatList
            data={selectedDevice.components}
            scrollEnabled={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text style={styles.listItemTitle}>{item.name}</Text>
                <Text style={styles.listItemDetail}>
                  Serial: {item.serialNumber}
                </Text>
                <Text style={styles.listItemDetail}>
                  Installed:{" "}
                  {item.installationDate?.toDate()?.toLocaleDateString() ||
                    "N/A"}
                </Text>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noDataText}>No components found</Text>
        )}
      </View>

      {/* Peripherals */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>
          Peripherals ({selectedDevice?.peripherals?.length || 0})
        </Text>
        {selectedDevice?.peripherals?.length > 0 ? (
          <FlatList
            data={selectedDevice.peripherals}
            scrollEnabled={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text style={styles.listItemTitle}>{item.name}</Text>
                <Text style={styles.listItemDetail}>
                  Serial: {item.serialNumber}
                </Text>
                <Text style={styles.listItemDetail}>
                  Installed:{" "}
                  {item.installationDate?.toDate()?.toLocaleDateString() ||
                    "N/A"}
                </Text>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noDataText}>No peripherals found</Text>
        )}
      </View>
    </ScrollView>
  );

  const renderTicketsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>
        Ticket History ({deviceTickets.length})
      </Text>
      {deviceTickets.length > 0 ? (
        deviceTickets.map((ticket) => (
          <View key={ticket.id} style={styles.ticketItem}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketId}>
                Ticket #{ticket.id.substring(0, 6)}
              </Text>
              <Text style={styles.ticketDate}>
                {ticket.dateCreated} - {ticket.dateFinished}
              </Text>
            </View>
            <Text style={styles.ticketProblem}>{ticket.problemType}</Text>
            <Text style={styles.ticketDescription}>
              {ticket.description || "No description provided"}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No tickets found for this device</Text>
      )}
    </ScrollView>
  );

  const renderStatsTab = () => {
    const problemTypesData = selectedDevice?.problemTypes
      ? Object.entries(selectedDevice.problemTypes).map(([name, count]) => ({
          name,
          count,
          color: getRandomColor(),
          legendFontColor: "#7F7F7F",
          legendFontSize: 12,
        }))
      : [];

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Device Statistics</Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Total Tickets</Text>
          <Text style={styles.statsValue}>
            {selectedDevice?.ticketCount || 0}
          </Text>
        </View>

        {problemTypesData.length > 0 && (
          <>
            <Text style={styles.sectionSubtitle}>
              Problem Types Distribution
            </Text>
            <PieChart
              data={problemTypesData}
              width={Dimensions.get("window").width - 60}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />

            <View style={styles.legendContainer}>
              {problemTypesData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {item.name} ({item.count})
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Last Issue Reported</Text>
          <Text style={styles.statsValue}>
            {selectedDevice?.lastTicketDate?.toLocaleDateString() || "N/A"}
          </Text>
        </View>
      </ScrollView>
    );
  };

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading device reports...</Text>
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
          onPress={() => setLoading(true)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Device Reports</Text>
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
          placeholder="Search devices..."
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

      <ScrollView style={styles.devicesContainer}>
        {filteredDevices.length > 0 ? (
          filteredDevices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceCard}
              onPress={() => handleDevicePress(device)}
            >
              <View style={styles.deviceIcon}>
                <Ionicons
                  name={
                    device.type === "Computer"
                      ? "desktop-outline"
                      : "hardware-chip-outline"
                  }
                  size={24}
                  color="#4A90E2"
                />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.equipmentId}</Text>
                <Text style={styles.deviceModel}>{device.model}</Text>
                <View style={styles.deviceMeta}>
                  <Text style={styles.deviceBranch}>{device.branchName}</Text>
                  <Text style={styles.deviceStatus}>{device.status}</Text>
                </View>
              </View>
              <View style={styles.deviceStats}>
                <View style={styles.ticketBadge}>
                  <Text style={styles.ticketBadgeText}>
                    {device.ticketCount}
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
                ? "No devices match your search"
                : "No devices with reported issues"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Device Details Modal */}
      <Modal
        visible={!!selectedDevice}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedDevice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedDevice?.equipmentId}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDevice?.model}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedDevice(null)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TabView
              navigationState={{ index, routes }}
              renderScene={renderScene}
              onIndexChange={setIndex}
              initialLayout={{ width: Dimensions.get("window").width }}
              renderTabBar={(props) => (
                <TabBar
                  {...props}
                  indicatorStyle={styles.tabIndicator}
                  style={styles.tabBar}
                  labelStyle={styles.tabLabel}
                  activeColor="#4A90E2"
                  inactiveColor="#666"
                />
              )}
            />
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
    padding: 16,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  timeFilterContainer: {
    flexDirection: "row",
    marginBottom: 12,
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
  devicesContainer: {
    flex: 1,
  },
  deviceCard: {
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
  deviceIcon: {
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  deviceModel: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  deviceMeta: {
    flexDirection: "row",
    marginTop: 4,
  },
  deviceBranch: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
  },
  deviceStatus: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  deviceStats: {
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
  tabBar: {
    backgroundColor: "white",
    elevation: 0,
    shadowOpacity: 0,
  },
  tabIndicator: {
    backgroundColor: "#4A90E2",
    height: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  tabContent: {
    padding: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 12,
    marginTop: 8,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoItem: {
    width: "48%",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  listItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  listItemDetail: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  noDataText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 12,
  },
  ticketItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A90E2",
  },
  ticketDate: {
    fontSize: 12,
    color: "#999",
  },
  ticketProblem: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 13,
    color: "#666",
  },
  statsCard: {
    backgroundColor: "#F5F9FF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  statsTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    margin: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FAFAFA",
    borderRadius: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  statusActive: {
    color: "#4CAF50",
  },
  statusInactive: {
    color: "#F44336",
  },
});

export default ReportsDevice;
