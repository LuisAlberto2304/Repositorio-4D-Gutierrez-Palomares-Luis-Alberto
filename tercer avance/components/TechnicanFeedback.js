import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Para los iconos
import { db } from "../firebaseConfig"; // Asumiendo que tienes configurado firebase
import { query, collection, where, getDocs } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext"; // Importar el contexto si es necesario

const TechnicianFeedback = () => {
  const { userEmail } = useContext(AuthContext); // Obtener el correo desde el contexto
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(null);


  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const feedbackQuery = query(
          collection(db, "Feedback"),
          where("technician.email", "==", userEmail),
          where("status", "==", "completed")
        );
  
        const querySnapshot = await getDocs(feedbackQuery);
        const feedbackList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        setFeedbacks(feedbackList);
  
        // Calcular promedio de calificaciones
        const ratings = feedbackList
          .map(item => item.rating)
          .filter(rating => typeof rating === "number");
  
        if (ratings.length > 0) {
          const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          setAverageRating(average.toFixed(1));
        } else {
          setAverageRating(null);
        }
  
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener feedbacks:", error);
        setLoading(false);
      }
    };
  
    if (userEmail) {
      fetchFeedbacks();
    }
  }, [userEmail]);
  

  if (loading) {
    return <Text>Loading feedbacks...</Text>;
  }

  if (feedbacks.length === 0) {
    return <Text>No feedback available.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feedback received</Text>
      <Text style={styles.averageText}>
        Average rating: {averageRating ? `${averageRating} / 5` : "No ratings yet"}
    </Text>

      <FlatList
        data={feedbacks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const employeeName = item.employee?.name || "Unknown user";
          const feedbackDate = item.completedAt?.toDate
            ? item.completedAt.toDate().toLocaleDateString()
            : "No date";

            const ticketInfo = item.ticket || {};
            const equipment = ticketInfo.equipment || "Not specified";
            const ticketId = ticketInfo.id || "Unknown";
            const problemType = ticketInfo.problemType || "Not specified";
            
            return (
                <View style={styles.card}>
                  <Ionicons name="star-outline" size={24} color="#f1c40f" />
                  <Text style={styles.feedbackText}>
                    {item.rating ? `Score: ${item.rating} / 5` : "No rating"}
                  </Text>
                  <Text style={styles.feedbackText}>
                    Comment: {item.comment || "Not rated"}
                  </Text>
                  <Text style={styles.feedbackMeta}>By: {employeeName}</Text>
                  <Text style={styles.feedbackMeta}>Date: {feedbackDate}</Text>
            
                  {/* Nueva info del ticket */}
                  <Text style={styles.ticketInfo}>Equipment: {equipment}</Text>
                  <Text style={styles.ticketInfo}>Ticket ID: {ticketId}</Text>
                  <Text style={styles.ticketInfo}>Problem Type: {problemType}</Text>
                </View>
              );
        }}
      />
    </View>
  );  
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: "#f5f6fa", // Fondo general claro y suave
    },
    title: {
      fontSize: 26,
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: 20,
      textAlign: "center",
    },
    card: {
      backgroundColor: "#ffffff",
      padding: 20,
      marginBottom: 15,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
    },
    feedbackText: {
      fontSize: 16,
      color: "#34495e",
      marginBottom: 8,
    },
    feedbackMeta: {
      fontSize: 14,
      color: "#7f8c8d",
    },
    averageText: {
        fontSize: 18,
        color: "#e67e22",
        fontWeight: "600",
        marginBottom: 12,
        textAlign: "center",
      },
      ticketInfo: {
        fontSize: 12,
        color: "#4B5563",
        marginTop: 2,
        fontFamily: "Poppins-Regular",
      }
      
  });
  
export default TechnicianFeedback;
