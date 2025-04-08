// components/HomeScreens/HomeTec.js
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../context/AuthContext";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlertModal from "../CustomAlertModal";
import Ionicons from "@expo/vector-icons/Ionicons";

const HomeTec = () => {
  const navigation = useNavigation();
  const { userEmail, userUID } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch technician info and ratings
        if (userEmail) {
          // Get technician info
          const userQuery = query(
            collection(db, "Technical"),
            where("email", "==", userEmail)
          );
          const querySnapshot = await getDocs(userQuery);
          if (!querySnapshot.empty) {
            setUserInfo(querySnapshot.docs[0].data());
          }

          // Get ratings
          const feedbackQuery = query(
            collection(db, "Feedback"),
            where("technician.email", "==", userEmail),
            where("status", "==", "completed")
          );
          const feedbackSnapshot = await getDocs(feedbackQuery);
          const ratings = feedbackSnapshot.docs
            .map((doc) => doc.data().rating)
            .filter((rating) => typeof rating === "number");

          if (ratings.length > 0) {
            const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            setAverageRating(average.toFixed(1));
          }
        }

        // Fetch tickets
        if (userUID && userEmail) {
          // Check cache
          const cachedData = await AsyncStorage.getItem(
            `ticketsCache_${userUID}`
          );
          if (cachedData) {
            setTickets(JSON.parse(cachedData).tickets);
          }

          // Optimized query (requires index)
          const ticketsQuery = query(
            collection(db, "Ticket"),
            where("technicalEmail", "==", userEmail),
            where("status", "==", "Open"),
            orderBy("dateCreated", "desc"),
            limit(3)
          );

          const querySnapshot = await getDocs(ticketsQuery);
          const recentTickets = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            dateCreated: safeToDate(doc.data().dateCreated),
          }));

          setTickets(recentTickets);
          await AsyncStorage.setItem(
            `ticketsCache_${userUID}`,
            JSON.stringify({ tickets: recentTickets })
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showCustomAlert(
          "Error",
          "Failed to load data. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userUID, userEmail]);

  const safeToDate = (timestamp) => {
    try {
      return (
        timestamp?.toDate?.() ||
        (timestamp instanceof Date ? timestamp : new Date(timestamp))
      );
    } catch {
      return new Date(); // Fallback to current date
    }
  };

  const formatDate = (dateInput) => {
    try {
      let date;

      if (dateInput?.toDate) {
        date = dateInput.toDate();
      } else if (dateInput instanceof Date) {
        date = dateInput;
      } else if (
        typeof dateInput === "string" ||
        typeof dateInput === "number"
      ) {
        date = new Date(dateInput);
      } else {
        console.warn("Invalid date format:", dateInput);
        return "Date not available";
      }

      if (isNaN(date.getTime())) {
        console.warn("Invalid date value:", dateInput);
        return "Invalid date";
      }

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.warn("Date formatting error:", e, "Input:", dateInput);
      return "Date error";
    }
  };

  const handleTicketPress = (ticket) => {
    navigation.navigate("Ticket Details", { ticket });
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, styles.centerContainer]}>
        <Text>Loading data...</Text>
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
        isConfirmation={alertConfig.isConfirmation}
      />

      <Text style={styles.textMain}>Welcome Technician</Text>

      {/* Technician Info Card */}
      {userInfo && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Profile</Text>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#5DADE2" />
            <Text style={styles.infoText}>
              Name: {userInfo.firstName} {userInfo.lastName}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color="#5DADE2" />
            <Text style={styles.infoText}>Email: {userInfo.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#5DADE2" />
            <Text style={styles.infoText}>Phone: {userInfo.phone}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="star-outline" size={20} color="#f1c40f" />
            <Text style={styles.infoText}>
              Rating: {averageRating !== null ? `${averageRating} / 5.0` : "No ratings yet"}
            </Text>
          </View>
        </View>
      )}

      {/* Recent Tickets Card */}
      <View style={styles.card}>
        <View style={styles.containerTopCard}>
          <Text style={styles.cardTitle}>Recent Tickets</Text>
          <TouchableOpacity
            style={styles.view}
            onPress={() => {
              navigation.dispatch(DrawerActions.jumpTo("Tickets"));
            }}
          >
            <Text style={styles.viewText}>View All</Text>
          </TouchableOpacity>
        </View>
        {tickets.length > 0 ? (
          tickets.map((ticket, index) => (
            <TouchableOpacity
              key={index}
              style={styles.ticketItem}
              onPress={() => handleTicketPress(ticket)}
            >
              <Text style={styles.ticketCode}>
                Ticket #{ticket.ticketId || ticket.id.substring(0, 6)}
              </Text>
              <Text style={styles.ticketTitle}>{ticket.location}</Text>
              <Text style={styles.ticketTitle}>{ticket.status} </Text>
              <Text style={styles.ticketDate}>
                Created: {formatDate(ticket.dateCreated)}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.cardContent}>No tickets assigned</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  textMain: {
    fontFamily: "Poppins-Bold",
    fontSize: 28,
    textAlign: "center",
    margin: 20,
    paddingTop: 10,
    color: "#2E2E2E",
  },
  card: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  containerTopCard: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FFC107",
  },
  cardTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 20,
    color: "#2E2E2E",
    marginBottom: 10,
  },
  view: {
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    width: 80,
    borderRadius: 3,
  },
  viewText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#1E3A8A",
  },
  cardContent: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#2E2E2E",
    marginVertical: 5,
  },
  ticketItem: {
    marginVertical: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  ticketCode: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#1E3A8A",
  },
  ticketTitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#333",
  },
  ticketDate: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#777",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  infoText: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
});

export default HomeTec;