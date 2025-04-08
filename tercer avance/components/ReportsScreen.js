import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const ReportsScreen = () => {
  const [topErrorTypes, setTopErrorTypes] = useState([]);
  const [topEquipment, setTopEquipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // 1. Obtener los tipos de error más comunes
        const ticketsSnapshot = await getDocs(collection(db, "Ticket"));
        const tickets = ticketsSnapshot.docs.map((doc) => doc.data());

        // Contar frecuencia de cada tipo de error
        const errorCounts = {};
        tickets.forEach((ticket) => {
          const errorType = ticket.problemType || "Sin especificar";
          errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
        });

        // Convertir a array y ordenar
        const sortedErrors = Object.entries(errorCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 errores

        setTopErrorTypes(sortedErrors);

        // 2. Obtener el equipo con más tickets
        const equipmentSnapshot = await getDocs(collection(db, "Equipment"));
        const equipmentList = await Promise.all(
          equipmentSnapshot.docs.map(async (doc) => {
            const ticketsQuery = query(
              collection(db, "Ticket"),
              where("affectedEquipmentUID", "==", doc.id),
            );
            const ticketCount = (await getDocs(ticketsQuery)).size;
            return {
              id: doc.id,
              ...doc.data(),
              ticketCount,
            };
          }),
        );

        // Ordenar por cantidad de tickets
        equipmentList.sort((a, b) => b.ticketCount - a.ticketCount);
        setTopEquipment(equipmentList[0]);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const [equipmentLoading, setEquipmentLoading] = useState(true);

  useEffect(() => {
    const fetchTopEquipment = async () => {
      try {
        // Obtener todos los equipos
        const equipmentSnapshot = await getDocs(
          collection(db, "EquipmentActive"),
        );
        const equipmentList = [];

        // Obtener conteo de tickets para cada equipo
        for (const doc of equipmentSnapshot.docs) {
          const ticketsQuery = query(
            collection(db, "Ticket"),
            where("affectedEquipmentUID", "==", doc.id),
          );
          const ticketSnapshot = await getDocs(ticketsQuery);
          const ticketCount = ticketSnapshot.size;

          if (ticketCount > 0) {
            equipmentList.push({
              id: doc.id,
              ...doc.data(),
              ticketCount,
            });
          }
        }

        // Ordenar por cantidad de tickets (mayor a menor)
        equipmentList.sort((a, b) => b.ticketCount - a.ticketCount);

        // Establecer el equipo con más tickets (si existe)
        setTopEquipment(equipmentList.length > 0 ? equipmentList[0] : null);
      } catch (error) {
        console.error("Error al obtener equipos:", error);
      } finally {
        setEquipmentLoading(false);
      }
    };

    fetchTopEquipment();
  }, []);

  const getEquipmentIcon = (type) => {
    if (!type) return "help-circle-outline";

    const typeLower = type.toLowerCase();

    if (typeLower.includes("computadora") || typeLower.includes("desktop")) {
      return "desktop-outline";
    }
    if (typeLower.includes("laptop") || typeLower.includes("notebook")) {
      return "laptop-outline";
    }
    if (typeLower.includes("servidor") || typeLower.includes("server")) {
      return "server-outline";
    }
    if (typeLower.includes("impresora") || typeLower.includes("printer")) {
      return "printer-outline";
    }
    if (typeLower.includes("red") || typeLower.includes("network")) {
      return "wifi-outline";
    }
    if (typeLower.includes("teléfono") || typeLower.includes("phone")) {
      return "phone-portrait-outline";
    }

    return "hardware-chip-outline"; // Icono por defecto
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Statistical Reports</Text>

      {/* Gráfico de tipos de error */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Common Error Types</Text>
        {topErrorTypes.length > 0 ? (
          <>
            <PieChart
              data={topErrorTypes.map((error, index) => ({
                name: "", // Dejamos el name vacío para que no muestre leyenda
                count: error.count,
                color: getColorByIndex(index),
                legendFontColor: "#7F7F7F",
                legendFontSize: 12,
              }))}
              width={Dimensions.get("window").width - 20}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              marginLeft="100"
              hasLegend={false} // Desactivamos la leyenda del gráfico
            />
            <View style={styles.errorList}>
              {topErrorTypes.map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <View
                    style={[
                      styles.colorIndicator,
                      { backgroundColor: getColorByIndex(index) },
                    ]}
                  />
                  <Text style={styles.errorText}>
                    {error.type}: {error.count} tickets
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.noData}>There is no ticket data</Text>
        )}
      </View>

      {/* Equipo con más tickets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device with the Most Tickets</Text>

        {equipmentLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3498db" />
            <Text style={styles.loadingText}>Loading device data...</Text>
          </View>
        ) : topEquipment ? (
          <View style={styles.equipmentCard}>
            <Ionicons
              name={getEquipmentIcon(topEquipment.type)} // Función ahora definida
              size={40}
              color="#3498db"
              style={styles.equipmentIcon}
            />
            <View style={styles.equipmentInfo}>
              <Text style={styles.equipmentName}>{topEquipment.name}</Text>
              <Text style={styles.equipmentDetail}>
                <Ionicons name="location-outline" size={14} />{" "}
                {topEquipment.location || "No location"}
              </Text>
              <Text style={styles.equipmentDetail}>
                <Ionicons name="pricetag-outline" size={14} />{" "}
                {topEquipment.type || "No type"}
              </Text>
              <Text style={styles.equipmentDetail}>
                <Ionicons name="document-text-outline" size={14} />{" "}
                {topEquipment.ticketCount} reported tickets
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noData}>No teams with tickets were found</Text>
        )}
      </View>
    </ScrollView>
  );
};

// Función para colores del gráfico
const getColorByIndex = (index) => {
  const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f7fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2c3e50",
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: "#3498db",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#2c3e50",
  },
  errorList: {
    marginTop: 15,
  },
  errorItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  errorText: {
    fontSize: 14,
    color: "#555",
  },
  noData: {
    textAlign: "center",
    color: "#95a5a6",
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 14,
    color: "#555",
  },
  equipmentCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  equipmentIcon: {
    marginRight: 15,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  equipmentDetail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 3,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default ReportsScreen;
