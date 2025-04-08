import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TouchableOpacity } from "react-native-gesture-handler";
import { MaterialIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import CustomAlertModal from "../CustomAlertModal";

const HomeJef = () => {
  const navigation = useNavigation();
  const [metrics, setMetrics] = useState({
    openTickets: 0,
    urgentTickets: 0,
    activeUsers: 0,
    locations: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    isConfirmation: false,
  });

  const showCustomAlert = (title, message, isConfirmation = false) => {
    setAlertConfig({
      title,
      message,
      isConfirmation,
    });
    setShowAlert(true);
  };

  const handleAlertConfirm = () => {
    setShowAlert(false);
  };

  const handleAlertCancel = () => {
    setShowAlert(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedMetrics = await AsyncStorage.getItem("metricsCache");
        if (cachedMetrics) {
          const { metrics: cachedMetricsData, activity: cachedActivity } =
            JSON.parse(cachedMetrics);
          setMetrics(cachedMetricsData);
          setRecentActivity(cachedActivity);
          setLoading(false);
        }

        // Get all data and filter locally
        const [
          ticketsSnapshot,
          usersSnapshot,
          techniciansSnapshot,
          locationsSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "Ticket")),
          getDocs(collection(db, "User")),
          getDocs(collection(db, "Technical")),
          getDocs(collection(db, "Location")),
        ]);

        // Process data locally
        const allTickets = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const openTickets = allTickets.filter((t) => t.status === "Open");
        const urgentTickets = openTickets.filter(
          (t) => t.priority === "High",
        ).length;

        const totalUsers = usersSnapshot.size + techniciansSnapshot.size;

        // Sort tickets by date locally
        const sortedTickets = [...allTickets].sort(
          (a, b) =>
            new Date(b.dateCreated?.toDate?.() || 0) -
            new Date(a.dateCreated?.toDate?.() || 0),
        );

        const recentActivity = sortedTickets.slice(0, 5).map((ticket) => {
          const assignmentStatus = ticket.technicalName
            ? "Assigned"
            : "Unassigned";
          return `• Ticket #${ticket.ticketId || ticket.id.substring(0, 4)} ${assignmentStatus} (${formatTime(ticket.dateCreated)})`;
        });

        const metricsData = {
          openTickets: openTickets.length,
          urgentTickets: urgentTickets,
          activeUsers: totalUsers,
          locations: locationsSnapshot.size,
        };

        // Update state and cache
        setMetrics(metricsData);
        setRecentActivity(recentActivity);

        await AsyncStorage.setItem(
          "metricsCache",
          JSON.stringify({
            metrics: metricsData,
            activity: recentActivity,
          }),
        );
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message);
        showCustomAlert("Error", "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTime = (timestamp) => {
    try {
      const date =
        timestamp?.toDate?.() ||
        (timestamp instanceof Date ? timestamp : new Date(timestamp));

      if (!date || isNaN(date.getTime())) return "recently";

      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));

      if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
      if (diffInMinutes < 1440)
        return `${Math.floor(diffInMinutes / 60)} hrs ago`;
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    } catch (e) {
      console.warn("Error formatting date:", e, timestamp);
      return "recently";
    }
  };

  const quickActions = [
    {
      icon: <MaterialIcons name="assignment" size={24} color="#FFF" />,
      label: "Tickets",
      screen: "Ticket Management",
    },
    {
      icon: <FontAwesome5 name="users" size={20} color="#FFF" />,
      label: "Users",
      screen: "Users",
    },
    {
      icon: <MaterialIcons name="location-on" size={24} color="#FFF" />,
      label: "Locations",
      screen: "Locations Management",
    },
    {
      icon: <Feather name="bar-chart-2" size={24} color="#FFF" />,
      label: "Reports",
      screen: "Reports",
    },
  ];

  if (loading) {
    return (
      <View
        style={[
          styles.screenContainer,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>Loading data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.screenContainer,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: "red", marginBottom: 20 }}>{error}</Text>
        <TouchableOpacity
          style={{ padding: 10, backgroundColor: "#2196F3", borderRadius: 5 }}
          onPress={() => {
            setLoading(true);
            setError(null);
            useEffect(() => {}, []); // Force re-render
          }}
        >
          <Text style={{ color: "white" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screenContainer}>
      <CustomAlertModal
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
        isConfirmation={alertConfig.isConfirmation}
      />

      <Text style={[styles.textMain, { marginTop: 10 }]}>Admin Dashboard</Text>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, styles.blueCard]}>
          <Text style={styles.metricNumber}>{metrics.openTickets}</Text>
          <Text style={styles.metricText}>Open tickets</Text>
        </View>
        <View style={[styles.metricCard, styles.redCard]}>
          <Text style={styles.metricNumber}>{metrics.urgentTickets}</Text>
          <Text style={styles.metricText}>Urgent</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, styles.purpleCard]}>
          <Text style={styles.metricNumber}>{metrics.activeUsers}</Text>
          <Text style={styles.metricText}>Users</Text>
        </View>
        <View style={[styles.metricCard, styles.greenCard]}>
          <Text style={styles.metricNumber}>{metrics.locations}</Text>
          <Text style={styles.metricText}>Locations</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionButton}
            onPress={() => {
              navigation.dispatch(DrawerActions.jumpTo(action.screen));
            }}
          >
            <View style={styles.actionIcon}>{action.icon}</View>
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityBox}>
        {recentActivity.length > 0 ? (
          recentActivity.map((item, index) => (
            <Text key={index} style={styles.activityItem}>
              {item}
            </Text>
          ))
        ) : (
          <Text style={styles.activityItem}>No recent activity</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#f8f9fa",
  },
  textMain: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  metricCard: {
    width: "48%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
  blueCard: {
    backgroundColor: "#4285F4",
  },
  redCard: {
    backgroundColor: "#EA4335",
  },
  purpleCard: {
    backgroundColor: "#9C27B0",
  },
  greenCard: {
    backgroundColor: "#34A853",
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 5,
  },
  metricText: {
    color: "#FFF",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 15,
    color: "#444",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: 150,
    height: 60,
    backgroundColor: "#5F6F94",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  actionIcon: {
    marginRight: 10,
  },
  actionText: {
    color: "#FFF",
    fontSize: 16,
  },
  activityBox: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  activityItem: {
    fontSize: 14,
    marginBottom: 8,
    color: "#555",
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
});

export default HomeJef;
