import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const TicketDetailsScreen = ({ route }) => {
  const { ticket } = route.params;
  const [employeeData, setEmployeeData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const db = getFirestore();
  const { userType } = useContext(AuthContext);
  const navigation = useNavigation();
  const isTechnician = userType === 1;

  // Check if chat should be available
  const isChatAvailable = ticket.status === "Open" && ticket.technicalName;

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      if (ticket.employeeEmail) {
        try {
          const usersRef = collection(db, "User");
          const q = query(usersRef, where("email", "==", ticket.employeeEmail));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            setEmployeeData({ id: userDoc.id, ...userDoc.data() });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setIsLoading(false);
    };
  
    const fetchFeedback = async () => {
      try {
        const feedbackRef = collection(db, "Feedback");
        const q = query(feedbackRef, where("ticket.id", "==", ticket.id));

        const querySnapshot = await getDocs(q);
    
        console.log("Feedback query size:", querySnapshot.size);
    
        if (!querySnapshot.empty) {
          const feedbackDoc = querySnapshot.docs[0];
          setFeedback({ id: feedbackDoc.id, ...feedbackDoc.data() });
          console.log("Feedback encontrado:", feedbackDoc.data());
        } else {
          console.log("No feedback found for ticket.id:", ticket.id);
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    };
    
  
    fetchUserData();
    fetchFeedback();
  }, [ticket.employeeEmail]);
  

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      if (typeof date === "object" && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const navigateToChat = () => {
    navigation.navigate("TicketChat", { ticket });
  };

  // Main sections data
  const ticketSections = [
    {
      title: "Ticket Information",
      items: [
        {
          label: "Ticket ID",
          value: ticket.ticketId || "N/A",
          icon: "hashtag",
        },
        {
          label: "Status",
          value: ticket.status || "Pending",
          icon: "info-circle",
          isHighlighted: true,
          status: ticket.status,
        },
        {
          label: "Created Date",
          value: formatDate(ticket.dateCreated),
          icon: "calendar",
        },
        {
          label: "Finished Date",
          value: ticket.dateFinished ? formatDate(ticket.dateFinished) : "N/A",
          icon: "check-circle",
        },
      ],
    },
    {
      title: "Problem Details",
      items: [
        {
          label: "Problem Type",
          value: ticket.problemType || "Not specified",
          icon: "exclamation-triangle",
        },
        {
          label: "Device Affected",
          value: ticket.affectedEquipment || "Not specified",
          icon: "desktop",
        },
        {
          label: "Description",
          value: ticket.description || "No description",
          icon: "align-left",
        },
      ],
    },
    {
      title: "Location Information",
      items: [
        {
          label: "Location",
          value: ticket.location || "Not specified",
          icon: "map-marker",
        },
      ],
    },
    {
      title: "Personnel",
      items: [
        { label: "Assigned Technician", value: ticket.technicalName || "Unassigned", icon: "user" },
        { label: "Requested By", value: ticket.employeeName || "Not specified", icon: "id-badge" },
        ...(feedback ? [
          { label: "Employee Rating", value: `${feedback.rating} / 5`, icon: "star" },
          { label: "Employee Feedback", value: feedback.comment || "No comment", icon: "comment" }
        ] : [])
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "#10B981";
      case "Denied":
        return "#EF4444";
      case "Resolved":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView} // Añade este estilo
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
          </View>
        ) : (
          <>
            <View style={styles.gridContainer}>
              {ticketSections.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Icon
                      name={section.icon}
                      size={18}
                      color="#1E3A8A"
                      style={styles.sectionIcon}
                    />
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>

                  <View style={styles.sectionContent}>
                    {section.items.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.detailItem}>
                        <View style={styles.detailLabelContainer}>
                          <Icon
                            name={item.icon}
                            size={14}
                            color="#6B7280"
                            style={styles.itemIcon}
                          />
                          <Text style={styles.detailLabel}>{item.label}</Text>
                        </View>
                        {item.status ? (
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(item.status) },
                            ]}
                          >
                            <Text style={styles.statusText}>{item.value}</Text>
                          </View>
                        ) : (
                          <Text
                            style={[
                              styles.detailValue,
                              item.isHighlighted && styles.highlightedValue,
                            ]}
                            numberOfLines={2}
                          >
                            {item.value}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {isChatAvailable && (
              <View style={styles.chatButtonOuterContainer}>
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={navigateToChat}
                >
                  <Icon name="comments" size={20} color="#fff" />
                  <Text style={styles.chatButtonText}>Open Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Añade esto para ocupar toda la pantalla
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1, // Añade esto para que ScrollView ocupe todo el espacio
  },
  scrollContainer: {
    paddingBottom: 14,
    paddingTop: 14,
    minHeight: '100%', // Añade esto para web
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  sectionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
  },
  sectionContent: {
    paddingHorizontal: 4,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#374151",
    paddingLeft: 24, // Align with icon
  },
  highlightedValue: {
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginLeft: 24, // Align with icon
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginTop: 2,
  },
  chatButtonOuterContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center', // Centra el botón horizontalmente
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingVertical: 14,
    paddingHorizontal: 24, // Añade más padding horizontal
    borderRadius: 8,
    gap: 10,
    width: '80%', // Haz el botón más ancho
    maxWidth: 300, // Pero no más ancho que esto
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
  },
});

export default TicketDetailsScreen;
